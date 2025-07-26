@echo off
echo ========================================
echo    CareerBird Queue Worker
echo ========================================
echo.

echo Starting CareerBird Queue Worker...

REM Set environment variables
set REDIS_URL=redis://localhost:6379
set MAX_CONCURRENT_JOBS=5
set DATABASE_URL=postgresql://postgres:password@localhost:5432/careerbird

REM Change to the recruiter AI service directory
cd /d "c:\Users\visha\Documents\careerbird-frontend\recruiter_ai_service"

REM Activate virtual environment if it exists
if exist "venv\Scripts\activate.bat" (
    echo Activating virtual environment...
    call venv\Scripts\activate.bat
) else (
    echo [WARNING] Virtual environment not found. Creating one...
    python -m venv venv
    call venv\Scripts\activate.bat
    echo Installing dependencies...
    pip install -r requirements.txt
)

REM Check Redis connection
echo Checking Redis connection...
redis-cli ping >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Cannot connect to Redis server
    echo Please make sure Redis is running: redis-server
    pause
    exit /b 1
) else (
    echo [OK] Redis connection successful
)

REM Start the queue worker
echo.
echo ========================================
echo    Queue Worker Configuration
echo ========================================
echo Redis URL: %REDIS_URL%
echo Max Concurrent Jobs: %MAX_CONCURRENT_JOBS%
echo Database URL: %DATABASE_URL%
echo.
echo Starting queue worker...
echo Press Ctrl+C to stop the worker
echo.

python queue_worker.py

echo.
echo Queue worker stopped.
pause