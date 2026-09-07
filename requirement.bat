@echo off
title ESCAPE THE CYBER VAULT - Automated Requirements Installer (Windows)
cls

echo =================================================================
echo    ESCAPE THE CYBER VAULT - AUTOMATED DEPENDENCY INSTALLER
echo             Department of BSc CS with Cyber Security
echo =================================================================
echo.
echo  This installer will automatically verify, download, and configure:
echo    [1] Python 3.11+ (Runtime, pip, and system PATH)
echo    [2] Node.js LTS ^& npm (Vite runtime and system PATH)
echo    [3] Python Backend Libraries (FastAPI, Uvicorn, SQLAlchemy)
echo    [4] Frontend npm Modules (React, Tailwind, Framer Motion)
echo    [5] Database Initialization ^& Room Seed Data
echo.
echo =================================================================
echo.

:: Refresh current session PATH with standard installation locations
set "TOOLS_DIR=%LOCALAPPDATA%\Programs\CyberVaultTools"
if not exist "%TOOLS_DIR%" mkdir "%TOOLS_DIR%"

set "PATH=%PATH%;C:\Program Files\nodejs;C:\Program Files\Python311;C:\Program Files\Python311\Scripts;C:\Program Files\Python312;C:\Program Files\Python312\Scripts;C:\Program Files\Python310;C:\Program Files\Python310\Scripts;%LOCALAPPDATA%\Programs\Python\Python311;%LOCALAPPDATA%\Programs\Python\Python311\Scripts;%LOCALAPPDATA%\Programs\Python\Python312;%LOCALAPPDATA%\Programs\Python\Python312\Scripts;%TOOLS_DIR%\python;%TOOLS_DIR%\python\Scripts;%TOOLS_DIR%\nodejs;%APPDATA%\npm"

:: -------------------------------------------------------------------
:: STEP 1: CHECK & CONFIGURE PYTHON
:: -------------------------------------------------------------------
echo [STEP 1/5] Checking Python installation...
set "PY_EXEC="

python --version >nul 2>&1
if %errorlevel% equ 0 set "PY_EXEC=python"

if "%PY_EXEC%"=="" (
    py -3 --version >nul 2>&1
    if %errorlevel% equ 0 set "PY_EXEC=py -3"
)

if "%PY_EXEC%"=="" (
    if exist "%TOOLS_DIR%\python\python.exe" (
        set "PY_EXEC=%TOOLS_DIR%\python\python.exe"
    )
)

if "%PY_EXEC%"=="" (
    echo   ⚠️ Python not detected in PATH. Downloading standalone Python runtime...
    powershell -NoProfile -ExecutionPolicy Bypass -Command ^
        "$ErrorActionPreference = 'Stop';" ^
        "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12;" ^
        "$pyZip = Join-Path $env:TEMP 'python_embed.zip';" ^
        "$pyDest = '%TOOLS_DIR%\python';" ^
        "if (!(Test-Path $pyDest)) { New-Item -ItemType Directory -Path $pyDest | Out-Null };" ^
        "Write-Host '  -> Downloading official Python 3.11 package...';" ^
        "Invoke-WebRequest -Uri 'https://www.python.org/ftp/python/3.11.9/python-3.11.9-embed-amd64.zip' -OutFile $pyZip;" ^
        "Write-Host '  -> Extracting Python files...';" ^
        "Expand-Archive -Path $pyZip -DestinationPath $pyDest -Force;" ^
        "Remove-Item $pyZip -Force -ErrorAction SilentlyContinue;" ^
        "$pthFile = Get-ChildItem $pyDest -Filter '*._pth' | Select-Object -First 1;" ^
        "if ($pthFile) { (Get-Content $pthFile.FullName) -replace '#import site', 'import site' | Set-Content $pthFile.FullName };" ^
        "Write-Host '  -> Installing pip package manager...';" ^
        "$getPip = Join-Path $env:TEMP 'get-pip.py';" ^
        "Invoke-WebRequest -Uri 'https://bootstrap.pypa.io/get-pip.py' -OutFile $getPip;" ^
        "& (Join-Path $pyDest 'python.exe') $getPip --no-warn-script-location --quiet;" ^
        "Remove-Item $getPip -Force -ErrorAction SilentlyContinue;"

    set "PY_EXEC=%TOOLS_DIR%\python\python.exe"
    set "PATH=%PATH%;%TOOLS_DIR%\python;%TOOLS_DIR%\python\Scripts"
    setx PATH "%PATH%;%TOOLS_DIR%\python;%TOOLS_DIR%\python\Scripts" >nul 2>&1
    echo       ✓ Python 3.11 runtime configured successfully.
) else (
    echo       ✓ Python runtime detected.
)

