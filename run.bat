@echo off
SET BACKEND_PATH=backend
SET FRONTEND_PATH=frontend
SET JAR_NAME=logistics-system-0.0.1-SNAPSHOT.jar

echo [1/3] Pakovanje backenda...
cd %BACKEND_PATH%
call mvnw.cmd clean package -DskipTests
if %ERRORLEVEL% NEQ 0 (
    echo [GRESKA] Backend build nije uspeo!
    pause
    exit /b %ERRORLEVEL%
)

echo [2/3] Pokretanje backenda u novom prozoru...
start "Backend - Logistics System" java -jar target\%JAR_NAME%

echo Cekanje da se backend inicijalizuje (10 sekundi)...
timeout /t 10 /nobreak

echo [3/3] Pokretanje frontenda...
cd ..\%FRONTEND_PATH%
start "Frontend - React/Vite" npm run dev

echo SVE JE POKRENUTO!
pause