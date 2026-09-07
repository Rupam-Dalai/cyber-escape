@echo off
title CYBER VAULT - Backend Server (Port 8000)
cls

echo =================================================================
echo         STARTING CYBER VAULT BACKEND FASTAPI SERVER
echo =================================================================
echo.

:: Initialize PATH for Python & CyberVaultTools
set "PATH=%LOCALAPPDATA%\Programs\CyberVaultTools\python;%LOCALAPPDATA%\Programs\CyberVaultTools\python\Scripts;C:\Program Files\Python311;C:\Program Files\Python312;C:\Program Files\Python310;%PATH%"

:: Free port 8000 if occupied by previous session
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1

cd /d "%~dp0backend"
python run.py

if %errorlevel% neq 0 (
    echo.
    echo ⚠️ Failed to launch with python. Trying standalone launcher...
    "%LOCALAPPDATA%\Programs\CyberVaultTools\python\python.exe" run.py
)

pause
