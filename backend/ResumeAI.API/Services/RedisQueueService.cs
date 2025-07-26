using Microsoft.Extensions.Options;
using Npgsql;
using StackExchange.Redis;
using System.Text.Json;
using ResumeAI.API.Models;

namespace ResumeAI.API.Services
{
    public class RedisQueueService : IQueueService
    {
        private readonly IConnectionMultiplexer _redis;
        private readonly IDatabase _database;
        private readonly ISubscriber _subscriber;
        private readonly ILogger<RedisQueueService> _logger;
        private readonly QueueConfiguration _queueConfig;
        private readonly string _connectionString;

        public RedisQueueService(
            IConnectionMultiplexer redis,
            ILogger<RedisQueueService> logger,
            IOptions<QueueConfiguration> queueConfig,
            IConfiguration configuration)
        {
            _redis = redis;
            _database = redis.GetDatabase();
            _subscriber = redis.GetSubscriber();
            _logger = logger;
            _queueConfig = queueConfig.Value;
            _connectionString = configuration.GetConnectionString("DefaultConnection") 
                ?? throw new InvalidOperationException("Database connection string not found");
        }

        public async Task<string> EnqueueBulkAnalysisAsync(BulkAnalysisJobRequest request)
        {
            var jobId = Guid.NewGuid().ToString();
            
            try
            {
                // Store job in database
                var job = new ProcessingJob
                {
                    Id = Guid.Parse(jobId),
                    UserId = Guid.Parse(request.UserId),
                    JobType = "bulk_analysis",
                    Priority = request.Priority,
                    TotalItems = request.ResumeIds.Count,
                    JobData = JsonDocument.Parse(JsonSerializer.Serialize(request)),
                    EstimatedCompletionTime = DateTime.UtcNow.AddMinutes(request.ResumeIds.Count * 2) // 2 min per resume estimate
                };

                await StoreJobInDatabaseAsync(job);

                // Create job items
                var jobItems = request.ResumeIds.Select(resumeId => new ProcessingJobItem
                {
                    JobId = job.Id,
                    ItemId = resumeId,
                    ItemType = "resume_analysis"
                }).ToList();

                await StoreJobItemsInDatabaseAsync(jobItems);

                // Add to Redis queue
                var queueItem = new QueueItem
                {
                    JobId = jobId,
                    JobType = "bulk_analysis",
                    Priority = request.Priority,
                    Data = JsonSerializer.Serialize(request),
                    CreatedAt = DateTime.UtcNow
                };

                var queueKey = GetQueueKey("bulk_analysis", request.Priority);
                await _database.ListLeftPushAsync(queueKey, JsonSerializer.Serialize(queueItem));

                // Notify workers
                await _subscriber.PublishAsync("queue:notifications", jobId);

                _logger.LogInformation($"Enqueued bulk analysis job {jobId} with {request.ResumeIds.Count} resumes");
                return jobId;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to enqueue bulk analysis job {jobId}");
                throw;
            }
        }

        public async Task<string> EnqueueReportGenerationAsync(ReportGenerationJobRequest request)
        {
            var jobId = Guid.NewGuid().ToString();
            
            try
            {
                var job = new ProcessingJob
                {
                    Id = Guid.Parse(jobId),
                    UserId = Guid.Parse(request.UserId),
                    JobType = "report_generation",
                    Priority = request.Priority,
                    TotalItems = 1, // Single report
                    JobData = JsonDocument.Parse(JsonSerializer.Serialize(request)),
                    EstimatedCompletionTime = DateTime.UtcNow.AddMinutes(5) // 5 min estimate for report
                };

                await StoreJobInDatabaseAsync(job);

                var jobItem = new ProcessingJobItem
                {
                    JobId = job.Id,
                    ItemId = request.ReportType,
                    ItemType = "report_generation"
                };

                await StoreJobItemsInDatabaseAsync(new[] { jobItem });

                var queueItem = new QueueItem
                {
                    JobId = jobId,
                    JobType = "report_generation",
                    Priority = request.Priority,
                    Data = JsonSerializer.Serialize(request),
                    CreatedAt = DateTime.UtcNow
                };

                var queueKey = GetQueueKey("report_generation", request.Priority);
                await _database.ListLeftPushAsync(queueKey, JsonSerializer.Serialize(queueItem));

                await _subscriber.PublishAsync("queue:notifications", jobId);

                _logger.LogInformation($"Enqueued report generation job {jobId}");
                return jobId;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to enqueue report generation job {jobId}");
                throw;
            }
        }

