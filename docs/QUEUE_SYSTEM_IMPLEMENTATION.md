# 🚀 Queue System Implementation Guide

## **Overview**

This document provides a complete implementation guide for the Redis-based queue system that handles bulk candidate processing, report generation, and other async operations in the CareerBird platform.

## **Architecture & Technologies**

### **Technology Stack**

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                           │
│  React + TypeScript + SignalR Client                       │
│  ├── Real-time Progress Tracking                           │
│  ├── Job Status Monitoring                                 │
│  ├── Live Notifications                                    │
│  └── Partial Results Display                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend API Layer                        │
│  .NET 9 + ASP.NET Core + SignalR Hub                       │
│  ├── Job Submission Endpoints                              │
│  ├── Progress Tracking APIs                                │
│  ├── Real-time WebSocket Handlers                          │
│  └── Queue Management Services                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Message Queue Layer                       │
│  Redis 7.0+ with Pub/Sub + List Operations                 │
│  ├── Priority Job Queues (High/Normal)                     │
│  ├── Real-time Pub/Sub Messaging                           │
│  ├── Job State Management                                  │
│  └── Rate Limiting & Throttling                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Worker Services                           │
│  Python 3.11+ + AsyncIO + Redis Client                     │
│  ├── Bulk Resume Analysis Workers                          │
│  ├── Report Generation Workers                             │
│  ├── Skill Gap Analysis Workers                            │
│  └── Real-time Progress Publishers                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Storage Layer                       │
│  Supabase PostgreSQL 15+ + Redis Cache                     │
│  ├── Job Status & Progress Tracking                        │
│  ├── Queue Statistics & Monitoring                         │
│  ├── Results Storage & Retrieval                           │
│  └── Error Logging & Retry Management                      │
└─────────────────────────────────────────────────────────────┘
```

### **Technology Purposes**

#### **Redis (Message Queue & Cache)**
- **Purpose**: Message queuing, real-time pub/sub, caching
- **Usage**: 
  - Job queue management with priority support
  - Real-time progress updates via pub/sub
  - Rate limiting and throttling
  - Session storage and caching
- **Why**: Extremely fast, reliable, supports complex data structures

#### **SignalR (.NET)**
- **Purpose**: Real-time bidirectional communication
- **Usage**:
  - Live job progress updates to frontend
  - Real-time notifications
  - Connection management for users
- **Why**: Native .NET integration, automatic fallback to long polling

#### **PostgreSQL (Supabase)**
- **Purpose**: Persistent job storage and tracking
- **Usage**:
  - Job metadata and status persistence
  - Progress tracking and history
  - Queue statistics and monitoring
  - Results storage
- **Why**: ACID compliance, complex queries, JSON support

#### **Python AsyncIO Workers**
- **Purpose**: Asynchronous job processing
- **Usage**:
  - Bulk resume analysis processing
  - Report generation
  - AI service integration
  - Concurrent job handling
- **Why**: Excellent async support, AI/ML library ecosystem

#### **.NET Background Services**
- **Purpose**: Queue monitoring and management
- **Usage**:
  - Job timeout handling
  - Queue health monitoring
  - Cleanup operations
  - Statistics collection
- **Why**: Integrated with ASP.NET Core, excellent performance

## **Database Schema**

### **Required Supabase Queries**

Run these queries in your Supabase SQL Editor:

```sql
-- 1. Create job queue tables
-- Run this first to create the basic structure
CREATE TABLE processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    job_type VARCHAR(50) NOT NULL, -- 'bulk_analysis', 'report_generation', 'skill_gap_batch', etc.
    status VARCHAR(20) NOT NULL DEFAULT 'queued', -- queued, processing, completed, failed, cancelled
    priority INTEGER DEFAULT 0, -- Higher number = higher priority
    total_items INTEGER NOT NULL,
    processed_items INTEGER DEFAULT 0,
    failed_items INTEGER DEFAULT 0,
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    job_data JSONB NOT NULL, -- Input parameters
    result_data JSONB, -- Output results
    error_message TEXT,
    estimated_completion_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '24 hours') -- Auto cleanup after 24 hours
);

-- 2. Create job items table for granular tracking
CREATE TABLE processing_job_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES processing_jobs(id) ON DELETE CASCADE,
    item_id VARCHAR(255) NOT NULL, -- resume_id, report_id, etc.
    item_type VARCHAR(50) NOT NULL, -- 'resume_analysis', 'report_section', etc.
    status VARCHAR(20) NOT NULL DEFAULT 'queued', -- queued, processing, completed, failed
    result_data JSONB,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    processing_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- 3. Create queue statistics table
