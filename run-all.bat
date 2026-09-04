@echo off
title Launch Munim App (Backend + Frontend)
echo Launching Munim Backend (port 8080) and Frontend (port 3000)...
start "Munim Backend" "%~dp0run-backend.bat"
start "Munim Frontend" "%~dp0run-frontend.bat"
echo.
echo Both applications are launching in separate windows!
echo Frontend URL: http://localhost:3000
echo Backend API:  http://localhost:8080/api
echo Swagger UI:   http://localhost:8080/swagger-ui.html
echo.
pause
