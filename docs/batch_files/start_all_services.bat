@echo off
echo ========================================
echo    CareerBird - Starting All Services
echo ========================================
echo.
echo Starting all services in the correct order...
echo.

echo [1/6] Starting Redis Server...
start "Redis Server" cmd /k "echo Redis Server Running && redis-server"
timeout /t 3

echo [2/6] Starting Python AI Service (LlamaIndex + OpenAI)...
start "Python AI Service" cmd /k "cd /d c:\Users\visha\Documents\careerbird-frontend\recruiter_ai_service && call venv\Scripts\activate.bat && uvicorn main:app --host 0.0.0.0 --port 8001 --reload"
timeout /t 5

echo [3/6] Starting Queue Worker...
start "Queue Worker" cmd /k "cd /d c:\Users\visha\Documents\careerbird-frontend\recruiter_ai_service && call venv\Scripts\activate.bat && python queue_worker.py"
timeout /t 3

echo [4/6] Starting .NET Backend API...
start ".NET Backend API" cmd /k "cd /d c:\Users\visha\Documents\careerbird-frontend\backend\ResumeAI.API && dotnet run"
timeout /t 5

echo [5/6] Starting React Frontend...
start "React Frontend" cmd /k "cd /d c:\Users\visha\Documents\careerbird-frontend && npm run dev"
timeout /t 3

echo [6/6] Opening Application in Browser...
timeout /t 10
start http://localhost:3000

echo.
echo ========================================
echo    All Services Started Successfully!
echo ========================================
echo.
echo Access Points:
echo - Frontend:      http://localhost:3000
echo - Backend API:   http://localhost:5001
echo - Python AI:     http://localhost:8001
echo - API Docs:      http://localhost:5001/swagger
echo - Redis CLI:     redis-cli (in separate terminal)
echo.
echo Architecture Overview:
echo - Frontend:      React + TypeScript + Tailwind CSS
echo - Backend:       .NET 6 + ASP.NET Core + SignalR
echo - AI Service:    Python + FastAPI + LlamaIndex (Premium)
echo - Queue System:  Redis + Background Workers
echo - Database:      Supabase PostgreSQL + Vector Extension
echo.
echo AI Features by Plan:
echo - Free:    Basic OpenAI (GPT-3.5, ada-002) - Synchronous
echo - Basic:   Enhanced OpenAI + Queue Processing
echo - Premium: LlamaIndex + OpenAI (GPT-4, 3-large) + Priority Queue
echo.
echo Queue System Features:
echo - Background processing for bulk operations
echo - Real-time progress updates via SignalR
echo - Priority processing for Premium users
echo - Automatic retry and error handling
echo - Queue monitoring and statistics
echo.
echo To stop all services, close all terminal windows or press Ctrl+C in each.
echo For troubleshooting, see docs/RECRUITER_AI_COMPLETE_GUIDE.md
echo.
pause