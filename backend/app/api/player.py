import time
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Team, Quest, TeamProgress, AnswerAttempt, ScoreEvent, EventConfiguration, PhysicalToken
from app.schemas import QuestPublic, AnswerSubmission, AnswerResult, TeamResponse
from app.security import normalize_and_hash_answer
from app.websocket.manager import manager

router = APIRouter(prefix="/player", tags=["player"])

def get_current_team(x_team_code: str = Header(...), db: Session = Depends(get_db)) -> Team:
    team = db.query(Team).filter_by(registration_code=x_team_code).first()
    if not team:
        raise HTTPException(status_code=401, detail="Invalid team session code")
    return team

@router.get("/me", response_model=TeamResponse)
def get_team_status(team: Team = Depends(get_current_team), db: Session = Depends(get_db)):
    if team.status == "RECOVERY" and time.time() >= team.lockout_until:
        team.status = "ACTIVE"
        team.lives = 1
        db.commit()
        db.refresh(team)
    return team

@router.get("/quest/current", response_model=QuestPublic)
def get_current_quest(team: Team = Depends(get_current_team), db: Session = Depends(get_db)):
    config = db.query(EventConfiguration).first()
    if config and config.event_status == "WAITING":
        raise HTTPException(status_code=403, detail="THE VAULT HAS NOT OPENED YET. PLEASE WAIT IN THE LOBBY.")
    if config and config.event_status == "PAUSED":
        raise HTTPException(status_code=403, detail="THE HUNT HAS BEEN PAUSED BY THE GAME MASTER.")

    all_quests = db.query(Quest).order_by(Quest.order_index).all()
    if team.current_quest_index >= len(all_quests):
        raise HTTPException(status_code=400, detail="All quests have been completed.")

    quest = all_quests[team.current_quest_index]
    progress = db.query(TeamProgress).filter_by(team_id=team.id, quest_id=quest.id).first()

    return QuestPublic(
        id=quest.id,
        order_index=quest.order_index,
        slug=quest.slug,
        title=quest.title,
        location_name=quest.location_name,
        description=quest.description,
        narrative=quest.narrative,
        challenge_type=quest.challenge_type,
        code_language=quest.code_language,
        code_content=quest.code_content,
        image_url=quest.image_url,
        hint_available=progress.hint_used if progress else False,
        hint_text=quest.hint_text if (progress and progress.hint_used) else None,
        fragment_char=quest.fragment_char if (progress and progress.status == "COMPLETED") else None
    )

@router.get("/fragments")
def get_collected_fragments(team: Team = Depends(get_current_team), db: Session = Depends(get_db)):
    all_quests = db.query(Quest).order_by(Quest.order_index).all()
    fragments = []

    room_item_map = {
        0: {"name": "Firewall Patch", "icon": "🛡️", "type": "network", "desc": "Reflects and neutralizes NuLL Corruption Pulse in Phase 2."},
        1: {"name": "Power Surge Cell", "icon": "🔋", "type": "energy", "desc": "Delivers the final catastrophic EMP overload to NuLL in Phase 5."},
        2: {"name": "Access Credentials", "icon": "📜", "type": "root", "desc": "Combined with Firewall Rule Set to breach NuLL outer shield in Phase 1."},
        3: {"name": "Clean API Call", "icon": "⚙️", "type": "api", "desc": "Filters corrupted decoy streams to reveal the true NuLL in Phase 3."},
        4: {"name": "Firewall Rule Set", "icon": "🧱", "type": "network", "desc": "Combined with Access Credentials to breach NuLL outer shield in Phase 1."},
        5: {"name": "Cipher Key", "icon": "🔑", "type": "root", "desc": "Decodes and shatters NuLL encrypted core lock in Phase 4."},
        6: {"name": "Forensic Trace Map", "icon": "🗺️", "type": "quest", "desc": "Reveals NuLL exploitable timing reboot window in Phase 5."},
        7: {"name": "Master Vault Override Key", "icon": "★", "type": "vault", "desc": "Airlock master exit bypass key."}
    }

    for idx, q in enumerate(all_quests):
        prog = db.query(TeamProgress).filter_by(team_id=team.id, quest_id=q.id).first()
        is_done = (prog and prog.status == "COMPLETED") or (idx < team.current_quest_index) or (team.status == "COMPLETED")
        if is_done:
            item_meta = room_item_map.get(q.order_index, {"name": f"Item #{q.order_index+1}", "icon": q.fragment_char or "🔑", "type": "quest", "desc": "Room Key Item"})
            fragments.append({
                "order": q.order_index,
                "char": q.fragment_char,
                "location": q.location_name,
                "item_name": item_meta["name"],
                "icon": item_meta["icon"],
                "item_type": item_meta["type"],
                "description": item_meta["desc"]
            })
    return {"fragments": fragments}

