@echo off
echo ========================================
echo    Redis Server for CareerBird
echo ========================================
echo.

echo Checking Redis installation...
redis-cli --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Redis is not installed or not in PATH
    echo.
    echo Installation Options:
    echo 1. Using Chocolatey: choco install redis-64
    echo 2. Manual Download: https://github.com/microsoftarchive/redis/releases
    echo.
    pause
    exit /b 1
) else (
    echo [OK] Redis is installed
)

echo.
echo Starting Redis server...
echo.
echo Redis Configuration:
echo - Port: 6379 (default)
echo - Host: localhost
echo - Database: 0 (default)
echo.
echo Queue Configuration:
echo - Queue Name: queue:bulk_analysis:normal
echo - Priority Queue: queue:bulk_analysis:high
echo - Statistics: queue:statistics
echo.
echo Press Ctrl+C to stop Redis server
echo.

redis-server

echo.
echo Redis server stopped.
pause