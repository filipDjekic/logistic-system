@echo off
SET BACKEND_PATH=backend
SET FRONTEND_PATH=frontend
SET JAR_NAME=logistics-system-0.0.1-SNAPSHOT.jar

echo [1/4] Pakovanje backenda...
cd %BACKEND_PATH%
call mvnw.cmd clean package -DskipTests
if %ERRORLEVEL% NEQ 0 (
    echo [GRESKA] Backend build nije uspeo!
    pause
    exit /b %ERRORLEVEL%
)

echo [2/4] Provera frontend dependencies...
cd ..\%FRONTEND_PATH%

if not exist node_modules (
    echo Instaliranje frontend dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [GRESKA] npm install nije uspeo!
        pause
        exit /b %ERRORLEVEL%
    )
)

echo [3/4] Pokretanje backenda...
cd ..\%BACKEND_PATH%
start "Backend - Logistics System" java -jar target\%JAR_NAME%

echo Cekanje da se backend inicijalizuje...
timeout /t 10 /nobreak

echo [4/4] Pokretanje frontenda...
cd ..\%FRONTEND_PATH%
start "Frontend - React/Vite" cmd /k npm run dev

echo.
echo ======================================
echo   SVE JE USPESNO POKRENUTO!
echo ======================================
pause