        public async Task<ProcessingJob?> GetJobAsync(string jobId)
        {
            try
            {
                using var connection = new NpgsqlConnection(_connectionString);
                await connection.OpenAsync();

                var query = @"
                    SELECT id, user_id, job_type, status, priority, total_items, 
                           processed_items, failed_items, progress_percentage, 
                           job_data, result_data, error_message, estimated_completion_time,
                           created_at, started_at, completed_at, updated_at, expires_at
                    FROM processing_jobs 
                    WHERE id = @jobId";

                using var command = new NpgsqlCommand(query, connection);
                command.Parameters.AddWithValue("jobId", Guid.Parse(jobId));

                using var reader = await command.ExecuteReaderAsync();
                if (await reader.ReadAsync())
                {
                    return MapJobFromReader(reader);
                }

                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to get job {jobId}");
                throw;
            }
        }

        public async Task<List<ProcessingJob>> GetUserJobsAsync(string userId, int limit = 50)
        {
            try
            {
                using var connection = new NpgsqlConnection(_connectionString);
                await connection.OpenAsync();

                var query = @"
                    SELECT id, user_id, job_type, status, priority, total_items, 
                           processed_items, failed_items, progress_percentage, 
                           job_data, result_data, error_message, estimated_completion_time,
                           created_at, started_at, completed_at, updated_at, expires_at
                    FROM processing_jobs 
                    WHERE user_id = @userId 
                    ORDER BY created_at DESC 
                    LIMIT @limit";

                using var command = new NpgsqlCommand(query, connection);
                command.Parameters.AddWithValue("userId", Guid.Parse(userId));
                command.Parameters.AddWithValue("limit", limit);

                var jobs = new List<ProcessingJob>();
                using var reader = await command.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    jobs.Add(MapJobFromReader(reader));
                }

                return jobs;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to get jobs for user {userId}");
                throw;
            }
        }

        public async Task<bool> CancelJobAsync(string jobId, string userId)
        {
            try
            {
                using var connection = new NpgsqlConnection(_connectionString);
                await connection.OpenAsync();

                var query = @"
                    UPDATE processing_jobs 
                    SET status = 'cancelled', updated_at = NOW() 
                    WHERE id = @jobId AND user_id = @userId AND status IN ('queued', 'processing')";

                using var command = new NpgsqlCommand(query, connection);
                command.Parameters.AddWithValue("jobId", Guid.Parse(jobId));
                command.Parameters.AddWithValue("userId", Guid.Parse(userId));

                var rowsAffected = await command.ExecuteNonQueryAsync();
                
                if (rowsAffected > 0)
                {
                    // Remove from Redis queue if still queued
                    await RemoveFromQueueAsync(jobId);
                    
                    // Notify about cancellation
                    await _subscriber.PublishAsync($"job_updates:{jobId}", JsonSerializer.Serialize(new
                    {
                        job_id = jobId,
                        type = "job_cancelled",
                        timestamp = DateTime.UtcNow
                    }));
                }

                return rowsAffected > 0;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to cancel job {jobId}");
                throw;
            }
        }

        public async Task<JobProgress?> GetJobProgressAsync(string jobId)
        {
            try
            {
                var job = await GetJobAsync(jobId);
                if (job == null) return null;

                return new JobProgress
                {
                    JobId = jobId,
                    Status = job.Status,
                    ProgressPercentage = job.ProgressPercentage,
                    ProcessedItems = job.ProcessedItems,
                    TotalItems = job.TotalItems,
                    FailedItems = job.FailedItems,
                    EstimatedCompletionTime = job.EstimatedCompletionTime,
                    ErrorMessage = job.ErrorMessage,
                    LastUpdated = job.UpdatedAt
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to get job progress {jobId}");
                throw;
            }
        }

        public async Task UpdateJobProgressAsync(string jobId, JobProgress progress)
        {
            try
            {
                // Publish real-time update
                await _subscriber.PublishAsync($"job_updates:{jobId}", JsonSerializer.Serialize(new
                {
                    job_id = jobId,
                    type = "progress_update",
                    data = progress,
                    timestamp = DateTime.UtcNow
                }));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to update job progress {jobId}");
                throw;
            }
        }

        public async Task<QueueStatistics> GetQueueStatisticsAsync(string jobType)
        {
            try
            {
                var queueDepth = await _database.ListLengthAsync(GetQueueKey(jobType, 0));
                var highPriorityDepth = await _database.ListLengthAsync(GetQueueKey(jobType, 1));
                
                using var connection = new NpgsqlConnection(_connectionString);
                await connection.OpenAsync();

                var query = @"
                    SELECT 
                        COUNT(*) FILTER (WHERE status = 'processing') as processing_count,
                        COUNT(*) FILTER (WHERE status = 'completed' AND DATE(completed_at) = CURRENT_DATE) as completed_today,
                        COUNT(*) FILTER (WHERE status = 'failed' AND DATE(updated_at) = CURRENT_DATE) as failed_today,
                        AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) * 1000) FILTER (WHERE status = 'completed') as avg_processing_time
                    FROM processing_jobs 
                    WHERE job_type = @jobType";

                using var command = new NpgsqlCommand(query, connection);
                command.Parameters.AddWithValue("jobType", jobType);

                using var reader = await command.ExecuteReaderAsync();
                await reader.ReadAsync();

                return new QueueStatistics
                {
                    JobType = jobType,
                    QueueDepth = (int)(queueDepth + highPriorityDepth),
                    ProcessingCount = reader.GetInt32("processing_count"),
                    CompletedToday = reader.GetInt32("completed_today"),
                    FailedToday = reader.GetInt32("failed_today"),
                    AverageProcessingTimeMs = reader.IsDBNull("avg_processing_time") ? 0 : reader.GetDouble("avg_processing_time")
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to get queue statistics for {jobType}");
                throw;
            }
        }

