using ResumeAI.API.Models;

namespace ResumeAI.API.Services
{
    public interface IQueueService
    {
        // Job submission
        Task<string> EnqueueBulkAnalysisAsync(BulkAnalysisJobRequest request);
        Task<string> EnqueueReportGenerationAsync(ReportGenerationJobRequest request);
        
        // Job management
        Task<ProcessingJob?> GetJobAsync(string jobId);
        Task<List<ProcessingJob>> GetUserJobsAsync(string userId, int limit = 50);
        Task<bool> CancelJobAsync(string jobId, string userId);
        
        // Job progress
        Task<JobProgress?> GetJobProgressAsync(string jobId);
        Task UpdateJobProgressAsync(string jobId, JobProgress progress);
        
        // Queue monitoring
        Task<QueueStatistics> GetQueueStatisticsAsync(string jobType);
        Task<List<QueueStatistics>> GetAllQueueStatisticsAsync();
        
        // Cleanup
        Task<int> CleanupExpiredJobsAsync();
        Task<int> RetryFailedJobsAsync();
    }
}