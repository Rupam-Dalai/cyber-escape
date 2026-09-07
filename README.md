# ESCAPE THE CYBER VAULT — 2.5D Cyber Escape Room Platform

**Escape the Cyber Vault** is an interactive 2.5D cyber escape room mystery and boss encounter platform organized by the **Department of BSc CS with Cyber Security**.

Players control a cyber security operative / cyborg navigating 5 interconnected vault chambers, solving tactile infrastructure tasks (Among Us-style interactive panels), surviving hazardous short circuits, collecting master key items, and strategically deploying them to defeat Rogue AI **`NuLL`** in the final climax chamber.

---

## 🏛️ Interconnected Escape Room Chambers

1. **⚡ Room 1: Power Substation Core**
   - **Task:** High-voltage wire splicing & polarity balancing across 4 conduits (Power 240V, Ground 0V, Data 12V, Quantum Flux 48V).
   - **Hazard:** Cross-polarity connections trigger an explosive **short-circuit blast** and checkpoint respawn!
   - **Reward:** 🔋 `[Power Override Core]` (EMP Shield Breaker).

2. **🖥️ Room 2: Server Rack Array & Comm Junction**
   - **Task:** Router fiber-optic patching, packet route alignment, and 100 Gbps optical calibration.
   - **Hazard:** Overclocking optical laser diodes causes an optical data surge shockwave!
   - **Reward:** 🎴 `[Server Optical Decryption Matrix]` (Sensor Laser Blind).

3. **⚙️ Room 3: Backend Store & API Engine Hub**
   - **Task:** Microservice REST endpoint restorer (`GET /vault/schema`, `POST /auth/credentials`, `PUT /shield/bypass` -> 200 OK) with `Bearer CYBER_TOKEN`.
   - **Hazard:** Malformed buffer overflow payloads trigger toxic memory leak radiation!
   - **Reward:** 🛡️ `[API Gateway Master Token]` (Firewall Shield Barrier).
   - *Dependency:* Unlocks downstream Database Security Vault access!

4. **🗄️ Room 4: Database Security Vault & Cipher Keypad**
   - **Task:** Root SQL credentials query, table schema repair, and door cipher keypad decryption (`VAULT-9082-ROOT`).
   - **Hazard:** Unauthorized SQL injection traps trigger security perimeter defense lasers!
   - **Reward:** 📜 `[Root Database Security Certificate]` (Root Kernel Purge).

5. **👑 Chamber 5: Central Airlock — Boss NuLL Battle Arena**
   - **End Task Climax:** Tactical combat against Rogue AI `NuLL` using the 4 collected items:
     - ⚡ **Power Core:** EMP Overcharge -> Shatters NuLL's Invincible Hyper-Shield.
     - 🖥️ **Server Matrix:** Optical DDoS Flood -> Blinds NuLL's Laser Cannon targeting.
     - 🛡️ **API Token:** Firewall Barrier -> Blocks NuLL's devastating Malware Purge.
     - 📜 **Root Certificate:** Root Kernel Purge -> Executes `PURGE SYSTEM WHERE entity='NULL'` to disintegrate NuLL and open the exit airlock!

---

## 🚀 Quick Start Instructions

### 🐧 One-Click Launch (Linux)
```bash
./start_all.sh
# or
./start_code_hunt.sh
```

### 🧹 System Reset & Database Wipe (Clear All Records)
```bash
./reset.sh
```

### 🪟 Windows Setup & Launch (One-Click)

1. **First-time Setup (Automated Requirements & Dependency Installer):**
   ```cmd
   requirement.bat
   ```
   *Automatically downloads & installs Python 3.11, Node.js LTS, npm, pip requirements, node_modules, and seeds the database.*

2. **Launch Platform:**
   Double-click `START_CYBER_VAULT.bat` or run `start_all.bat`.

### Manual Launch

#### 1. Backend Server (FastAPI + SQLite + WebSockets)
```bash
cd backend
python run.py
```
- **Local Access**: `http://localhost:8000`
- **API Documentation**: `http://localhost:8000/docs`
- **LAN Access**: `http://192.168.x.x:8000`

#### 2. Frontend Server (React + Vite + TypeScript + Tailwind)
```bash
cd frontend
npm run dev
```
- **Local Access**: `http://localhost:5173`
- **LAN Participant Access**: `http://192.168.x.x:5173`

---

## 🛡️ Admin Mission Control (`/admin` or `/missioncontrol`)
- **Default Credentials**: `admin` / `admincrack`
- **Organized By**: Department of BSc CS with Cyber Security
- **Features**: Live team monitoring, event status controls (START, PAUSE, RESUME, RESET), stuck team detection, and sector override controls.
