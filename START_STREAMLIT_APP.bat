@echo off
title IntruderGuard Streamlit App Launcher
cd /d "%~dp0"
echo =================================================================
echo 🛡️ LAUNCHING INTRUDERGUARD STREAMLIT APP...
echo =================================================================
python -m streamlit run streamlit_app.py
pause
