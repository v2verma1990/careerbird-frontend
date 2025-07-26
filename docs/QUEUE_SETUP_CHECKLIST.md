# 🚀 Queue System Setup Checklist

## **Quick Start Guide**

Follow these steps to get your queue system up and running:

### **Step 1: Install Redis**
```bash
# Option 1: Using Chocolatey (Recommended)
choco install redis-64

# Option 2: Manual Download
# Download from: https://github.com/microsoftarchive/redis/releases
# Extract and run redis-server.exe
```

### **Step 2: Run Database Migration**
Copy and paste this SQL into your **Supabase SQL Editor**:

```sql
-- Create job queue tables
CREATE TABLE processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    job_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'queued',
    priority INTEGER DEFAULT 0,
    total_items INTEGER NOT NULL,
    processed_items INTEGER DEFAULT 0,
    failed_items INTEGER DEFAULT 0,
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    job_data JSONB NOT NULL,
    result_data JSONB,
    error_message TEXT,
    estimated_completion_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '24 hours')
);

CREATE TABLE processing_job_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES processing_jobs(id) ON DELETE CASCADE,
    item_id VARCHAR(255) NOT NULL,
    item_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'queued',
    result_data JSONB,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    processing_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);

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

-- Create indexes
CREATE INDEX idx_processing_jobs_user_status ON processing_jobs(user_id, status);
CREATE INDEX idx_processing_jobs_status_priority ON processing_jobs(status, priority DESC);
CREATE INDEX idx_processing_jobs_created_at ON processing_jobs(created_at DESC);
CREATE INDEX idx_processing_jobs_expires_at ON processing_jobs(expires_at);
CREATE INDEX idx_processing_job_items_job_status ON processing_job_items(job_id, status);
CREATE INDEX idx_processing_job_items_item_id ON processing_job_items(item_id);
CREATE INDEX idx_queue_statistics_date_type ON queue_statistics(date, job_type);

-- Create progress update function
CREATE OR REPLACE FUNCTION update_job_progress()
RETURNS TRIGGER AS $$
BEGIN
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

-- Create trigger
CREATE TRIGGER trigger_update_job_progress
    AFTER UPDATE ON processing_job_items
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION update_job_progress();

-- Create cleanup function
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

-- Insert default statistics
INSERT INTO queue_statistics (date, job_type, total_jobs, completed_jobs, failed_jobs)
VALUES 
    (CURRENT_DATE, 'bulk_analysis', 0, 0, 0),
    (CURRENT_DATE, 'report_generation', 0, 0, 0),
    (CURRENT_DATE, 'skill_gap_batch', 0, 0, 0)
ON CONFLICT (date, job_type) DO NOTHING;

-- Enable RLS
ALTER TABLE processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_job_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_statistics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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

### **Step 3: Install Dependencies**
```bash
# Frontend dependencies
npm install @microsoft/signalr

# .NET dependencies (already added to .csproj)
cd backend/ResumeAI.API
dotnet restore

# Python dependencies (already added to requirements.txt)
cd recruiter_ai_service
pip install redis[hiredis]==5.0.1 celery==5.3.4
```

### **Step 4: Update Configuration**
Your `appsettings.json` has already been updated with:
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

### **Step 5: Start Services**

**Use the provided batch files for easy startup:**

**Option 1 - Complete Setup:**
```bash
# Run the setup script first (one time only)
setup_queue_system.bat
```

**Option 2 - Start All Services:**
```bash
# Start all services at once
start_all_services.bat
```

**Option 3 - Manual Startup:**

**Terminal 1 - Redis Server:**
```bash
redis-server
```

**Terminal 2 - .NET API:**
```bash
cd backend/ResumeAI.API
dotnet run
```

**Terminal 3 - Python AI Service:**
```bash
cd recruiter_ai_service
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

**Terminal 4 - Queue Worker:**
```bash
cd recruiter_ai_service
python queue_worker.py
```

**Terminal 5 - Frontend:**
```bash
npm run dev
```

## **Testing the Queue System**