@router.post("/submit", response_model=AnswerResult)
async def submit_answer(
    submission: AnswerSubmission,
    team: Team = Depends(get_current_team),
    db: Session = Depends(get_db)
):
    config = db.query(EventConfiguration).first()
    if config and config.event_status == "WAITING":
        raise HTTPException(status_code=403, detail="THE VAULT HAS NOT OPENED YET. PLEASE WAIT IN THE LOBBY.")
    if config and config.event_status == "PAUSED":
        raise HTTPException(status_code=403, detail="THE HUNT HAS BEEN PAUSED BY THE GAME MASTER.")

    if team.status == "RECOVERY":
        remaining = int(team.lockout_until - time.time())
        if remaining > 0:
            raise HTTPException(status_code=429, detail=f"Your expedition is in RECOVERY MODE. Lockout ends in {remaining} seconds.")
        else:
            team.status = "ACTIVE"
            team.lives = 1

    if team.status == "DISQUALIFIED":
        raise HTTPException(status_code=403, detail="Team has been disqualified by Game Master.")

    all_quests = db.query(Quest).order_by(Quest.order_index).all()
    cleaned_sub = submission.submitted_value.strip().upper().replace(" ", "").replace("-", "").replace("_", "")

    # Resolve target quest from submission.quest_id or answer content
    target_quest = None
    if submission.quest_id:
        target_quest = db.query(Quest).filter_by(id=submission.quest_id).first()

    # Smart match across all quests if submitted from open world room console
    if not target_quest or (normalize_and_hash_answer(submission.submitted_value) != target_quest.expected_answer_hash):
        if any(v in cleaned_sub for v in ["FIREWALLPATCHACTIVE", "FIREWALLPATCH", "PATCHACTIVE", "REWIRED", "LOADBALANCED", "SERVERHARDWAREREPAIRED", "SERVERREPAIRED", "SERVERARRAYRESTORED", "BLADESERVER"]):
            target_quest = db.query(Quest).filter_by(slug="network-infrastructure").first()
        elif any(v in cleaned_sub for v in ["POWERSURGECHARGED", "POWERGRIDONLINE", "GRIDSTABLE", "CIRCUITREPAIRED", "FUSEINSTALLED", "WIRESPLICED", "SPLICED", "PCBBREADBOARD", "BREADBOARD"]):
            target_quest = db.query(Quest).filter_by(slug="power-grid").first()
        elif any(v in cleaned_sub for v in ["ACCESSCREDENTIALSGRANTED", "ACCESSCREDENTIALSACTIVE", "ACCESSCREDENTIALS", "ROOTCREDENTIALS", "VAULT9082ROOT", "9082", "VAULTROOT", "KEYPADVAULT", "VAULT", "SELECTVAULT"]):
            target_quest = db.query(Quest).filter_by(slug="database-vault").first()
        elif any(v in cleaned_sub for v in ["CLEANAPIDISPATCHED", "CLEANAPICALLACTIVE", "CLEANAPI", "200OK", "CYBERTOKEN", "APIRESTORED", "==", "CLEANAPIAUTHVERIFIED", "CLEANAPIAUTH", "APIPIPELINEACTIVE", "APIDEBUGGER"]):
            target_quest = db.query(Quest).filter_by(slug="backend-api").first()
        elif any(v in cleaned_sub for v in ["PERIMETERSEALED", "FIREWALLRULESET", "FIREWALLRULESACTIVE", "FIREWALLRULES", "ACLACTIVE", "PACKETFILTERACTIVE", "PACKETFILTER", "TRAFFICFILTERED"]):
            target_quest = db.query(Quest).filter_by(slug="firewall-perimeter").first()
        elif any(v in cleaned_sub for v in ["CIPHERKEYUNLOCKED", "CIPHERKEYACTIVE", "CIPHERKEY", "ENIGMAMATRIXSOLVED", "ENIGMA", "VERIFYLOCKNEXT7", "VERIFY", "VERIFYKOCKNECT7"]):
            target_quest = db.query(Quest).filter_by(slug="crypto-vault").first()
        elif any(v in cleaned_sub for v in ["FORENSICMAPCOMPILED", "FORENSICMAPACTIVE", "FORENSICTRACEMAP", "FORENSICMAP", "PCAPSTREAMRECONSTRUCTED", "PCAP", "GHOST9", "INTRUSIONTRACED"]):
            target_quest = db.query(Quest).filter_by(slug="forensics-lab").first()
        elif any(v in cleaned_sub for v in ["NULLPURGED", "PURGE", "VICTORY", "ESCAPE"]):
            target_quest = db.query(Quest).filter_by(slug="null-chamber").first()

    if not target_quest:
        if team.current_quest_index < len(all_quests):
            target_quest = all_quests[team.current_quest_index]
        else:
            target_quest = all_quests[-1]

    # Compute submission hash & normalized checks
    submitted_hash = normalize_and_hash_answer(submission.submitted_value)
    is_primary_correct = (submitted_hash == target_quest.expected_answer_hash)

    if not is_primary_correct:
        if target_quest.slug == "network-infrastructure" and any(v in cleaned_sub for v in ["FIREWALLPATCHACTIVE", "FIREWALLPATCH", "PATCHACTIVE", "REWIRED", "LOADBALANCED", "SERVERHARDWAREREPAIRED", "SERVERREPAIRED", "SERVERARRAYRESTORED", "BLADESERVER", "100%", "SUCCESS"]):
            is_primary_correct = True
        elif target_quest.slug == "power-grid" and any(v in cleaned_sub for v in ["POWERSURGECHARGED", "POWERGRIDONLINE", "GRIDSTABLE", "CIRCUITREPAIRED", "FUSEINSTALLED", "WIRESPLICED", "SPLICED", "PCBBREADBOARD", "BREADBOARD", "ONLINE", "SUCCESS"]):
            is_primary_correct = True
        elif target_quest.slug == "database-vault" and any(v in cleaned_sub for v in ["ACCESSCREDENTIALSGRANTED", "ACCESSCREDENTIALSACTIVE", "ACCESSCREDENTIALS", "ROOTCREDENTIALS", "VAULT9082ROOT", "VAULT9082R00T", "9082", "VAULTROOT", "VAULTR00T", "KEYPADVAULT", "VAULT", "SELECTVAULT", "SUCCESS", "R00T", "ROOT"]):
            is_primary_correct = True
        elif target_quest.slug == "backend-api" and any(v in cleaned_sub for v in ["CLEANAPIDISPATCHED", "CLEANAPICALLACTIVE", "CLEANAPI", "200OK", "CYBERTOKEN", "APIRESTORED", "==", "SUCCESS", "CLEANAPIAUTHVERIFIED", "CLEANAPIAUTH", "APIPIPELINEACTIVE", "APIDEBUGGER"]):
            is_primary_correct = True
        elif target_quest.slug == "firewall-perimeter" and any(v in cleaned_sub for v in ["PERIMETERSEALED", "FIREWALLRULESET", "FIREWALLRULESACTIVE", "FIREWALLRULES", "ACLACTIVE", "PACKETFILTERACTIVE", "PACKETFILTER", "TRAFFICFILTERED", "SUCCESS"]):
            is_primary_correct = True
        elif target_quest.slug == "crypto-vault" and any(v in cleaned_sub for v in ["CIPHERKEYUNLOCKED", "CIPHERKEYACTIVE", "CIPHERKEY", "ENIGMAMATRIXSOLVED", "ENIGMA", "VERIFYLOCKNEXT7", "VERIFY", "SUCCESS", "VERIFYKOCKNECT7"]):
            is_primary_correct = True
        elif target_quest.slug == "forensics-lab" and any(v in cleaned_sub for v in ["FORENSICMAPCOMPILED", "FORENSICMAPACTIVE", "FORENSICTRACEMAP", "FORENSICMAP", "PCAPSTREAMRECONSTRUCTED", "PCAP", "GHOST9", "INTRUSIONTRACED", "SUCCESS"]):
            is_primary_correct = True
        elif target_quest.slug == "null-chamber" and any(v in cleaned_sub for v in ["NULLPURGED", "PURGE", "VICTORY", "ESCAPE"]):
            is_primary_correct = True

    # Validate secondary value if present, but accept primary match
    is_correct = is_primary_correct

    attempt = AnswerAttempt(
        team_id=team.id,
        quest_id=target_quest.id,
        submitted_value=submission.submitted_value + (f" | {submission.secondary_value}" if submission.secondary_value else ""),
        is_correct=is_correct,
        timestamp=time.time()
    )
    db.add(attempt)

    progress = db.query(TeamProgress).filter_by(team_id=team.id, quest_id=target_quest.id).first()
    if not progress:
        progress = TeamProgress(
            team_id=team.id,
            quest_id=target_quest.id,
            status="UNLOCKED",
            attempt_count=0,
            unlocked_at=time.time()
        )
        db.add(progress)

    progress.attempt_count += 1
    score_change = 0

    if is_correct:
        progress.status = "COMPLETED"
        progress.completed_at = time.time()

        # Identify specific task key (explicitly passed or inferred)
        task_key = submission.task_id
        if not task_key:
            if target_quest.slug == "network-infrastructure":
                task_key = "network_blade_server" if any(v in cleaned_sub for v in ["SERVERHARDWARE", "SERVERREPAIRED", "SERVERARRAY", "BLADESERVER"]) else "network_patch_console"
            elif target_quest.slug == "power-grid":
                task_key = "power_pcb_breadboard" if any(v in cleaned_sub for v in ["CIRCUITREPAIRED", "FUSEINSTALLED", "BREADBOARD", "PCBBREADBOARD"]) else "power_wire_splicing_box"
            elif target_quest.slug == "database-vault":
                task_key = "db_keypad_vault" if any(v in cleaned_sub for v in ["VAULT9082ROOT", "9082", "VAULTROOT", "KEYPADVAULT", "VAULT"]) else "db_terminal_query"
            elif target_quest.slug == "backend-api":
                task_key = "api_debugger_console" if any(v in cleaned_sub for v in ["CLEANAPIAUTH", "==", "HMAC", "DEBUGGER", "APIDEBUGGER"]) else "api_workstation_dispatch"
            elif target_quest.slug == "firewall-perimeter":
                task_key = "soc_firewall_console" if any(v in cleaned_sub for v in ["FIREWALLRULES", "FIREWALLRULESET", "PERIMETERSEALED", "ACLACTIVE"]) else "soc_packet_sorter"
            elif target_quest.slug == "crypto-vault":
                task_key = "crypto_enigma_plugboard" if any(v in cleaned_sub for v in ["ENIGMAMATRIX", "ENIGMA", "PLUGBOARD", "STECKERBRETT"]) else "crypto_wheel_terminal"
            elif target_quest.slug == "forensics-lab":
                task_key = "forensics_pcap_reconstruct" if any(v in cleaned_sub for v in ["PCAPSTREAM", "PCAP", "RECONSTRUCT"]) else "forensics_timeline_workstation"
            elif target_quest.slug == "null-chamber":
                task_key = "null_chamber"
            else:
                task_key = f"{target_quest.slug}_task"

        # Check if trophies for this specific task have already been awarded to this team
        already_awarded = db.query(ScoreEvent).filter(
            ScoreEvent.team_id == team.id,
            ScoreEvent.reason.like(f"%Task: {task_key}%")
        ).first() is not None

        if not already_awarded:
            task_points = 1000 if target_quest.slug == "null-chamber" else 250
            score_change = task_points
            team.score += score_change

            db.add(ScoreEvent(
                team_id=team.id,
                event_type="TASK_COMPLETE",
                points_changed=score_change,
                reason=f"Completed Task: {task_key} in {target_quest.title}",
                timestamp=time.time()
            ))

        team.current_quest_index = max(team.current_quest_index, target_quest.order_index + 1)
        completed_count = db.query(TeamProgress).filter_by(team_id=team.id, status="COMPLETED").count()
        all_completed = (team.current_quest_index >= 8) or (team.status == "COMPLETED")
        if all_completed and team.status != "COMPLETED":
            team.status = "COMPLETED"
            if not team.completed_at:
                team.completed_at = time.time()

        db.commit()

        await manager.broadcast({
            "type": "TEAM_UPDATE",
            "team_id": team.id,
            "current_quest_index": team.current_quest_index,
            "score": team.score,
            "lives": team.lives,
            "status": team.status
        })
        await manager.broadcast({"type": "LEADERBOARD_UPDATE", "team_id": team.id})

        return AnswerResult(
            is_correct=True,
            message=f"TERMINAL ACCEPTED: {task_key.replace('_', ' ').upper()} SECURED! (+{score_change} Trophies)",
            score_change=score_change,
            new_score=team.score,
            lives_remaining=team.lives,
            lockout_until=0.0,
            fragment_unlocked=target_quest.fragment_char,
            quest_completed=True,
            all_quests_completed=all_completed
        )
    else:
        penalty = config.wrong_penalty if config else 50
        team.score = max(0, team.score - penalty)
        team.lives -= 1

        db.add(ScoreEvent(
            team_id=team.id,
            event_type="WRONG_ATTEMPT",
            points_changed=-penalty,
            reason=f"Incorrect attempt on {target_quest.title}",
            timestamp=time.time()
        ))

        lockout = 0.0
        if team.lives <= 0:
            team.status = "RECOVERY"
            lockout_duration = config.lockout_seconds if config else 15
            team.lockout_until = time.time() + lockout_duration
            lockout = team.lockout_until

        db.commit()

        await manager.broadcast({"type": "LEADERBOARD_UPDATE", "team_id": team.id})

        return AnswerResult(
            is_correct=False,
            message="TERMINAL REJECTED THE SEQUENCE.",
            score_change=-penalty,
            new_score=team.score,
            lives_remaining=max(0, team.lives),
            lockout_until=lockout,
            quest_completed=False,
            all_quests_completed=False
        )

