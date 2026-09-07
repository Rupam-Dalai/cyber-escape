import time
from typing import List
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Team, Quest, EventConfiguration
from app.schemas import LeaderboardEntry
from app.websocket.manager import manager

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])

@router.get("", response_model=List[LeaderboardEntry])
def get_leaderboard(db: Session = Depends(get_db)):
    config = db.query(EventConfiguration).first()
    if config and not config.leaderboard_enabled:
        return []

    teams = db.query(Team).all()
    all_quests = db.query(Quest).order_by(Quest.order_index).all()

    now = time.time()
    # Sort primarily by highest trophies/score (descending), then lowest completion time (ascending)
    teams.sort(key=lambda t: (-t.score, int((t.completed_at or now) - t.started_at)))

    leaderboard = []
    for rank, team in enumerate(teams, start=1):
        loc_name = "NuLL Master Fortress (Boss Arena)" if team.current_quest_index >= len(all_quests) else all_quests[team.current_quest_index].location_name
        elapsed = int((team.completed_at or time.time()) - team.started_at)

        leaderboard.append(LeaderboardEntry(
            rank=rank,
            team_name=team.name,
            register_number=team.registration_code,
            avatar_id=getattr(team, "avatar_id", None) or "cyber_warrior",
            current_location=loc_name,
            current_quest_index=team.current_quest_index,
            score=team.score,
            lives=team.lives,
            time_elapsed_seconds=elapsed,
            status=team.status,
            fragments_count=min(18, team.current_quest_index)
        ))
    return leaderboard

@router.websocket("/ws")
async def leaderboard_websocket(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep socket alive and respond to pings
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
