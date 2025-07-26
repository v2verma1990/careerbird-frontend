using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace ResumeAI.API.Models
{
    // Job status enumeration
    public enum JobStatus
    {
        Queued,
        Processing,
        Completed,
        Failed,
        Cancelled
    }

    public enum JobType
    {
        BulkAnalysis,
        ReportGeneration,
        SkillGapBatch,
        CandidateComparison
    }

    // Processing job model
    public class ProcessingJob
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string JobType { get; set; } = string.Empty;
        public JobStatus Status { get; set; } = JobStatus.Queued;
        public int Priority { get; set; } = 0;
        public int TotalItems { get; set; }
        public int ProcessedItems { get; set; } = 0;
        public int FailedItems { get; set; } = 0;
        public decimal ProgressPercentage { get; set; } = 0;
        public JsonDocument JobData { get; set; } = JsonDocument.Parse("{}");
        public JsonDocument? ResultData { get; set; }
        public string? ErrorMessage { get; set; }
        public DateTime? EstimatedCompletionTime { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddHours(24);
    }

    // Processing job item model
    public class ProcessingJobItem
    {
        public Guid Id { get; set; }
        public Guid JobId { get; set; }
        public string ItemId { get; set; } = string.Empty;
        public string ItemType { get; set; } = string.Empty;
        public JobStatus Status { get; set; } = JobStatus.Queued;
        public JsonDocument? ResultData { get; set; }
        public string? ErrorMessage { get; set; }
        public int RetryCount { get; set; } = 0;
        public int? ProcessingTimeMs { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
    }

    // Queue configuration
    public class QueueConfiguration
    {
        public int MaxConcurrentJobs { get; set; } = 10;
        public int RetryAttempts { get; set; } = 3;
        public int RetryDelaySeconds { get; set; } = 30;
        public int JobTimeoutMinutes { get; set; } = 30;
        public int CleanupIntervalMinutes { get; set; } = 60;
    }

    // Redis configuration
    public class RedisConfiguration
    {
        public string ConnectionString { get; set; } = "localhost:6379";
        public int Database { get; set; } = 0;
        public string InstanceName { get; set; } = "CareerBirdQueue";
    }

    // Job request models
    public class BulkAnalysisJobRequest
    {
        [Required]
        public List<string> ResumeIds { get; set; } = new();
        
        [Required]
        public string JobDescriptionId { get; set; } = string.Empty;
        
        [Required]
        public string UserId { get; set; } = string.Empty;
        
        public string PlanType { get; set; } = "free";
        public int Priority { get; set; } = 0;
    }

    public class ReportGenerationJobRequest
    {
        [Required]
        public string ReportType { get; set; } = string.Empty;
        
        [Required]
        public string JobDescriptionId { get; set; } = string.Empty;
        
        [Required]
        public List<string> ResumeAnalysisIds { get; set; } = new();
        
        [Required]
        public string UserId { get; set; } = string.Empty;
        
        public string PlanType { get; set; } = "free";
        public int Priority { get; set; } = 0;
    }

    // Job progress model for real-time updates
    public class JobProgress
    {
        public string JobId { get; set; } = string.Empty;
        public JobStatus Status { get; set; }
        public decimal ProgressPercentage { get; set; }
        public int ProcessedItems { get; set; }
        public int TotalItems { get; set; }
        public int FailedItems { get; set; }
        public DateTime? EstimatedCompletionTime { get; set; }
        public string? CurrentItem { get; set; }
        public object? PartialResults { get; set; }
        public string? ErrorMessage { get; set; }
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    }

    // Queue item for Redis
    public class QueueItem
    {
        public string JobId { get; set; } = string.Empty;
        public string JobType { get; set; } = string.Empty;
        public int Priority { get; set; } = 0;
        public string Data { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public int RetryCount { get; set; } = 0;
    }

    // Job statistics
    public class QueueStatistics
    {
        public string JobType { get; set; } = string.Empty;
        public int QueueDepth { get; set; }
        public int ProcessingCount { get; set; }
        public int CompletedToday { get; set; }
        public int FailedToday { get; set; }
        public double AverageProcessingTimeMs { get; set; }
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    }
}