@router.post("/use-hint")
async def use_hint(team: Team = Depends(get_current_team), db: Session = Depends(get_db)):
    config = db.query(EventConfiguration).first()
    cost = config.hint_cost if config else 200

    all_quests = db.query(Quest).order_by(Quest.order_index).all()
    if team.current_quest_index >= len(all_quests):
        raise HTTPException(status_code=400, detail="All quests completed.")

    quest = all_quests[team.current_quest_index]
    progress = db.query(TeamProgress).filter_by(team_id=team.id, quest_id=quest.id).first()

    # If hint was already unlocked for this quest, return it without deducting points or hint count
    if progress and progress.hint_used:
        return {"hint_text": quest.hint_text, "already_used": True, "hints_remaining": team.hints_remaining, "new_score": team.score}

    if team.hints_remaining <= 0:
        raise HTTPException(status_code=400, detail="No hints remaining for your team.")

    if team.score < cost:
        raise HTTPException(status_code=400, detail=f"Insufficient points. Hints cost {cost} points.")

    team.hints_remaining -= 1
    team.score = max(0, team.score - cost)
    if progress:
        progress.hint_used = True

    db.add(ScoreEvent(
        team_id=team.id,
        event_type="HINT_USED",
        points_changed=-cost,
        reason=f"Used hint for {quest.title}",
        timestamp=time.time()
    ))
    db.commit()

    await manager.broadcast({"type": "LEADERBOARD_UPDATE", "team_id": team.id})

    return {"hint_text": quest.hint_text, "hints_remaining": team.hints_remaining, "new_score": team.score}

