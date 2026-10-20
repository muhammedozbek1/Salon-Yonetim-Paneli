@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Beyaz Kuafor - Sunucu
echo.
echo   Beyaz Kuafor sunucusu baslatiliyor...
echo   Adres: http://localhost:8000
echo   Yonetim paneli: http://localhost:8000/login.html
echo   Durdurmak icin bu pencereyi kapatin veya Ctrl+C yapin.
echo.
start "" cmd /c "timeout /t 2 >nul && start "" http://localhost:8000"
node server.js
pause