CREATE TABLE queue_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    job_type VARCHAR(50) NOT NULL,
    total_jobs INTEGER DEFAULT 0,
    completed_jobs INTEGER DEFAULT 0,
    failed_jobs INTEGER DEFAULT 0,
    average_processing_time_ms INTEGER DEFAULT 0,
    peak_queue_depth INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(date, job_type)
);

-- 4. Create indexes for performance
CREATE INDEX idx_processing_jobs_user_status ON processing_jobs(user_id, status);
CREATE INDEX idx_processing_jobs_status_priority ON processing_jobs(status, priority DESC);
CREATE INDEX idx_processing_jobs_created_at ON processing_jobs(created_at DESC);
CREATE INDEX idx_processing_jobs_expires_at ON processing_jobs(expires_at);
CREATE INDEX idx_processing_job_items_job_status ON processing_job_items(job_id, status);
CREATE INDEX idx_processing_job_items_item_id ON processing_job_items(item_id);
CREATE INDEX idx_queue_statistics_date_type ON queue_statistics(date, job_type);

-- 5. Create function to update job progress automatically
CREATE OR REPLACE FUNCTION update_job_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Update parent job progress when job items change
    UPDATE processing_jobs 
    SET 
        processed_items = (
            SELECT COUNT(*) 
            FROM processing_job_items 
            WHERE job_id = NEW.job_id AND status = 'completed'
        ),
        failed_items = (
            SELECT COUNT(*) 
            FROM processing_job_items 
            WHERE job_id = NEW.job_id AND status = 'failed'
        ),
        progress_percentage = (
            SELECT ROUND(
                (COUNT(*) FILTER (WHERE status IN ('completed', 'failed'))::DECIMAL / COUNT(*)) * 100, 2
            )
            FROM processing_job_items 
            WHERE job_id = NEW.job_id
        ),
        updated_at = NOW(),
        status = CASE 
            WHEN (
                SELECT COUNT(*) 
                FROM processing_job_items 
                WHERE job_id = NEW.job_id AND status NOT IN ('completed', 'failed')
            ) = 0 THEN 'completed'
            ELSE status
        END
    WHERE id = NEW.job_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger to auto-update job progress
CREATE TRIGGER trigger_update_job_progress
    AFTER UPDATE ON processing_job_items
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION update_job_progress();

-- 7. Create cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_jobs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM processing_jobs 
    WHERE expires_at < NOW() 
    AND status IN ('completed', 'failed', 'cancelled');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 8. Insert default queue statistics
INSERT INTO queue_statistics (date, job_type, total_jobs, completed_jobs, failed_jobs)
VALUES 
    (CURRENT_DATE, 'bulk_analysis', 0, 0, 0),
    (CURRENT_DATE, 'report_generation', 0, 0, 0),
    (CURRENT_DATE, 'skill_gap_batch', 0, 0, 0)
ON CONFLICT (date, job_type) DO NOTHING;

-- 9. Enable Row Level Security
ALTER TABLE processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_job_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_statistics ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS Policies
CREATE POLICY "Users can view their own jobs" ON processing_jobs
    FOR SELECT USING (user_id = auth.uid()::uuid);

CREATE POLICY "Users can insert their own jobs" ON processing_jobs
    FOR INSERT WITH CHECK (user_id = auth.uid()::uuid);

CREATE POLICY "Users can update their own jobs" ON processing_jobs
    FOR UPDATE USING (user_id = auth.uid()::uuid);

CREATE POLICY "Users can view job items for their jobs" ON processing_job_items
    FOR SELECT USING (
        job_id IN (
            SELECT id FROM processing_jobs WHERE user_id = auth.uid()::uuid
        )
    );

CREATE POLICY "Service role can manage all jobs" ON processing_jobs
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all job items" ON processing_job_items
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can view statistics" ON queue_statistics
    FOR SELECT USING (auth.role() = 'service_role');
```

## **Installation & Setup**

### **Prerequisites**

1. **Redis Server**
   ```bash
   # Windows (using Chocolatey)
   choco install redis-64
   
   # Or download from: https://github.com/microsoftarchive/redis/releases
   # Start Redis: redis-server
   ```

2. **Python Dependencies**
   ```bash
   cd recruiter_ai_service
   pip install -r requirements.txt
   ```

3. **.NET Dependencies**
   ```bash
   cd backend/ResumeAI.API
   dotnet restore
   ```

### **Configuration**

#### **1. Update appsettings.json**
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
  }
}
```

