using ResumeAI.API.Models;
using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace ResumeAI.API.Services
{
    public class SubscriptionExpirationService : BackgroundService
    {
        private readonly ILogger<SubscriptionExpirationService> _logger;
        private readonly IServiceProvider _serviceProvider;
        private readonly TimeSpan _checkInterval = TimeSpan.FromHours(1); // Check every hour

        public SubscriptionExpirationService(
            ILogger<SubscriptionExpirationService> logger,
            IServiceProvider serviceProvider)
        {
            _logger = logger;
            _serviceProvider = serviceProvider;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Subscription Expiration Service is starting.");

            while (!stoppingToken.IsCancellationRequested)
            {
                _logger.LogInformation("Checking for expired subscriptions at: {time}", DateTimeOffset.Now);
                
                try
                {
                    await ProcessExpiredSubscriptions();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred while processing expired subscriptions.");
                }

                await Task.Delay(_checkInterval, stoppingToken);
            }
        }

        private async Task ProcessExpiredSubscriptions()
        {
            using (var scope = _serviceProvider.CreateScope())
            {
                var userService = scope.ServiceProvider.GetRequiredService<UserService>();
                var activityLogService = scope.ServiceProvider.GetRequiredService<ActivityLogService>();
                
                // Get all subscriptions that are cancelled and have an end date in the past
                var expiredSubscriptions = await userService.GetExpiredSubscriptions();
                
                foreach (var subscription in expiredSubscriptions)
                {
                    try
                    {
                        _logger.LogInformation("Processing expired subscription for user: {userId}", subscription.user_id);
                        
                        // Create a new free subscription
                        var newSubscription = new Subscription
                        {
                            id = Guid.NewGuid().ToString(),
                            user_id = subscription.user_id,
                            subscription_type = "free",
                            start_date = DateTime.UtcNow,
                            end_date = null,
                            created_at = DateTime.UtcNow,
                            updated_at = DateTime.UtcNow,
                            is_cancelled = false,
                            is_active = true
                        };
                        
                        // Add the new free subscription
                        await userService.AddOrUpdateSubscriptionAsync(newSubscription);
                        
                        // Reset usage for free plan
                        await userService.ResetUsageOnUpgradeAsync(subscription.user_id, "free");
                        _logger.LogInformation("Reset usage for free plan for user: {userId}", subscription.user_id);
                        
                        // Log activity
                        await activityLogService.LogActivity(
                            subscription.user_id, 
                            "subscription_expired", 
                            $"Subscription expired and downgraded to free plan with usage reset"
                        );
                        
                        _logger.LogInformation("Successfully downgraded expired subscription for user: {userId}", subscription.user_id);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error processing expired subscription for user: {userId}", subscription.user_id);
                    }
                }
            }
        }
    }
}