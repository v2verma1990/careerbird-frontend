# 🚀 CareerBird Application Runner Guide

## 📋 **Quick Start Options**

### **Option 1: Complete Setup (First Time)**
```bash
# Run this ONCE to set up everything
docs/batch_files/setup_queue_system.bat
```

### **Option 2: Start All Services (Recommended)**
```bash
# Start all services at once
docs/batch_files/start_all_services.bat
```

### **Option 3: Individual Service Control**
```bash
# Start individual services as needed
docs/batch_files/start_redis_server.bat
docs/batch_files/start_queue_worker.bat
docs/batch_files/start_recruiter_ai.bat
```

---

## 🔧 **Detailed Setup Instructions**

### **Prerequisites Check**
Before running any batch files, ensure you have:

✅ **Node.js 18+**
```bash
node --version
npm --version
```

✅ **Python 3.11+**
```bash
python --version
pip --version
```

✅ **.NET 6 SDK**
```bash
dotnet --version
```

✅ **Redis Server**
```bash
redis-cli --version
# If not installed: choco install redis-64
```

✅ **Git**
```bash
git --version
```

---

## 🏗️ **Step-by-Step Setup Process**

### **Step 1: Initial Setup (Run Once)**

**Execute:**
```bash
docs/batch_files/setup_queue_system.bat
```

**What it does:**
- ✅ Checks Redis installation
- ✅ Starts Redis server
- ✅ Tests Redis connection
- ✅ Installs .NET dependencies (`dotnet restore`)
- ✅ Creates Python virtual environment
- ✅ Installs Python dependencies (`pip install -r requirements.txt`)
- ✅ Installs Frontend dependencies (`npm install`)

**Expected Output:**
```
========================================
  CareerBird Queue System Setup
========================================

Step 1: Checking Redis installation...
[OK] Redis is installed

Step 2: Starting Redis server...

Step 3: Testing Redis connection...
[OK] Redis server is running

Step 4: Installing .NET dependencies...
[OK] .NET dependencies installed

Step 5: Installing Python dependencies...
[OK] Python dependencies installed

Step 6: Installing Frontend dependencies...
[OK] Frontend dependencies installed

========================================
  Setup Complete!
========================================
```

### **Step 2: Database Setup**

**Manual Step - Run in Supabase SQL Editor:**
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the SQL from `docs/QUEUE_SETUP_CHECKLIST.md`
4. Execute the SQL to create queue tables

**Tables Created:**
- `processing_jobs`
- `processing_job_items`
- `queue_statistics`
- All necessary indexes, triggers, and RLS policies

### **Step 3: Configuration**

**Update Configuration Files:**

**Backend Configuration (`backend/ResumeAI.API/appsettings.json`):**
```json
{
  "Redis": {
    "ConnectionString": "localhost:6379",
    "Database": 0,
    "InstanceName": "CareerBirdQueue"
  },
  "Queue": {
    "MaxConcurrentJobs": 10,
    "RetryAttempts": 3,
    "RetryDelaySeconds": 30,
    "JobTimeoutMinutes": 30,
    "CleanupIntervalMinutes": 60
  },
  "PythonAI": {
    "ServiceUrl": "http://localhost:8001",
    "TimeoutSeconds": 300,
    "MaxRetries": 3
  },
  "SignalR": {
    "EnableDetailedErrors": true,
    "MaximumReceiveMessageSize": 32768
  }
}
```

**Environment Variables (`.env`):**
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key

# Redis Configuration (for Python service)
REDIS_URL=redis://localhost:6379
MAX_CONCURRENT_JOBS=5
```

### **Step 4: Start All Services**

**Execute:**
```bash
docs/batch_files/start_all_services.bat
```

**Service Startup Order:**
1. **Redis Server** (Port: 6379)
2. **Python AI Service** (Port: 8001)
3. **Queue Worker** (Background process)
4. **Backend API** (Port: 5001)
5. **Frontend** (Port: 3000)
6. **Browser** (Auto-opens http://localhost:3000)

**Expected Terminal Windows:**
- Redis Server (running continuously)
- Python AI Service (FastAPI with LlamaIndex)
- Queue Worker (Processing background jobs)
- .NET Backend API (ASP.NET Core with SignalR)
- React Frontend (Vite development server)

---

## 🔍 **Service Details**

### **1. Redis Server**
```bash
# Manual start
docs/batch_files/start_redis_server.bat

# What it provides:
- Message queue for background jobs
- Caching layer for AI responses
- Session storage for SignalR
- Queue statistics and monitoring
```

### **2. Python AI Service**
```bash
# Manual start (after Redis)
cd recruiter_ai_service
call venv\Scripts\activate.bat
uvicorn main:app --host 0.0.0.0 --port 8001 --reload

# What it provides:
- Resume parsing and analysis
- LlamaIndex integration (Premium)
- OpenAI API integration
- Vector embeddings generation
- Bulk processing capabilities
```

### **3. Queue Worker**
```bash
# Manual start
docs/batch_files/start_queue_worker.bat