        public async Task<List<QueueStatistics>> GetAllQueueStatisticsAsync()
        {
            var jobTypes = new[] { "bulk_analysis", "report_generation", "skill_gap_batch" };
            var statistics = new List<QueueStatistics>();

            foreach (var jobType in jobTypes)
            {
                statistics.Add(await GetQueueStatisticsAsync(jobType));
            }

            return statistics;
        }

        public async Task<int> CleanupExpiredJobsAsync()
        {
            try
            {
                using var connection = new NpgsqlConnection(_connectionString);
                await connection.OpenAsync();

                var query = "SELECT cleanup_expired_jobs()";
                using var command = new NpgsqlCommand(query, connection);
                
                var result = await command.ExecuteScalarAsync();
                var deletedCount = Convert.ToInt32(result);

                _logger.LogInformation($"Cleaned up {deletedCount} expired jobs");
                return deletedCount;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to cleanup expired jobs");
                throw;
            }
        }

        public async Task<int> RetryFailedJobsAsync()
        {
            try
            {
                using var connection = new NpgsqlConnection(_connectionString);
                await connection.OpenAsync();

                // Get failed jobs that can be retried
                var query = @"
                    SELECT id, job_type, job_data, priority
                    FROM processing_jobs 
                    WHERE status = 'failed' 
                    AND created_at > NOW() - INTERVAL '1 hour'
                    AND (error_message NOT LIKE '%permanent%' OR error_message IS NULL)
                    LIMIT 10";

                using var command = new NpgsqlCommand(query, connection);
                using var reader = await command.ExecuteReaderAsync();

                var jobsToRetry = new List<(string id, string jobType, string jobData, int priority)>();
                while (await reader.ReadAsync())
                {
                    jobsToRetry.Add((
                        reader.GetGuid("id").ToString(),
                        reader.GetString("job_type"),
                        reader.GetString("job_data"),
                        reader.GetInt32("priority")
                    ));
                }

                reader.Close();

                // Retry each job
                foreach (var (id, jobType, jobData, priority) in jobsToRetry)
                {
                    // Reset job status
                    var updateQuery = @"
                        UPDATE processing_jobs 
                        SET status = 'queued', error_message = NULL, updated_at = NOW()
                        WHERE id = @id";

                    using var updateCommand = new NpgsqlCommand(updateQuery, connection);
                    updateCommand.Parameters.AddWithValue("id", Guid.Parse(id));
                    await updateCommand.ExecuteNonQueryAsync();

                    // Re-queue
                    var queueItem = new QueueItem
                    {
                        JobId = id,
                        JobType = jobType,
                        Priority = priority,
                        Data = jobData,
                        CreatedAt = DateTime.UtcNow,
                        RetryCount = 1
                    };

                    var queueKey = GetQueueKey(jobType, priority);
                    await _database.ListLeftPushAsync(queueKey, JsonSerializer.Serialize(queueItem));
                }

                _logger.LogInformation($"Retried {jobsToRetry.Count} failed jobs");
                return jobsToRetry.Count;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retry failed jobs");
                throw;
            }
        }

        // Private helper methods
        private string GetQueueKey(string jobType, int priority)
        {
            return priority > 0 ? $"queue:{jobType}:high" : $"queue:{jobType}:normal";
        }

