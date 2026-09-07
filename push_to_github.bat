@echo off
title Push Escape the Cyber Vault to GitHub
echo =================================================================
echo        PUSHING ESCAPE THE CYBER VAULT TO GITHUB REPO
echo           https://github.com/Rupam-Dalai/cyber-escape.git
echo =================================================================
echo.
cd /d "%~dp0"
echo [1/3] Checking git status...
git status --short
echo.
echo [2/3] Adding and committing any pending changes...
git add .
git commit -m "Configure Supabase PostgreSQL and Render deployment" 2>nul
echo.
echo [3/3] Pushing branch 'main' to origin...
echo (If a browser window opens, click 'Sign in with your browser' to authorize)
echo.
git push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo =================================================================
    echo        SUCCESS! Project successfully pushed to GitHub!
    echo        Visit: https://github.com/Rupam-Dalai/cyber-escape
    echo =================================================================
) else (
    echo =================================================================
    echo        Push failed. Please check your GitHub permissions or credentials.
    echo =================================================================
)
pause
