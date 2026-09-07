from pydantic import BaseModel, Field
from typing import Optional, List

# Team Schemas
class TeamRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    registration_code: str = Field(..., min_length=1, max_length=50)

class TeamLogin(BaseModel):
    registration_code: str = Field(..., min_length=1, max_length=50)

class TeamResponse(BaseModel):
    id: str
    name: str
    registration_code: str
    score: int
    lives: int
    hints_remaining: int
    current_quest_index: int
    status: str
    lockout_until: float
    started_at: float
    completed_at: Optional[float] = None

    class Config:
        from_attributes = True

# Quest Schemas
class QuestPublic(BaseModel):
    id: str
    order_index: int
    slug: str
    title: str
    location_name: str
    description: Optional[str] = None
    narrative: Optional[str] = None
    challenge_type: str
    code_language: str
    code_content: Optional[str] = None
    image_url: Optional[str] = None
    hint_available: bool = False
    hint_text: Optional[str] = None # Only populated if unlocked
    fragment_char: Optional[str] = None # Only shown if solved

    class Config:
        from_attributes = True

# Answer Submission Schema
class AnswerSubmission(BaseModel):
    quest_id: str
    submitted_value: str
    secondary_value: Optional[str] = None # For multi-key challenge
    task_id: Optional[str] = None

class AnswerResult(BaseModel):
    is_correct: bool
    message: str
    score_change: int
    new_score: int
    lives_remaining: int
    lockout_until: float
    fragment_unlocked: Optional[str] = None
    quest_completed: bool
    all_quests_completed: bool = False

# Admin Schemas
class AdminLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class AdminTeamOverride(BaseModel):
    action: str # add_points, subtract_points, restore_lives, reset_level, unlock_level, set_quest, pause_team, disqualify
    value: Optional[int] = None
    quest_index: Optional[int] = None

class EventConfigUpdate(BaseModel):
    event_name: Optional[str] = None
    club_name: Optional[str] = None
    starting_score: Optional[int] = None
    starting_lives: Optional[int] = None
    hints_per_team: Optional[int] = None
    hint_cost: Optional[int] = None
    wrong_penalty: Optional[int] = None
    completion_points: Optional[int] = None
    final_bonus: Optional[int] = None
    lockout_seconds: Optional[int] = None
    leaderboard_enabled: Optional[bool] = None
    physical_treasure_mode: Optional[bool] = None
    final_physical_clue: Optional[str] = None
    event_status: Optional[str] = None

# Leaderboard Entry
class LeaderboardEntry(BaseModel):
    rank: int
    team_name: str
    register_number: Optional[str] = ""
    avatar_id: Optional[str] = "cyber_warrior"
    current_location: str
    current_quest_index: Optional[int] = 0
    score: int
    lives: Optional[int] = 3
    time_elapsed_seconds: int
    status: str
    fragments_count: int
