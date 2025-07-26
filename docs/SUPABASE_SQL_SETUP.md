# 🗄️ Supabase SQL Setup - What to Run

## ❓ **Your Question Answered**

You mentioned seeing `processing_job_items` twice in the QUEUE_SETUP_CHECKLIST.md. **This was a duplication error in the old file.** The new documentation has been cleaned up.

## ✅ **What You Need to Run in Supabase (ONCE ONLY)**

Copy and paste this **COMPLETE SQL SCRIPT** into your Supabase SQL Editor and run it **ONCE**:

```sql
-- ========================================
-- CareerBird Queue System Database Setup
-- Run this ONCE in Supabase SQL Editor
-- ========================================

-- Create job queue tables
CREATE TABLE IF NOT EXISTS processing_jobs (
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

CREATE TABLE IF NOT EXISTS processing_job_items (
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

CREATE TABLE IF NOT EXISTS queue_statistics (
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_processing_jobs_user_status ON processing_jobs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_status_priority ON processing_jobs(status, priority DESC);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_created_at ON processing_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_expires_at ON processing_jobs(expires_at);
CREATE INDEX IF NOT EXISTS idx_processing_job_items_job_status ON processing_job_items(job_id, status);
CREATE INDEX IF NOT EXISTS idx_processing_job_items_item_id ON processing_job_items(item_id);
CREATE INDEX IF NOT EXISTS idx_queue_statistics_date_type ON queue_statistics(date, job_type);

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

-- Create trigger (drop first if exists)
DROP TRIGGER IF EXISTS trigger_update_job_progress ON processing_job_items;
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

-- Insert default statistics (only if they don't exist)
INSERT INTO queue_statistics (date, job_type, total_jobs, completed_jobs, failed_jobs)
VALUES 
    (CURRENT_DATE, 'bulk_analysis', 0, 0, 0),
    (CURRENT_DATE, 'report_generation', 0, 0, 0),
    (CURRENT_DATE, 'skill_gap_batch', 0, 0, 0)
ON CONFLICT (date, job_type) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_job_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_statistics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own jobs" ON processing_jobs;
DROP POLICY IF EXISTS "Users can insert their own jobs" ON processing_jobs;
DROP POLICY IF EXISTS "Users can update their own jobs" ON processing_jobs;
DROP POLICY IF EXISTS "Users can view job items for their jobs" ON processing_job_items;
DROP POLICY IF EXISTS "Service role can manage all jobs" ON processing_jobs;
DROP POLICY IF EXISTS "Service role can manage all job items" ON processing_job_items;
DROP POLICY IF EXISTS "Service role can view statistics" ON queue_statistics;

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

-- ========================================
-- Setup Complete!
-- ========================================
-- You should now have:
-- ✅ processing_jobs table
-- ✅ processing_job_items table  
-- ✅ queue_statistics table
-- ✅ All indexes for performance
-- ✅ Automatic progress update trigger
-- ✅ Cleanup function for expired jobs
-- ✅ Row Level Security policies
-- ✅ Default statistics entries
-- ========================================
```

## 🔍 **What This SQL Creates**

### **Tables Created:**
1. **`processing_jobs`** - Main job tracking table
2. **`processing_job_items`** - Individual job item tracking (NOT duplicated)
3. **`queue_statistics`** - Queue performance metrics

### **Functions Created:**
1. **`update_job_progress()`** - Automatically updates job progress
2. **`cleanup_expired_jobs()`** - Cleans up old completed jobs

### **Triggers Created:**
1. **`trigger_update_job_progress`** - Fires when job items change status

### **Indexes Created:**
- Performance indexes for fast queries
- User-based filtering indexes
- Date-based sorting indexes

### **Security:**
- Row Level Security (RLS) enabled
- User-specific access policies
- Service role permissions for background workers

## ✅ **Verification Steps**

After running the SQL, verify in your Supabase dashboard:

1. **Go to Table Editor**
2. **Check these tables exist:**
   - `processing_jobs`
   - `processing_job_items`
   - `queue_statistics`

3. **Check Functions (Database → Functions):**
   - `update_job_progress`
   - `cleanup_expired_jobs`

4. **Check Triggers (Database → Triggers):**
   - `trigger_update_job_progress`

## ❌ **What NOT to Run**

**Don't run:**
- The old duplicated SQL from the previous file
- Multiple copies of the same CREATE TABLE statements
- The migration file directly (it's already included above)

## 🚨 **If You Already Ran Something**

If you already ran some SQL and got errors:

```sql
-- Clean up and start fresh (OPTIONAL - only if you have issues)
DROP TABLE IF EXISTS processing_job_items CASCADE;
DROP TABLE IF EXISTS processing_jobs CASCADE;
DROP TABLE IF EXISTS queue_statistics CASCADE;
DROP FUNCTION IF EXISTS update_job_progress() CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_jobs() CASCADE;

-- Then run the complete SQL above
```

## 🎯 **Summary**

**What you need to do:**
1. ✅ Copy the **COMPLETE SQL SCRIPT** above
2. ✅ Paste it into Supabase SQL Editor
3. ✅ Click "Run" **ONCE**
4. ✅ Verify tables are created
5. ✅ You're done with database setup!

**The duplication issue has been fixed in the new documentation. You only need to run the SQL once, and it will create all necessary tables, functions, and triggers for the queue system.**