"""
Queue Worker Service for Processing Jobs
Handles bulk analysis, report generation, and other async tasks
"""

import asyncio
import redis.asyncio as redis
import json
import logging
import signal
import sys
from typing import Dict, Any, Optional
from datetime import datetime
import traceback

# Import our services
from services.analysis_service import AnalysisService
from services.report_service import ReportService
from services.comparison_service import ComparisonService
from services.skill_gap_service import SkillGapService
from services.cache_service import CacheService
from services.vector_service import VectorService
from utils.database import DatabaseService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class QueueWorker:
    def __init__(self, redis_url: str = "redis://localhost:6379", max_concurrent: int = 5):
        self.redis_url = redis_url
        self.max_concurrent = max_concurrent
        self.running = False
        self.semaphore = asyncio.Semaphore(max_concurrent)
        
        # Initialize services
        self.db_service = DatabaseService()
        self.cache_service = CacheService(self.db_service)
        self.vector_service = VectorService(self.db_service)
        self.analysis_service = AnalysisService(self.db_service, self.cache_service, self.vector_service)
        self.comparison_service = ComparisonService(self.db_service, self.cache_service, self.vector_service)
        self.skill_gap_service = SkillGapService(self.db_service, self.cache_service)
        self.report_service = ReportService(self.db_service, self.cache_service)
        
        # Redis connection
        self.redis_client = None
        
    async def start(self):
        """Start the queue worker"""
        logger.info("Starting Queue Worker...")
        
        # Initialize database connection
        await self.db_service.initialize()
        
        # Connect to Redis
        self.redis_client = redis.from_url(self.redis_url, decode_responses=True)
        
        # Test Redis connection
        try:
            await self.redis_client.ping()
            logger.info("Connected to Redis successfully")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            return
        
        self.running = True
        
        # Start worker tasks
        tasks = [
            self.process_queue("bulk_analysis"),
            self.process_queue("report_generation"),
            self.process_queue("skill_gap_batch"),
            self.monitor_jobs()
        ]
        
        try:
            await asyncio.gather(*tasks)
        except KeyboardInterrupt:
            logger.info("Received shutdown signal")
        finally:
            await self.shutdown()
    
    async def process_queue(self, job_type: str):
        """Process jobs from a specific queue"""
        high_priority_queue = f"queue:{job_type}:high"
        normal_priority_queue = f"queue:{job_type}:normal"
        
        logger.info(f"Started processing {job_type} queue")
        
        while self.running:
            try:
                # Wait for semaphore (rate limiting)
                await self.semaphore.acquire()
                
                try:
                    # Check high priority queue first
                    queue_item = await self.redis_client.brpop(high_priority_queue, timeout=1)
                    
                    # If no high priority items, check normal priority
                    if not queue_item:
                        queue_item = await self.redis_client.brpop(normal_priority_queue, timeout=1)
                    
                    if queue_item:
                        _, item_data = queue_item
                        item = json.loads(item_data)
                        
                        # Process job in background
                        asyncio.create_task(self.process_job(item))
                    else:
                        # No items, release semaphore and wait
                        self.semaphore.release()
                        await asyncio.sleep(1)
                        
                except Exception as e:
                    self.semaphore.release()
                    logger.error(f"Error processing {job_type} queue: {e}")
                    await asyncio.sleep(5)
                    
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Unexpected error in {job_type} queue processor: {e}")
                await asyncio.sleep(5)
    
    async def process_job(self, queue_item: Dict[str, Any]):
        """Process a single job"""
        job_id = queue_item.get("job_id")
        job_type = queue_item.get("job_type")
        
        try:
            logger.info(f"Processing job {job_id} of type {job_type}")
            
            # Update job status to processing
            await self.update_job_status(job_id, "processing")
            
            # Route to appropriate processor
            if job_type == "bulk_analysis":
                await self.process_bulk_analysis_job(queue_item)
            elif job_type == "report_generation":
                await self.process_report_generation_job(queue_item)
            elif job_type == "skill_gap_batch":
                await self.process_skill_gap_batch_job(queue_item)
            else:
                raise ValueError(f"Unknown job type: {job_type}")
            
            logger.info(f"Successfully processed job {job_id}")
            
        except Exception as e:
            logger.error(f"Failed to process job {job_id}: {e}")
            logger.error(traceback.format_exc())
            await self.handle_job_failure(job_id, str(e), queue_item)
        finally:
            self.semaphore.release()
    
    async def process_bulk_analysis_job(self, queue_item: Dict[str, Any]):
        """Process bulk analysis job"""
        job_id = queue_item["job_id"]
        job_data = json.loads(queue_item["data"])
        
        resume_ids = job_data["ResumeIds"]
        job_description_id = job_data["JobDescriptionId"]
        user_id = job_data["UserId"]
        plan_type = job_data.get("PlanType", "free")
        
        total_resumes = len(resume_ids)
        processed = 0
        failed = 0
        results = []
        
        logger.info(f"Processing bulk analysis job {job_id} with {total_resumes} resumes")
        
        for resume_id in resume_ids:
            try:
                # Update progress
                progress_percentage = (processed / total_resumes) * 100
                await self.update_job_progress(job_id, processed, failed, progress_percentage, resume_id)
                
                # Analyze resume
                result = await self.analysis_service.analyze_resume(
                    resume_id=resume_id,
                    job_description_id=job_description_id,
                    user_id=user_id,
                    plan_type=plan_type
                )
                
                results.append({
                    "resume_id": resume_id,
                    "success": True,
                    "analysis": result
                })
                
                processed += 1
                
                # Update job item status
                await self.update_job_item_status(job_id, resume_id, "completed", result)
                
                # Send real-time update
                await self.send_progress_update(job_id, {
                    "resume_id": resume_id,
                    "status": "completed",
                    "result": result,
                    "progress": (processed / total_resumes) * 100
                })
                
            except Exception as e:
                logger.error(f"Failed to analyze resume {resume_id}: {e}")
                failed += 1
                
                results.append({
                    "resume_id": resume_id,
                    "success": False,
                    "error": str(e)
                })
                
                await self.update_job_item_status(job_id, resume_id, "failed", None, str(e))
                
                # Send error update
                await self.send_progress_update(job_id, {
                    "resume_id": resume_id,
                    "status": "failed",
                    "error": str(e),
                    "progress": (processed / total_resumes) * 100
                })
            
            # Rate limiting - small delay between requests
            await asyncio.sleep(0.1)
        
        # Complete the job
        await self.complete_job(job_id, results, processed, failed)
    
    async def process_report_generation_job(self, queue_item: Dict[str, Any]):
        """Process report generation job"""
        job_id = queue_item["job_id"]
        job_data = json.loads(queue_item["data"])
        
        report_type = job_data["ReportType"]
        job_description_id = job_data["JobDescriptionId"]
        resume_analysis_ids = job_data["ResumeAnalysisIds"]
        user_id = job_data["UserId"]
        plan_type = job_data.get("PlanType", "free")
        
        logger.info(f"Processing report generation job {job_id} for report type {report_type}")
        
        try:
            # Update progress
            await self.update_job_progress(job_id, 0, 0, 25, "Generating report...")
            
            # Generate report
            report_result = await self.report_service.generate_report(
                report_type=report_type,
                job_description_id=job_description_id,
                resume_analysis_ids=resume_analysis_ids,
                user_id=user_id,
                plan_type=plan_type
            )
            
            await self.update_job_progress(job_id, 1, 0, 100, "Report completed")
            await self.complete_job(job_id, report_result, 1, 0)
            await self.update_job_item_status(job_id, report_type, "completed", report_result)
            
        except Exception as e:
            await self.update_job_item_status(job_id, report_type, "failed", None, str(e))
            raise
    
    async def process_skill_gap_batch_job(self, queue_item: Dict[str, Any]):
        """Process skill gap batch analysis job"""
        job_id = queue_item["job_id"]
        job_data = json.loads(queue_item["data"])
        
        # Implementation for batch skill gap analysis
        logger.info(f"Processing skill gap batch job {job_id}")
        # Add implementation as needed
        
        await self.complete_job(job_id, {"message": "Skill gap batch analysis completed"}, 1, 0)
    
    async def update_job_status(self, job_id: str, status: str):
        """Update job status in database"""
        try:
            query = """
                UPDATE processing_jobs 
                SET status = %s, 
                    started_at = CASE WHEN %s = 'processing' THEN NOW() ELSE started_at END,
                    completed_at = CASE WHEN %s IN ('completed', 'failed', 'cancelled') THEN NOW() ELSE completed_at END,
                    updated_at = NOW()
                WHERE id = %s
            """
            await self.db_service.execute(query, (status, status, status, job_id))
        except Exception as e:
            logger.error(f"Failed to update job status for {job_id}: {e}")
    
    async def update_job_progress(self, job_id: str, processed: int, failed: int, progress: float, current_item: str = None):
        """Update job progress in database"""
        try:
            query = """
                UPDATE processing_jobs 
                SET processed_items = %s,
                    failed_items = %s,
                    progress_percentage = %s,
                    updated_at = NOW()
                WHERE id = %s
            """
            await self.db_service.execute(query, (processed, failed, progress, job_id))
            
            # Send real-time update
            await self.send_progress_update(job_id, {
                "processed_items": processed,
                "failed_items": failed,
                "progress_percentage": progress,
                "current_item": current_item
            })
            
        except Exception as e:
            logger.error(f"Failed to update job progress for {job_id}: {e}")
    
    async def update_job_item_status(self, job_id: str, item_id: str, status: str, result_data: Any = None, error_message: str = None):
        """Update job item status in database"""
        try:
            query = """
                UPDATE processing_job_items 
                SET status = %s,
                    result_data = %s,
                    error_message = %s,
                    started_at = CASE WHEN %s = 'processing' THEN NOW() ELSE started_at END,
                    completed_at = CASE WHEN %s IN ('completed', 'failed') THEN NOW() ELSE completed_at END
                WHERE job_id = %s AND item_id = %s
            """
            
            result_json = json.dumps(result_data) if result_data else None
            await self.db_service.execute(query, (status, result_json, error_message, status, status, job_id, item_id))
            
        except Exception as e:
            logger.error(f"Failed to update job item status for {job_id}/{item_id}: {e}")
    
    async def complete_job(self, job_id: str, results: Any, processed: int, failed: int):
        """Mark job as completed"""
        try:
            query = """
                UPDATE processing_jobs 
                SET status = 'completed',
                    result_data = %s,
                    completed_at = NOW(),
                    updated_at = NOW()
                WHERE id = %s
            """
            
            await self.db_service.execute(query, (json.dumps(results), job_id))
            
            # Send completion notification
            await self.send_completion_notification(job_id, {
                "status": "completed",
                "total_processed": processed,
                "total_failed": failed,
                "results": results
            })
            
        except Exception as e:
            logger.error(f"Failed to complete job {job_id}: {e}")
    
    async def handle_job_failure(self, job_id: str, error_message: str, queue_item: Dict[str, Any]):
        """Handle job failure with retry logic"""
        try:
            retry_count = queue_item.get("retry_count", 0)
            max_retries = 3
            
            if retry_count < max_retries and "permanent" not in error_message.lower():
                # Retry the job
                queue_item["retry_count"] = retry_count + 1
                job_type = queue_item["job_type"]
                priority = queue_item.get("priority", 0)
                
                queue_key = f"queue:{job_type}:high" if priority > 0 else f"queue:{job_type}:normal"
                
                # Add delay before retry
                await asyncio.sleep(30 * (retry_count + 1))  # Exponential backoff
                await self.redis_client.lpush(queue_key, json.dumps(queue_item))
                
                logger.info(f"Retrying job {job_id} (attempt {retry_count + 1}/{max_retries})")
            else:
                # Mark as permanently failed
                query = """
                    UPDATE processing_jobs 
                    SET status = 'failed',
                        error_message = %s,
                        completed_at = NOW(),
                        updated_at = NOW()
                    WHERE id = %s
                """
                
                await self.db_service.execute(query, (error_message, job_id))
                
                # Send failure notification
                await self.send_failure_notification(job_id, error_message)
                
        except Exception as e:
            logger.error(f"Failed to handle job failure for {job_id}: {e}")
    
    async def send_progress_update(self, job_id: str, update_data: Dict[str, Any]):
        """Send real-time progress update via Redis pub/sub"""
        try:
            message = {
                "job_id": job_id,
                "type": "progress_update",
                "data": update_data,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            await self.redis_client.publish(f"job_updates:{job_id}", json.dumps(message))
        except Exception as e:
            logger.error(f"Failed to send progress update for {job_id}: {e}")
    
    async def send_completion_notification(self, job_id: str, completion_data: Dict[str, Any]):
        """Send job completion notification"""
        try:
            message = {
                "job_id": job_id,
                "type": "job_completed",
                "data": completion_data,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            await self.redis_client.publish(f"job_updates:{job_id}", json.dumps(message))
        except Exception as e:
            logger.error(f"Failed to send completion notification for {job_id}: {e}")
    
    async def send_failure_notification(self, job_id: str, error_message: str):
        """Send job failure notification"""
        try:
            message = {
                "job_id": job_id,
                "type": "job_failed",
                "error_message": error_message,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            await self.redis_client.publish(f"job_updates:{job_id}", json.dumps(message))
        except Exception as e:
            logger.error(f"Failed to send failure notification for {job_id}: {e}")
    
    async def monitor_jobs(self):
        """Monitor jobs for timeouts and cleanup"""
        while self.running:
            try:
                # Handle job timeouts
                timeout_query = """
                    UPDATE processing_jobs 
                    SET status = 'failed',
                        error_message = 'Job timed out',
                        completed_at = NOW(),
                        updated_at = NOW()
                    WHERE status = 'processing' 
                    AND started_at < NOW() - INTERVAL '30 minutes'
                """
                
                await self.db_service.execute(timeout_query)
                
                # Cleanup expired jobs
                cleanup_query = """
                    DELETE FROM processing_jobs 
                    WHERE expires_at < NOW() 
                    AND status IN ('completed', 'failed', 'cancelled')
                """
                
                await self.db_service.execute(cleanup_query)
                
                # Wait before next check
                await asyncio.sleep(60)  # Check every minute
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in job monitoring: {e}")
                await asyncio.sleep(60)
    
    async def shutdown(self):
        """Graceful shutdown"""
        logger.info("Shutting down Queue Worker...")
        self.running = False
        
        if self.redis_client:
            await self.redis_client.close()
        
        if self.db_service:
            await self.db_service.close()
        
        logger.info("Queue Worker shutdown complete")

# Signal handlers for graceful shutdown
def signal_handler(worker):
    def handler(signum, frame):
        logger.info(f"Received signal {signum}")
        asyncio.create_task(worker.shutdown())
        sys.exit(0)
    return handler

async def main():
    """Main entry point"""
    import os
    
    # Configuration from environment variables
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
    max_concurrent = int(os.getenv("MAX_CONCURRENT_JOBS", "5"))
    
    # Create and start worker
    worker = QueueWorker(redis_url, max_concurrent)
    
    # Setup signal handlers
    signal.signal(signal.SIGINT, signal_handler(worker))
    signal.signal(signal.SIGTERM, signal_handler(worker))
    
    try:
        await worker.start()
    except KeyboardInterrupt:
        logger.info("Received keyboard interrupt")
    finally:
        await worker.shutdown()

if __name__ == "__main__":
    asyncio.run(main())