# What it provides:
- Background job processing
- Bulk resume analysis
- Progress tracking
- Error handling and retries
- Real-time status updates
```

### **4. Backend API**
```bash
# Manual start
cd backend/ResumeAI.API
dotnet run

# What it provides:
- REST API endpoints
- Authentication and authorization
- SignalR hub for real-time updates
- Queue job management
- Database operations
```

### **5. Frontend**
```bash
# Manual start
npm run dev

# What it provides:
- React user interface
- Real-time progress updates
- Queue status monitoring
- Recruiter dashboard
- Candidate analysis tools
```

---

## 🌐 **Access Points**

Once all services are running:

| **Service** | **URL** | **Purpose** |
|-------------|---------|-------------|
| **Frontend** | http://localhost:3000 | Main application interface |
| **Backend API** | http://localhost:5001 | REST API endpoints |
| **API Documentation** | http://localhost:5001/swagger | Interactive API docs |
| **Python AI Service** | http://localhost:8001 | AI processing endpoints |
| **AI Service Docs** | http://localhost:8001/docs | FastAPI documentation |

---

## 🔧 **Troubleshooting**

### **Common Issues**

**1. Redis Connection Failed**
```bash
# Check if Redis is running
redis-cli ping
# Expected: PONG

# If not running, start Redis
redis-server

# Check Redis logs
redis-cli monitor
```

**2. Python Virtual Environment Issues**
```bash
# Recreate virtual environment
cd recruiter_ai_service
rmdir /s venv
python -m venv venv
call venv\Scripts\activate.bat
pip install -r requirements.txt
```

**3. .NET Build Errors**
```bash
# Clean and restore
cd backend/ResumeAI.API
dotnet clean
dotnet restore
dotnet build
```

**4. Frontend Build Issues**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

**5. Port Conflicts**
```bash
# Check what's using ports
netstat -ano | findstr :3000
netstat -ano | findstr :5001
netstat -ano | findstr :8001
netstat -ano | findstr :6379

# Kill processes if needed
taskkill /PID <process_id> /F
```

### **Service Health Checks**

**Redis Health:**
```bash
redis-cli ping
# Expected: PONG
```

**Python AI Service Health:**
```bash
curl http://localhost:8001/health
# Expected: {"status": "healthy"}
```

**Backend API Health:**
```bash
curl http://localhost:5001/health
# Expected: {"status": "healthy"}
```

**Queue Worker Health:**
```bash
redis-cli llen "queue:bulk_analysis:normal"
# Expected: Number (queue depth)
```

---

## 📊 **Monitoring**

### **Queue Monitoring**
```bash
# Check queue depth
redis-cli llen "queue:bulk_analysis:normal"
redis-cli llen "queue:bulk_analysis:high"

# Monitor Redis activity
redis-cli monitor

# Check queue statistics
curl http://localhost:5001/api/queue/statistics
```

### **Service Logs**
- **Redis**: Console output in Redis terminal
- **Python AI**: Console output with detailed logging
- **Queue Worker**: Processing logs and error messages
- **Backend API**: ASP.NET Core logging
- **Frontend**: Browser console and network tab

---

## 🚀 **Production Deployment**

### **Environment Preparation**
```bash
# Set production environment variables
set ASPNETCORE_ENVIRONMENT=Production
set NODE_ENV=production

# Build frontend for production
npm run build

# Build backend for production
dotnet publish -c Release
```

### **Docker Deployment**
```dockerfile
# Use provided Dockerfile for containerized deployment
docker-compose up -d
```

### **Cloud Deployment**
- **Frontend**: Deploy to Vercel/Netlify
- **Backend**: Deploy to Azure/AWS
- **Python AI**: Deploy to cloud functions
- **Redis**: Use managed Redis service
- **Database**: Supabase (already cloud-hosted)

---

## 📚 **Additional Resources**

- **Complete Guide**: `docs/RECRUITER_AI_COMPLETE_GUIDE.md`
- **Queue Setup**: `docs/QUEUE_SETUP_CHECKLIST.md`
- **AI Framework**: `docs/AI_FRAMEWORK_DECISIONS.md`
- **RAG Implementation**: `docs/RAG_IMPLEMENTATION_COMPARISON.md`
- **LlamaIndex Features**: `docs/LLAMAINDEX_FEATURES_BREAKDOWN.md`

---

## 🎯 **Success Indicators**

When everything is working correctly, you should see:

✅ **All 5 terminal windows open and running**
✅ **Browser opens to http://localhost:3000**
✅ **Frontend loads without errors**
✅ **API documentation accessible at /swagger**
✅ **Redis responds to ping commands**
✅ **Queue worker shows "Waiting for jobs..." message**
✅ **Real-time progress updates work in the UI**

**You're ready to use the CareerBird Recruiter AI System with full queue processing capabilities!** 🎉