import os
import sys
import time
import socket
import subprocess
import uvicorn

# Set current directory and python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
os.chdir(backend_dir)

def free_port(port=8000):
    """Ensure port 8000 is not held by a previous stale server instance on Windows."""
    try:
        current_pid = os.getpid()
        if os.name == "nt":
            output = subprocess.check_output(f"netstat -ano | findstr :{port}", shell=True, text=True, errors="ignore")
            for line in output.strip().splitlines():
                if "LISTENING" in line:
                    parts = line.strip().split()
                    pid = int(parts[-1])
                    if pid != current_pid and pid > 4:
                        print(f"      [!] Terminating stale process (PID {pid}) on port {port}...")
                        subprocess.run(f"taskkill /F /PID {pid}", shell=True, capture_output=True)
                        time.sleep(1)
    except Exception:
        pass

if __name__ == "__main__":
    free_port(8000)

    host_ip = "127.0.0.1"
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        host_ip = s.getsockname()[0]
        s.close()
    except Exception:
        pass

    print("=================================================================")
    print("      ESCAPE THE CYBER VAULT - BACKEND SERVER (BSc CS)           ")
    print("=================================================================")
    print(f" Local Host Access: http://localhost:8000")
    print(f" LAN WiFi Access:   http://{host_ip}:8000")
    print(f" API Documentation: http://localhost:8000/docs")
    print("=================================================================")

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        app_dir=backend_dir
    )
