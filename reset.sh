#!/usr/bin/env bash

# ESCAPE THE CYBER VAULT — Complete System Reset Script (Linux & Mac)

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

echo "================================================================="
echo "        WARNING: FULL CYBER VAULT SYSTEM RESET (BSc CS)          "
echo "================================================================="
echo " This will PERMANENTLY ERASE:"
echo "   - All registered team accounts"
echo "   - All player chamber progress and inventory items"
echo "   - All leaderboard scores & penalty logs"
echo "   - The entire SQLite database (code_hunt.db)"
echo "================================================================="
echo ""

read -p "Are you sure you want to completely reset the system? (y/N): " CONFIRM
if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
    echo "Reset cancelled."
    exit 0
fi

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

echo "[1/2] Terminating any active Cyber Vault server processes..."
pkill -f "python.*run.py" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

sleep 1

echo "[2/2] Resetting SQLite Database and re-seeding default data..."
cd "$SCRIPT_DIR/backend"

# Remove database file directly if present
if [ -f "code_hunt.db" ]; then
    rm -f "code_hunt.db"
    echo "      ✓ Deleted existing code_hunt.db file."
fi

# Run Python reset script to re-create schema and seed default data
$PYTHON_CMD reset_db.py

echo "================================================================="
echo "   RESTART THE PLATFORM NOW BY RUNNING: ./start_all.sh"
echo "================================================================="
echo ""
