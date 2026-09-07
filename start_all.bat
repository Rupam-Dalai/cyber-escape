@echo off
title ESCAPE THE CYBER VAULT - Platform Launcher
cls
echo =================================================================
echo        STARTING ESCAPE THE CYBER VAULT PLATFORM (BSc CS)
echo =================================================================
echo.

:: Free port 8000 if occupied by previous session
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1

set "ENV_INIT=set PATH=%LOCALAPPDATA%\Programs\CyberVaultTools\nodejs;%LOCALAPPDATA%\Programs\CyberVaultTools\python;%LOCALAPPDATA%\Programs\CyberVaultTools\python\Scripts;C:\Program Files\nodejs;C:\Program Files\Python311;C:\Program Files\Python312;C:\Program Files\Python310;%APPDATA%\npm;%%PATH%%"

echo [1/2] Starting Backend FastAPI Server (Port 8000)...
start "CYBER VAULT - Backend Server" cmd /k "%ENV_INIT% && cd /d %~dp0backend && python run.py"

timeout /t 2 >nul

echo [2/2] Starting Frontend React Vite Server (Port 5173)...
start "CYBER VAULT - Frontend Server" cmd /k "%ENV_INIT% && cd /d %~dp0frontend && npm run dev"

echo.
echo =================================================================
echo             ESCAPE THE CYBER VAULT IS NOW RUNNING!
echo =================================================================
echo.
echo   Participant URL (Local):  http://localhost:5173
echo   Backend API ^& Docs:        http://localhost:8000/docs
echo   Admin Mission Control:    http://localhost:5173 (Click Mission Control)
echo.
echo =================================================================
pause
