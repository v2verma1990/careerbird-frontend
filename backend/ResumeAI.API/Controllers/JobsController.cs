using Microsoft.AspNetCore.Mvc;
using ResumeAI.API.Models;
using ResumeAI.API.Services;
using System.Threading.Tasks;

namespace ResumeAI.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class JobsController : ControllerBase
    {
        private readonly JobsService _jobsService;
        private readonly UserService _userService;
        private readonly ActivityLogService _activityLogService;
        private readonly RecruiterSubscriptionService _recruiterSubscriptionService;
        private readonly CandidateSubscriptionService _candidateSubscriptionService;
        private readonly AuthService _authService;

        public JobsController(
            JobsService jobsService, AuthService authService,
            UserService userService,
            ActivityLogService activityLogService,
            RecruiterSubscriptionService recruiterSubscriptionService,
            CandidateSubscriptionService candidateSubscriptionService)
        {
            _jobsService = jobsService;
            _userService = userService;
            _activityLogService = activityLogService;
            _recruiterSubscriptionService = recruiterSubscriptionService;
            _candidateSubscriptionService = candidateSubscriptionService;
            _authService = authService;
        }

        [HttpPost("optimize")]
        public async Task<IActionResult> OptimizeJobDescription([FromBody] OptimizeJobRequest request)
        {
            string userId = _authService.GetUserIdFromRequest(Request);
            if (string.IsNullOrEmpty(userId))
            {
                // If userId wasn't in the Authorization header, check if it's in the request body
                userId = request.UserId;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { error = "User not authenticated" });
                }
            }
            
            // Check subscription status and usage limits
            // Determine user type from profile
            var profile = await _userService.GetUserProfileAsync(userId);
            var isRecruiter = profile?.UserType == "recruiter";
            var subscription = isRecruiter
                ? await _recruiterSubscriptionService.GetRecruiterSubscription(userId)
                : await _candidateSubscriptionService.GetCandidateSubscription(userId);
            
            var usageTracking = await _activityLogService.GetFeatureUsage(userId, "job_description_optimization");
            
            if (subscription.subscription_type == "free" && usageTracking.usage_count >= await _userService.GetPlanLimit(subscription.subscription_type, "job_description_optimization"))
            {
                return BadRequest(new { error = "Usage limit reached. Please upgrade your subscription." });
            }
            
            // Track usage
            await _userService.TrackFeatureUsage(userId, "job_description_optimization");
            
            // Optimize job description
            var optimizedDescription = _jobsService.OptimizeJobDescription(request.JobDescription, subscription.subscription_type);
            
            // Log activity
            await _activityLogService.LogActivity(userId, "job_description_optimized", "Job description optimized");
            
            return Ok(optimizedDescription);
        }

        [HttpPost("candidates")]
        public async Task<IActionResult> FindBestCandidates([FromBody] FindCandidatesRequest request)
        {
            string userId = _authService.GetUserIdFromRequest(Request);
            if (string.IsNullOrEmpty(userId))
            {
                // If userId wasn't in the Authorization header, check if it's in the request body
                userId = request.UserId;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { error = "User not authenticated" });
                }
            }
            
            // Check subscription and usage
            // Determine user type from profile
            var profile = await _userService.GetUserProfileAsync(userId);
            var isRecruiter = profile?.UserType == "recruiter";
            var subscription = isRecruiter
                ? await _recruiterSubscriptionService.GetRecruiterSubscription(userId)
                : await _candidateSubscriptionService.GetCandidateSubscription(userId);
            
            var usageTracking = await _activityLogService.GetFeatureUsage(userId, "candidate_matching");
            
            if (subscription.subscription_type == "free" && usageTracking.usage_count >= await _userService.GetPlanLimit(subscription.subscription_type, "candidate_matching"))
            {
                return BadRequest(new { error = "Usage limit reached. Please upgrade your subscription." });
            }
            
            // Track usage
            await _userService.TrackFeatureUsage(userId, "candidate_matching");
            
            // Find candidates
            var candidates = _jobsService.FindBestCandidates(request.JobDescription, subscription.subscription_type);
            
            // Log activity
            await _activityLogService.LogActivity(userId, "candidates_found", "Matched candidates for job description");
            
            return Ok(new { candidates = candidates });
        }

        [HttpPost("optimizeResume")]
        public async Task<IActionResult> OptimizeResume([FromBody] OptimizeResumeRequest request)
        {
            string userId = _authService.GetUserIdFromRequest(Request);
            if (string.IsNullOrEmpty(userId))
            {
                // If userId wasn't in the Authorization header, check if it's in the request body
                userId = request.UserId;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { error = "User not authenticated" });
                }
            }
            
            // Check subscription and usage
            // Determine user type from profile
            var profile = await _userService.GetUserProfileAsync(userId);
            var isRecruiter = profile?.UserType == "recruiter";
            var subscription = isRecruiter
                ? await _recruiterSubscriptionService.GetRecruiterSubscription(userId)
                : await _candidateSubscriptionService.GetCandidateSubscription(userId);
            
            var usageTracking = await _activityLogService.GetFeatureUsage(userId, "resume_optimization");
            
            if (subscription.subscription_type == "free" && usageTracking.usage_count >= await _userService.GetPlanLimit(subscription.subscription_type, "resume_optimization"))
            {
                return BadRequest(new { error = "Usage limit reached. Please upgrade your subscription." });
            }
            
            // Track usage
            await _userService.TrackFeatureUsage(userId, "resume_optimization");
            
            // Optimize resume
            var optimizedResume = _jobsService.OptimizeResume(request.ResumeContent, request.JobDescription, subscription.subscription_type);
            
            // Log activity
            await _activityLogService.LogActivity(userId, "resume_optimized", "Resume optimized for job description");
            
            return Ok(optimizedResume);
        }
        
        [HttpPost("coverLetter")]
        public async Task<IActionResult> GenerateCoverLetter([FromBody] CoverLetterRequest request)
        {
            string userId = _authService.GetUserIdFromRequest(Request);
            if (string.IsNullOrEmpty(userId))
            {
                // If userId wasn't in the Authorization header, check if it's in the request body
                userId = request.UserId;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { error = "User not authenticated" });
                }
            }
            
            // Check subscription and usage
            // Determine user type from profile
            var profile = await _userService.GetUserProfileAsync(userId);
            var isRecruiter = profile?.UserType == "recruiter";
            var subscription = isRecruiter
                ? await _recruiterSubscriptionService.GetRecruiterSubscription(userId)
                : await _candidateSubscriptionService.GetCandidateSubscription(userId);
            
            var usageTracking = await _activityLogService.GetFeatureUsage(userId, "cover_letter_generation");
            
            if (subscription.subscription_type == "free" && usageTracking.usage_count >= await _userService.GetPlanLimit(subscription.subscription_type, "cover_letter_generation"))
            {
                return BadRequest(new { error = "Usage limit reached. Please upgrade your subscription." });
            }
            
            // Track usage
            await _userService.TrackFeatureUsage(userId, "cover_letter_generation");
            
            // Generate cover letter
            var coverLetter = _jobsService.GenerateCoverLetter(request.JobTitle, request.Company, request.JobDescription, subscription.subscription_type);
            
            // Log activity
            await _activityLogService.LogActivity(userId, "cover_letter_generated", "Cover letter generated");
            
            return Ok(coverLetter);
        }
        
        [HttpPost("interviewQuestions")]
        public async Task<IActionResult> GenerateInterviewQuestions([FromBody] InterviewQuestionsRequest request)
        {
            string userId = _authService.GetUserIdFromRequest(Request);
            if (string.IsNullOrEmpty(userId))
            {
                // If userId wasn't in the Authorization header, check if it's in the request body
                userId = request.UserId;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { error = "User not authenticated" });
                }
            }
            
            // Check subscription and usage
            // Determine user type from profile
            var profile = await _userService.GetUserProfileAsync(userId);
            var isRecruiter = profile?.UserType == "recruiter";
            var subscription = isRecruiter
                ? await _recruiterSubscriptionService.GetRecruiterSubscription(userId)
                : await _candidateSubscriptionService.GetCandidateSubscription(userId);
            
            var usageTracking = await _activityLogService.GetFeatureUsage(userId, "interview_question_generation");
            
            if (subscription.subscription_type == "free" && usageTracking.usage_count >= await _userService.GetPlanLimit(subscription.subscription_type, "interview_question_generation"))
            {
                return BadRequest(new { error = "Usage limit reached. Please upgrade your subscription." });
            }
            
            // Track usage
            await _userService.TrackFeatureUsage(userId, "interview_question_generation");
            
            // Generate interview questions
            var questions = _jobsService.GenerateInterviewQuestions(request.JobTitle, subscription.subscription_type);
            
            // Log activity
            await _activityLogService.LogActivity(userId, "interview_questions_generated", "Interview questions generated");
            
            return Ok(new { questions = questions });
        }
        
        [HttpPost("scanResume")]
        public async Task<IActionResult> ScanResumeWithATS([FromBody] ScanResumeRequest request)
        {
            string userId = _authService.GetUserIdFromRequest(Request);
            if (string.IsNullOrEmpty(userId))
            {
                // If userId wasn't in the Authorization header, check if it's in the request body
                userId = request.UserId;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { error = "User not authenticated" });
                }
            }
            
            // Check subscription and usage
            // Determine user type from profile
            var profile = await _userService.GetUserProfileAsync(userId);
            var isRecruiter = profile?.UserType == "recruiter";
            var subscription = isRecruiter
                ? await _recruiterSubscriptionService.GetRecruiterSubscription(userId)
                : await _candidateSubscriptionService.GetCandidateSubscription(userId);
            
            var usageTracking = await _activityLogService.GetFeatureUsage(userId, "resume_scanning");
            
            if (subscription.subscription_type == "free" && usageTracking.usage_count >= await _userService.GetPlanLimit(subscription.subscription_type, "resume_scanning"))
            {
                return BadRequest(new { error = "Usage limit reached. Please upgrade your subscription." });
            }
            
            // Track usage
            await _userService.TrackFeatureUsage(userId, "resume_scanning");
            
            // Scan resume with ATS
            var scanResult = _jobsService.ScanResumeWithATS(request.ResumeContent, subscription.subscription_type, request.JobDescription);
            
            // Log activity
            await _activityLogService.LogActivity(userId, "resume_scanned", "Resume scanned with ATS");
            
            return Ok(scanResult);
        }
    }

    public class OptimizeJobRequest
    {
        public string UserId { get; set; } = string.Empty;
        public string JobDescription { get; set; } = string.Empty;
    }

    public class FindCandidatesRequest
    {
        public string UserId { get; set; } = string.Empty;
        public string JobDescription { get; set; } = string.Empty;
    }

    public class OptimizeResumeRequest
    {
        public string UserId { get; set; } = string.Empty;
        public string ResumeContent { get; set; } = string.Empty;
        public string JobDescription { get; set; } = string.Empty;
    }
    
    public class CoverLetterRequest
    {
        public string UserId { get; set; } = string.Empty;
        public string JobTitle { get; set; } = string.Empty;
        public string Company { get; set; } = string.Empty;
        public string JobDescription { get; set; } = string.Empty;
    }
    
    public class InterviewQuestionsRequest
    {
        public string UserId { get; set; } = string.Empty;
        public string JobTitle { get; set; } = string.Empty;
        public string JobDescription { get; set; } = string.Empty;
    }
    
    public class ScanResumeRequest
    {
        public string UserId { get; set; } = string.Empty;
        public string ResumeContent { get; set; } = string.Empty;
        public string JobDescription { get; set; } = string.Empty;
    }
}
