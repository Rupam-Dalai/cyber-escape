import time
import uuid
from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, Float, Text, DateTime
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Admin(Base):
    __tablename__ = "admins"

    id = Column(String, primary_key=True, default=generate_uuid)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(Float, default=time.time)

class EventConfiguration(Base):
    __tablename__ = "event_configurations"

    id = Column(Integer, primary_key=True, default=1)
    event_name = Column(String, default="ESCAPE THE CYBER VAULT 2026")
    club_name = Column(String, default="Department of BSc CS with Cyber Security")
    event_date = Column(String, default="2026-09-01")
    starting_score = Column(Integer, default=1000)
    starting_lives = Column(Integer, default=3)
    hints_per_team = Column(Integer, default=5)
    hint_cost = Column(Integer, default=200)
    wrong_penalty = Column(Integer, default=50)
    completion_points = Column(Integer, default=500)
    final_bonus = Column(Integer, default=1000)
    lockout_seconds = Column(Integer, default=15)
    leaderboard_enabled = Column(Boolean, default=True)
    physical_treasure_mode = Column(Boolean, default=False)
    final_physical_clue = Column(Text, default="VAULT OVERRIDE KEY LOCATED IN CYBER SECURITY LAB #01")
    event_status = Column(String, default="WAITING") # WAITING, ACTIVE, PAUSED, ENDED
    updated_at = Column(Float, default=time.time)

class Team(Base):
    __tablename__ = "teams"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, unique=True, index=True, nullable=False)
    registration_code = Column(String, unique=True, index=True, nullable=False)
    avatar_id = Column(String, default="cyber_warrior")
    score = Column(Integer, default=1000)
    lives = Column(Integer, default=3)
    hints_remaining = Column(Integer, default=18)
    current_quest_index = Column(Integer, default=0) # 0 to 5
    status = Column(String, default="ACTIVE") # ACTIVE, RECOVERY, COMPLETED, DISQUALIFIED
    lockout_until = Column(Float, default=0.0) # Timestamp when recovery mode ends
    started_at = Column(Float, default=time.time)
    completed_at = Column(Float, nullable=True)

    progress_records = relationship("TeamProgress", back_populates="team", cascade="all, delete-orphan")
    attempts = relationship("AnswerAttempt", back_populates="team", cascade="all, delete-orphan")
    score_events = relationship("ScoreEvent", back_populates="team", cascade="all, delete-orphan")

class Quest(Base):
    __tablename__ = "quests"

    id = Column(String, primary_key=True, default=generate_uuid)
    order_index = Column(Integer, unique=True, nullable=False) # 0, 1, 2, 3, 4, 5
    slug = Column(String, unique=True, nullable=False)
    title = Column(String, nullable=False)
    location_name = Column(String, nullable=False) # e.g. Ancient Gate
    description = Column(Text, nullable=True)
    narrative = Column(Text, nullable=True)
    challenge_type = Column(String, nullable=False) # OUTPUT, PATH_SELECTION, NUMBER_KEYPAD, DEBUG_FIX, PASSWORD, MULTI_KEY
    code_language = Column(String, default="c")
    code_content = Column(Text, nullable=True)
    image_url = Column(Text, nullable=True)
    expected_answer_hash = Column(String, nullable=False) # Hash or normalized expected answer string
    secondary_answer_hash = Column(String, nullable=True) # For multi-key challenge
    hint_text = Column(Text, nullable=True)
    hint_cost = Column(Integer, default=200)
    completion_points = Column(Integer, default=500)
    wrong_attempt_penalty = Column(Integer, default=50)
    fragment_char = Column(String, nullable=True) # C, O, D, E, R
    is_active = Column(Boolean, default=True)

class TeamProgress(Base):
    __tablename__ = "team_progress"

    id = Column(String, primary_key=True, default=generate_uuid)
    team_id = Column(String, ForeignKey("teams.id"), nullable=False)
    quest_id = Column(String, ForeignKey("quests.id"), nullable=False)
    status = Column(String, default="LOCKED") # LOCKED, UNLOCKED, COMPLETED
    attempt_count = Column(Integer, default=0)
    hint_used = Column(Boolean, default=False)
    unlocked_at = Column(Float, default=time.time)
    completed_at = Column(Float, nullable=True)

    team = relationship("Team", back_populates="progress_records")

class AnswerAttempt(Base):
    __tablename__ = "answer_attempts"

    id = Column(String, primary_key=True, default=generate_uuid)
    team_id = Column(String, ForeignKey("teams.id"), nullable=False)
    quest_id = Column(String, ForeignKey("quests.id"), nullable=False)
    submitted_value = Column(Text, nullable=False)
    is_correct = Column(Boolean, nullable=False)
    timestamp = Column(Float, default=time.time)

    team = relationship("Team", back_populates="attempts")

class ScoreEvent(Base):
    __tablename__ = "score_events"

    id = Column(String, primary_key=True, default=generate_uuid)
    team_id = Column(String, ForeignKey("teams.id"), nullable=False)
    event_type = Column(String, nullable=False) # LEVEL_COMPLETE, WRONG_ATTEMPT, HINT_USED, ADMIN_OVERRIDE, FINAL_BONUS
    points_changed = Column(Integer, nullable=False)
    reason = Column(String, nullable=True)
    timestamp = Column(Float, default=time.time)

    team = relationship("Team", back_populates="score_events")

class AdminAuditLog(Base):
    __tablename__ = "admin_audit_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    admin_id = Column(String, nullable=False)
    action = Column(String, nullable=False)
    details = Column(Text, nullable=True)
    timestamp = Column(Float, default=time.time)

class PhysicalToken(Base):
    __tablename__ = "physical_tokens"

    id = Column(String, primary_key=True, default=generate_uuid)
    token = Column(String, unique=True, index=True, nullable=False)
    is_claimed = Column(Boolean, default=False)
    claimed_by_team_id = Column(String, ForeignKey("teams.id"), nullable=True)
    claimed_at = Column(Float, nullable=True)
