using ResumeAI.API.Models;

namespace ResumeAI.API.Services
{
    public class RecruiterSubscriptionService
    {
        private readonly UserService _userService;
        private readonly ActivityLogService _activityLogService;

        public RecruiterSubscriptionService(UserService userService, ActivityLogService activityLogService)
        {
            _userService = userService;
            _activityLogService = activityLogService;
        }

        public async Task<Subscription> GetRecruiterSubscription(string userId)
        {
            // Always return the latest subscription from the subscriptions table for recruiter
            return await _userService.GetUserSubscriptionAsync(userId);
        }

        public async Task<Subscription> UpgradeRecruiterSubscription(string userId, string subscriptionType)
        {
            Console.WriteLine($"UpgradeRecruiterSubscription Method in RecruiterSubscriptionService for user {userId} to {subscriptionType}");
            
            // Validate inputs
            if (string.IsNullOrEmpty(userId))
            {
                throw new ArgumentException("User ID cannot be null or empty", nameof(userId));
            }
            
            if (string.IsNullOrEmpty(subscriptionType))
            {
                throw new ArgumentException("Subscription type cannot be null or empty", nameof(subscriptionType));
            }
            
            // Create new subscription record
            var subscription = new Subscription
            {
                id = Guid.NewGuid().ToString(),
                user_id = userId,
                subscription_type = subscriptionType,
                start_date = DateTime.UtcNow,
                end_date = subscriptionType.ToLower() == "free" ? null : DateTime.UtcNow.AddMonths(1),
                created_at = DateTime.UtcNow,
                updated_at = DateTime.UtcNow,
                is_cancelled = false,
                is_active = true
            };
            
            try
            {
                // Update subscription in database
                Console.WriteLine($"Calling AddOrUpdateSubscriptionAsync for user {userId}");
                var updatedSubscription = await _userService.AddOrUpdateSubscriptionAsync(subscription);
                Console.WriteLine($"Subscription table updated: userId={userId}, subscriptionType={subscriptionType}");
                
                // Log the activity
                await _activityLogService.LogActivity(userId, "recruiter_subscription_upgraded", $"Recruiter subscription upgraded to {subscriptionType}");
                Console.WriteLine($"Activity logged for subscription upgrade");
                
                // Reset usage limits for premium recruiter users
                if (subscriptionType.ToLower() != "free")
                {
                    await _activityLogService.ResetUsageLimits(userId);
                    Console.WriteLine($"Usage limits reset for premium user");
                }
                
                // Verify the subscription was updated by retrieving it again
                var verifiedSubscription = await _userService.GetUserSubscriptionAsync(userId);
                Console.WriteLine($"Verified subscription type: {verifiedSubscription.subscription_type}");
                
                if (verifiedSubscription.subscription_type != subscriptionType)
                {
                    Console.WriteLine($"WARNING: Subscription verification failed. Expected {subscriptionType}, got {verifiedSubscription.subscription_type}");
                    throw new Exception($"Subscription update verification failed. The database was not updated correctly.");
                }
                
                return updatedSubscription;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error adding/updating recruiter subscription: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                }
                throw; // Rethrow to ensure the controller knows about the error
            }
        }

