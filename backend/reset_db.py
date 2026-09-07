import os
import sys

# Ensure UTF-8 output encoding on Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

# Add parent directory to path to allow importing app modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base, SessionLocal
from app.seed import seed_database

def reset_system():
    print("=================================================================")
    print("       RESETTING ESCAPE THE CYBER VAULT DATABASE (BSc CS)        ")
    print("=================================================================")

    # 1. Drop all tables in SQLite database
    print("\n[1/3] Dropping all database tables...")
    Base.metadata.drop_all(bind=engine)
    print("      [+] Database tables dropped successfully.")

    # 2. Re-create all database schema tables
    print("\n[2/3] Re-creating fresh database schema...")
    Base.metadata.create_all(bind=engine)
    print("      [+] Fresh database schema created.")

    # 3. Seed fresh configuration and default administrator
    print("\n[3/3] Seeding initial event configuration & admin user...")
    db = SessionLocal()
    try:
        seed_database(db)
        print("      [+] Fresh database seeded successfully.")
    except Exception as e:
        print(f"      [-] Seeding error: {e}")
    finally:
        db.close()

    # 4. Verify database file
    db_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "code_hunt.db")
    if os.path.exists(db_file):
        print(f"\n      [+] Verified SQLite database at: {db_file}")

    print("\n=================================================================")
    print("  SYSTEM RESET COMPLETE! ESCAPE THE CYBER VAULT IS READY!        ")
    print("=================================================================\n")

if __name__ == "__main__":
    reset_system()
