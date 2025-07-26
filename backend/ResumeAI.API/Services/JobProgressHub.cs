using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;

namespace ResumeAI.API.Services
{
    [Authorize]
    public class JobProgressHub : Hub
    {
        private readonly ILogger<JobProgressHub> _logger;

        public JobProgressHub(ILogger<JobProgressHub> logger)
        {
            _logger = logger;
        }

        public async Task JoinJobGroup(string jobId)
        {
            try
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, $"job_{jobId}");
                _logger.LogInformation($"User {Context.UserIdentifier} joined job group {jobId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to join job group {jobId}");
                throw;
            }
        }

        public async Task LeaveJobGroup(string jobId)
        {
            try
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"job_{jobId}");
                _logger.LogInformation($"User {Context.UserIdentifier} left job group {jobId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to leave job group {jobId}");
                throw;
            }
        }

        public async Task JoinUserGroup(string userId)
        {
            try
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
                _logger.LogInformation($"User {Context.UserIdentifier} joined user group {userId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to join user group {userId}");
                throw;
            }
        }

        public override async Task OnConnectedAsync()
        {
            _logger.LogInformation($"User {Context.UserIdentifier} connected to JobProgressHub");
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            _logger.LogInformation($"User {Context.UserIdentifier} disconnected from JobProgressHub");
            await base.OnDisconnectedAsync(exception);
        }
    }

    // Service for sending progress updates
    public interface IJobProgressService
    {
        Task SendProgressUpdateAsync(string jobId, object progressData);
        Task SendJobCompletedAsync(string jobId, object resultData);
        Task SendJobFailedAsync(string jobId, string errorMessage);
        Task SendUserNotificationAsync(string userId, object notification);
    }

    public class JobProgressService : IJobProgressService
    {
        private readonly IHubContext<JobProgressHub> _hubContext;
        private readonly ILogger<JobProgressService> _logger;

        public JobProgressService(IHubContext<JobProgressHub> hubContext, ILogger<JobProgressService> logger)
        {
            _hubContext = hubContext;
            _logger = logger;
        }

        public async Task SendProgressUpdateAsync(string jobId, object progressData)
        {
            try
            {
                await _hubContext.Clients.Group($"job_{jobId}")
                    .SendAsync("ProgressUpdate", progressData);
                
                _logger.LogDebug($"Sent progress update for job {jobId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to send progress update for job {jobId}");
            }
        }

        public async Task SendJobCompletedAsync(string jobId, object resultData)
        {
            try
            {
                await _hubContext.Clients.Group($"job_{jobId}")
                    .SendAsync("JobCompleted", new { jobId, resultData, timestamp = DateTime.UtcNow });
                
                _logger.LogInformation($"Sent job completed notification for job {jobId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to send job completed notification for job {jobId}");
            }
        }

        public async Task SendJobFailedAsync(string jobId, string errorMessage)
        {
            try
            {
                await _hubContext.Clients.Group($"job_{jobId}")
                    .SendAsync("JobFailed", new { jobId, errorMessage, timestamp = DateTime.UtcNow });
                
                _logger.LogInformation($"Sent job failed notification for job {jobId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to send job failed notification for job {jobId}");
            }
        }

        public async Task SendUserNotificationAsync(string userId, object notification)
        {
            try
            {
                await _hubContext.Clients.Group($"user_{userId}")
                    .SendAsync("UserNotification", notification);
                
                _logger.LogDebug($"Sent user notification to user {userId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to send user notification to user {userId}");
            }
        }
    }
}