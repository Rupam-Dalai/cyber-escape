@echo off
title ESCAPE THE CYBER VAULT - System Reset Script
cls
echo =================================================================
echo        WARNING: FULL CYBER VAULT SYSTEM RESET (BSc CS)
echo =================================================================
echo  This will PERMANENTLY ERASE:
echo    - All registered operative team accounts
echo    - All room progress, hazard checkpoints, and inventory items
echo    - All leaderboard scores & penalty logs
echo    - The entire SQLite database (code_hunt.db)
echo =================================================================
echo.

set /p CONFIRM="Are you sure you want to completely reset the system? (Y/N): "
if /i "%CONFIRM%" NEQ "Y" (
    echo Reset cancelled.
    pause
    exit /b 0
)

echo.
echo [1/2] Deleting SQLite database file (code_hunt.db)...
if exist "%~dp0backend\code_hunt.db" (
    del /f /q "%~dp0backend\code_hunt.db"
    echo       ✓ Deleted existing code_hunt.db file.
)

echo [2/2] Re-creating fresh database schema & seeding default data...
cd /d "%~dp0backend"
python reset_db.py

echo.
echo =================================================================
echo    RESTART THE PLATFORM NOW BY RUNNING: start_all.bat
echo =================================================================
echo.
pause
