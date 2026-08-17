@echo off
title Business ERP AI Desktop Launcher
setlocal enabledelayedexpansion

:: Set Working Directory to Script Path
cd /d "%~dp0"

echo ===================================================
echo     Launching Business ERP AI Desktop App...
echo ===================================================
echo.

set "JAVA_HOME=C:\Program Files\Java\jdk-17"

:: Start backend process in background if not already running on port 8080
netstat -ano | findstr :8080 >nul
if %errorlevel% neq 0 (
    echo [INFO] Starting Spring Boot REST Backend on port 8080...
    start /min "Business ERP Backend" cmd /c "set JAVA_HOME=C:\Program Files\Java\jdk-17&& cd backend && mvnw.cmd spring-boot:run"
)

:: Check root node_modules
if not exist "node_modules\electron" (
    echo [INFO] Installing required desktop app dependencies...
    call npm.cmd install
)

echo [INFO] Opening Business ERP Desktop Window...
start "" npx electron .

exit
