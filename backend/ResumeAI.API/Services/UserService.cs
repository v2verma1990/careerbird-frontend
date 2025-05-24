using Microsoft.Extensions.Configuration;
using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System.Collections.Generic;
using ResumeAI.API.Models;
using System.Net.Http.Headers;

namespace ResumeAI.API.Services
{
    public class UserService
    {
        private readonly SupabaseHttpClientService _supabaseHttpClientService;
        
        public UserService(SupabaseHttpClientService supabaseHttpClientService)
        {
            _supabaseHttpClientService = supabaseHttpClientService;
        }

        public async Task<UserProfile> GetProfile(string userId)
        {
            if (string.IsNullOrEmpty(userId))
            {
                throw new ArgumentException("User ID cannot be null or empty", nameof(userId));
            }
            Console.WriteLine($"Getting profile for user ID: {userId}");
            var profile = await GetUserProfileAsync(userId);
            // Only set UserType default, do not touch subscription/plan here
            if (string.IsNullOrEmpty(profile.UserType) || profile.UserType == "undefined")
            {
                profile.UserType = "candidate";
                await AddOrUpdateUserProfileAsync(profile);
            }
            Console.WriteLine($"Retrieved profile: {profile.Id}, type: {profile.UserType}");
            return profile;
        }

        public async Task<Subscription> GetActiveSubscription(string userId)
        {
            if (string.IsNullOrEmpty(userId))
            {
                throw new ArgumentException("User ID cannot be null or empty", nameof(userId));
            }
            
            return await GetUserSubscriptionAsync(userId);
        }

        public async Task<UserProfile> UpdateProfile(string userId, string subscriptionType)
        {
            if (string.IsNullOrEmpty(userId))
            {
                throw new ArgumentException("User ID cannot be null or empty", nameof(userId));
            }
            Console.WriteLine("UpdateProfile Method in User Service");
            var profile = await GetUserProfileAsync(userId);
            // Only update non-plan fields (if needed)
            profile.UpdatedAt = DateTime.UtcNow;
            await AddOrUpdateUserProfileAsync(profile);
            return profile;
        }