        private async Task StoreJobInDatabaseAsync(ProcessingJob job)
        {
            using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();

            var query = @"
                INSERT INTO processing_jobs (
                    id, user_id, job_type, status, priority, total_items, 
                    job_data, estimated_completion_time, created_at, updated_at, expires_at
                ) VALUES (
                    @id, @userId, @jobType, @status, @priority, @totalItems, 
                    @jobData, @estimatedCompletionTime, @createdAt, @updatedAt, @expiresAt
                )";

            using var command = new NpgsqlCommand(query, connection);
            command.Parameters.AddWithValue("id", job.Id);
            command.Parameters.AddWithValue("userId", job.UserId);
            command.Parameters.AddWithValue("jobType", job.JobType);
            command.Parameters.AddWithValue("status", job.Status.ToString().ToLower());
            command.Parameters.AddWithValue("priority", job.Priority);
            command.Parameters.AddWithValue("totalItems", job.TotalItems);
            command.Parameters.AddWithValue("jobData", job.JobData.RootElement.GetRawText());
            command.Parameters.AddWithValue("estimatedCompletionTime", job.EstimatedCompletionTime ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("createdAt", job.CreatedAt);
            command.Parameters.AddWithValue("updatedAt", job.UpdatedAt);
            command.Parameters.AddWithValue("expiresAt", job.ExpiresAt);

            await command.ExecuteNonQueryAsync();
        }

        private async Task StoreJobItemsInDatabaseAsync(IEnumerable<ProcessingJobItem> jobItems)
        {
            using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();

            foreach (var item in jobItems)
            {
                var query = @"
                    INSERT INTO processing_job_items (
                        id, job_id, item_id, item_type, status, created_at
                    ) VALUES (
                        @id, @jobId, @itemId, @itemType, @status, @createdAt
                    )";

                using var command = new NpgsqlCommand(query, connection);
                command.Parameters.AddWithValue("id", item.Id);
                command.Parameters.AddWithValue("jobId", item.JobId);
                command.Parameters.AddWithValue("itemId", item.ItemId);
                command.Parameters.AddWithValue("itemType", item.ItemType);
                command.Parameters.AddWithValue("status", item.Status.ToString().ToLower());
                command.Parameters.AddWithValue("createdAt", item.CreatedAt);

                await command.ExecuteNonQueryAsync();
            }
        }

        private async Task RemoveFromQueueAsync(string jobId)
        {
            var jobTypes = new[] { "bulk_analysis", "report_generation", "skill_gap_batch" };
            var priorities = new[] { 0, 1 };

            foreach (var jobType in jobTypes)
            {
                foreach (var priority in priorities)
                {
                    var queueKey = GetQueueKey(jobType, priority);
                    var items = await _database.ListRangeAsync(queueKey);
                    
                    foreach (var item in items)
                    {
                        var queueItem = JsonSerializer.Deserialize<QueueItem>(item!);
                        if (queueItem?.JobId == jobId)
                        {
                            await _database.ListRemoveAsync(queueKey, item);
                            return;
                        }
                    }
                }
            }
        }

        private ProcessingJob MapJobFromReader(NpgsqlDataReader reader)
        {
            return new ProcessingJob
            {
                Id = reader.GetGuid("id"),
                UserId = reader.GetGuid("user_id"),
                JobType = reader.GetString("job_type"),
                Status = Enum.Parse<JobStatus>(reader.GetString("status"), true),
                Priority = reader.GetInt32("priority"),
                TotalItems = reader.GetInt32("total_items"),
                ProcessedItems = reader.GetInt32("processed_items"),
                FailedItems = reader.GetInt32("failed_items"),
                ProgressPercentage = reader.GetDecimal("progress_percentage"),
                JobData = JsonDocument.Parse(reader.GetString("job_data")),
                ResultData = reader.IsDBNull("result_data") ? null : JsonDocument.Parse(reader.GetString("result_data")),
                ErrorMessage = reader.IsDBNull("error_message") ? null : reader.GetString("error_message"),
                EstimatedCompletionTime = reader.IsDBNull("estimated_completion_time") ? null : reader.GetDateTime("estimated_completion_time"),
                CreatedAt = reader.GetDateTime("created_at"),
                StartedAt = reader.IsDBNull("started_at") ? null : reader.GetDateTime("started_at"),
                CompletedAt = reader.IsDBNull("completed_at") ? null : reader.GetDateTime("completed_at"),
                UpdatedAt = reader.GetDateTime("updated_at"),
                ExpiresAt = reader.GetDateTime("expires_at")
            };
        }
    }
}