@router.post("/defeat-boss")
async def defeat_boss(team: Team = Depends(get_current_team), db: Session = Depends(get_db)):
    config = db.query(EventConfiguration).first()

    if team.status != "COMPLETED":
        team.status = "COMPLETED"
        if not team.completed_at:
            team.completed_at = time.time()

        bonus = config.final_bonus if config else 1000
        team.score += bonus

        db.add(ScoreEvent(
            team_id=team.id,
            event_type="FINAL_BOSS_DEFEATED",
            points_changed=bonus,
            reason="Defeated Master Boss NuLL!",
            timestamp=time.time()
        ))
        db.commit()
        await manager.broadcast({"type": "LEADERBOARD_UPDATE", "team_id": team.id})

    return {
        "status": "COMPLETED",
        "message": "MASTER BOSS NULL DEFEATED! VICTORY ACHIEVED!",
        "score": team.score,
        "completed_at": team.completed_at
    }

@router.post("/respawn")
async def respawn_player(team: Team = Depends(get_current_team), db: Session = Depends(get_db)):
    penalty = 50
    team.score = max(0, team.score - penalty)
    team.lives = 3
    team.status = "ACTIVE"
    team.lockout_until = 0.0

    db.add(ScoreEvent(
        team_id=team.id,
        event_type="RESPAWN_PENALTY",
        points_changed=-penalty,
        reason="Respawned in NuLL Boss Arena",
        timestamp=time.time()
    ))
    db.commit()

    await manager.broadcast({"type": "LEADERBOARD_UPDATE", "team_id": team.id})

    return {
        "status": "SUCCESS",
        "message": "Operative respawned with emergency combat shield (-50 Trophies).",
        "new_score": team.score,
        "lives": team.lives
    }

@router.post("/claim-treasure/{token_str}")
def claim_physical_treasure(token_str: str, team: Team = Depends(get_current_team), db: Session = Depends(get_db)):
    token = db.query(PhysicalToken).filter_by(token=token_str).first()
    if not token or not token.is_claimed:
        if token:
            token.is_claimed = True
            token.claimed_by_team_id = team.id
            token.claimed_at = time.time()
            db.commit()
            return {"status": "SUCCESS", "message": "Physical Treasure Claimed!"}
    raise HTTPException(status_code=400, detail="Invalid or already claimed physical treasure token.")