        /// <summary>
        /// Creates a new subscription for the user and updates the user's profile to reflect the latest subscription type.
        /// This method MUST be used for all subscription changes to ensure profile and subscription stay in sync.
        /// Never update the subscriptions table directly without also updating the profile.
        /// </summary>
        /// <param name="userId">The user's unique identifier.</param>
        /// <param name="subscriptionType">The new subscription type (plan name).</param>
        /// <returns>The created or updated Subscription object.</returns>
        public async Task<Subscription> CreateOrUpdateSubscription(string userId, string subscriptionType)
        {
            Console.WriteLine("CreateOrUpdateSubscription Method in User Service");
            if (string.IsNullOrEmpty(userId))
            {
                throw new ArgumentException("User ID cannot be null or empty", nameof(userId));
            }
            // Do NOT update profile for plan changes
            var subscription = new Subscription
            {
                id = Guid.NewGuid().ToString(),
                user_id = userId,
                subscription_type = subscriptionType,
                start_date = DateTime.UtcNow,
                end_date = subscriptionType == "free" ? null : DateTime.UtcNow.AddYears(1),
                created_at = DateTime.UtcNow,
                updated_at = DateTime.UtcNow
            };
            var url = $"{_supabaseHttpClientService.Url}/rest/v1/subscriptions";
            var json = JsonSerializer.Serialize(subscription, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            var response = await _supabaseHttpClientService.Client.PostAsync(url, content);
            if (!response.IsSuccessStatusCode)
            {
                Console.WriteLine($"Error inserting subscription: {response.StatusCode}");
                Console.WriteLine($"Response: {await response.Content.ReadAsStringAsync()}");
            }
            else
            {
                Console.WriteLine("Subscription inserted successfully");
            }
            return subscription;
        }

        /// <summary>
        /// Helper to update the user's profile subscription_type from a Subscription object.
        /// </summary>
        /// <param name="subscription">The subscription object.</param>
        public async Task UpdateProfileFromSubscriptionAsync(Subscription subscription)
        {
            // No-op: profile no longer tracks plan
            await Task.CompletedTask;
        }
        
        public async Task<List<User>> GetUsersAsync()
        {
            Console.WriteLine("GetUsersAsync Method");
            var url = $"{_supabaseHttpClientService.Url}/rest/v1/users?select=*";
            Console.WriteLine($"Fetching users from: {url}");
            var response = await _supabaseHttpClientService.Client.GetAsync(url);
            
            if (!response.IsSuccessStatusCode)
            {
                Console.WriteLine($"Error fetching users: {response.StatusCode}");
                Console.WriteLine($"Response: {await response.Content.ReadAsStringAsync()}");
                return new List<User>();
            }
            var content = await response.Content.ReadAsStringAsync();
            Console.WriteLine($"GetUsersAsync response content: {content}");
            return JsonSerializer.Deserialize<List<User>>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new List<User>();
        }
        
        public async Task<User> GetUserByEmailAsync(string email)
        {
            Console.WriteLine($"GetUserByEmailAsync: {email}");
            

                var serviceKey = _supabaseHttpClientService.GetServiceKey();
                if (!string.IsNullOrEmpty(serviceKey)) {
                    Console.WriteLine("Using service key for activity logging");
                    _supabaseHttpClientService.SetServiceKey();
                } else {
                    Console.WriteLine("Warning: No service key available for activity logging");
                }

            var url = $"{_supabaseHttpClientService.Url}/rest/v1/profiles?email=eq.{Uri.EscapeDataString(email)}&select=*";
            Console.WriteLine($"Fetching user by email: {url}");
            var response = await _supabaseHttpClientService.Client.GetAsync(url);
            
            if (!response.IsSuccessStatusCode)
            {
                Console.WriteLine($"Error fetching user by email: {response.StatusCode}");
                Console.WriteLine($"Response: {await response.Content.ReadAsStringAsync()}");
                throw new UnauthorizedAccessException("User not found");
            }
            
            var content = await response.Content.ReadAsStringAsync();
            if (string.IsNullOrEmpty(content)|| content == "[]")
            {
                Console.WriteLine("No user found with the provided email.");
                throw new UnauthorizedAccessException("User not found");
            }
            
            Console.WriteLine($"GetUserByEmailAsync response content: {content}");
            
            var users = JsonSerializer.Deserialize<List<User>>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new List<User>();
            return users.FirstOrDefault() ??throw new UnauthorizedAccessException("User not found");
        }
        
        public async Task<User> AddUserAsync(User user)
        {
            Console.WriteLine("AddUserAsync Method");
            var url = $"{_supabaseHttpClientService.Url}/rest/v1/users";
            var json = JsonSerializer.Serialize(user, new JsonSerializerOptions 
            { 
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase 
            });
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            
            var response = await _supabaseHttpClientService.Client.PostAsync(url, content);
            
            if (!response.IsSuccessStatusCode)
            {
                Console.WriteLine($"Error adding user: {response.StatusCode}");
                Console.WriteLine($"Response: {await response.Content.ReadAsStringAsync()}");
            }
            
            return user;
        }
        
        // Profile methods - Updated to use 'profiles' table and 'id' column
        public async Task<UserProfile> GetUserProfileAsync(string userId)
        {
            try
            {
                Console.WriteLine($"GetUserProfileAsync: {userId}");
                var url = $"{_supabaseHttpClientService.Url}/rest/v1/profiles?id=eq.{Uri.EscapeDataString(userId)}&select=*";
                Console.WriteLine($"Profile URL: {url}");
                
                var response = await _supabaseHttpClientService.Client.GetAsync(url);
                
                if (!response.IsSuccessStatusCode)
                {
                    Console.WriteLine($"Error fetching profile: {response.StatusCode}");
                    Console.WriteLine($"Response: {await response.Content.ReadAsStringAsync()}");
                    return new UserProfile { Id = userId };
                }
                
                var content = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"Profile response content: {content}");
                
                var profiles = JsonSerializer.Deserialize<List<UserProfile>>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new List<UserProfile>();
                var foundProfile = profiles.FirstOrDefault();
                if (foundProfile != null)
                {
                    Console.WriteLine($"Returning existing profile: Id={foundProfile.Id}, UserType={foundProfile.UserType}, SubscriptionType={foundProfile.SubscriptionType}");
                    return foundProfile;
                }
                else
                {
                    Console.WriteLine($"No profile found, returning new UserProfile with Id={userId}");
                    return new UserProfile { Id = userId };
                }
            }
            catch (Exception ex) 
            {
                Console.WriteLine($"Exception in GetUserProfileAsync: {ex.Message}");
                return new UserProfile { Id = userId };
            }
        }
        