        public async Task<Subscription> CancelRecruiterSubscription(string userId)
        {
            Console.WriteLine("CancelRecruiterSubscription Method in RecruiterSubscriptionService");
            // Get current subscription
            var currentSubscription = await GetRecruiterSubscription(userId);
            
            // Mark the current subscription as cancelled but keep the same end date
            // This way the user maintains access until the end of the billing period
            var subscription = new Subscription
            {
                id = currentSubscription.id,
                user_id = userId,
                subscription_type = currentSubscription.subscription_type, // Keep the current type
                start_date = currentSubscription.start_date,
                end_date = currentSubscription.end_date, // Keep the current end date
                created_at = currentSubscription.created_at,
                updated_at = DateTime.UtcNow,
                is_cancelled = true, // Mark as cancelled
                is_active = true // Still active until end date
            };
            
            try
            {
                // Update the subscription to mark it as cancelled
                await _userService.AddOrUpdateSubscriptionAsync(subscription);
                
                // Log activity
                await _activityLogService.LogActivity(userId, "recruiter_subscription_canceled", "Recruiter subscription canceled but access maintained until end date");
                
                // Schedule a job to downgrade to free plan at end date
                // This would typically be handled by a background job or cron task
                // For now, we'll rely on checking the end date and cancelled flag when the user logs in
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error canceling recruiter subscription: {ex.Message}");
            }
            return subscription;
        }
    }

    public class CandidateSubscriptionService
    {
        private readonly UserService _userService;
        private readonly ActivityLogService _activityLogService;

        public CandidateSubscriptionService(UserService userService, ActivityLogService activityLogService)
        {
            _userService = userService;
            _activityLogService = activityLogService;
        }

        public async Task<Subscription> GetCandidateSubscription(string userId)
        {
            // Always return the latest subscription from the subscriptions table for candidate
            return await _userService.GetUserSubscriptionAsync(userId);
        }

        public async Task<Subscription> UpgradeCandidateSubscription(string userId, string subscriptionType)
        {
            Console.WriteLine($"UpgradeCandidateSubscription Method in CandidateSubscriptionService for user {userId} to {subscriptionType}");
            
            // Validate inputs
            if (string.IsNullOrEmpty(userId))
            {
                throw new ArgumentException("User ID cannot be null or empty", nameof(userId));
            }
            
            if (string.IsNullOrEmpty(subscriptionType))
            {
                throw new ArgumentException("Subscription type cannot be null or empty", nameof(subscriptionType));
            }
            
            // Create new subscription record
            var subscription = new Subscription
            {
                id = Guid.NewGuid().ToString(),
                user_id = userId,
                subscription_type = subscriptionType,
                start_date = DateTime.UtcNow,
                end_date = subscriptionType.ToLower() == "free" ? null : DateTime.UtcNow.AddMonths(1),
                created_at = DateTime.UtcNow,
                updated_at = DateTime.UtcNow,
                is_cancelled = false,
                is_active = true
            };
            
            try
            {
                // Update subscription in database
                Console.WriteLine($"Calling AddOrUpdateSubscriptionAsync for user {userId}");
                var updatedSubscription = await _userService.AddOrUpdateSubscriptionAsync(subscription);
                Console.WriteLine($"Subscription table updated: userId={userId}, subscriptionType={subscriptionType}");
                
                // Log the activity
                await _activityLogService.LogActivity(userId, "candidate_subscription_upgraded", $"Candidate subscription upgraded to {subscriptionType}");
                Console.WriteLine($"Activity logged for subscription upgrade");
                
                // Reset usage limits for premium candidate users
                if (subscriptionType.ToLower() != "free")
                {
                    await _activityLogService.ResetUsageLimits(userId);
                    Console.WriteLine($"Usage limits reset for premium user");
                }
                
                // Verify the subscription was updated by retrieving it again
                var verifiedSubscription = await _userService.GetUserSubscriptionAsync(userId);
                Console.WriteLine($"Verified subscription type: {verifiedSubscription.subscription_type}");
                
                if (verifiedSubscription.subscription_type != subscriptionType)
                {
                    Console.WriteLine($"WARNING: Subscription verification failed. Expected {subscriptionType}, got {verifiedSubscription.subscription_type}");
                    throw new Exception($"Subscription update verification failed. The database was not updated correctly.");
                }
                
                return updatedSubscription;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error adding/updating candidate subscription: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                }
                throw; // Rethrow to ensure the controller knows about the error
            }
        }

        public async Task<Subscription> CancelCandidateSubscription(string userId)
        {
            Console.WriteLine("CancelCandidateSubscription Method in CandidateSubscriptionService");
            // Get current subscription
            var currentSubscription = await GetCandidateSubscription(userId);
            
            // Mark the current subscription as cancelled but keep the same end date
            // This way the user maintains access until the end of the billing period
            var subscription = new Subscription
            {
                id = currentSubscription.id,
                user_id = userId,
                subscription_type = currentSubscription.subscription_type, // Keep the current type
                start_date = currentSubscription.start_date,
                end_date = currentSubscription.end_date, // Keep the current end date
                created_at = currentSubscription.created_at,
                updated_at = DateTime.UtcNow,
                is_cancelled = true, // Mark as cancelled
                is_active = true // Still active until end date
            };
            
            try
            {
                // Update the subscription to mark it as cancelled
                await _userService.AddOrUpdateSubscriptionAsync(subscription);
                
                // Log activity
                await _activityLogService.LogActivity(userId, "candidate_subscription_canceled", "Candidate subscription canceled but access maintained until end date");
                
                // Schedule a job to downgrade to free plan at end date
                // This would typically be handled by a background job or cron task
                // For now, we'll rely on checking the end date and cancelled flag when the user logs in
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error canceling candidate subscription: {ex.Message}");
            }
            return subscription;
        }
    }
}