using ResumeAI.API.Models;
using System.Text.Json;
using System.Text;
using System.Threading.Tasks;
using System.Net.Http;
using System.Net.Http.Headers;
namespace ResumeAI.API.Services
{
    public class ActivityLogService
    {
        private readonly SupabaseHttpClientService _supabasehttpclientService;
        private readonly UserService _userService;
        
        public ActivityLogService(SupabaseHttpClientService supabasehttpclientService,UserService UserService)
        {
            _supabasehttpclientService = supabasehttpclientService;
            _userService = UserService;
        }      

        public async Task LogActivity(string userId, string actionType, string? description = null)
        {
            var log = new ActivityLog
            {
                user_id = userId,
                action_type = actionType,
                description = description,
                //Timestamp = DateTime.UtcNow,
                created_at = DateTime.UtcNow
            };
            
            await LogActivityAsync(log);
        }
        private async Task<ActivityLog> LogActivityAsync(ActivityLog log)
        {
            Console.WriteLine("LogActivityAsync Method in Backend Supabase Service entry");
            var url = $"{_supabasehttpclientService.Url}/rest/v1/activity_logs";
            
            var content = new StringContent(
                JsonSerializer.Serialize(log),
                Encoding.UTF8,
                "application/json");
            
            try {
                // Make sure we have the proper authorization headers set for this request
                // This ensures the service key is used for DB operations
                var serviceKey = _supabasehttpclientService.GetServiceKey();
                if (!string.IsNullOrEmpty(serviceKey)) {
                    Console.WriteLine("Using service key for activity logging");
                    _supabasehttpclientService.SetServiceKey();
                } else {
                    Console.WriteLine("Warning: No service key available for activity logging");
                }
                
                Console.WriteLine(" log activity content : "+JsonSerializer.Serialize(log));
                Console.WriteLine("LogActivityAsync Method-url in Backend Supabase Service: "+url);
                
                var response = await _supabasehttpclientService.Client.PostAsync(url, content);
                Console.WriteLine("LogActivityAsync Method response status: "+response.Content.ReadAsStringAsync().Result);
                Console.WriteLine("LogActivityAsync Method response status: "+response.StatusCode);
                
                // Check if unauthorized
                if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized) {
                    Console.WriteLine("Unauthorized response when logging activity. Check Supabase permissions and keys.");
                    // Continue execution without throwing - we don't want activity logging to break the application
                    return log;
                }
                
                response.EnsureSuccessStatusCode();
                
                Console.WriteLine("Activity logged successfully");
            }
            catch(Exception ex)
            {
                Console.WriteLine("Exception when logging activity: "+ex.ToString());
                // Don't rethrow - activity logging should not break application flow
            }
            return log;
        }

        public async Task<List<ActivityLog>> GetUserActivity(string userId)
        {
            return await _userService.GetUserActivityAsync(userId);
        }

        public async Task AddActivityLog(ActivityLog log)
        {
            await LogActivityAsync(log);
        }

        public async Task ResetFeatureUsage(string userId, string featureType, string plan)
        {
            var usage = await _userService.GetFeatureUsageAsync(userId, featureType, plan);
            usage.usage_count = 0;
            usage.last_used = DateTime.UtcNow;
            usage.updated_at = DateTime.UtcNow;
            await _userService.UpdateUsageTrackingAsync(usage);
        }

        public async Task<UsageTracking> TrackFeatureUsage(string userId, string featureType, string plan)
        {
            // No increment or usage logic here for free candidate flow
            // Only delegate to UserService if needed for other flows
            return await _userService.GetFeatureUsageAsync(userId, featureType, plan);
        }

        public async Task<UsageTracking> TrackFeatureUsage(string userId, string featureType, Subscription? subscription = null)
        {
            // Use plan from subscription if provided, otherwise fallback to userService logic
            string plan = subscription?.subscription_type ?? "free";
            return await _userService.TrackFeatureUsage(userId, featureType, subscription);
        }

        public async Task<List<UsageTracking>> GetUserUsage(string userId, string plan = "free")
        {
            var features = new[] { "resume_optimization", "job_optimization", "cover_letter", "interview_questions" };
            var result = new List<UsageTracking>();
            foreach (var feature in features)
            {
                var usage = await _userService.GetFeatureUsageAsync(userId, feature, plan);
                result.Add(usage);
            }
            return result;
        }

        public async Task<UsageTracking> GetFeatureUsage(string userId, string featureType, string plan = "free")
        {
            return await _userService.GetFeatureUsageAsync(userId, featureType, plan);
        }

        public async Task ResetUsageLimits(string userId, string plan = "free")
        {
            var features = new[] { "resume_optimization", "job_optimization", "cover_letter", "interview_questions" };
            foreach (var feature in features)
            {
                var usage = await _userService.GetFeatureUsageAsync(userId, feature, plan);
                usage.updated_at = DateTime.UtcNow;
                await _userService.UpdateUsageTrackingAsync(usage);
            }
        }
    }
}
