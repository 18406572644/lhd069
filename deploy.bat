@echo off
chcp 65001 >nul 2>&1

echo =========================================
echo   LHD069 Docker One-Click Deploy
echo =========================================
echo.
echo Frontend : http://localhost:2069
echo Backend  : http://localhost:6069
echo.

docker compose up -d --build

echo.
echo =========================================
echo   Deploy Complete!
echo =========================================
echo Frontend : http://localhost:2069
echo Backend  : http://localhost:6069
echo.
echo Commands:
echo   Stop   : docker compose down
echo   Logs   : docker compose logs -f
echo   Restart: docker compose restart
echo =========================================

pause