#### **2. Environment Variables**
Create `.env` file in `recruiter_ai_service/`:
```env
REDIS_URL=redis://localhost:6379
MAX_CONCURRENT_JOBS=5
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
OPENAI_API_KEY=your_openai_key
```

## **Running the System**

### **Step 1: Start Redis Server**
```bash
# Windows
redis-server

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

### **Step 2: Run Database Migration**
Execute all the SQL queries above in your Supabase SQL Editor.

### **Step 3: Start the .NET API**
```bash
cd backend/ResumeAI.API
dotnet run
```

### **Step 4: Start the Python Queue Worker**
```bash
# Option 1: Use the batch file
start_queue_worker.bat

# Option 2: Manual start
cd recruiter_ai_service
python queue_worker.py
```

### **Step 5: Start the Python AI Service**
```bash
cd recruiter_ai_service
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

## **API Endpoints**

### **Queue Management**

#### **Submit Bulk Analysis Job**
```http
POST /api/recruiter/analyze/bulk
Content-Type: application/json
Authorization: Bearer {token}

{
  "resumeIds": ["uuid1", "uuid2", "uuid3"],
  "jobDescriptionId": "job-uuid",
  "userId": "user-uuid",
  "planType": "premium"
}

Response:
{
  "success": true,
  "jobId": "job-uuid",
  "message": "Bulk analysis job queued successfully",
  "estimatedCompletionTime": "2024-12-20T15:30:00Z",
  "totalResumes": 3,
  "status": "queued"
}
```

#### **Get Job Status**
```http
GET /api/recruiter/jobs/{jobId}
Authorization: Bearer {token}

Response:
{
  "id": "job-uuid",
  "userId": "user-uuid",
  "jobType": "bulk_analysis",
  "status": "processing",
  "progressPercentage": 45.5,
  "processedItems": 5,
  "totalItems": 11,
  "failedItems": 1,
  "estimatedCompletionTime": "2024-12-20T15:30:00Z",
  "createdAt": "2024-12-20T15:00:00Z",
  "startedAt": "2024-12-20T15:01:00Z"
}
```

#### **Get Job Progress**
```http
GET /api/recruiter/jobs/{jobId}/progress
Authorization: Bearer {token}

Response:
{
  "jobId": "job-uuid",
  "status": "processing",
  "progressPercentage": 45.5,
  "processedItems": 5,
  "totalItems": 11,
  "failedItems": 1,
  "currentItem": "resume-uuid-6",
  "lastUpdated": "2024-12-20T15:15:00Z"
}
```

#### **Cancel Job**
```http
POST /api/recruiter/jobs/{jobId}/cancel
Content-Type: application/json
Authorization: Bearer {token}

{
  "userId": "user-uuid"
}

Response:
{
  "success": true,
  "message": "Job cancelled successfully"
}
```

#### **Get User Jobs**
```http
GET /api/recruiter/queue/status/{userId}
Authorization: Bearer {token}

Response: [
  {
    "id": "job-uuid-1",
    "jobType": "bulk_analysis",
    "status": "completed",
    "progressPercentage": 100,
    "totalItems": 10,
    "processedItems": 9,
    "failedItems": 1,
    "createdAt": "2024-12-20T14:00:00Z",
    "completedAt": "2024-12-20T14:15:00Z"
  }
]
```

#### **Get Queue Statistics**
```http
GET /api/recruiter/queue/statistics
Authorization: Bearer {token}

Response: [
  {
    "jobType": "bulk_analysis",
    "queueDepth": 5,
    "processingCount": 2,
    "completedToday": 15,
    "failedToday": 1,
    "averageProcessingTimeMs": 45000
  }
]
```

## **Real-time Updates**

### **SignalR Connection (Frontend)**
```typescript
import { HubConnectionBuilder } from '@microsoft/signalr';

// Connect to SignalR hub
const connection = new HubConnectionBuilder()
  .withUrl('/jobProgressHub', {
    accessTokenFactory: () => authToken
  })
  .build();

// Start connection
await connection.start();

// Join job group for updates
await connection.invoke('JoinJobGroup', jobId);

// Listen for progress updates
connection.on('ProgressUpdate', (progressData) => {
  console.log('Progress update:', progressData);
  updateUI(progressData);
});

// Listen for job completion
connection.on('JobCompleted', (completionData) => {
  console.log('Job completed:', completionData);
  showResults(completionData.resultData);
});

// Listen for job failure
connection.on('JobFailed', (failureData) => {
  console.log('Job failed:', failureData);
  showError(failureData.errorMessage);
});
```

