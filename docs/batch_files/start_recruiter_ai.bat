@echo off
echo ========================================
echo    Recruiter AI System - Enhanced
echo ========================================
echo.
echo Starting Recruiter AI services with Queue System...
echo.

echo [1/4] Starting Python AI Service (LlamaIndex + OpenAI)...
start "Python AI Service" cmd /k "cd /d c:\Users\visha\Documents\careerbird-frontend\recruiter_ai_service && call venv\Scripts\activate.bat && echo Python AI Service Starting... && uvicorn main:app --host 0.0.0.0 --port 8001 --reload"

timeout /t 5

echo [2/4] Starting Queue Worker...
start "Queue Worker" cmd /k "cd /d c:\Users\visha\Documents\careerbird-frontend\recruiter_ai_service && call venv\Scripts\activate.bat && echo Queue Worker Starting... && python queue_worker.py"

timeout /t 3

echo [3/4] Starting .NET Backend API...
start ".NET Backend API" cmd /k "cd /d c:\Users\visha\Documents\careerbird-frontend\backend\ResumeAI.API && echo .NET Backend Starting... && dotnet run"

timeout /t 5

echo [4/4] Starting React Frontend...
start "React Frontend" cmd /k "cd /d c:\Users\visha\Documents\careerbird-frontend && echo React Frontend Starting... && npm run dev"

echo.
echo ========================================
echo    All Services Started Successfully!
echo ========================================
echo.
echo Access Points:
echo - Frontend:     http://localhost:3000
echo - Backend API:  http://localhost:5001
echo - Python AI:    http://localhost:8001
echo - API Docs:     http://localhost:5001/swagger
echo.
echo Enhanced Architecture:
echo - Frontend: React + TypeScript + Tailwind + SignalR
echo - Backend:  .NET 6 + ASP.NET Core + SignalR Hub
echo - AI:       Python + FastAPI + LlamaIndex (Premium)
echo - Queue:    Redis + Background Workers
echo - Database: Supabase PostgreSQL + Vector + Queue Tables
echo.
echo AI Features by Plan:
echo - Free:    Basic OpenAI (GPT-3.5, ada-002) - Synchronous only
echo - Basic:   Enhanced OpenAI + Queue Processing + Progress Updates
echo - Premium: LlamaIndex + OpenAI (GPT-4, 3-large) + Priority Queue
echo.
echo Queue System Features:
echo ✅ Background processing for bulk operations
echo ✅ Real-time progress updates via SignalR
echo ✅ Priority processing for Premium users
echo ✅ Automatic retry and error handling
echo ✅ Queue monitoring and statistics
echo ✅ Job cancellation and management
echo.
echo Note: Make sure Redis server is running before using queue features.
echo Run 'redis-server' in a separate terminal if not already running.
echo.
pause