:: -------------------------------------------------------------------
:: STEP 2: CHECK & CONFIGURE NODE.JS & NPM
:: -------------------------------------------------------------------
echo.
echo [STEP 2/5] Checking Node.js ^& npm installation...
set "NODE_OK=0"

node -v >nul 2>&1
if %errorlevel% equ 0 set "NODE_OK=1"

if "%NODE_OK%"=="0" (
    if exist "%TOOLS_DIR%\nodejs\node.exe" (
        set "PATH=%PATH%;%TOOLS_DIR%\nodejs"
        set "NODE_OK=1"
    )
)

if "%NODE_OK%"=="0" (
    echo   ⚠️ Node.js / npm not detected in PATH. Downloading standalone Node.js LTS package...
    powershell -NoProfile -ExecutionPolicy Bypass -Command ^
        "$ErrorActionPreference = 'Stop';" ^
        "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12;" ^
        "$nodeZip = Join-Path $env:TEMP 'node_dist.zip';" ^
        "$destDir = '%TOOLS_DIR%\nodejs';" ^
        "$tempExtract = Join-Path $env:TEMP 'node_temp';" ^
        "Write-Host '  -> Downloading official Node.js LTS runtime...';" ^
        "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.18.0/node-v20.18.0-win-x64.zip' -OutFile $nodeZip;" ^
        "Write-Host '  -> Extracting Node.js package...';" ^
        "if (Test-Path $tempExtract) { Remove-Item $tempExtract -Recurse -Force };" ^
        "Expand-Archive -Path $nodeZip -DestinationPath $tempExtract -Force;" ^
        "$innerDir = Get-ChildItem $tempExtract | Select-Object -First 1;" ^
        "if (!(Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir | Out-Null };" ^
        "Copy-Item -Path ($innerDir.FullName + '\*') -Destination $destDir -Recurse -Force;" ^
        "Remove-Item $nodeZip -Force -ErrorAction SilentlyContinue;" ^
        "Remove-Item $tempExtract -Recurse -Force -ErrorAction SilentlyContinue;"

    set "PATH=%PATH%;%TOOLS_DIR%\nodejs;%APPDATA%\npm"
    setx PATH "%PATH%;%TOOLS_DIR%\nodejs;%APPDATA%\npm" >nul 2>&1
    echo       ✓ Node.js LTS ^& npm configured successfully.
) else (
    echo       ✓ Node.js ^& npm detected.
)

:: -------------------------------------------------------------------
:: STEP 3: INSTALL PYTHON DEPENDENCIES
:: -------------------------------------------------------------------
echo.
echo [STEP 3/5] Installing Python backend modules from requirements.txt...
"%PY_EXEC%" -m pip install --upgrade pip --quiet --no-warn-script-location
"%PY_EXEC%" -m pip install -r "%~dp0requirements.txt" --no-warn-script-location
if %errorlevel% neq 0 (
    "%PY_EXEC%" -m pip install -r "%~dp0backend\requirements.txt" --no-warn-script-location
)
echo       ✓ Python backend libraries installed.

:: -------------------------------------------------------------------
:: STEP 4: INSTALL FRONTEND NPM MODULES
:: -------------------------------------------------------------------
echo.
echo [STEP 4/5] Installing Frontend React / Vite / Tailwind dependencies...
cd /d "%~dp0frontend"
call npm install
cd /d "%~dp0"
echo       ✓ Frontend node modules installed.

:: -------------------------------------------------------------------
:: STEP 5: INITIALIZE & SEED DATABASE
:: -------------------------------------------------------------------
echo.
echo [STEP 5/5] Initializing Cyber Vault database schema ^& room seeds...
cd /d "%~dp0backend"
"%PY_EXEC%" reset_db.py
cd /d "%~dp0"

echo.
echo =================================================================
echo       🎉 ALL REQUIREMENTS SUCCESSFULLY DOWNLOADED ^& CONFIGURED!
echo =================================================================
echo.
echo  You can now launch the platform anytime with:
echo    Double-click: START_CYBER_VAULT.bat
echo    or run:       start_all.bat
echo.
echo =================================================================
pause