        public async Task<UserProfile> AddOrUpdateUserProfileAsync(UserProfile profile)
        {
            try 
            {
                Console.WriteLine($"AddOrUpdateUserProfileAsync for user ID: {profile.Id}");
                
                // Set timestamps if not already set
                if (profile.CreatedAt == DateTime.MinValue)
                    profile.CreatedAt = DateTime.UtcNow;
                profile.UpdatedAt = DateTime.UtcNow;
                
                var json = JsonSerializer.Serialize(profile, new JsonSerializerOptions 
                { 
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                    WriteIndented = true
                });
                Console.WriteLine($"Profile JSON: {json}");
                
                var url = $"{_supabaseHttpClientService.Url}/rest/v1/profiles";
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                
                // Use UPSERT with ON CONFLICT DO UPDATE
                _supabaseHttpClientService.Client.DefaultRequestHeaders.Remove("Prefer");
                _supabaseHttpClientService.Client.DefaultRequestHeaders.Add("Prefer", "return=representation,resolution=merge-duplicates");
                
                // Log Authorization header before making the request
                var authHeader = _supabaseHttpClientService.Client.DefaultRequestHeaders.Authorization;
                Console.WriteLine($"[Supabase] Authorization header before profile upsert: {authHeader}");
                
                var response = await _supabaseHttpClientService.Client.PostAsync(url, content);
                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"Error updating profile: {response.StatusCode}");
                    Console.WriteLine($"Response: {errorContent}");
                }
                else
                {
                    Console.WriteLine("Profile updated successfully");
                }
                
