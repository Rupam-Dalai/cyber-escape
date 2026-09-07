#!/usr/bin/env bash

# ESCAPE THE CYBER VAULT — Platform Launcher for Linux

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

echo "================================================================="
echo "        STARTING ESCAPE THE CYBER VAULT (BSc CS)                 "
echo "================================================================="
echo ""

# Find Python binary
if command -v python3 &>/dev/null; then
    PYTHON_CMD="python3"
elif command -v python &>/dev/null; then
    PYTHON_CMD="python"
else
    echo "❌ Error: Python is not installed or not in PATH."
    exit 1
fi

# Find npm binary
if ! command -v npm &>/dev/null; then
    echo "❌ Error: npm is not installed or not in PATH."
    exit 1
fi

echo "[1/2] Checking Python requirements & Starting Backend FastAPI Server (Port 8000)..."
cd "$SCRIPT_DIR/backend"
$PYTHON_CMD -c "import jose, fastapi, uvicorn, sqlalchemy" 2>/dev/null || $PYTHON_CMD -m pip install -q -r requirements.txt --break-system-packages 2>/dev/null
$PYTHON_CMD run.py &
BACKEND_PID=$!

sleep 2

echo "[2/2] Starting Frontend React Vite Server (Port 5173)..."
cd "$SCRIPT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

# Trap signals to ensure background processes are terminated on exit
cleanup() {
    echo ""
    echo "Shutting down Cyber Vault servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup INT TERM EXIT

echo ""
echo "================================================================="
echo "            ESCAPE THE CYBER VAULT IS NOW RUNNING!               "
echo "================================================================="
echo ""
echo "  Participant URL (Local):  http://localhost:5173"
echo "  Backend API & Docs:       http://localhost:8000/docs"
echo "  Admin Mission Control:    http://localhost:5173 (Click Mission Control)"
echo ""
echo "  Press Ctrl+C to stop all servers."
echo "================================================================="
echo ""

wait
