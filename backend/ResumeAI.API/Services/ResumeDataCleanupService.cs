using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace ResumeAI.API.Services
{
    public class ResumeDataCleanupService(
        ILogger<ResumeDataCleanupService> logger,
        IServiceProvider serviceProvider) : BackgroundService
    {
        private readonly ILogger<ResumeDataCleanupService> _logger = logger;
        private readonly IServiceProvider _serviceProvider = serviceProvider;

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Resume Data Cleanup Service started");

            // Run cleanup daily at 2 AM
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var now = DateTime.Now;
                    var nextRun = DateTime.Today.AddDays(1).AddHours(2); // Tomorrow at 2 AM
                    
                    if (now.Hour >= 2)
                    {
                        nextRun = DateTime.Today.AddDays(1).AddHours(2); // Tomorrow at 2 AM
                    }
                    else
                    {
                        nextRun = DateTime.Today.AddHours(2); // Today at 2 AM
                    }

                    var delay = nextRun - now;
                    _logger.LogInformation($"Next cleanup scheduled for: {nextRun}");

                    await Task.Delay(delay, stoppingToken);

                    if (!stoppingToken.IsCancellationRequested)
                    {
                        await PerformCleanupAsync();
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in Resume Data Cleanup Service");
                    // Wait 1 hour before retrying
                    await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
                }
            }
        }

        private async Task PerformCleanupAsync()
        {
            _logger.LogInformation("Starting daily resume data cleanup");

            try
            {
                using var scope = _serviceProvider.CreateScope();
                var profileMetadataService = scope.ServiceProvider.GetRequiredService<ProfileMetadataService>();

                // Send 30-day warnings
                await SendDeletionWarningsAsync(profileMetadataService, 30);

                // Send 7-day final warnings
                await SendDeletionWarningsAsync(profileMetadataService, 7);

                // Delete expired resume data
                var deletedCount = await profileMetadataService.DeleteExpiredResumeDataAsync();

                _logger.LogInformation($"Daily cleanup completed. Deleted {deletedCount} expired resume records");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during daily cleanup");
            }
        }

        private async Task SendDeletionWarningsAsync(ProfileMetadataService profileMetadataService, int daysBeforeDeletion)
        {
            try
            {
                var resumesApproachingDeletion = await profileMetadataService.GetResumesApproachingDeletionAsync(daysBeforeDeletion);

                foreach (var resume in resumesApproachingDeletion)
                {
                    var deletionDate = resume.UploadDate.AddMonths(6);
                    var message = daysBeforeDeletion == 30 
                        ? $"Your resume data will be deleted in 30 days ({deletionDate:yyyy-MM-dd}). Update your resume to extend retention for another 6 months."
                        : $"FINAL WARNING: Your resume data will be deleted in 7 days ({deletionDate:yyyy-MM-dd}). Update your resume now to prevent deletion.";

                    // Log the warning (you can replace this with actual notification sending)
                    _logger.LogInformation($"Deletion warning ({daysBeforeDeletion} days) for user {resume.UserId}: {message}");

                    // TODO: Send actual notification via email/in-app notification
                    // await notificationService.SendNotificationAsync(resume.UserId, message);
                }

                _logger.LogInformation($"Sent {resumesApproachingDeletion.Count} deletion warnings ({daysBeforeDeletion} days)");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending {daysBeforeDeletion}-day deletion warnings");
            }
        }

        public override async Task StopAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Resume Data Cleanup Service is stopping");
            await base.StopAsync(stoppingToken);
        }
    }
}