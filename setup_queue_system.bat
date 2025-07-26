@echo off
echo ========================================
echo   CareerBird Queue System Setup
echo ========================================
echo.

echo Step 1: Checking Redis installation...
redis-cli --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Redis is not installed or not in PATH
    echo Please install Redis from: https://github.com/microsoftarchive/redis/releases
    echo Or use Chocolatey: choco install redis-64
    pause
    exit /b 1
) else (
    echo [OK] Redis is installed
)

echo.
echo Step 2: Starting Redis server...
start "Redis Server" redis-server
timeout /t 3 >nul

echo.
echo Step 3: Testing Redis connection...
redis-cli ping >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Cannot connect to Redis server
    echo Make sure Redis server is running
    pause
    exit /b 1
) else (
    echo [OK] Redis server is running
)

echo.
echo Step 4: Installing .NET dependencies...
cd /d "c:\Users\visha\Documents\careerbird-frontend\backend\ResumeAI.API"
dotnet restore
if %errorlevel% neq 0 (
    echo [ERROR] Failed to restore .NET packages
    pause
    exit /b 1
) else (
    echo [OK] .NET dependencies installed
)

echo.
echo Step 5: Installing Python dependencies...
cd /d "c:\Users\visha\Documents\careerbird-frontend\recruiter_ai_service"

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install dependencies
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install Python packages
    pause
    exit /b 1
) else (
    echo [OK] Python dependencies installed
)

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Run the SQL queries in Supabase (see docs/QUEUE_SYSTEM_IMPLEMENTATION.md)
echo 2. Update your appsettings.json with Redis configuration
echo 3. Start the services:
echo    - .NET API: dotnet run (in backend/ResumeAI.API)
echo    - Python AI Service: uvicorn main:app --port 8001 (in recruiter_ai_service)
echo    - Queue Worker: python queue_worker.py (in recruiter_ai_service)
echo.
echo For detailed instructions, see: docs/QUEUE_SYSTEM_IMPLEMENTATION.md
echo.
pause@echo off
echo ========================================
echo   CareerBird Queue System Setup
echo ========================================
echo.

echo Step 1: Checking Redis installation...
redis-cli --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Redis is not installed or not in PATH
    echo Please install Redis from: https://github.com/microsoftarchive/redis/releases
    echo Or use Chocolatey: choco install redis-64
    pause
    exit /b 1
) else (
    echo [OK] Redis is installed
)

echo.
echo Step 2: Starting Redis server...
start "Redis Server" redis-server
timeout /t 3 >nul

echo.
echo Step 3: Testing Redis connection...
redis-cli ping >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Cannot connect to Redis server
    echo Make sure Redis server is running
    pause
    exit /b 1
) else (
    echo [OK] Redis server is running
)

echo.
echo Step 4: Installing .NET dependencies...
cd /d "c:\Users\visha\Documents\careerbird-frontend\backend\ResumeAI.API"
dotnet restore
if %errorlevel% neq 0 (
    echo [ERROR] Failed to restore .NET packages
    pause
    exit /b 1
) else (
    echo [OK] .NET dependencies installed
)

echo.
echo Step 5: Installing Python dependencies...
cd /d "c:\Users\visha\Documents\careerbird-frontend\recruiter_ai_service"

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install dependencies
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install Python packages
    pause
    exit /b 1
) else (
    echo [OK] Python dependencies installed
)

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Run the SQL queries in Supabase (see docs/QUEUE_SYSTEM_IMPLEMENTATION.md)
echo 2. Update your appsettings.json with Redis configuration
echo 3. Start the services:
echo    - .NET API: dotnet run (in backend/ResumeAI.API)
echo    - Python AI Service: uvicorn main:app --port 8001 (in recruiter_ai_service)
echo    - Queue Worker: python queue_worker.py (in recruiter_ai_service)
echo.
echo For detailed instructions, see: docs/QUEUE_SYSTEM_IMPLEMENTATION.md
echo.
pause