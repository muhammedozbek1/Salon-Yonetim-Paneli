@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Beyaz Kuaför - Sunucu
echo.
echo   Beyaz Kuaför sunucusu başlatılıyor...
echo   Adres: http://localhost:8000
echo   Yönetim paneli: http://localhost:8000/login.html
echo   Durdurmak için bu pencereyi kapatın veya Ctrl+C yapın.
echo.
start "" cmd /c "timeout /t 2 >nul && start "" http://localhost:8000"
node server.js
pause