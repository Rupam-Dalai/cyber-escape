import time
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Team, Quest, EventConfiguration, AdminAuditLog, ScoreEvent, TeamProgress, AnswerAttempt, PhysicalToken
from app.schemas import AdminTeamOverride, EventConfigUpdate
from app.security import decode_access_token
from app.websocket.manager import manager

router = APIRouter(prefix="/admin", tags=["admin"])

def get_current_admin(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token format")
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload or payload.get("role") != "admin":
        raise HTTPException(status_code=401, detail="Unauthorized admin session")
    return payload.get("sub")

@router.get("/config")
def get_event_config(db: Session = Depends(get_db)):
    config = db.query(EventConfiguration).first()
    return config

@router.put("/config")
async def update_event_config(config_in: EventConfigUpdate, admin: str = Depends(get_current_admin), db: Session = Depends(get_db)):
    config = db.query(EventConfiguration).first()
    if not config:
        config = EventConfiguration()
        db.add(config)

    for field, val in config_in.dict(exclude_unset=True).items():
        setattr(config, field, val)

    config.updated_at = time.time()
    db.add(AdminAuditLog(admin_id=admin, action="UPDATE_CONFIG", details=str(config_in.dict(exclude_unset=True))))
    db.commit()

    await manager.broadcast({"type": "EVENT_STATUS_CHANGE", "event_status": config.event_status})
    return config

@router.post("/event/status")
async def change_event_status(status_val: str, admin: str = Depends(get_current_admin), db: Session = Depends(get_db)):
    config = db.query(EventConfiguration).first()
    if config:
        config.event_status = status_val
        config.updated_at = time.time()
        db.add(AdminAuditLog(admin_id=admin, action="CHANGE_EVENT_STATUS", details=f"Status set to {status_val}"))
        db.commit()

        await manager.broadcast({"type": "EVENT_STATUS_CHANGE", "event_status": status_val})
        return {"status": "SUCCESS", "event_status": status_val}
    raise HTTPException(status_code=400, detail="Configuration not initialized.")

@router.get("/teams")
def list_teams_detailed(admin: str = Depends(get_current_admin), db: Session = Depends(get_db)):
    teams = db.query(Team).order_by(Team.score.desc()).all()
    all_quests = db.query(Quest).order_by(Quest.order_index).all()

    result = []
    for t in teams:
        current_loc = all_quests[t.current_quest_index].location_name if t.current_quest_index < len(all_quests) else "Treasure Vault (Completed)"
        attempts_count = db.query(AnswerAttempt).filter_by(team_id=t.id).count()
        wrong_count = db.query(AnswerAttempt).filter_by(team_id=t.id, is_correct=False).count()

        # Check if team is stuck on current level for more than 5 minutes (300s)
        last_attempt = db.query(AnswerAttempt).filter_by(team_id=t.id).order_by(AnswerAttempt.timestamp.desc()).first()
        is_stuck = False
        if t.status == "ACTIVE" and t.current_quest_index < len(all_quests):
            time_on_level = time.time() - (last_attempt.timestamp if last_attempt else t.started_at)
            if time_on_level > 300:
                is_stuck = True

        result.append({
            "id": t.id,
            "name": t.name,
            "registration_code": t.registration_code,
            "score": t.score,
            "lives": t.lives,
            "hints_remaining": t.hints_remaining,
            "current_quest_index": t.current_quest_index,
            "current_location": current_loc,
            "status": t.status,
            "attempts_count": attempts_count,
            "wrong_count": wrong_count,
            "is_stuck": is_stuck,
            "started_at": t.started_at,
            "completed_at": t.completed_at
        })
    return result

@router.post("/team/{team_id}/override")
async def team_admin_override(team_id: str, override: AdminTeamOverride, admin: str = Depends(get_current_admin), db: Session = Depends(get_db)):
    team = db.query(Team).filter_by(id=team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    action = override.action
    all_quests = db.query(Quest).order_by(Quest.order_index).all()

    if action == "add_points" and override.value:
        team.score += override.value
        db.add(ScoreEvent(team_id=team.id, event_type="ADMIN_OVERRIDE", points_changed=override.value, reason="Admin added points"))
    elif action == "subtract_points" and override.value:
        team.score = max(0, team.score - override.value)
        db.add(ScoreEvent(team_id=team.id, event_type="ADMIN_OVERRIDE", points_changed=-override.value, reason="Admin subtracted points"))
    elif action == "restore_lives":
        team.lives = 3
        team.status = "ACTIVE"
        team.lockout_until = 0.0
    elif action == "set_quest" and override.quest_index is not None:
        target_idx = min(len(all_quests), max(0, override.quest_index))
        team.current_quest_index = target_idx
        team.status = "ACTIVE"
        team.completed_at = None

        # Synchronize TeamProgress:
        # 1. Precursor rooms (idx < target_idx) are COMPLETED
        for idx in range(target_idx):
            if idx < len(all_quests):
                q = all_quests[idx]
                prog = db.query(TeamProgress).filter_by(team_id=team.id, quest_id=q.id).first()
                if not prog:
                    prog = TeamProgress(team_id=team.id, quest_id=q.id, status="COMPLETED", completed_at=time.time())
                    db.add(prog)
                else:
                    prog.status = "COMPLETED"
                    prog.completed_at = time.time() if not prog.completed_at else prog.completed_at

        # 2. Target room and subsequent rooms (idx >= target_idx) MUST NOT be COMPLETED
        for idx in range(target_idx, len(all_quests)):
            q = all_quests[idx]
            prog = db.query(TeamProgress).filter_by(team_id=team.id, quest_id=q.id).first()
            if prog:
                prog.status = "IN_PROGRESS" if idx == target_idx else "LOCKED"
                prog.completed_at = None
                prog.attempt_count = 0
                prog.hint_used = False
            else:
                prog = TeamProgress(team_id=team.id, quest_id=q.id, status="IN_PROGRESS" if idx == target_idx else "LOCKED")
                db.add(prog)

        if target_idx >= len(all_quests):
            team.status = "COMPLETED"
            team.completed_at = time.time()
    elif action == "disqualify":
        team.status = "DISQUALIFIED"
    elif action == "pause_team":
        team.status = "PAUSED"
    elif action == "resume_team":
        team.status = "ACTIVE"

    db.add(AdminAuditLog(admin_id=admin, action=f"TEAM_OVERRIDE_{action}", details=f"Team: {team.name}, Override: {override.dict()}"))
    db.commit()

    await manager.broadcast({
        "type": "TEAM_UPDATE",
        "team_id": team.id,
        "action": action,
        "current_quest_index": team.current_quest_index,
        "score": team.score,
        "lives": team.lives,
        "status": team.status
    })
    await manager.broadcast({"type": "LEADERBOARD_UPDATE", "team_id": team.id})
    return {"status": "SUCCESS", "team": team.name, "new_score": team.score, "current_quest": team.current_quest_index}

@router.post("/reset-event")
async def reset_event(admin: str = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Complete Reset of the Event: Clears all teams, progress, attempts, score logs, and claims."""
    try:
        # Delete dependent child tables first
        db.query(AnswerAttempt).delete(synchronize_session=False)
        db.query(ScoreEvent).delete(synchronize_session=False)
        db.query(TeamProgress).delete(synchronize_session=False)
        db.query(Team).delete(synchronize_session=False)

        # Reset physical tokens if any
        tokens = db.query(PhysicalToken).all()
        for tok in tokens:
            tok.is_claimed = False
            tok.claimed_by_team_id = None
            tok.claimed_at = None

        # Reset config status
        config = db.query(EventConfiguration).first()
        if config:
            config.event_status = "WAITING"
            config.updated_at = time.time()

        db.add(AdminAuditLog(admin_id=admin, action="RESET_EVENT", details="Full event data reset by Game Master."))
        db.commit()

        await manager.broadcast({"type": "EVENT_RESET"})
        await manager.broadcast({"type": "LEADERBOARD_UPDATE"})

        return {"status": "SUCCESS", "message": "The entire event database has been reset. All records cleared."}
    except Exception as e:
        db.rollback()
        print("Reset event error:", e)
        raise HTTPException(status_code=500, detail=f"Reset failed: {str(e)}")
