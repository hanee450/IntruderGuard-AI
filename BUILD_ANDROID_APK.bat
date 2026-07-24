@echo off
title Build Android APK for Google Play Store
cd /d "%~dp0"
echo =================================================================
echo 🤖 INTRUDERGUARD ANDROID APK & PLAY STORE BUILDER
echo =================================================================
echo.
echo Step 1: Installing Bubblewrap CLI for Android APK Compilation...
call npx -y @bubblewrap/cli build --manifest=./android_build/twa-manifest.json
echo.
echo =================================================================
echo  APK Build Complete!
echo  Your Play Store upload file (.aab) & installable (.apk) are ready.
echo =================================================================
pause