## **Monitoring & Troubleshooting**

### **Redis Monitoring**
```bash
# Monitor Redis activity
redis-cli monitor

# Check queue depths
redis-cli llen "queue:bulk_analysis:normal"
redis-cli llen "queue:bulk_analysis:high"

# View queue contents
redis-cli lrange "queue:bulk_analysis:normal" 0 -1
```

### **Database Monitoring**
```sql
-- Check active jobs
SELECT job_type, status, COUNT(*) 
FROM processing_jobs 
WHERE created_at > NOW() - INTERVAL '1 day'
GROUP BY job_type, status;

-- Check job performance
SELECT 
    job_type,
    AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration_seconds,
    COUNT(*) as total_jobs
FROM processing_jobs 
WHERE status = 'completed' 
AND completed_at > NOW() - INTERVAL '1 day'
GROUP BY job_type;

-- Check failed jobs
SELECT job_type, error_message, COUNT(*) 
FROM processing_jobs 
WHERE status = 'failed' 
AND created_at > NOW() - INTERVAL '1 day'
GROUP BY job_type, error_message;
```

### **Log Monitoring**
```bash
# .NET API logs
dotnet run --verbosity detailed

# Python worker logs
python queue_worker.py
# Logs will show job processing status and errors
```

## **Performance Tuning**

### **Redis Configuration**
```conf
# redis.conf optimizations
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

### **Queue Configuration**
```json
{
  "Queue": {
    "MaxConcurrentJobs": 20,        // Increase for more throughput
    "RetryAttempts": 5,             // More retries for reliability
    "RetryDelaySeconds": 15,        // Faster retries
    "JobTimeoutMinutes": 60,        // Longer timeout for complex jobs
    "CleanupIntervalMinutes": 30    // More frequent cleanup
  }
}
```

### **Database Optimization**
```sql
-- Add more indexes for better performance
CREATE INDEX CONCURRENTLY idx_processing_jobs_type_status_created 
ON processing_jobs(job_type, status, created_at DESC);

-- Partition large tables by date
CREATE TABLE processing_jobs_2024_12 PARTITION OF processing_jobs
FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');
```

## **Scaling Considerations**

### **Horizontal Scaling**
- **Multiple Workers**: Run multiple Python worker instances
- **Redis Cluster**: Use Redis Cluster for high availability
- **Load Balancing**: Use nginx or cloud load balancer for API

### **Vertical Scaling**
- **Increase Redis Memory**: More memory for larger queues
- **More CPU Cores**: Better for concurrent processing
- **SSD Storage**: Faster database operations

## **Security**

### **Redis Security**
```conf
# redis.conf security
requirepass your_redis_password
bind 127.0.0.1
protected-mode yes
```

### **API Security**
- JWT token validation on all endpoints
- Rate limiting on job submission
- User isolation through RLS policies

## **Backup & Recovery**

### **Redis Backup**
```bash
# Create Redis backup
redis-cli BGSAVE

# Restore from backup
cp dump.rdb /var/lib/redis/
systemctl restart redis
```

### **Database Backup**
```sql
-- Backup job data
COPY processing_jobs TO '/backup/jobs.csv' CSV HEADER;
COPY processing_job_items TO '/backup/job_items.csv' CSV HEADER;
```

## **Testing**

### **Load Testing**
```bash
# Test bulk analysis endpoint
curl -X POST "http://localhost:5000/api/recruiter/analyze/bulk" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resumeIds": ["uuid1", "uuid2", "uuid3"],
    "jobDescriptionId": "job-uuid",
    "userId": "user-uuid",
    "planType": "premium"
  }'
```

### **Integration Testing**
```python
# Test queue worker
import asyncio
from queue_worker import QueueWorker

async def test_worker():
    worker = QueueWorker("redis://localhost:6379", 1)
    await worker.start()

