@echo off
title Deploy IntruderGuard to GitHub
cd /d "%~dp0"
echo =================================================================
echo 🚀 GITHUB DEPLOYMENT WIZARD FOR INTRUDERGUARD AI
echo =================================================================
echo.
echo Step 1: Create a new Repository on GitHub:
echo    Go to https://github.com/new
echo    Repository Name: IntruderGuard-AI
echo    Click "Create repository" button.
echo.
echo Step 2: Paste your GitHub Repository URL below:
echo (Example: https://github.com/your-username/IntruderGuard-AI.git)
echo.
set /p REPO_URL="Enter GitHub Repo URL: "

if "%REPO_URL%"=="" (
    echo Error: No URL entered. Exiting.
    pause
    exit /b
)

echo.
echo 🔄 Pushing files to GitHub...
git branch -M main
git remote remove origin >nul 2>&1
git remote add origin %REPO_URL%
git add .
git commit -m "Deploy IntruderGuard Mobile Web App" >nul 2>&1
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo =================================================================
    echo SUCCESS! Project uploaded to GitHub successfully!
    echo =================================================================
    echo.
    echo 🌐 TO ENABLE FREE GITHUB PAGES HOSTING:
    echo  1. Go to your GitHub Repo -> Settings -> Pages.
    echo  2. Under 'Source', select 'Deploy from a branch' -> 'main' -> '/ (root)' -> Save.
    echo  3. Your app will be LIVE on the internet at:
    echo     https://YOUR-USERNAME.github.io/IntruderGuard-AI/
    echo =================================================================
) else (
    echo.
    echo ❌ Git push failed. Please ensure you are logged into Git/GitHub on this PC.
)

pause
