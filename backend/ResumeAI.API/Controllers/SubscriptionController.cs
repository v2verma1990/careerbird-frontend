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
                string userId = _authService.ExtractUserIdFromAuthHeader(Request.Headers["Authorization"].ToString());
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { error = "Invalid or missing authorization token" });
                }
                var profile = await _userService.GetUserProfileAsync(userId);
                var isRecruiter = profile?.UserType == "recruiter";
                var subscription = isRecruiter
                    ? await _recruiterSubscriptionService.UpgradeRecruiterSubscription(userId, request.SubscriptionType)
                    : await _candidateSubscriptionService.UpgradeCandidateSubscription(userId, request.SubscriptionType);
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
