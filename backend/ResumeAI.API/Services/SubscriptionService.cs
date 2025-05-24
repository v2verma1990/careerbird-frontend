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
            Console.WriteLine("UpgradeRecruiterSubscription Method in RecruiterSubscriptionService");
            // Create new subscription record
            var subscription = new Subscription
            {
                id = Guid.NewGuid().ToString(),
                user_id = userId,
                subscription_type = subscriptionType,
                start_date = DateTime.UtcNow,
                end_date = subscriptionType.ToLower() == "free" ? null : DateTime.UtcNow.AddMonths(1),
                created_at = DateTime.UtcNow,
                updated_at = DateTime.UtcNow
            };
            try
            {
                // Update subscription in database
                await _userService.AddOrUpdateSubscriptionAsync(subscription);
                Console.WriteLine($"Subscription table updated: userId={userId}, subscriptionType={subscriptionType}");
                await _activityLogService.LogActivity(userId, "recruiter_subscription_upgraded", $"Recruiter subscription upgraded to {subscriptionType}");
                // Reset usage limits for premium recruiter users
                if (subscriptionType.ToLower() != "free")
                {
                    await _activityLogService.ResetUsageLimits(userId);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error adding/updating recruiter subscription: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                }
            }
            return subscription;
        }

        public async Task<Subscription> CancelRecruiterSubscription(string userId)
        {
            Console.WriteLine("CancelRecruiterSubscription Method in RecruiterSubscriptionService");
            // Get current subscription
            var currentSubscription = await GetRecruiterSubscription(userId);
            // Create a new free subscription that takes effect immediately
            var subscription = new Subscription
            {
                id = Guid.NewGuid().ToString(),
                user_id = userId,
                subscription_type = "free",
                start_date = DateTime.UtcNow,
                end_date = null,
                created_at = DateTime.UtcNow,
                updated_at = DateTime.UtcNow
            };
            try
            {
                // Add the new free subscription
                await _userService.AddOrUpdateSubscriptionAsync(subscription);
                // Log activity
                await _activityLogService.LogActivity(userId, "recruiter_subscription_canceled", "Recruiter subscription canceled");
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
            Console.WriteLine("UpgradeCandidateSubscription Method in CandidateSubscriptionService");
            // Create new subscription record
            var subscription = new Subscription
            {
                id = Guid.NewGuid().ToString(),
                user_id = userId,
                subscription_type = subscriptionType,
                start_date = DateTime.UtcNow,
                end_date = subscriptionType.ToLower() == "free" ? null : DateTime.UtcNow.AddMonths(1),
                created_at = DateTime.UtcNow,
                updated_at = DateTime.UtcNow
            };
            try
            {
                // Update subscription in database
                await _userService.AddOrUpdateSubscriptionAsync(subscription);
                Console.WriteLine($"Subscription table updated: userId={userId}, subscriptionType={subscriptionType}");
                await _activityLogService.LogActivity(userId, "candidate_subscription_upgraded", $"Candidate subscription upgraded to {subscriptionType}");
                // Reset usage limits for premium candidate users
                if (subscriptionType.ToLower() != "free")
                {
                    await _activityLogService.ResetUsageLimits(userId);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error adding/updating candidate subscription: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                }
            }
            return subscription;
        }

        public async Task<Subscription> CancelCandidateSubscription(string userId)
        {
            Console.WriteLine("CancelCandidateSubscription Method in CandidateSubscriptionService");
            // Get current subscription
            var currentSubscription = await GetCandidateSubscription(userId);
            // Create a new free subscription that takes effect immediately
            var subscription = new Subscription
            {
                id = Guid.NewGuid().ToString(),
                user_id = userId,
                subscription_type = "free",
                start_date = DateTime.UtcNow,
                end_date = null,
                created_at = DateTime.UtcNow,
                updated_at = DateTime.UtcNow
            };
            try
            {
                // Add the new free subscription
                await _userService.AddOrUpdateSubscriptionAsync(subscription);
                // Log activity
                await _activityLogService.LogActivity(userId, "candidate_subscription_canceled", "Candidate subscription canceled");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error canceling candidate subscription: {ex.Message}");
            }
            return subscription;
        }
    }
}
