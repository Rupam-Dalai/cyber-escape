import os

class Settings:
    PROJECT_NAME: str = "CODE HUNT"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "codehunt_secret_key_college_event_2026_super_secure")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    # Database URL handling with Render/Heroku postgres:// schema fix
    _raw_db = os.getenv("DATABASE_URL", "sqlite:///./code_hunt.db")
    if _raw_db.startswith("postgres://"):
        _raw_db = _raw_db.replace("postgres://", "postgresql://", 1)
    DATABASE_URL: str = _raw_db
    
    # Game Defaults
    DEFAULT_STARTING_SCORE: int = 1000
    DEFAULT_STARTING_LIVES: int = 3
    DEFAULT_HINTS_PER_TEAM: int = 2
    DEFAULT_HINT_COST: int = 200
    DEFAULT_WRONG_PENALTY: int = 50
    DEFAULT_COMPLETION_POINTS: int = 500
    DEFAULT_FINAL_BONUS: int = 1000
    DEFAULT_LOCKOUT_SECONDS: int = 60

settings = Settings()
