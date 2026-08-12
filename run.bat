@echo off
setlocal

SET BACKEND_PATH=backend
SET FRONTEND_PATH=frontend
SET JAR_NAME=logistics-system-0.0.1-SNAPSHOT.jar

echo ========================================
echo [1/3] Build backend-a...
echo ========================================

cd /d "%~dp0%BACKEND_PATH%"

call mvnw.cmd clean package -DskipTests

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [GRESKA] Backend build nije uspeo!
    pause
    exit /b %ERRORLEVEL%
)

if not exist "target\%JAR_NAME%" (
    echo.
    echo [GRESKA] JAR fajl nije pronadjen:
    echo target\%JAR_NAME%
    pause
    exit /b 1
)

echo.
echo ========================================
echo [2/3] Pokretanje backend-a...
echo ========================================

start "Logistics System - Backend" cmd /k java -jar "target\%JAR_NAME%"

echo.
echo Cekanje 10 sekundi da se backend pokrene...
timeout /t 10 /nobreak >nul

echo.
echo ========================================
echo [3/3] Pokretanje frontend-a...
echo ========================================

cd /d "%~dp0%FRONTEND_PATH%"

if not exist "node_modules" (
    echo node_modules ne postoji. Pokrecem npm install...
    call npm install

    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [GRESKA] npm install nije uspeo!
        pause
        exit /b %ERRORLEVEL%
    )
)

start "Logistics System - Frontend" cmd /k npm run dev

echo.
echo ========================================
echo Logistics System je pokrenut.
echo ========================================
echo Backend:  http://localhost:8080
echo Frontend: http://localhost:5173
echo ========================================

endlocal