                return profile;
            }
            catch (Exception ex) 
            {
                Console.WriteLine($"Exception in AddOrUpdateUserProfileAsync: {ex.Message}");
                return profile;
            }
        }
        
        // Subscription methods
        public async Task<Subscription> GetUserSubscriptionAsync(string userId)
        {
            try
            {
                Console.WriteLine($"GetUserSubscriptionAsync: {userId}");
                var url = $"{_supabaseHttpClientService.Url}/rest/v1/subscriptions?user_id=eq.{Uri.EscapeDataString(userId)}&order=start_date.desc&select=*";
                var response = await _supabaseHttpClientService.Client.GetAsync(url);
                
                if (!response.IsSuccessStatusCode)
                {
                    Console.WriteLine($"Error fetching subscription: {response.StatusCode}");
                    Console.WriteLine($"Response: {await response.Content.ReadAsStringAsync()}");
                    // Return an in-memory free subscription (do NOT insert into DB)
                    return new Subscription
                    {
                        id = string.Empty,
                        user_id = userId,
                        subscription_type = "free",
                        start_date = DateTime.UtcNow,
                        end_date = null,
                        created_at = DateTime.UtcNow,
                        updated_at = DateTime.UtcNow
                    };
                }
                var content = await response.Content.ReadAsStringAsync();
                var subscriptions = JsonSerializer.Deserialize<List<Subscription>>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new List<Subscription>();
                // Return the most recent active subscription
                var activeSubscription = subscriptions
                    .Where(s => !s.end_date.HasValue || s.end_date > DateTime.UtcNow)
                    .OrderByDescending(s => s.start_date)
                    .FirstOrDefault();
                if (activeSubscription != null)
                {
                    return activeSubscription;
                }
                // If no active subscription, return an in-memory free subscription (do NOT insert into DB)
                return new Subscription
                {
                    id = string.Empty,
                    user_id = userId,
                    subscription_type = "free",
                    start_date = DateTime.UtcNow,
                    end_date = null,
                    created_at = DateTime.UtcNow,
                    updated_at = DateTime.UtcNow
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception in GetUserSubscriptionAsync: {ex.Message}");
                // Return an in-memory free subscription (do NOT insert into DB)
                return new Subscription
                {
                    id = string.Empty,
                    user_id = userId,
                    subscription_type = "free",
                    start_date = DateTime.UtcNow,
                    end_date = null,
                    created_at = DateTime.UtcNow,
                    updated_at = DateTime.UtcNow
                };
            }
        }
        
        public async Task<Subscription> AddOrUpdateSubscriptionAsync(Subscription subscription)
        {
            try
            {
                Console.WriteLine($"AddOrUpdateSubscriptionAsync for user: {subscription.user_id}");
                var url = $"{_supabaseHttpClientService.Url}/rest/v1/subscriptions";
                
                var json = JsonSerializer.Serialize(subscription, new JsonSerializerOptions 
                { 
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase 
                });
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                
                var response = await _supabaseHttpClientService.Client.PostAsync(url, content);
                
                if (!response.IsSuccessStatusCode)
                {
                    Console.WriteLine($"Error adding/updating subscription: {response.StatusCode}");
                    Console.WriteLine($"Response: {await response.Content.ReadAsStringAsync()}");
                }

                return subscription;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception in AddOrUpdateSubscriptionAsync: {ex.Message}");
                return subscription;
            }
        }
        
        // Usage tracking methods
        public async Task<UsageTracking> GetFeatureUsageAsync(string userId, string featureType, string plan)
        {
            try
            {
                var serviceKey = _supabaseHttpClientService.GetServiceKey();
                if (!string.IsNullOrEmpty(serviceKey)) {
                    Console.WriteLine("Using service key for activity logging");
                    _supabaseHttpClientService.SetServiceKey();
                } else {
                    Console.WriteLine("Warning: No service key available for activity logging");
                }
                Console.WriteLine($"[GetFeatureUsageAsync] userId: {userId}, featureType: {featureType}, plan: {plan}");
                var url = $"{_supabaseHttpClientService.Url}/rest/v1/usage_tracking?user_id=eq.{Uri.EscapeDataString(userId)}&feature_type=eq.{Uri.EscapeDataString(featureType)}&plan=eq.{Uri.EscapeDataString(plan)}&select=*";
                Console.WriteLine($"[GetFeatureUsageAsync] Supabase URL: {url}");
                var response = await _supabaseHttpClientService.Client.GetAsync(url);
                Console.WriteLine($"[GetFeatureUsageAsync] Response status: {response.StatusCode}");
                var content = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"[GetFeatureUsageAsync] Response content: {content}");
                if (!response.IsSuccessStatusCode)
                {
                    throw new Exception($"Failed to fetch usage tracking: {response.StatusCode} - {content}");
                }
                var usageData = JsonSerializer.Deserialize<List<UsageTracking>>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new List<UsageTracking>();
                var usage = usageData.FirstOrDefault();
                if (usage != null)
                {
                    Console.WriteLine($"[GetFeatureUsageAsync] Found usage row: usage_count={usage.usage_count}");
                    return usage;
                }
                // If no usage row exists, log and create a new one for this user/feature/plan
                Console.WriteLine($"[GetFeatureUsageAsync] No usage row found for userId={userId}, featureType={featureType}, plan={plan}. Creating new usage row with UsageCount=0.");
                var newUsage = new UsageTracking
                {
                    id = Guid.NewGuid().ToString(),
                    user_id = userId,
                    feature_type = featureType,
                    usage_count = 0,
                    created_at = DateTime.UtcNow,
                    updated_at = DateTime.UtcNow,
                    last_used = DateTime.UtcNow,
                    plan = plan
                };
                // Directly POST the new usage row to Supabase (no recursion)
                var postUrl = $"{_supabaseHttpClientService.Url}/rest/v1/usage_tracking";
                var json = JsonSerializer.Serialize(newUsage, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
                var contentPost = new StringContent(json, Encoding.UTF8, "application/json");
                var postResponse = await _supabaseHttpClientService.Client.PostAsync(postUrl, contentPost);
                if (!postResponse.IsSuccessStatusCode)
                {
                    var errorContent = await postResponse.Content.ReadAsStringAsync();
                    Console.WriteLine($"Error creating usage tracking: {postResponse.StatusCode}");
                    Console.WriteLine($"Response: {errorContent}");
                    throw new Exception($"Failed to create usage tracking row: {postResponse.StatusCode} - {errorContent}");
                }
                return newUsage;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GetFeatureUsageAsync] Exception: {ex.Message}");
                throw;
            }
        }

        public async Task<UsageTracking> UpdateUsageTrackingAsync(UsageTracking usage)
        {
            try
            {
                Console.WriteLine($"UpdateUsageTrackingAsync: {usage.user_id}, feature: {usage.feature_type}");
                // Only update an existing row (do not call GetFeatureUsageAsync)
                var url = $"{_supabaseHttpClientService.Url}/rest/v1/usage_tracking?id=eq.{Uri.EscapeDataString(usage.id)}";
                var updateData = new
                {
                    usage_count = usage.usage_count,
                    last_used = usage.last_used == DateTime.MinValue ? DateTime.UtcNow : usage.last_used,
                    updated_at = DateTime.UtcNow
                };
                var json = JsonSerializer.Serialize(updateData, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                var response = await _supabaseHttpClientService.Client.PatchAsync(url, content);
                if (!response.IsSuccessStatusCode)
                {
                    Console.WriteLine($"Error updating usage tracking: {response.StatusCode}");
                    Console.WriteLine($"Response: {await response.Content.ReadAsStringAsync()}");
                }
                return usage;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception in UpdateUsageTrackingAsync: {ex.Message}");
                return usage;
            }
        }
        
        // Add the missing GetUserActivityAsync method
        public async Task<List<ActivityLog>> GetUserActivityAsync(string userId)
        {
            try
            {
                Console.WriteLine($"GetUserActivityAsync: {userId}");
                var url = $"{_supabaseHttpClientService.Url}/rest/v1/activity_logs?user_id=eq.{Uri.EscapeDataString(userId)}&select=*";
                
                var response = await _supabaseHttpClientService.Client.GetAsync(url);
                
                if (!response.IsSuccessStatusCode)
                {
                    Console.WriteLine($"Error fetching user activity: {response.StatusCode}");
                    Console.WriteLine($"Response: {await response.Content.ReadAsStringAsync()}");
                    return new List<ActivityLog>();
                }
                
                var content = await response.Content.ReadAsStringAsync();
                var activities = JsonSerializer.Deserialize<List<ActivityLog>>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new List<ActivityLog>();
                
                return activities;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception in GetUserActivityAsync: {ex.Message}");
                return new List<ActivityLog>();
            }
        }

        /// <summary>
        /// Checks if the user is allowed to use a feature based on their plan and usage.
        /// Returns true if under limit, false if at or above limit.
        /// </summary>
        public async Task<bool> CanUseFeatureAsync(string userId, string featureType, Subscription? subscription = null)
        {
            var (usageCount, usageLimit) = await GetUsageAndLimit(userId, featureType, subscription);
            // If limit is 0, feature is not available for this plan
            if (usageLimit == 0) return false;
            return usageCount < usageLimit;
        }

        /// <summary>
        /// Increments usage for a feature if under plan limit. Returns updated usage, or throws if limit reached.
        /// </summary>
        public async Task<UsageTracking> TrackFeatureUsage(string userId, string featureType, Subscription? subscription = null)
        {
            // Fetch the current usage tracking row
            if (subscription == null)
                subscription = await GetUserSubscriptionAsync(userId);
            var plan = subscription.subscription_type ?? "free";
            var usage = await GetFeatureUsageAsync(userId, featureType, plan);
            // Get user's plan and limit
            var limit = await GetPlanLimit(plan, featureType);
            if (limit == 0)
                throw new InvalidOperationException($"Feature '{featureType}' is not available for plan '{plan}'.");
            if (usage.usage_count >= limit)
                throw new InvalidOperationException($"Usage limit reached for feature '{featureType}' on plan '{plan}'.");
            // Increment the usage count
            usage.usage_count++;
            usage.last_used = DateTime.UtcNow;
            usage.updated_at = DateTime.UtcNow;
            // Save the updated usage tracking row
            await UpdateUsageTrackingAsync(usage);
            return usage;
        }

        /// <summary>
        /// Optionally resets usage for all features on plan upgrade (if business logic requires).
        /// </summary>
        public async Task ResetUsageOnUpgradeAsync(string userId, string newPlan)
        {
            // This is a placeholder. If you want to reset usage on upgrade, implement logic here.
            // For now, do nothing.
            await Task.CompletedTask;
        }
        
        // Helper: Get plan-based usage limit from plan_limits table
        public async Task<int> GetPlanLimit(string planName, string featureType)
        {
            try
            {
                var url = $"{_supabaseHttpClientService.Url}/rest/v1/plan_limits?plan_name=eq.{Uri.EscapeDataString(planName)}&feature_type=eq.{Uri.EscapeDataString(featureType)}&select=usage_limit";
                Console.WriteLine($"[GetPlanLimit] Supabase URL: {url}");
                var response = await _supabaseHttpClientService.Client.GetAsync(url);
                Console.WriteLine($"[GetPlanLimit] Response status: {response.StatusCode}");
                var content = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"[GetPlanLimit] Response content: {content}");
                if (!response.IsSuccessStatusCode)
                {
                    throw new Exception($"Failed to fetch plan limit: {response.StatusCode} - {content}");
                }
                var planLimits = JsonSerializer.Deserialize<List<Dictionary<string, int>>>(content);
                if (planLimits != null && planLimits.Count > 0 && planLimits[0].ContainsKey("usage_limit"))
                {
                    return planLimits[0]["usage_limit"];
                }
                // If no plan limit found, return 0 (feature not available for this plan)
                Console.WriteLine($"No plan limit found for planName={planName}, featureType={featureType}. Returning 0.");
                return 0;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GetPlanLimit] Exception: {ex.Message}");
                return 0;
            }
        }

        // Main method to get usage count and plan-based limit
        public async Task<(int usageCount, int usageLimit)> GetUsageAndLimit(string userId, string featureType, Subscription? subscription = null)
        {
            // Get usage count from usage_tracking
            if (subscription == null)
                subscription = await GetUserSubscriptionAsync(userId);
            var plan = subscription.subscription_type ?? "free";
            var usage = await GetFeatureUsageAsync(userId, featureType, plan);
            // Debug logging for plan/limit
            Console.WriteLine($"[GetUsageAndLimit] userId={userId}, featureType={featureType}, plan={plan}");
            // Get plan-based limit
            var limit = await GetPlanLimit(plan, featureType);
            Console.WriteLine($"[GetUsageAndLimit] usage_count={usage.usage_count}, usage_limit={limit}");
            return (usage.usage_count, limit);
        }

        // Efficient batch usage/limit fetch for all features (optimized: only 2 awaits)
        public async Task<Dictionary<string, (int usageCount, int usageLimit)>> GetAllFeatureUsage(string userId, Subscription? subscription = null)
        {
            var featureKeys = new List<string> {
                "resume_customization", "resume_optimization", "ats_scan", "resume_benchmarking", "cover_letter", "interview_questions"
            };
            if (subscription == null)
                subscription = await GetActiveSubscription(userId);
            var plan = subscription.subscription_type ?? "free";

            // Fetch all usage rows for this user in one call
            var usageUrl = $"{_supabaseHttpClientService.Url}/rest/v1/usage_tracking?user_id=eq.{Uri.EscapeDataString(userId)}&select=*";
            var usageResponse = await _supabaseHttpClientService.Client.GetAsync(usageUrl);
            var usageContent = await usageResponse.Content.ReadAsStringAsync();
            var usageRows = new List<UsageTracking>();
            if (usageResponse.IsSuccessStatusCode && !string.IsNullOrEmpty(usageContent))
            {
                usageRows = JsonSerializer.Deserialize<List<UsageTracking>>(usageContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new List<UsageTracking>();
            }

            // Fetch all plan limits for this plan in one call
            var planLimitUrl = $"{_supabaseHttpClientService.Url}/rest/v1/plan_limits?plan_name=eq.{Uri.EscapeDataString(plan)}&select=*";
            var planLimitResponse = await _supabaseHttpClientService.Client.GetAsync(planLimitUrl);
            var planLimitContent = await planLimitResponse.Content.ReadAsStringAsync();
            var planLimits = new List<Dictionary<string, object>>();
            if (planLimitResponse.IsSuccessStatusCode && !string.IsNullOrEmpty(planLimitContent))
            {
                planLimits = JsonSerializer.Deserialize<List<Dictionary<string, object>>>(planLimitContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new List<Dictionary<string, object>>();
            }

            // Map plan limits for quick lookup
            var planLimitMap = new Dictionary<string, int>();
            foreach (var row in planLimits)
            {
                if (row.TryGetValue("feature_type", out var featureTypeObj) && row.TryGetValue("usage_limit", out var usageLimitObj))
                {
                    var featureType = featureTypeObj?.ToString() ?? "";
                    if (int.TryParse(usageLimitObj?.ToString(), out int usageLimit))
                    {
                        planLimitMap[featureType] = usageLimit;
                    }
                }
            }

            // Map usage for quick lookup
            var usageMap = usageRows.ToDictionary(u => u.feature_type, u => u.usage_count);

            // Build result for all features
            var result = new Dictionary<string, (int usageCount, int usageLimit)>();
            foreach (var key in featureKeys)
            {
                var usageCount = usageMap.ContainsKey(key) ? usageMap[key] : 0;
                var usageLimit = planLimitMap.ContainsKey(key) ? planLimitMap[key] : 0;
                result[key] = (usageCount, usageLimit);
            }
            return result;
        }
    }
}
