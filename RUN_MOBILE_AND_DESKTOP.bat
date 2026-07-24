@echo off
title IntruderGuard - Mobile & Desktop Master Launcher
cd /d "%~dp0"

echo =================================================================
echo 🛡️ INTRUDERGUARD AI - MOBILE & DESKTOP DUAL LAUNCHER
echo =================================================================
echo.
echo 🖥️ Starting Desktop App at http://localhost:5000 ...
echo 📱 Starting Mobile Server for Android / iPhone ...
echo.

start powershell -Command "Start-Sleep -Seconds 2; Start-Process 'http://localhost:5000'"
python server.py

pause
