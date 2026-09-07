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

import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

@app.get("/api/health")
@app.get("/api/status")
def read_status():
    host_ip = "127.0.0.1"
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        host_ip = s.getsockname()[0]
        s.close()
    except Exception:
        pass

    return {
        "title": "Escape the Cyber Vault Platform API",
        "status": "ONLINE",
        "lan_access_url": f"http://{host_ip}:8000",
        "docs_url": f"http://{host_ip}:8000/docs"
    }

# Serve Frontend Static Files (SPA Single-Project Support)
static_dir = os.path.join(os.path.dirname(__file__), "static")
if not os.path.exists(static_dir):
    static_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))

if os.path.exists(static_dir):
    assets_dir = os.path.join(static_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        target_file = os.path.join(static_dir, full_path)
        if full_path and os.path.isfile(target_file):
            return FileResponse(target_file)
        return FileResponse(os.path.join(static_dir, "index.html"))

