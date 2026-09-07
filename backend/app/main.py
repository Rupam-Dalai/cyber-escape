import socket
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, SessionLocal
from app.seed import seed_database
from app.api import auth, player, admin, leaderboard

# Create DB Tables
Base.metadata.create_all(bind=engine)

# Auto-migrate SQLite missing columns
try:
    with engine.connect() as conn:
        from sqlalchemy import text
        conn.execute(text("ALTER TABLE teams ADD COLUMN avatar_id VARCHAR DEFAULT 'cyber_warrior'"))
        conn.commit()
except Exception:
    pass

# Seed Database
db = SessionLocal()
try:
    seed_database(db)
finally:
    db.close()

app = FastAPI(
    title="Escape the Cyber Vault Platform API",
    description="2.5D Cyber Escape Room & Boss Encounter Platform - Department of BSc CS with Cyber Security",
    version="2.0.0"
)

# CORS middleware for LAN and dev environments
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router, prefix="/api")
app.include_router(player.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(leaderboard.router, prefix="/api")

@app.get("/")
def read_root():
    # Helper to discover local IP address for LAN setup
    host_ip = "127.0.0.1"
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        host_ip = s.getsockname()[0]
        s.close()
    except Exception:
        pass

    return {
        "title": "CODE HUNT Platform API",
        "status": "ONLINE",
        "lan_access_url": f"http://{host_ip}:8000",
        "docs_url": f"http://{host_ip}:8000/docs"
    }
