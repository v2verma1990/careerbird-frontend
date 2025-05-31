using Microsoft.AspNetCore.Mvc;
using ResumeAI.API.Services;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;

namespace ResumeAI.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Added authorize attribute
    public class SubscriptionController : ControllerBase
    {
        private readonly RecruiterSubscriptionService _recruiterSubscriptionService;
        private readonly CandidateSubscriptionService _candidateSubscriptionService;
        private readonly UserService _userService;
        private readonly AuthService _authService;

        public SubscriptionController(AuthService authService, RecruiterSubscriptionService recruiterSubscriptionService, CandidateSubscriptionService candidateSubscriptionService, UserService userService)
        {
            _recruiterSubscriptionService = recruiterSubscriptionService;
            _candidateSubscriptionService = candidateSubscriptionService;
            _userService = userService;
            _authService = authService;
        }

        [HttpGet("current")]
        public async Task<IActionResult> GetCurrentSubscription()
        {
            try
            {
                // Extract user ID from the Authorization header
                string userId = _authService.ExtractUserIdFromAuthHeader(Request.Headers["Authorization"].ToString());
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { error = "Invalid or missing authorization token" });
                }
                var profile = await _userService.GetUserProfileAsync(userId);
                var isRecruiter = profile?.UserType == "recruiter";
                var subscription = isRecruiter
                    ? await _recruiterSubscriptionService.GetRecruiterSubscription(userId)
                    : await _candidateSubscriptionService.GetCandidateSubscription(userId);
                return Ok(subscription);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("upgrade")]
        public async Task<IActionResult> UpgradeSubscription([FromBody] UpgradeSubscriptionRequest request)
        {
            try
            {
                Console.WriteLine($"UpgradeSubscription API called with type: {request.SubscriptionType}");
                
                string userId = _authService.ExtractUserIdFromAuthHeader(Request.Headers["Authorization"].ToString());
                if (string.IsNullOrEmpty(userId))
                {
                    Console.WriteLine("Unauthorized: Invalid or missing authorization token");
                    return Unauthorized(new { error = "Invalid or missing authorization token" });
                }
                
                Console.WriteLine($"Upgrading subscription for user: {userId}");
                var profile = await _userService.GetUserProfileAsync(userId);
                Console.WriteLine($"User profile retrieved: {profile?.Id}, UserType: {profile?.UserType}");
                
                var isRecruiter = profile?.UserType == "recruiter";
                Console.WriteLine($"User is a {(isRecruiter ? "recruiter" : "candidate")}");
                
                var subscription = isRecruiter
                    ? await _recruiterSubscriptionService.UpgradeRecruiterSubscription(userId, request.SubscriptionType)
                    : await _candidateSubscriptionService.UpgradeCandidateSubscription(userId, request.SubscriptionType);
                
                Console.WriteLine($"Subscription upgraded successfully to {subscription.subscription_type}");
                
                // Verify the subscription was actually created/updated
                var currentSubscription = isRecruiter
                    ? await _recruiterSubscriptionService.GetRecruiterSubscription(userId)
                    : await _candidateSubscriptionService.GetCandidateSubscription(userId);
                
                Console.WriteLine($"Current subscription after upgrade: {currentSubscription.subscription_type}");
                
                if (currentSubscription.subscription_type != request.SubscriptionType)
                {
                    Console.WriteLine("Warning: Subscription type mismatch after upgrade");
                    return StatusCode(500, new { 
                        error = "Subscription upgrade may have failed. Please try again or contact support.",
                        requested = request.SubscriptionType,
                        current = currentSubscription.subscription_type
                    });
                }
                
                return Ok(new { 
                    success = true, 
                    message = $"Subscription upgraded to {subscription.subscription_type}",
                    subscription = subscription 
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                Console.WriteLine($"Unauthorized: {ex.Message}");
                return Unauthorized(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in UpgradeSubscription: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                }
                return StatusCode(500, new { error = ex.Message });
            }
        }
        [HttpPost("cancel")]
        public async Task<IActionResult> CancelSubscription()
        {
            try
            {
                string userId = _authService.ExtractUserIdFromAuthHeader(Request.Headers["Authorization"].ToString());
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { error = "Invalid or missing authorization token" });
                }
                var profile = await _userService.GetUserProfileAsync(userId);
                var isRecruiter = profile?.UserType == "recruiter";
                var subscription = isRecruiter
                    ? await _recruiterSubscriptionService.CancelRecruiterSubscription(userId)
                    : await _candidateSubscriptionService.CancelCandidateSubscription(userId);
                return Ok(subscription);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }

    public class UpgradeSubscriptionRequest
    {
        public string SubscriptionType { get; set; } = "premium";
    }
}
