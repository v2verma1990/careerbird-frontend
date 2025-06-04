using Microsoft.AspNetCore.Mvc;
using ResumeAI.API.Models;
using ResumeAI.API.Services;
using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using System.Text.Json;

namespace ResumeAI.API.Controllers
{
    [ApiController]
    [Authorize] 
    [Route("api/[controller]")]
    public class UsageController : ControllerBase
    {
        private readonly ActivityLogService _activityLogService;
        private readonly UserService _userService;

        public UsageController(ActivityLogService activityLogService, UserService userService)
        {
            _activityLogService = activityLogService;
            _userService = userService;
        }

        [HttpGet("{userId}")]
        public async Task<IActionResult> GetUserUsage(string userId)
        {
            if (string.IsNullOrEmpty(userId))
            {
                return BadRequest(new { error = "User ID is required" });
            }
            
            try
            {
                var logs = await _activityLogService.GetUserActivity(userId);
                return Ok(logs);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("{userId}/{featureType}")]
        public async Task<IActionResult> GetFeatureUsage(string userId, string featureType)
        {
            if (string.IsNullOrEmpty(userId))
            {
                return BadRequest(new { error = "User ID is required" });
            }
            
            try
            {
                Console.WriteLine($"Getting feature usage for user {userId}, feature: {featureType}");
                // Always use UserService.GetUsageAndLimit for robust, plan-based logic
                var (usageCount, usageLimit) = await _userService.GetUsageAndLimit(userId, featureType);
                var result = new { usageCount, usageLimit };
                
                Console.WriteLine($"Feature usage: {JsonSerializer.Serialize(result)}");
                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting feature usage: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("log-activity")]
        public async Task<IActionResult> LogActivity([FromBody] ActivityLogRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.UserId) || string.IsNullOrEmpty(request.ActionType))
            {
                Console.WriteLine("Invalid activity log data");
                return BadRequest("Invalid activity log data");
            }

            try
            {
                Console.WriteLine($"Logging activity for user {request.UserId}: {request.ActionType}");
                
                var log = new ActivityLog
                {
                    user_id = request.UserId,
                    action_type = request.ActionType,
                    description = request.Description ?? string.Empty,
                    created_at = DateTime.UtcNow
                };

                await _activityLogService.AddActivityLog(log);
                return Ok(log);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error logging activity: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("increment")]
        public async Task<IActionResult> IncrementUsage([FromBody] UsageIncrementRequest request)
        {
            // Log the received request for debugging
            Console.WriteLine($"Received increment usage request: {JsonSerializer.Serialize(request)}");
            
            if (request == null)
            {
                Console.WriteLine("Request body is null");
                return BadRequest(new { error = "Invalid usage increment data - null request" });
            }
            
            if (string.IsNullOrEmpty(request.UserId))
            {
                Console.WriteLine("UserId is missing in request");
                return BadRequest(new { error = "Invalid usage increment data - missing user ID" });
            }
            
            if (string.IsNullOrEmpty(request.FeatureType))
            {
                Console.WriteLine("FeatureType is missing, using default");
                request.FeatureType = "default";
            }

            try
            {
                Console.WriteLine($"Incrementing usage for user {request.UserId}, feature: {request.FeatureType}");
                
                // Track the feature usage
                var usage = await _userService.TrackFeatureUsage(request.UserId, request.FeatureType);
                
                // Get the usage limit
                var usageLimit = await GetUserUsageLimit(request.UserId, request.FeatureType);
                
                var result = new
                {
                    newCount = usage.usage_count,
                    usageLimit = usageLimit
                };
                
                Console.WriteLine($"New usage count: {JsonSerializer.Serialize(result)}");
                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error incrementing usage: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }
        [HttpPost("reset")]
        public async Task<IActionResult> ResetUsageCount([FromBody] UsageResetRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.UserId) || string.IsNullOrEmpty(request.FeatureType))
            {
                return BadRequest("Invalid usage reset data");
            }

            try
            {
                var profile = await _userService.GetProfile(request.UserId);
                var subscription = await _userService.GetActiveSubscription(request.UserId);
                var plan = subscription?.subscription_type ?? "free";

                await _activityLogService.ResetFeatureUsage(request.UserId, request.FeatureType, plan);

                return Ok(new
                {
                    message = $"Usage count for {request.FeatureType} has been reset",
                    success = true
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
                // Efficient endpoint: Get usage/limit for all features in one call
                [HttpGet("all/{userId}")]
                public async Task<IActionResult> GetAllFeatureUsage(string userId)
                {
                    if (string.IsNullOrEmpty(userId))
                    {
                        return BadRequest(new { error = "User ID is required" });
                    }
                    try
                    {
                        // List of all feature keys (should match frontend)
                        var featureKeys = new List<string> {
                            "resume_customization", "resume_optimization", "ats_scan", "resume_benchmarking", "cover_letter", "interview_questions", "salary_insights", "resume_builder"
                        };
                        var subscription = await _userService.GetActiveSubscription(userId);
                        var usageDict = new Dictionary<string, object>();
                        foreach (var key in featureKeys)
                        {
                            var (usageCount, usageLimit) = await _userService.GetUsageAndLimit(userId, key, subscription);
                            usageDict[key] = new { usageCount, usageLimit };
                        }
                        return Ok(usageDict);
                    }
                    catch (Exception ex)
                    {
                        return StatusCode(500, new { error = ex.Message });
                    }
                }

                private async Task<int> GetUserUsageLimit(string userId, string featureType)
                {
                    // Get profile to determine user type and subscription
                    var profile = await _userService.GetProfile(userId);
                    var subscription = await _userService.GetActiveSubscription(userId);

                    // Default limits based on subscription type (case insensitive comparison)
                    if (subscription != null && !string.Equals(subscription.subscription_type, "free", StringComparison.OrdinalIgnoreCase))
                    {
                        return string.Equals(subscription.subscription_type, "premium", StringComparison.OrdinalIgnoreCase) ? 999 : 10;
                    }

                    // Free tier limits
                    return string.Equals(profile.UserType, "recruiter", StringComparison.OrdinalIgnoreCase) ? 5 : 3;
                }
            }

    public class ActivityLogRequest
    {
        public string UserId { get; set; } = string.Empty;
        public string ActionType { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    public class UsageIncrementRequest
    {
        public string UserId { get; set; } = string.Empty;
        public string FeatureType { get; set; } = string.Empty;
    }

    public class UsageResetRequest
    {
        public string UserId { get; set; } = string.Empty;
        public string FeatureType { get; set; } = string.Empty;
    }
}
