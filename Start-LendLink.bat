
@echo off
cd /d "%~dp0"

powershell -NoProfile -Command "try { Invoke-WebRequest 'http://localhost:3000' -UseBasicParsing -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }"

if errorlevel 1 (
    start "LendLink Server" cmd /k "cd /d ""%~dp0"" && node server.js"
    timeout /t 3 /nobreak >nul
)

start "" "http://localhost:3000"
exit
