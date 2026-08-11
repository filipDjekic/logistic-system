@echo off
setlocal

where docker >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker CLI is not available in PATH.
    exit /b 1
)

pushd "%~dp0"
docker compose up --build
set "EXIT_CODE=%ERRORLEVEL%"
popd

exit /b %EXIT_CODE%
