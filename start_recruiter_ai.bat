@echo off
echo ========================================
echo    Recruiter AI System - Simplified
echo ========================================
echo.
echo Starting all services...
echo.

echo [1/3] Starting Python AI Service (LlamaIndex + OpenAI)...
start "Python AI Service" cmd /k "cd recruiter_ai_service && python start.py"

timeout /t 5

echo [2/3] Starting .NET Backend API...
start ".NET Backend" cmd /k "cd backend\ResumeAI.API && dotnet run"

timeout /t 5

echo [3/3] Starting React Frontend...
start "React Frontend" cmd /k "npm run dev"

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
echo Architecture:
echo - Frontend: React + TypeScript + Tailwind
echo - Backend:  .NET 6 + ASP.NET Core
echo - AI:       Python + FastAPI + LlamaIndex (Premium)
echo - Database: Supabase PostgreSQL + Vector
echo.
echo AI Features by Plan:
echo - Free:    Basic OpenAI (GPT-3.5, ada-002)
echo - Basic:   Enhanced OpenAI (GPT-3.5, ada-002)
echo - Premium: LlamaIndex + OpenAI (GPT-4, 3-large)
echo.
pause