asyncio.run(test_worker())
```

## **Conclusion**

This queue system provides:
- ✅ **Scalable Architecture**: Handle 100+ concurrent users
- ✅ **Real-time Updates**: Live progress tracking
- ✅ **Fault Tolerance**: Automatic retries and error handling
- ✅ **Performance**: Non-blocking operations
- ✅ **Monitoring**: Comprehensive logging and statistics
- ✅ **Security**: JWT authentication and RLS policies

The system is production-ready and can scale with your business growth.# 🚀 Queue System Implementation Guide

## **Overview**

This document provides a complete implementation guide for the Redis-based queue system that handles bulk candidate processing, report generation, and other async operations in the CareerBird platform.

## **Architecture & Technologies**

### **Technology Stack**

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                           │
│  React + TypeScript + SignalR Client                       │
│  ├── Real-time Progress Tracking                           │
│  ├── Job Status Monitoring                                 │
│  ├── Live Notifications                                    │
│  └── Partial Results Display                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend API Layer                        │
│  .NET 9 + ASP.NET Core + SignalR Hub                       │
│  ├── Job Submission Endpoints                              │
│  ├── Progress Tracking APIs                                │
│  ├── Real-time WebSocket Handlers                          │
│  └── Queue Management Services                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Message Queue Layer                       │
│  Redis 7.0+ with Pub/Sub + List Operations                 │
│  ├── Priority Job Queues (High/Normal)                     │
│  ├── Real-time Pub/Sub Messaging                           │
│  ├── Job State Management                                  │
│  └── Rate Limiting & Throttling                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Worker Services                           │
│  Python 3.11+ + AsyncIO + Redis Client                     │
│  ├── Bulk Resume Analysis Workers                          │
│  ├── Report Generation Workers                             │
│  ├── Skill Gap Analysis Workers                            │
│  └── Real-time Progress Publishers                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Storage Layer                       │
│  Supabase PostgreSQL 15+ + Redis Cache                     │
│  ├── Job Status & Progress Tracking                        │
│  ├── Queue Statistics & Monitoring                         │
│  ├── Results Storage & Retrieval                           │
│  └── Error Logging & Retry Management                      │
└─────────────────────────────────────────────────────────────┘
```

### **Technology Purposes**

#### **Redis (Message Queue & Cache)**
- **Purpose**: Message queuing, real-time pub/sub, caching
- **Usage**: 
  - Job queue management with priority support
  - Real-time progress updates via pub/sub
  - Rate limiting and throttling
  - Session storage and caching
- **Why**: Extremely fast, reliable, supports complex data structures

#### **SignalR (.NET)**
- **Purpose**: Real-time bidirectional communication
- **Usage**:
  - Live job progress updates to frontend
  - Real-time notifications
  - Connection management for users
- **Why**: Native .NET integration, automatic fallback to long polling

#### **PostgreSQL (Supabase)**
- **Purpose**: Persistent job storage and tracking
- **Usage**:
  - Job metadata and status persistence
  - Progress tracking and history
  - Queue statistics and monitoring
  - Results storage
- **Why**: ACID compliance, complex queries, JSON support

#### **Python AsyncIO Workers**
- **Purpose**: Asynchronous job processing
- **Usage**:
  - Bulk resume analysis processing
  - Report generation
  - AI service integration
  - Concurrent job handling
- **Why**: Excellent async support, AI/ML library ecosystem

#### **.NET Background Services**
- **Purpose**: Queue monitoring and management
- **Usage**:
  - Job timeout handling
  - Queue health monitoring
  - Cleanup operations
  - Statistics collection
- **Why**: Integrated with ASP.NET Core, excellent performance

## **Database Schema**

### **Required Supabase Queries**

Run these queries in your Supabase SQL Editor:

