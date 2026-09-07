@echo off
title CYBER VAULT - Frontend Server (Port 5173)
cls

echo =================================================================
echo        STARTING CYBER VAULT FRONTEND REACT VITE SERVER
echo =================================================================
echo.

:: Initialize PATH for Node.js, npm, and CyberVaultTools
set "PATH=%LOCALAPPDATA%\Programs\CyberVaultTools\nodejs;C:\Program Files\nodejs;%APPDATA%\npm;%PATH%"

cd /d "%~dp0frontend"
npm run dev

pause
