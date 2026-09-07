import time
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.models import Admin, EventConfiguration, Quest, Team, TeamProgress, ScoreEvent, PhysicalToken
from app.security import hash_password, normalize_and_hash_answer

def seed_database(db: Session):
    # Auto-migrate SQLite schema if new column image_url is missing
    try:
        db.execute(text("ALTER TABLE quests ADD COLUMN image_url TEXT;"))
        db.commit()
    except Exception:
        db.rollback()

    # 1. Event Config
    config = db.query(EventConfiguration).first()
    if not config:
        config = EventConfiguration(
            id=1,
            event_name="ESCAPE THE CYBER VAULT 2026",
            club_name="Department of BSc CS with Cyber Security",
            starting_score=1000,
            starting_lives=3,
            hints_per_team=5,
            hint_cost=200,
            wrong_penalty=50,
            completion_points=500,
            final_bonus=1000,
            lockout_seconds=15,
            leaderboard_enabled=True,
            physical_treasure_mode=False,
            final_physical_clue="VAULT OVERRIDE KEY LOCATED IN CYBER SECURITY LAB #01",
            event_status="WAITING"
        )
        db.add(config)
    else:
        config.event_name = "ESCAPE THE CYBER VAULT 2026"
        config.club_name = "Department of BSc CS with Cyber Security"
        config.lockout_seconds = 15
        db.commit()

    # 2. Admin User
    admin = db.query(Admin).filter_by(username="admin").first()
    if not admin:
        admin = Admin(
            username="admin",
            password_hash=hash_password("admincrack")
        )
        db.add(admin)
    else:
        admin.password_hash = hash_password("admincrack")
        db.commit()

    # 3. Official 7 Cyber Security Escape Rooms & Final NuLL Boss Chamber
    quests_data = [
        {
            "order_index": 0,
            "slug": "network-infrastructure",
            "title": "SECTOR-01: NETWORK INFRASTRUCTURE — REWIRE THE RACK",
            "location_name": "Network Infrastructure Hub | Sector-01",
            "description": "Patch-panel matching followed by a load-balancing calibration across 3 server racks without exceeding 100%.",
            "narrative": "Central routing arrays are offline. Fiber patch lines SFP+ Uplink, Core Switch, Eth0, and SAN Storage must be reconnected. Then, balance traffic across Racks A, B, and C based on the technician's threshold specifications! WARNING: 3 mismatched connections will spark an optical surge!",
            "challenge_type": "NETWORK_PATCH",
            "code_language": "network",
            "code_content": "=== NETWORK PATCH & LOAD BALANCING ===\nPorts: [SFP+ Uplink] [Core Switch] [Router Eth0] [SAN Storage]\nLoad Balancing: Distribute 100% traffic across Rack A (45%), Rack B (35%), Rack C (20%).\n\nTask: Connect ports and balance load to compile the Firewall Patch!",
            "expected_answer": "FIREWALL_PATCH_ACTIVE",
            "hint_text": "Connect SFP+ to Fiber-01, Core Switch to LAN-01, Eth0 to Gateway, and SAN to Storage. Check the hidden technician note behind the rack for load thresholds!",
            "fragment_char": "🛡️",
            "completion_points": 500,
            "wrong_attempt_penalty": 50
        },
        {
            "order_index": 1,
            "slug": "power-grid",
            "title": "SECTOR-02: POWER GRID — RESTORE THE GRID",
            "location_name": "Industrial Power Substation | Sector-02",
            "description": "Connect relay circuits without crossing conflicting hot wires, insert the spare fuse, and stabilize grid frequency.",
            "narrative": "High-voltage relays are disconnected. Connect the 4 relay busbars safely. You MUST find the Spare Fuse hidden in the maintenance vent before powering the second stage grid stabilizer! WARNING: Touching wrong wires or redlining voltage causes an explosive short-circuit arc blast!",
            "challenge_type": "CIRCUIT_STABILIZE",
            "code_language": "circuit",
            "code_content": "=== INDUSTRIAL POWER SUBSTATION ===\nRelays: [Phase 1 (240V)] [Neutral (0V)] [Bus Aux (12V)] [Flux Core (48V)]\nRequirement: Insert 50A Spare Fuse into secondary stage.\n\nTask: Wire relays and stabilize grid frequency to charge the Power Surge Cell!",
            "expected_answer": "POWER_SURGE_CHARGED",
            "hint_text": "Find the spare fuse in the maintenance vent. Connect Phase 1 to P1, Neutral to N0, Aux to A12, and Flux to F48. Hold the stabilization needle inside the green zone.",
            "fragment_char": "🔋",
            "completion_points": 500,
            "wrong_attempt_penalty": 50
        },
        {
            "order_index": 2,
            "slug": "database-vault",
            "title": "SECTOR-03: DATABASE VAULT — CRACK THE CREDENTIAL VAULT",
            "location_name": "Database Security Vault | Sector-03",
            "description": "Logic-grid table repair to deduce corrupted clearance records, followed by a drag-block SQL query builder.",
            "narrative": "The Database Security Vault holds root credentials, but its query engine is locked until the Backend API (Sector-04) is restored! Deduce corrupted credentials using the logic grid, resolve ambiguous values with the drawer clue, and construct the SQL query to unlock Access Credentials!",
            "challenge_type": "LOGIC_GRID",
            "code_language": "sql",
            "code_content": "=== DATABASE LOGIC GRID & SQL BUILDER ===\nTable: security_vault\nRequired Query: SELECT vault_pass, root_cert FROM security_vault WHERE role = 'ROOT' AND status = 'ACTIVE';\n\nTask: Repair logic grid and execute the root query to extract Access Credentials!",
            "expected_answer": "ACCESS_CREDENTIALS_GRANTED",
            "hint_text": "Use the Security Memo in the filing cabinet to deduce clearance level ROOT, passcode VAULT-9082-ROOT, and status ACTIVE for operative #007.",
            "fragment_char": "📜",
            "completion_points": 500,
            "wrong_attempt_penalty": 50
        },
        {
            "order_index": 3,
            "slug": "backend-api",
            "title": "SECTOR-04: BACKEND / API — PATCH THE ENDPOINTS",
            "location_name": "Backend & Microservice Hub | Sector-04",
            "description": "Match REST requests to expected response status codes and patch the missing schema field on the bugged endpoint.",
            "narrative": "Microservice communication is throwing 502 Bad Gateway errors. Match endpoints GET /auth, POST /telemetry, PUT /firewall with their 200 OK payloads, and inject the missing schema authorization header identified on the whiteboard diagram. Completing this unlocks the Database Vault!",
            "challenge_type": "API_ENDPOINT",
            "code_language": "json",
            "code_content": "=== MICROSERVICE API PATCH ===\nEndpoints: GET /auth, POST /telemetry, PUT /firewall\nMissing Field: Authorization: Bearer CYBER_TOKEN\n\nTask: Match endpoints and deploy the schema patch to generate Clean API Call!",
            "expected_answer": "CLEAN_API_DISPATCHED",
            "hint_text": "Inspect the architecture whiteboard. It reveals endpoint #2 requires 'Bearer CYBER_TOKEN' and status 200 OK.",
            "fragment_char": "⚙️",
            "completion_points": 500,
            "wrong_attempt_penalty": 50
        },
        {
            "order_index": 4,
            "slug": "firewall-perimeter",
            "title": "SECTOR-05: FIREWALL & PERIMETER — SEAL THE PERIMETER",
            "location_name": "Security Operations Center | Sector-05",
            "description": "Build and order a priority list of packet-filtering ACL rules to drop malicious traffic and permit legitimate connections.",
            "narrative": "The facility SOC is receiving a flood of mixed network packets. Inspect incoming traffic (SSH, HTTPS, C2 Botnet, Port Scans), refer to the pinned Bad IP range printout, and arrange allow/deny firewall rules in priority sequence. WARNING: Leaking 2 malicious packets triggers a lockdown alarm!",
            "challenge_type": "FIREWALL_ACL",
            "code_language": "acl",
            "code_content": "=== FIREWALL ACCESS CONTROL LIST (ACL) ===\nRules Available: [ALLOW 10.0.0.0/8] [DENY 198.51.100.0/24 (C2)] [DENY PORT 4444] [ALLOW PORT 443 HTTPS] [DENY ALL]\n\nTask: Order ACL rules so all bad traffic is dropped and legit packets pass!",
            "expected_answer": "PERIMETER_SEALED",
            "hint_text": "Put specific DENY rules (like DENY C2 IP 198.51.100.0/24 and DENY Port 4444) before general ALLOW rules, and terminate with DENY ALL.",
            "fragment_char": "🧱",
            "completion_points": 500,
            "wrong_attempt_penalty": 50
        },
        {
            "order_index": 5,
            "slug": "crypto-vault",
            "title": "SECTOR-06: CRYPTOGRAPHY VAULT — BREAK THE CIPHER",
            "location_name": "Cryptography Sanctuary | Sector-06",
            "description": "Rotate the cipher wheel and substitution key to decrypt the encrypted vault communication string.",
            "narrative": "An encrypted transmission from rogue AI NULL is stored inside the cipher terminal. Use the rotating cipher wheel and the 2 pre-solved substitution pairs from the torn note on the floor to decrypt the cipher and forge the Cipher Key!",
            "challenge_type": "CIPHER_WHEEL",
            "code_language": "crypto",
            "code_content": "=== CIPHER WHEEL / ENIGMA-LITE ===\nEncrypted String: XGTKHA_MQEM_PGEV_7\nPartial Key from Note: X -> V, G -> E (Offset = +2 / Caesar Shift -2)\n\nTask: Decrypt the full string to extract the Cipher Key!",
            "expected_answer": "CIPHER_KEY_UNLOCKED",
            "hint_text": "The torn note gives X->V and G->E. A shift of -2 decrypts XGTKHA to VERIFY, MQEM to LOCK, and PGEV to NEXT. Decrypted value: VERIFY_LOCK_NEXT_7.",
            "fragment_char": "🔑",
            "completion_points": 500,
            "wrong_attempt_penalty": 50
        },
        {
            "order_index": 6,
            "slug": "forensics-lab",
            "title": "SECTOR-07: FORENSICS LAB — TRACE THE INTRUSION",
            "location_name": "Digital Forensics Lab | Sector-07",
            "description": "Scrub through timestamped event logs to flag 3-4 anomalous entries (odd hour, impossible location jump, unapproved privilege jump).",
            "narrative": "The digital forensics evidence room is filled with timeline logs. Scrub through the access records and flag the true anomalies: an off-hours login at 03:14 AM, an impossible travel jump from Tokyo to London in 2 minutes, and an unapproved sudo escalation from unauthorized device GHOST-9 (found on corkboard photo)!",
            "challenge_type": "FORENSIC_TIMELINE",
            "code_language": "log",
            "code_content": "=== INCIDENT RESPONSE FORENSIC TIMELINE ===\nLogs: [01:15 SysCheck] [03:14 Admin Login - External IP] [03:16 London Access after Tokyo 03:14] [03:22 Sudo UID 0 Device GHOST-9] [04:00 Cron Audit]\n\nTask: Flag the 3 anomalous logs to reconstruct the Forensic Trace Map!",
            "expected_answer": "FORENSIC_MAP_COMPILED",
            "hint_text": "Check the corkboard photo for device GHOST-9. Flag the 03:14 external login, the 03:16 impossible travel, and the 03:22 GHOST-9 privilege escalation.",
            "fragment_char": "🗺️",
            "completion_points": 500,
            "wrong_attempt_penalty": 50
        },
        {
            "order_index": 7,
            "slug": "null-chamber",
            "title": "CENTRAL VAULT CORE: BOSS NuLL CHAMBER",
            "location_name": "Central Core Airlock: Rogue AI NuLL",
            "description": "5-phase boss fight against rogue super-intelligence NuLL using all 7 collected facility items.",
            "narrative": "You have breached the Central Airlock! Rogue AI NuLL has initiated facility lockdown. Overcome all 5 combat phases: Phase 1 (Firewall Rule Set + Access Credentials), Phase 2 (Firewall Patch), Phase 3 (Clean API Call), Phase 4 (Cipher Key), and Phase 5 (Forensic Trace Map + Power Surge Cell) to destroy NuLL and escape the Cyber Vault!",
            "challenge_type": "BOSS_BATTLE",
            "code_language": "security",
            "code_content": "=== NuLL AI OVERLORD CORE (5-PHASE ENCOUNTER) ===\nPhase 1: Perimeter Breach -> Firewall Rule Set + Access Credentials\nPhase 2: Corruption Pulse -> Firewall Patch\nPhase 3: Clone Swarm -> Clean API Call (reveals true NULL)\nPhase 4: Decryption Core -> Cipher Key (staggers NULL)\nPhase 5: Final Overload -> Forensic Trace Map (timing window) + Power Surge Cell\n\nTask: Deploy all 7 items to defeat NULL and escape!",
            "expected_answer": "NULL_PURGED",
            "hint_text": "Deploy items according to NULL's attack phases. Use combinations in Phase 1 and Phase 5. Watch your 3-hit health pool!",
            "fragment_char": "★",
            "completion_points": 1000,
            "wrong_attempt_penalty": 50
        }
    ]

    valid_slugs = {q["slug"] for q in quests_data}
    
    # Clean up obsolete/abandoned quests from older schema versions to prevent unique constraint collisions
    obsolete = db.query(Quest).filter(~Quest.slug.in_(valid_slugs)).all()
    for obs in obsolete:
        db.delete(obs)
    db.flush()

    for q in quests_data:
        existing = db.query(Quest).filter_by(slug=q["slug"]).first()

        answer_hash = normalize_and_hash_answer(q["expected_answer"])
        sec_hash = normalize_and_hash_answer(q.get("secondary_expected_answer", "")) if q.get("secondary_expected_answer") else None

        if existing:
            existing.order_index = q["order_index"]
            existing.title = q["title"]
            existing.location_name = q["location_name"]
            existing.description = q["description"]
            existing.narrative = q["narrative"]
            existing.challenge_type = q["challenge_type"]
            existing.code_language = q["code_language"]
            existing.code_content = q["code_content"]
            existing.image_url = q.get("image_url")
            existing.expected_answer_hash = answer_hash
            existing.secondary_answer_hash = sec_hash
            existing.hint_text = q["hint_text"]
            existing.fragment_char = q["fragment_char"]
            existing.completion_points = q["completion_points"]
            existing.wrong_attempt_penalty = q["wrong_attempt_penalty"]
        else:
            quest = Quest(
                order_index=q["order_index"],
                slug=q["slug"],
                title=q["title"],
                location_name=q["location_name"],
                description=q["description"],
                narrative=q["narrative"],
                challenge_type=q["challenge_type"],
                code_language=q["code_language"],
                code_content=q["code_content"],
                image_url=q.get("image_url"),
                expected_answer_hash=answer_hash,
                secondary_answer_hash=sec_hash,
                hint_text=q["hint_text"],
                fragment_char=q["fragment_char"],
                completion_points=q["completion_points"],
                wrong_attempt_penalty=q["wrong_attempt_penalty"]
            )
            db.add(quest)

    # 4. Physical Token
    token = db.query(PhysicalToken).filter_by(token="CYBERVAULT2026KEY").first()
    if not token:
        db.add(PhysicalToken(token="CYBERVAULT2026KEY"))

    db.commit()
    print("Database successfully seeded for Escape the Cyber Vault.")