```sql
-- 1. Create job queue tables
-- Run this first to create the basic structure
CREATE TABLE processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    job_type VARCHAR(50) NOT NULL, -- 'bulk_analysis', 'report_generation', 'skill_gap_batch', etc.
    status VARCHAR(20) NOT NULL DEFAULT 'queued', -- queued, processing, completed, failed, cancelled
    priority INTEGER DEFAULT 0, -- Higher number = higher priority
    total_items INTEGER NOT NULL,
    processed_items INTEGER DEFAULT 0,
    failed_items INTEGER DEFAULT 0,
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    job_data JSONB NOT NULL, -- Input parameters
    result_data JSONB, -- Output results
    error_message TEXT,
    estimated_completion_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '24 hours') -- Auto cleanup after 24 hours
);

-- 2. Create job items table for granular tracking
CREATE TABLE processing_job_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES processing_jobs(id) ON DELETE CASCADE,
    item_id VARCHAR(255) NOT NULL, -- resume_id, report_id, etc.
    item_type VARCHAR(50) NOT NULL, -- 'resume_analysis', 'report_section', etc.
    status VARCHAR(20) NOT NULL DEFAULT 'queued', -- queued, processing, completed, failed
    result_data JSONB,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    processing_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- 3. Create queue statistics table
CREATE TABLE queue_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    job_type VARCHAR(50) NOT NULL,
    total_jobs INTEGER DEFAULT 0,
    completed_jobs INTEGER DEFAULT 0,
    failed_jobs INTEGER DEFAULT 0,
    average_processing_time_ms INTEGER DEFAULT 0,
    peak_queue_depth INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(date, job_type)
);

-- 4. Create indexes for performance
CREATE INDEX idx_processing_jobs_user_status ON processing_jobs(user_id, status);
CREATE INDEX idx_processing_jobs_status_priority ON processing_jobs(status, priority DESC);
CREATE INDEX idx_processing_jobs_created_at ON processing_jobs(created_at DESC);
CREATE INDEX idx_processing_jobs_expires_at ON processing_jobs(expires_at);
CREATE INDEX idx_processing_job_items_job_status ON processing_job_items(job_id, status);
CREATE INDEX idx_processing_job_items_item_id ON processing_job_items(item_id);
CREATE INDEX idx_queue_statistics_date_type ON queue_statistics(date, job_type);

-- 5. Create function to update job progress automatically
CREATE OR REPLACE FUNCTION update_job_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Update parent job progress when job items change
    UPDATE processing_jobs 
    SET 
        processed_items = (
            SELECT COUNT(*) 
            FROM processing_job_items 
            WHERE job_id = NEW.job_id AND status = 'completed'
        ),
        failed_items = (
            SELECT COUNT(*) 
            FROM processing_job_items 
            WHERE job_id = NEW.job_id AND status = 'failed'
        ),
        progress_percentage = (
            SELECT ROUND(
                (COUNT(*) FILTER (WHERE status IN ('completed', 'failed'))::DECIMAL / COUNT(*)) * 100, 2
            )
            FROM processing_job_items 
            WHERE job_id = NEW.job_id
        ),
        updated_at = NOW(),
        status = CASE 
            WHEN (
                SELECT COUNT(*) 
                FROM processing_job_items 
                WHERE job_id = NEW.job_id AND status NOT IN ('completed', 'failed')
            ) = 0 THEN 'completed'
            ELSE status
        END
    WHERE id = NEW.job_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger to auto-update job progress
CREATE TRIGGER trigger_update_job_progress
    AFTER UPDATE ON processing_job_items
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION update_job_progress();

-- 7. Create cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_jobs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM processing_jobs 
    WHERE expires_at < NOW() 
    AND status IN ('completed', 'failed', 'cancelled');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 8. Insert default queue statistics
INSERT INTO queue_statistics (date, job_type, total_jobs, completed_jobs, failed_jobs)
VALUES 
    (CURRENT_DATE, 'bulk_analysis', 0, 0, 0),
    (CURRENT_DATE, 'report_generation', 0, 0, 0),
    (CURRENT_DATE, 'skill_gap_batch', 0, 0, 0)
ON CONFLICT (date, job_type) DO NOTHING;

-- 9. Enable Row Level Security
ALTER TABLE processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_job_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_statistics ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS Policies
CREATE POLICY "Users can view their own jobs" ON processing_jobs
    FOR SELECT USING (user_id = auth.uid()::uuid);

CREATE POLICY "Users can insert their own jobs" ON processing_jobs
    FOR INSERT WITH CHECK (user_id = auth.uid()::uuid);

CREATE POLICY "Users can update their own jobs" ON processing_jobs
    FOR UPDATE USING (user_id = auth.uid()::uuid);

CREATE POLICY "Users can view job items for their jobs" ON processing_job_items
    FOR SELECT USING (
        job_id IN (
            SELECT id FROM processing_jobs WHERE user_id = auth.uid()::uuid
        )
    );

CREATE POLICY "Service role can manage all jobs" ON processing_jobs
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all job items" ON processing_job_items
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can view statistics" ON queue_statistics
    FOR SELECT USING (auth.role() = 'service_role');
```

## **Installation & Setup**

### **Prerequisites**

1. **Redis Server**
   ```bash
   # Windows (using Chocolatey)
   choco install redis-64
   
   # Or download from: https://github.com/microsoftarchive/redis/releases
   # Start Redis: redis-server
   ```

2. **Python Dependencies**
   ```bash
   cd recruiter_ai_service
   pip install -r requirements.txt
   ```

3. **.NET Dependencies**
   ```bash
   cd backend/ResumeAI.API
   dotnet restore
   ```

