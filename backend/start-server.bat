@echo off
echo ========================================
echo       LMS Backend Server Starter
echo ========================================

echo.
echo [1/3] Checking for existing processes on port 5000...

REM Kill any existing process on port 5000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do (
    if not "%%a"=="0" (
        echo Found process %%a using port 5000, terminating...
        taskkill /PID %%a /F >nul 2>&1
    )
)

echo [2/3] Port 5000 is now available

echo.
echo [3/3] Starting LMS Backend Server...
echo.
echo ========================================
echo   Server will start in 2 seconds...
echo   Press Ctrl+C to stop the server
echo ========================================
echo.

timeout /t 2 /nobreak >nul

REM Start the server
node server.js

pause
