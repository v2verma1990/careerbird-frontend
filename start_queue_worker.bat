@echo off
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
)

REM Install/update dependencies
echo Installing dependencies...
pip install -r requirements.txt

REM Start the queue worker
echo Starting queue worker...
python queue_worker.py

pause