### **Configuration**

#### **1. Update appsettings.json**
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
  }
}
```

#### **2. Environment Variables**
Create `.env` file in `recruiter_ai_service/`:
```env
REDIS_URL=redis://localhost:6379
MAX_CONCURRENT_JOBS=5
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
OPENAI_API_KEY=your_openai_key
```

## **Running the System**

### **Step 1: Start Redis Server**
```bash
# Windows
redis-server

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

### **Step 2: Run Database Migration**
Execute all the SQL queries above in your Supabase SQL Editor.

### **Step 3: Start the .NET API**
```bash
cd backend/ResumeAI.API
dotnet run
```

### **Step 4: Start the Python Queue Worker**
```bash
# Option 1: Use the batch file
start_queue_worker.bat

# Option 2: Manual start
cd recruiter_ai_service
python queue_worker.py
```

### **Step 5: Start the Python AI Service**
```bash
cd recruiter_ai_service
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

## **API Endpoints**

### **Queue Management**

#### **Submit Bulk Analysis Job**
```http
POST /api/recruiter/analyze/bulk
Content-Type: application/json
Authorization: Bearer {token}

{
  "resumeIds": ["uuid1", "uuid2", "uuid3"],
  "jobDescriptionId": "job-uuid",
  "userId": "user-uuid",
  "planType": "premium"
}

Response:
{
  "success": true,
  "jobId": "job-uuid",
  "message": "Bulk analysis job queued successfully",
  "estimatedCompletionTime": "2024-12-20T15:30:00Z",
  "totalResumes": 3,
  "status": "queued"
}
```

#### **Get Job Status**
```http
GET /api/recruiter/jobs/{jobId}
Authorization: Bearer {token}

Response:
{
  "id": "job-uuid",
  "userId": "user-uuid",
  "jobType": "bulk_analysis",
  "status": "processing",
  "progressPercentage": 45.5,
  "processedItems": 5,
  "totalItems": 11,
  "failedItems": 1,
  "estimatedCompletionTime": "2024-12-20T15:30:00Z",
  "createdAt": "2024-12-20T15:00:00Z",
  "startedAt": "2024-12-20T15:01:00Z"
}
```

#### **Get Job Progress**
```http
GET /api/recruiter/jobs/{jobId}/progress
Authorization: Bearer {token}

Response:
{
  "jobId": "job-uuid",
  "status": "processing",
  "progressPercentage": 45.5,
  "processedItems": 5,
  "totalItems": 11,
  "failedItems": 1,
  "currentItem": "resume-uuid-6",
  "lastUpdated": "2024-12-20T15:15:00Z"
}
```

#### **Cancel Job**
```http
POST /api/recruiter/jobs/{jobId}/cancel
Content-Type: application/json
Authorization: Bearer {token}

{
  "userId": "user-uuid"
}

Response:
{
  "success": true,
  "message": "Job cancelled successfully"
}
```

#### **Get User Jobs**
```http
GET /api/recruiter/queue/status/{userId}
Authorization: Bearer {token}

Response: [
  {
    "id": "job-uuid-1",
    "jobType": "bulk_analysis",
    "status": "completed",
    "progressPercentage": 100,
    "totalItems": 10,
    "processedItems": 9,
    "failedItems": 1,
    "createdAt": "2024-12-20T14:00:00Z",
    "completedAt": "2024-12-20T14:15:00Z"
  }
]
```

#### **Get Queue Statistics**
```http
GET /api/recruiter/queue/statistics
Authorization: Bearer {token}

Response: [
  {
    "jobType": "bulk_analysis",
    "queueDepth": 5,
    "processingCount": 2,
    "completedToday": 15,
    "failedToday": 1,
    "averageProcessingTimeMs": 45000
  }
]
```

## **Real-time Updates**

### **SignalR Connection (Frontend)**
```typescript
import { HubConnectionBuilder } from '@microsoft/signalr';

// Connect to SignalR hub
const connection = new HubConnectionBuilder()
  .withUrl('/jobProgressHub', {
    accessTokenFactory: () => authToken
  })
  .build();

// Start connection
await connection.start();

// Join job group for updates
await connection.invoke('JoinJobGroup', jobId);

// Listen for progress updates
connection.on('ProgressUpdate', (progressData) => {
  console.log('Progress update:', progressData);
  updateUI(progressData);
});

// Listen for job completion
connection.on('JobCompleted', (completionData) => {
  console.log('Job completed:', completionData);
  showResults(completionData.resultData);
});

