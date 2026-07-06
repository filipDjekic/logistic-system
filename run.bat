@echo off
SET BACKEND_PATH=backend
SET FRONTEND_PATH=frontend
SET JAR_NAME=logistics-system-0.0.1-SNAPSHOT.jar

echo [1/4] Testiranje i pakovanje backenda...
cd %BACKEND_PATH%
call mvnw.cmd clean package
if %ERRORLEVEL% NEQ 0 (
    echo [GRESKA] Backend build/test nije uspeo!
    pause
    exit /b %ERRORLEVEL%
)

echo [2/4] Testiranje frontenda...
cd ..\%FRONTEND_PATH%

if not exist node_modules (
    echo Instaliranje frontend dependencies...
    call npm install
)

call npm test
if %ERRORLEVEL% NEQ 0 (
    echo [GRESKA] Frontend testovi nisu prosli!
    pause
    exit /b %ERRORLEVEL%
)

echo [3/4] Pokretanje backenda...
cd ..\%BACKEND_PATH%
start "Backend - Logistics System" java -jar target\%JAR_NAME%

echo Cekanje da se backend inicijalizuje...
timeout /t 10 /nobreak

echo [4/4] Pokretanje frontenda...
cd ..\%FRONTEND_PATH%
start "Frontend - React/Vite" npm run dev

echo SVE JE POKRENUTO!
pause