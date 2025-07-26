using Microsoft.Extensions.Options;
using StackExchange.Redis;
using System.Text.Json;
using ResumeAI.API.Models;

namespace ResumeAI.API.Services
{
    public class QueueWorkerService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<QueueWorkerService> _logger;
        private readonly IConnectionMultiplexer _redis;
        private readonly QueueConfiguration _queueConfig;
        private readonly SemaphoreSlim _semaphore;

        public QueueWorkerService(
            IServiceProvider serviceProvider,
            ILogger<QueueWorkerService> logger,
            IConnectionMultiplexer redis,
            IOptions<QueueConfiguration> queueConfig)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
            _redis = redis;
            _queueConfig = queueConfig.Value;
            _semaphore = new SemaphoreSlim(_queueConfig.MaxConcurrentJobs, _queueConfig.MaxConcurrentJobs);
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Queue Worker Service started");

            // Start multiple worker tasks
            var tasks = new List<Task>
            {
                ProcessQueueAsync("bulk_analysis", stoppingToken),
                ProcessQueueAsync("report_generation", stoppingToken),
                MonitorJobsAsync(stoppingToken),
                CleanupExpiredJobsAsync(stoppingToken)
            };

            await Task.WhenAll(tasks);
        }

        private async Task ProcessQueueAsync(string jobType, CancellationToken stoppingToken)
        {
            var database = _redis.GetDatabase();
            var highPriorityQueue = $"queue:{jobType}:high";
            var normalPriorityQueue = $"queue:{jobType}:normal";

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await _semaphore.WaitAsync(stoppingToken);

                    try
                    {
                        // Check high priority queue first
                        var queueItem = await database.ListRightPopAsync(highPriorityQueue);
                        
                        // If no high priority items, check normal priority
                        if (!queueItem.HasValue)
                        {
                            queueItem = await database.ListRightPopAsync(normalPriorityQueue);
                        }

                        if (queueItem.HasValue)
                        {
                            var item = JsonSerializer.Deserialize<QueueItem>(queueItem!);
                            if (item != null)
                            {
                                // Process job in background to avoid blocking
                                _ = Task.Run(async () =>
                                {
                                    try
                                    {
                                        await ProcessJobAsync(item);
                                    }
                                    finally
                                    {
                                        _semaphore.Release();
                                    }
                                }, stoppingToken);
                            }
                            else
                            {
                                _semaphore.Release();
                            }
                        }
                        else
                        {
                            _semaphore.Release();
                            // No items in queue, wait a bit
                            await Task.Delay(1000, stoppingToken);
                        }
                    }
                    catch
                    {
                        _semaphore.Release();
                        throw;
                    }
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Error processing {jobType} queue");
                    await Task.Delay(5000, stoppingToken); // Wait before retrying
                }
            }
        }

        private async Task ProcessJobAsync(QueueItem queueItem)
        {
            using var scope = _serviceProvider.CreateScope();
            var queueService = scope.ServiceProvider.GetRequiredService<IQueueService>();
            var httpClient = scope.ServiceProvider.GetRequiredService<HttpClient>();
            var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();

            var pythonServiceUrl = configuration["PythonAI:ServiceUrl"] ?? "http://localhost:8001";

            try
            {
                _logger.LogInformation($"Processing job {queueItem.JobId} of type {queueItem.JobType}");

                // Update job status to processing
                await UpdateJobStatusAsync(queueItem.JobId, JobStatus.Processing);

                // Route to appropriate processor
                switch (queueItem.JobType)
                {
                    case "bulk_analysis":
                        await ProcessBulkAnalysisJobAsync(queueItem, httpClient, pythonServiceUrl, queueService);
                        break;
                    case "report_generation":
                        await ProcessReportGenerationJobAsync(queueItem, httpClient, pythonServiceUrl, queueService);
                        break;
                    default:
                        throw new InvalidOperationException($"Unknown job type: {queueItem.JobType}");
                }

                _logger.LogInformation($"Successfully processed job {queueItem.JobId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to process job {queueItem.JobId}");
                await HandleJobFailureAsync(queueItem.JobId, ex.Message, queueItem);
            }
        }

        private async Task ProcessBulkAnalysisJobAsync(
            QueueItem queueItem, 
            HttpClient httpClient, 
            string pythonServiceUrl,
            IQueueService queueService)
        {
            var request = JsonSerializer.Deserialize<BulkAnalysisJobRequest>(queueItem.Data);
            if (request == null) throw new InvalidOperationException("Invalid bulk analysis request data");

            var results = new List<object>();
            var processed = 0;
            var failed = 0;

            foreach (var resumeId in request.ResumeIds)
            {
                try
                {
                    // Update progress
                    var progress = new JobProgress
                    {
                        JobId = queueItem.JobId,
                        Status = JobStatus.Processing,
                        ProcessedItems = processed,
                        TotalItems = request.ResumeIds.Count,
                        FailedItems = failed,
                        ProgressPercentage = (decimal)processed / request.ResumeIds.Count * 100,
                        CurrentItem = resumeId
                    };

                    await queueService.UpdateJobProgressAsync(queueItem.JobId, progress);

                    // Call Python AI service for analysis
                    var analysisRequest = new
                    {
                        resume_id = resumeId,
                        job_description_id = request.JobDescriptionId,
                        user_id = request.UserId,
                        plan_type = request.PlanType
                    };

                    var jsonContent = new StringContent(
                        JsonSerializer.Serialize(analysisRequest),
                        System.Text.Encoding.UTF8,
                        "application/json"
                    );

                    using var response = await httpClient.PostAsync($"{pythonServiceUrl}/analyze-resume", jsonContent);
                    
                    if (response.IsSuccessStatusCode)
                    {
                        var result = await response.Content.ReadAsStringAsync();
                        var analysisResult = JsonSerializer.Deserialize<object>(result);
                        
                        results.Add(new
                        {
                            resume_id = resumeId,
                            success = true,
                            analysis = analysisResult
                        });

                        processed++;

                        // Update job item status
                        await UpdateJobItemStatusAsync(queueItem.JobId, resumeId, JobStatus.Completed, result);
                    }
                    else
                    {
                        var errorContent = await response.Content.ReadAsStringAsync();
                        throw new Exception($"Python service error: {response.StatusCode} - {errorContent}");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Failed to analyze resume {resumeId} in job {queueItem.JobId}");
                    
                    results.Add(new
                    {
                        resume_id = resumeId,
                        success = false,
                        error = ex.Message
                    });

                    failed++;
                    await UpdateJobItemStatusAsync(queueItem.JobId, resumeId, JobStatus.Failed, null, ex.Message);
                }

                // Rate limiting - small delay between requests
                await Task.Delay(100);
            }

            // Complete the job
            await CompleteJobAsync(queueItem.JobId, results, processed, failed);
        }

        private async Task ProcessReportGenerationJobAsync(
            QueueItem queueItem, 
            HttpClient httpClient, 
            string pythonServiceUrl,
            IQueueService queueService)
        {
            var request = JsonSerializer.Deserialize<ReportGenerationJobRequest>(queueItem.Data);
            if (request == null) throw new InvalidOperationException("Invalid report generation request data");

            try
            {
                // Update progress
                var progress = new JobProgress
                {
                    JobId = queueItem.JobId,
                    Status = JobStatus.Processing,
                    ProcessedItems = 0,
                    TotalItems = 1,
                    FailedItems = 0,
                    ProgressPercentage = 50,
                    CurrentItem = "Generating report..."
                };

                await queueService.UpdateJobProgressAsync(queueItem.JobId, progress);

                // Call Python AI service for report generation
                var reportRequest = new
                {
                    report_type = request.ReportType,
                    job_description_id = request.JobDescriptionId,
                    resume_analysis_ids = request.ResumeAnalysisIds,
                    user_id = request.UserId,
                    plan_type = request.PlanType
                };

                var jsonContent = new StringContent(
                    JsonSerializer.Serialize(reportRequest),
                    System.Text.Encoding.UTF8,
                    "application/json"
                );

                using var response = await httpClient.PostAsync($"{pythonServiceUrl}/generate-report", jsonContent);
                
                if (response.IsSuccessStatusCode)
                {
                    var result = await response.Content.ReadAsStringAsync();
                    var reportResult = JsonSerializer.Deserialize<object>(result);
                    
                    await CompleteJobAsync(queueItem.JobId, reportResult, 1, 0);
                    await UpdateJobItemStatusAsync(queueItem.JobId, request.ReportType, JobStatus.Completed, result);
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    throw new Exception($"Python service error: {response.StatusCode} - {errorContent}");
                }
            }
            catch (Exception ex)
            {
                await UpdateJobItemStatusAsync(queueItem.JobId, request.ReportType, JobStatus.Failed, null, ex.Message);
                throw;
            }
        }

        private async Task UpdateJobStatusAsync(string jobId, JobStatus status)
        {
            using var scope = _serviceProvider.CreateScope();
            var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();
            var connectionString = configuration.GetConnectionString("DefaultConnection");

            using var connection = new Npgsql.NpgsqlConnection(connectionString);
            await connection.OpenAsync();

            var query = @"
                UPDATE processing_jobs 
                SET status = @status, 
                    started_at = CASE WHEN @status = 'processing' THEN NOW() ELSE started_at END,
                    completed_at = CASE WHEN @status IN ('completed', 'failed', 'cancelled') THEN NOW() ELSE completed_at END,
                    updated_at = NOW()
                WHERE id = @jobId";

            using var command = new Npgsql.NpgsqlCommand(query, connection);
            command.Parameters.AddWithValue("status", status.ToString().ToLower());
            command.Parameters.AddWithValue("jobId", Guid.Parse(jobId));

            await command.ExecuteNonQueryAsync();
        }

        private async Task UpdateJobItemStatusAsync(string jobId, string itemId, JobStatus status, string? resultData, string? errorMessage = null)
        {
            using var scope = _serviceProvider.CreateScope();
            var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();
            var connectionString = configuration.GetConnectionString("DefaultConnection");

            using var connection = new Npgsql.NpgsqlConnection(connectionString);
            await connection.OpenAsync();

            var query = @"
                UPDATE processing_job_items 
                SET status = @status,
                    result_data = @resultData,
                    error_message = @errorMessage,
                    started_at = CASE WHEN @status = 'processing' THEN NOW() ELSE started_at END,
                    completed_at = CASE WHEN @status IN ('completed', 'failed') THEN NOW() ELSE completed_at END
                WHERE job_id = @jobId AND item_id = @itemId";

            using var command = new Npgsql.NpgsqlCommand(query, connection);
            command.Parameters.AddWithValue("status", status.ToString().ToLower());
            command.Parameters.AddWithValue("resultData", resultData ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("errorMessage", errorMessage ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("jobId", Guid.Parse(jobId));
            command.Parameters.AddWithValue("itemId", itemId);

            await command.ExecuteNonQueryAsync();
        }

        private async Task CompleteJobAsync(string jobId, object results, int processed, int failed)
        {
            using var scope = _serviceProvider.CreateScope();
            var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();
            var connectionString = configuration.GetConnectionString("DefaultConnection");

            using var connection = new Npgsql.NpgsqlConnection(connectionString);
            await connection.OpenAsync();

            var query = @"
                UPDATE processing_jobs 
                SET status = 'completed',
                    result_data = @resultData,
                    completed_at = NOW(),
                    updated_at = NOW()
                WHERE id = @jobId";

            using var command = new Npgsql.NpgsqlCommand(query, connection);
            command.Parameters.AddWithValue("resultData", JsonSerializer.Serialize(results));
            command.Parameters.AddWithValue("jobId", Guid.Parse(jobId));

            await command.ExecuteNonQueryAsync();

            // Send completion notification
            var subscriber = _redis.GetSubscriber();
            await subscriber.PublishAsync($"job_updates:{jobId}", JsonSerializer.Serialize(new
            {
                job_id = jobId,
                type = "job_completed",
                processed_items = processed,
                failed_items = failed,
                results = results,
                timestamp = DateTime.UtcNow
            }));
        }

        private async Task HandleJobFailureAsync(string jobId, string errorMessage, QueueItem queueItem)
        {
            using var scope = _serviceProvider.CreateScope();
            var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();
            var connectionString = configuration.GetConnectionString("DefaultConnection");

            using var connection = new Npgsql.NpgsqlConnection(connectionString);
            await connection.OpenAsync();

            // Check if we should retry
            var shouldRetry = queueItem.RetryCount < _queueConfig.RetryAttempts && 
                             !errorMessage.Contains("permanent", StringComparison.OrdinalIgnoreCase);

            if (shouldRetry)
            {
                // Increment retry count and re-queue
                queueItem.RetryCount++;
                
                var database = _redis.GetDatabase();
                var queueKey = queueItem.Priority > 0 ? $"queue:{queueItem.JobType}:high" : $"queue:{queueItem.JobType}:normal";
                
                // Add delay before retry
                await Task.Delay(TimeSpan.FromSeconds(_queueConfig.RetryDelaySeconds * queueItem.RetryCount));
                await database.ListLeftPushAsync(queueKey, JsonSerializer.Serialize(queueItem));

                _logger.LogInformation($"Retrying job {jobId} (attempt {queueItem.RetryCount}/{_queueConfig.RetryAttempts})");
            }
            else
            {
                // Mark as permanently failed
                var query = @"
                    UPDATE processing_jobs 
                    SET status = 'failed',
                        error_message = @errorMessage,
                        completed_at = NOW(),
                        updated_at = NOW()
                    WHERE id = @jobId";

                using var command = new Npgsql.NpgsqlCommand(query, connection);
                command.Parameters.AddWithValue("errorMessage", errorMessage);
                command.Parameters.AddWithValue("jobId", Guid.Parse(jobId));

                await command.ExecuteNonQueryAsync();

                // Send failure notification
                var subscriber = _redis.GetSubscriber();
                await subscriber.PublishAsync($"job_updates:{jobId}", JsonSerializer.Serialize(new
                {
                    job_id = jobId,
                    type = "job_failed",
                    error_message = errorMessage,
                    timestamp = DateTime.UtcNow
                }));
            }
        }

        private async Task MonitorJobsAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var queueService = scope.ServiceProvider.GetRequiredService<IQueueService>();

                    // Handle job timeouts
                    await HandleJobTimeoutsAsync();

                    await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in job monitoring");
                    await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
                }
            }
        }

        private async Task CleanupExpiredJobsAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var queueService = scope.ServiceProvider.GetRequiredService<IQueueService>();

                    var deletedCount = await queueService.CleanupExpiredJobsAsync();
                    if (deletedCount > 0)
                    {
                        _logger.LogInformation($"Cleaned up {deletedCount} expired jobs");
                    }

                    await Task.Delay(TimeSpan.FromMinutes(_queueConfig.CleanupIntervalMinutes), stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in cleanup task");
                    await Task.Delay(TimeSpan.FromMinutes(_queueConfig.CleanupIntervalMinutes), stoppingToken);
                }
            }
        }

        private async Task HandleJobTimeoutsAsync()
        {
            using var scope = _serviceProvider.CreateScope();
            var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();
            var connectionString = configuration.GetConnectionString("DefaultConnection");

            using var connection = new Npgsql.NpgsqlConnection(connectionString);
            await connection.OpenAsync();

            var query = @"
                UPDATE processing_jobs 
                SET status = 'failed',
                    error_message = 'Job timed out',
                    completed_at = NOW(),
                    updated_at = NOW()
                WHERE status = 'processing' 
                AND started_at < NOW() - INTERVAL '@timeoutMinutes minutes'";

            using var command = new Npgsql.NpgsqlCommand(query.Replace("@timeoutMinutes", _queueConfig.JobTimeoutMinutes.ToString()), connection);
            var timedOutJobs = await command.ExecuteNonQueryAsync();

            if (timedOutJobs > 0)
            {
                _logger.LogWarning($"Timed out {timedOutJobs} jobs that exceeded {_queueConfig.JobTimeoutMinutes} minutes");
            }
        }

        public override async Task StopAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Queue Worker Service is stopping");
            await base.StopAsync(stoppingToken);
        }
    }
}