// Listen for job failure
connection.on('JobFailed', (failureData) => {
  console.log('Job failed:', failureData);
  showError(failureData.errorMessage);
});
```

## **Monitoring & Troubleshooting**

### **Redis Monitoring**
```bash
# Monitor Redis activity
redis-cli monitor

# Check queue depths
redis-cli llen "queue:bulk_analysis:normal"
redis-cli llen "queue:bulk_analysis:high"

# View queue contents
redis-cli lrange "queue:bulk_analysis:normal" 0 -1
```

### **Database Monitoring**
```sql
-- Check active jobs
SELECT job_type, status, COUNT(*) 
FROM processing_jobs 
WHERE created_at > NOW() - INTERVAL '1 day'
GROUP BY job_type, status;

-- Check job performance
SELECT 
    job_type,
    AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration_seconds,
    COUNT(*) as total_jobs
FROM processing_jobs 
WHERE status = 'completed' 
AND completed_at > NOW() - INTERVAL '1 day'
GROUP BY job_type;

-- Check failed jobs
SELECT job_type, error_message, COUNT(*) 
FROM processing_jobs 
WHERE status = 'failed' 
AND created_at > NOW() - INTERVAL '1 day'
GROUP BY job_type, error_message;
```

### **Log Monitoring**
```bash
# .NET API logs
dotnet run --verbosity detailed

# Python worker logs
python queue_worker.py
# Logs will show job processing status and errors
```

## **Performance Tuning**

### **Redis Configuration**
```conf
# redis.conf optimizations
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

### **Queue Configuration**
```json
{
  "Queue": {
    "MaxConcurrentJobs": 20,        // Increase for more throughput
    "RetryAttempts": 5,             // More retries for reliability
    "RetryDelaySeconds": 15,        // Faster retries
    "JobTimeoutMinutes": 60,        // Longer timeout for complex jobs
    "CleanupIntervalMinutes": 30    // More frequent cleanup
  }
}
```

### **Database Optimization**
```sql
-- Add more indexes for better performance
CREATE INDEX CONCURRENTLY idx_processing_jobs_type_status_created 
ON processing_jobs(job_type, status, created_at DESC);

-- Partition large tables by date
CREATE TABLE processing_jobs_2024_12 PARTITION OF processing_jobs
FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');
```

## **Scaling Considerations**

### **Horizontal Scaling**
- **Multiple Workers**: Run multiple Python worker instances
- **Redis Cluster**: Use Redis Cluster for high availability
- **Load Balancing**: Use nginx or cloud load balancer for API

### **Vertical Scaling**
- **Increase Redis Memory**: More memory for larger queues
- **More CPU Cores**: Better for concurrent processing
- **SSD Storage**: Faster database operations

## **Security**

### **Redis Security**
```conf
# redis.conf security
requirepass your_redis_password
bind 127.0.0.1
protected-mode yes
```

### **API Security**
- JWT token validation on all endpoints
- Rate limiting on job submission
- User isolation through RLS policies

## **Backup & Recovery**

### **Redis Backup**
```bash
# Create Redis backup
redis-cli BGSAVE

# Restore from backup
cp dump.rdb /var/lib/redis/
systemctl restart redis
```

### **Database Backup**
```sql
-- Backup job data
COPY processing_jobs TO '/backup/jobs.csv' CSV HEADER;
COPY processing_job_items TO '/backup/job_items.csv' CSV HEADER;
```

## **Testing**

### **Load Testing**
```bash
# Test bulk analysis endpoint
curl -X POST "http://localhost:5000/api/recruiter/analyze/bulk" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resumeIds": ["uuid1", "uuid2", "uuid3"],
    "jobDescriptionId": "job-uuid",
    "userId": "user-uuid",
    "planType": "premium"
  }'
```

### **Integration Testing**
```python
# Test queue worker
import asyncio
from queue_worker import QueueWorker

async def test_worker():
    worker = QueueWorker("redis://localhost:6379", 1)
    await worker.start()

asyncio.run(test_worker())
```

## **Conclusion**

This queue system provides:
- ✅ **Scalable Architecture**: Handle 100+ concurrent users
- ✅ **Real-time Updates**: Live progress tracking
- ✅ **Fault Tolerance**: Automatic retries and error handling
- ✅ **Performance**: Non-blocking operations
- ✅ **Monitoring**: Comprehensive logging and statistics
- ✅ **Security**: JWT authentication and RLS policies

The system is production-ready and can scale with your business growth.