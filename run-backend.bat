@echo off
title Munim Backend (Spring Boot - Port 8080)
echo Starting Munim Backend on http://localhost:8080 ...
cd /d "%~dp0munim-backend\munim-backend"
"D:\download1\apache-maven-3.9.16-bin\apache-maven-3.9.16\bin\mvn.cmd" spring-boot:run
pause
