@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Dobroe Serdtse - Setup

echo ============================================
echo Dobroe Serdtse - automatic setup and launch
echo ============================================
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js is not installed or not in PATH.
  echo Install Node.js 22 LTS or newer from https://nodejs.org/en/download
  pause
  exit /b 1
)
for /f "tokens=1 delims=v." %%A in ('node -v') do set NODEVER=%%A
set NODEVER=%NODEVER:v=%
echo Detected Node.js:
node -v
if %NODEVER% LSS 22 (
  echo ERROR: Please install Node.js 22 LTS or newer.
  pause
  exit /b 1
)
if not exist "%~dp0backend\package.json" (
  echo ERROR: backend\package.json not found. Extract the whole ZIP first.
  pause
  exit /b 1
)
if not exist "%~dp0frontend\package.json" (
  echo ERROR: frontend\package.json not found. Extract the whole ZIP first.
  pause
  exit /b 1
)

echo [1/4] Installing backend dependencies...
cd /d "%~dp0backend"
if not exist .env copy /y .env.example .env >nul
call npm install
if errorlevel 1 goto failed

echo [2/4] Preparing demo database...
call npm run seed
if errorlevel 1 goto failed

echo [3/4] Installing frontend dependencies...
cd /d "%~dp0frontend"
if not exist .env copy /y .env.example .env >nul
call npm install
if errorlevel 1 goto failed

echo [4/4] Starting servers...
start "Dobroe Serdtse API" /D "%~dp0backend" cmd /k "npm run dev"
timeout /t 3 /nobreak >nul
start "Dobroe Serdtse Web" /D "%~dp0frontend" cmd /k "npm run dev"
timeout /t 3 /nobreak >nul
start "" http://localhost:5173
echo.
echo Setup complete. Keep both server windows open.
echo Website: http://localhost:5173
echo If the page does not open, inspect the API and Web windows for errors.
pause
exit /b 0

:failed
echo.
echo ERROR: A command failed. Read the error above this message.
echo Check internet access, then run this setup file again.
pause
exit /b 1
