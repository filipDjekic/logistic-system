@echo off
setlocal

REM Pokreni iz root foldera backend projekta
cd /d "%~dp0"

if not exist "pom.xml" (
  echo [GRESKA] pom.xml nije pronadjen. Stavi ovaj .bat fajl u root backend projekta.
  exit /b 1
)

echo.
echo [INFO] Cistim i pravim package...
call mvnw.cmd clean package -DskipTests

if errorlevel 1 (
  echo.
  echo [GRESKA] Maven package nije uspeo.
  exit /b 1
)

echo.
echo [INFO] Gotovo. Proveri target folder.
dir /b target
echo.
pause