### **1. Test Bulk Analysis API**
```bash
curl -X POST "http://localhost:5000/api/recruiter/analyze/bulk" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resumeIds": ["resume-1", "resume-2", "resume-3"],
    "jobDescriptionId": "job-123",
    "userId": "user-456",
    "planType": "premium"
  }'
```

### **2. Check Job Status**
```bash
curl -X GET "http://localhost:5000/api/recruiter/jobs/JOB_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **3. Monitor Redis Queue**
```bash
# Check queue depth
redis-cli llen "queue:bulk_analysis:normal"

# Monitor Redis activity
redis-cli monitor
```

## **Frontend Integration**

Use the provided React components:

```tsx
import BulkAnalysisQueue from './components/BulkAnalysisQueue';
import { useJobProgress } from './hooks/useJobProgress';

function RecruiterDashboard() {
  const resumeIds = ['resume-1', 'resume-2', 'resume-3'];
  const jobDescriptionId = 'job-123';

  return (
    <BulkAnalysisQueue
      resumeIds={resumeIds}
      jobDescriptionId={jobDescriptionId}
      onComplete={(results) => {
        console.log('Analysis completed:', results);
      }}
      onError={(error) => {
        console.error('Analysis failed:', error);
      }}
    />
  );
}
```

## **Key Features Implemented**

✅ **Redis-based Message Queue**
- Priority queues (high/normal)
- Automatic retry with exponential backoff
- Job timeout handling
- Queue statistics and monitoring

✅ **Real-time Progress Updates**
- SignalR WebSocket connections
- Live progress bars
- Partial results display
- Error notifications

✅ **Database Job Tracking**
- Persistent job storage in Supabase
- Granular item-level tracking
- Automatic progress calculation
- Row-level security policies

✅ **Background Processing**
- Async Python workers
- Concurrent job processing
- Rate limiting and throttling
- Graceful error handling

✅ **Monitoring & Management**
- Job cancellation
- Queue statistics
- Performance metrics
- Automatic cleanup

## **Production Considerations**

### **Redis Configuration for Production**
```conf
# /etc/redis/redis.conf
maxmemory 4gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
requirepass your_secure_password
bind 0.0.0.0
protected-mode yes
```

### **Environment Variables**
```env
# Production .env
REDIS_URL=redis://username:password@redis-server:6379
DATABASE_URL=postgresql://user:pass@db.supabase.co:5432/postgres
OPENAI_API_KEY=your_production_key
MAX_CONCURRENT_JOBS=20
```

### **Scaling Options**
- **Multiple Workers**: Run multiple Python worker instances
- **Redis Cluster**: For high availability
- **Load Balancer**: For API scaling
- **Database Partitioning**: For large job volumes

## **Troubleshooting**

### **Common Issues**

**Redis Connection Failed:**
```bash
# Check if Redis is running
redis-cli ping

# Check Redis logs
tail -f /var/log/redis/redis-server.log
```

**Queue Worker Not Processing:**
```bash
# Check Python worker logs
python queue_worker.py

# Check queue depth
redis-cli llen "queue:bulk_analysis:normal"
```

**SignalR Connection Issues:**
- Ensure CORS is configured correctly
- Check JWT token validity
- Verify WebSocket support

**Database Connection Issues:**
- Check Supabase connection string
- Verify RLS policies are correct
- Ensure service role permissions

## **Support**

For detailed documentation, see:
- `docs/QUEUE_SYSTEM_IMPLEMENTATION.md` - Complete technical documentation
- `src/hooks/useJobProgress.ts` - Frontend integration guide
- `src/components/BulkAnalysisQueue.tsx` - UI component example

The queue system is now ready for production use! 🚀

## **What to Run in Supabase**

**IMPORTANT**: The SQL above contains all the necessary tables and functions. You only need to run it **ONCE** in your Supabase SQL Editor. 

**Note**: There is no duplication of `processing_job_items` table - it appears only once in the migration. If you see any errors about existing tables, you can safely ignore them or add `IF NOT EXISTS` to the CREATE TABLE statements.

**Verification**: After running the SQL, you should see these tables in your Supabase dashboard:
- `processing_jobs`
- `processing_job_items` 
- `queue_statistics`

All triggers, functions, and policies will be automatically created.