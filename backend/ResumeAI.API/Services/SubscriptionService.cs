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
            
            // Get current subscription to check if we're extending an existing one
            var currentSubscription = await GetRecruiterSubscription(userId);
            
            // Log the current subscription details
            if (currentSubscription != null)
            {
                Console.WriteLine($"Current subscription: Type={currentSubscription.subscription_type}, " +
                                 $"EndDate={currentSubscription.end_date}, " +
                                 $"Cancelled={currentSubscription.is_cancelled}, " +
                                 $"Active={currentSubscription.is_active}");
                
                // Check if this is an upgrade or renewal
                if (string.Equals(currentSubscription.subscription_type, subscriptionType, StringComparison.OrdinalIgnoreCase))
                {
                    Console.WriteLine($"This is a RENEWAL of the same plan type: {subscriptionType}");
                }
                else
                {
                    Console.WriteLine($"This is an UPGRADE from {currentSubscription.subscription_type} to {subscriptionType}");
                }
            }
            else
            {
                Console.WriteLine("No current subscription found. This is a new subscription.");
            }
            
            // Determine the appropriate end date
            DateTime? endDate;
            
            if (subscriptionType.ToLower() == "free") 
            {
                // Free subscriptions don't have an end date
                endDate = null;
                Console.WriteLine("Setting free subscription with no end date");
            }
            else
            {
                // For ALL paid plans (recruiter), ALWAYS give a full new 30-day period
                // This applies to:
                // 1. New subscriptions
                // 2. Upgrades from free to paid
                // 3. Renewals of the same plan
                // 4. Resubscribing after cancellation
                endDate = DateTime.UtcNow.AddDays(30);
                Console.WriteLine($"Setting new subscription end date to {endDate} (30 days from now)");
            }
            
            // Create new subscription record
            var subscription = new Subscription
            {
                id = Guid.NewGuid().ToString(),
                user_id = userId,
                subscription_type = subscriptionType,
                start_date = DateTime.UtcNow,
                end_date = endDate,
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
                
                // Deactivate all previous subscriptions
                Console.WriteLine("Deactivating all previous subscriptions");
                await _userService.DeactivateAllPreviousSubscriptionsAsync(userId, updatedSubscription.id);
                
                // Log the activity
                await _activityLogService.LogActivity(userId, "recruiter_subscription_upgraded", $"Recruiter subscription upgraded to {subscriptionType}");
                Console.WriteLine($"Activity logged for subscription upgrade");
                
                // Reset usage limits for all paid plans
                if (subscriptionType.ToLower() != "free")
                {
                    // Reset usage through both methods to ensure complete reset
                    await _activityLogService.ResetUsageLimits(userId, subscriptionType);
                    await _userService.ResetUsageOnUpgradeAsync(userId, subscriptionType);
                    Console.WriteLine($"Usage limits reset for {subscriptionType} user");
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
            
            Console.WriteLine($"Current subscription before cancellation: id={currentSubscription.id}, type={currentSubscription.subscription_type}, endDate={currentSubscription.end_date}, cancelled={currentSubscription.is_cancelled}, active={currentSubscription.is_active}");
            
            // Calculate days remaining
            int daysRemaining = 0;
            if (currentSubscription.end_date.HasValue)
            {
                var timeRemaining = currentSubscription.end_date.Value - DateTime.UtcNow;
                daysRemaining = (int)Math.Ceiling(timeRemaining.TotalDays);
                Console.WriteLine($"Days remaining in subscription: {daysRemaining}");
            }
            
            // Mark the current subscription as cancelled but keep the same end date
            // This way the user maintains access until the end of the billing period
            var subscription = new Subscription
            {
                id = currentSubscription.id,
                user_id = userId,
                subscription_type = currentSubscription.subscription_type, // Keep the current type (recruiter)
                start_date = currentSubscription.start_date,
                end_date = currentSubscription.end_date, // Keep the current end date
                created_at = currentSubscription.created_at,
                updated_at = DateTime.UtcNow,
                is_cancelled = true, // Mark as cancelled
                is_active = true // Still active until end date
            };
            
            Console.WriteLine($"Cancelling subscription: Type={subscription.subscription_type}, EndDate={subscription.end_date}");
            Console.WriteLine("User will maintain access to this plan until the end date, then revert to free plan");
            
            Console.WriteLine($"Subscription after cancellation (before save): id={subscription.id}, type={subscription.subscription_type}, endDate={subscription.end_date}, cancelled={subscription.is_cancelled}, active={subscription.is_active}");
            
            try
            {
                // First, make sure all other subscriptions are deactivated
                Console.WriteLine("Deactivating all other subscriptions BEFORE updating the current one");
                await _userService.DeactivateAllPreviousSubscriptionsAsync(userId, subscription.id);
                
                // Update the subscription to mark it as cancelled
                var updatedSubscription = await _userService.AddOrUpdateSubscriptionAsync(subscription);
                
                Console.WriteLine($"Subscription after save: id={updatedSubscription.id}, type={updatedSubscription.subscription_type}, endDate={updatedSubscription.end_date}, cancelled={updatedSubscription.is_cancelled}, active={updatedSubscription.is_active}");
                
                // Log activity
                await _activityLogService.LogActivity(userId, "recruiter_subscription_canceled", "Recruiter subscription canceled but access maintained until end date");
                
                // Schedule a job to downgrade to free plan at end date
                // This would typically be handled by a background job or cron task
                // For now, we'll rely on checking the end date and cancelled flag when the user logs in
                
                // Verify the subscription was updated by retrieving it again
                var verifiedSubscription = await _userService.GetUserSubscriptionAsync(userId);
                Console.WriteLine($"Verified subscription after cancellation: id={verifiedSubscription.id}, type={verifiedSubscription.subscription_type}, endDate={verifiedSubscription.end_date}, cancelled={verifiedSubscription.is_cancelled}, active={verifiedSubscription.is_active}");
                
                // Calculate days remaining in verified subscription
                if (verifiedSubscription.end_date.HasValue)
                {
                    var verifiedTimeRemaining = verifiedSubscription.end_date.Value - DateTime.UtcNow;
                    var verifiedDaysRemaining = (int)Math.Ceiling(verifiedTimeRemaining.TotalDays);
                    Console.WriteLine($"Days remaining in verified subscription: {verifiedDaysRemaining}");
                }
                
                // Make sure all other subscriptions remain inactive AGAIN
                Console.WriteLine("Ensuring all other subscriptions remain inactive AFTER verification");
                await _userService.DeactivateAllPreviousSubscriptionsAsync(userId, verifiedSubscription.id);
                
                // Double-check that we're returning the correct subscription
                if (verifiedSubscription.subscription_type != currentSubscription.subscription_type)
                {
                    Console.WriteLine($"ERROR: Subscription type mismatch! Expected {currentSubscription.subscription_type}, got {verifiedSubscription.subscription_type}");
                    
                    // Force the correct subscription to be returned
                    subscription.is_active = true;
                    subscription.is_cancelled = true;
                    var correctedSubscription = await _userService.AddOrUpdateSubscriptionAsync(subscription);
                    Console.WriteLine($"Forced correct subscription: id={correctedSubscription.id}, type={correctedSubscription.subscription_type}");
                    
                    return correctedSubscription;
                }
                
                // Return the verified subscription from the database
                return verifiedSubscription;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error canceling recruiter subscription: {ex.Message}");
                // Return the original subscription if there was an error
                return subscription;
            }
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
            
            // Get current subscription to check if we're extending an existing one
            var currentSubscription = await GetCandidateSubscription(userId);
            
            // Log the current subscription details
            if (currentSubscription != null)
            {
                Console.WriteLine($"Current subscription: Type={currentSubscription.subscription_type}, " +
                                 $"EndDate={currentSubscription.end_date}, " +
                                 $"Cancelled={currentSubscription.is_cancelled}, " +
                                 $"Active={currentSubscription.is_active}");
                
                // Check if this is an upgrade or renewal
                if (string.Equals(currentSubscription.subscription_type, subscriptionType, StringComparison.OrdinalIgnoreCase))
                {
                    Console.WriteLine($"This is a RENEWAL of the same plan type: {subscriptionType}");
                }
                else
                {
                    Console.WriteLine($"This is an UPGRADE from {currentSubscription.subscription_type} to {subscriptionType}");
                }
            }
            else
            {
                Console.WriteLine("No current subscription found. This is a new subscription.");
            }
            
            // Determine the appropriate end date
            DateTime? endDate;
            
            if (subscriptionType.ToLower() == "free") 
            {
                // Free subscriptions don't have an end date
                endDate = null;
                Console.WriteLine("Setting free subscription with no end date");
            }
            else
            {
                // For ALL paid plans (basic or premium), ALWAYS give a full new 30-day period
                // This applies to:
                // 1. New subscriptions
                // 2. Upgrades from free to paid
                // 3. Upgrades from basic to premium
                // 4. Renewals of the same plan
                // 5. Resubscribing after cancellation
                endDate = DateTime.UtcNow.AddDays(30);
                Console.WriteLine($"Setting new subscription end date to {endDate} (30 days from now)");
            }
            
            // Create new subscription record
            var subscription = new Subscription
            {
                id = Guid.NewGuid().ToString(),
                user_id = userId,
                subscription_type = subscriptionType,
                start_date = DateTime.UtcNow,
                end_date = endDate,
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
                
                // Deactivate all previous subscriptions
                Console.WriteLine("Deactivating all previous subscriptions");
                await _userService.DeactivateAllPreviousSubscriptionsAsync(userId, updatedSubscription.id);
                
                // Log the activity
                await _activityLogService.LogActivity(userId, "candidate_subscription_upgraded", $"Candidate subscription upgraded to {subscriptionType}");
                Console.WriteLine($"Activity logged for subscription upgrade");
                
                // Reset usage limits for all paid plans (basic or premium)
                if (subscriptionType.ToLower() != "free")
                {
                    // Reset usage through both methods to ensure complete reset
                    await _activityLogService.ResetUsageLimits(userId, subscriptionType);
                    await _userService.ResetUsageOnUpgradeAsync(userId, subscriptionType);
                    Console.WriteLine($"Usage limits reset for {subscriptionType} user");
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
            
            Console.WriteLine($"Current subscription before cancellation: id={currentSubscription.id}, type={currentSubscription.subscription_type}, endDate={currentSubscription.end_date}, cancelled={currentSubscription.is_cancelled}, active={currentSubscription.is_active}");
            
            // Calculate days remaining
            int candidateDaysRemaining = 0;
            if (currentSubscription.end_date.HasValue)
            {
                var candidateTimeRemaining = currentSubscription.end_date.Value - DateTime.UtcNow;
                candidateDaysRemaining = (int)Math.Ceiling(candidateTimeRemaining.TotalDays);
                Console.WriteLine($"Days remaining in subscription: {candidateDaysRemaining}");
            }
            
            // Mark the current subscription as cancelled but keep the same end date
            // This way the user maintains access until the end of the billing period
            var subscription = new Subscription
            {
                id = currentSubscription.id,
                user_id = userId,
                subscription_type = currentSubscription.subscription_type, // Keep the current type (premium or basic)
                start_date = currentSubscription.start_date,
                end_date = currentSubscription.end_date, // Keep the current end date - preserves original days remaining
                created_at = currentSubscription.created_at,
                updated_at = DateTime.UtcNow,
                is_cancelled = true, // Mark as cancelled
                is_active = true // Still active until end date
            };
            
            Console.WriteLine($"Cancelling subscription: Type={subscription.subscription_type}, EndDate={subscription.end_date}");
            Console.WriteLine("User will maintain access to this plan until the end date, then revert to free plan");
            
            Console.WriteLine($"Subscription after cancellation (before save): id={subscription.id}, type={subscription.subscription_type}, endDate={subscription.end_date}, cancelled={subscription.is_cancelled}, active={subscription.is_active}");
            
            try
            {
                // First, make sure all other subscriptions are deactivated
                Console.WriteLine("Deactivating all other subscriptions BEFORE updating the current one");
                await _userService.DeactivateAllPreviousSubscriptionsAsync(userId, subscription.id);
                
                // Update the subscription to mark it as cancelled
                var updatedSubscription = await _userService.AddOrUpdateSubscriptionAsync(subscription);
                
                Console.WriteLine($"Subscription after save: id={updatedSubscription.id}, type={updatedSubscription.subscription_type}, endDate={updatedSubscription.end_date}, cancelled={updatedSubscription.is_cancelled}, active={updatedSubscription.is_active}");
                
                // Log activity
                await _activityLogService.LogActivity(userId, "candidate_subscription_canceled", "Candidate subscription canceled but access maintained until end date");
                
                // Schedule a job to downgrade to free plan at end date
                // This would typically be handled by a background job or cron task
                // For now, we'll rely on checking the end date and cancelled flag when the user logs in
                
                // Verify the subscription was updated by retrieving it again
                var verifiedSubscription = await _userService.GetUserSubscriptionAsync(userId);
                Console.WriteLine($"Verified subscription after cancellation: id={verifiedSubscription.id}, type={verifiedSubscription.subscription_type}, endDate={verifiedSubscription.end_date}, cancelled={verifiedSubscription.is_cancelled}, active={verifiedSubscription.is_active}");
                
                // Calculate days remaining in verified subscription
                if (verifiedSubscription.end_date.HasValue)
                {
                    var verifiedTimeRemaining = verifiedSubscription.end_date.Value - DateTime.UtcNow;
                    var verifiedDaysRemaining = (int)Math.Ceiling(verifiedTimeRemaining.TotalDays);
                    Console.WriteLine($"Days remaining in verified subscription: {verifiedDaysRemaining}");
                    
                    // Ensure the end_date is exactly the same as before cancellation
                    if (verifiedDaysRemaining != candidateDaysRemaining)
                    {
                        Console.WriteLine($"WARNING: Days remaining mismatch after cancellation. Original: {candidateDaysRemaining}, Current: {verifiedDaysRemaining}");
                        // If there's a mismatch, update the subscription again with the original end date
                        if (currentSubscription.end_date.HasValue)
                        {
                            verifiedSubscription.end_date = currentSubscription.end_date;
                            verifiedSubscription = await _userService.AddOrUpdateSubscriptionAsync(verifiedSubscription);
                            Console.WriteLine($"Fixed subscription end date to match original: {verifiedSubscription.end_date}");
                        }
                    }
                }
                
                // Make sure all other subscriptions remain inactive AGAIN
                Console.WriteLine("Ensuring all other subscriptions remain inactive AFTER verification");
                await _userService.DeactivateAllPreviousSubscriptionsAsync(userId, verifiedSubscription.id);
                
                // Double-check that we're returning the correct subscription
                if (verifiedSubscription.subscription_type != currentSubscription.subscription_type)
                {
                    Console.WriteLine($"ERROR: Subscription type mismatch! Expected {currentSubscription.subscription_type}, got {verifiedSubscription.subscription_type}");
                    
                    // Force the correct subscription to be returned
                    subscription.is_active = true;
                    subscription.is_cancelled = true;
                    var correctedSubscription = await _userService.AddOrUpdateSubscriptionAsync(subscription);
                    Console.WriteLine($"Forced correct subscription: id={correctedSubscription.id}, type={correctedSubscription.subscription_type}");
                    
                    return correctedSubscription;
                }
                
                // Return the verified subscription from the database
                return verifiedSubscription;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error canceling candidate subscription: {ex.Message}");
                // Return the original subscription if there was an error
                return subscription;
            }
        }
    }
}