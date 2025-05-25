using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using System;
using System.IO;
using System.Threading.Tasks;
using ResumeAI.API.Services;
using Microsoft.AspNetCore.Authorization;
using System.Text;
using System.Text.Json;
using System.Drawing;
using System.Drawing.Imaging;
using PdfSharpCore.Drawing;
using PdfSharpCore.Pdf;

namespace ResumeAI.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ResumeController : ControllerBase
    {
        private readonly ResumeService _resumeService;
        private readonly AuthService _authService;
        private readonly ActivityLogService _activityLogService;
        private readonly RecruiterSubscriptionService _recruiterSubscriptionService;
        private readonly CandidateSubscriptionService _candidateSubscriptionService;
        private readonly UserService _userService;

        public ResumeController(ResumeService resumeService, AuthService authService, ActivityLogService activityLogService, RecruiterSubscriptionService recruiterSubscriptionService, CandidateSubscriptionService candidateSubscriptionService, UserService userService)
        {
            _resumeService = resumeService;
            _authService = authService;
            _activityLogService = activityLogService;
            _recruiterSubscriptionService = recruiterSubscriptionService;
            _candidateSubscriptionService = candidateSubscriptionService;
            _userService = userService;
        }

        [HttpPost("analyze")]
        public async Task<IActionResult> AnalyzeResume([FromBody] ResumeAnalysisRequest request)
        {
            try
            {
                string userId = _authService.ExtractUserIdFromAuthHeader(Request.Headers["Authorization"].ToString());
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { error = "Invalid or missing authorization token" });
                if (string.IsNullOrEmpty(request.ResumeText) || string.IsNullOrEmpty(request.JobDescription))
                    return BadRequest(new { error = "Resume text and job description are required" });
                // Get user plan
                var profile = await _userService.GetUserProfileAsync(userId);
                var isRecruiter = profile?.UserType == "recruiter";
                var subscription = isRecruiter
                    ? await _recruiterSubscriptionService.GetRecruiterSubscription(userId)
                    : await _candidateSubscriptionService.GetCandidateSubscription(userId);
                var plan = subscription?.subscription_type ?? "free";
                await _activityLogService.LogActivity(userId, "resume_analyzed", "Resume analyzed against job description");
                // Usage is now tracked only after successful result
                var result = await _resumeService.AnalyzeResume(request.ResumeText, request.JobDescription, plan, userId, "resume_analysis", subscription);
                return Ok(result);
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

        [HttpPost("customize")]
        public async Task<IActionResult> CustomizeResume([FromForm] ResumeOptimizationRequest request)
        {
            try
            {
                string userId = _authService.ExtractUserIdFromAuthHeader(Request.Headers["Authorization"].ToString());
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { error = "Invalid or missing authorization token" });
                if (request.File == null || request.File.Length == 0)
                    return BadRequest(new { error = "Resume file is required" });
                if (request.File.Length > 5 * 1024 * 1024)
                    return BadRequest(new { error = "File size exceeds the 5MB limit" });
                var fileExtension = Path.GetExtension(request.File.FileName).ToLowerInvariant();
                if (fileExtension != ".pdf" && fileExtension != ".docx" && fileExtension != ".doc" && fileExtension != ".txt")
                    return BadRequest(new { error = "Only PDF, DOCX, DOC, and TXT files are supported" });

                // Extract job description text from file if present, otherwise use text
                string jobDescriptionText = request.JobDescription ?? string.Empty;
                if (request.JobDescriptionFile != null && request.JobDescriptionFile.Length > 0)
                {
                    using (var reader = new StreamReader(request.JobDescriptionFile.OpenReadStream()))
                    {
                        jobDescriptionText = await reader.ReadToEndAsync();
                    }
                }

                if (string.IsNullOrWhiteSpace(jobDescriptionText))
                    return BadRequest(new { error = "Job description is required (either as text or file)." });

                // Get user plan
                var profile = await _userService.GetUserProfileAsync(userId);
                var isRecruiter = profile?.UserType == "recruiter";
                var subscription = isRecruiter
                    ? await _recruiterSubscriptionService.GetRecruiterSubscription(userId)
                    : await _candidateSubscriptionService.GetCandidateSubscription(userId);
                var plan = subscription?.subscription_type ?? "free";
                await _activityLogService.LogActivity(userId, "resume_customized", "Resume customized for job description");

                var result = await _resumeService.CustomizeResume(
                    request.File,
                    jobDescriptionText,
                    plan,
                    userId,
                    "resume_customization",
                    subscription
                );

                return Ok(result);
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

        [HttpPost("benchmark")]
        public async Task<IActionResult> BenchmarkResume([FromBody] ResumeBenchmarkRequest request)
        {
            try
            {
                string userId = _authService.ExtractUserIdFromAuthHeader(Request.Headers["Authorization"].ToString());
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { error = "Invalid or missing authorization token" });
                if (string.IsNullOrEmpty(request.ResumeText) || string.IsNullOrEmpty(request.JobDescription))
                    return BadRequest(new { error = "Resume text and job description are required" });
                // Get user plan
                var profile = await _userService.GetUserProfileAsync(userId);
                var isRecruiter = profile?.UserType == "recruiter";
                var subscription = isRecruiter
                    ? await _recruiterSubscriptionService.GetRecruiterSubscription(userId)
                    : await _candidateSubscriptionService.GetCandidateSubscription(userId);
                var plan = subscription?.subscription_type ?? "free";
                await _activityLogService.LogActivity(userId, "resume_benchmarked", "Resume benchmarked against job description");
                var result = await _resumeService.BenchmarkResume(request.ResumeText, request.JobDescription, plan, userId, "resume_benchmark", subscription);
                return Ok(result);
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

        [HttpPost("scan-ats")]
        public async Task<IActionResult> ScanResumeWithATS([FromForm] IFormFile file, [FromForm] string? resumeText, [FromForm] string? plan)
        {
            try
            {
                string userId = _authService.ExtractUserIdFromAuthHeader(Request.Headers["Authorization"].ToString());
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { error = "Invalid or missing authorization token" });
                string text = resumeText??string.Empty;
                if (file != null && file.Length > 0)
                {
                    using (var reader = new StreamReader(file.OpenReadStream()))
                    {
                        text = await reader.ReadToEndAsync();
                    }
                }
                if (string.IsNullOrEmpty(text))
                    return BadRequest(new { error = "Resume text is required" });
                // Get user plan                
                var profile = await _userService.GetUserProfileAsync(userId);
                var isRecruiter = profile?.UserType == "recruiter";
                var subscription = isRecruiter
                    ? await _recruiterSubscriptionService.GetRecruiterSubscription(userId)
                    : await _candidateSubscriptionService.GetCandidateSubscription(userId);
                var userPlan = plan ?? subscription?.subscription_type ?? "free";
                var result = await _resumeService.ScanResumeWithATS(text, userPlan, userId, "ats_scan", subscription);
                if (result == null)
                {
                    return StatusCode(500, new { error = "Failed to analyze resume" });
                }
                if (result.ATSScore < 0)
                {
                    return StatusCode(500, new { error = "Failed to generate ATS score" });
                }
                var response = new
                {
                    atsScore = result.ATSScore,
                    parsedSections = result.ParsedSections,
                    parsingIssues = result.ParsingIssues,
                    optimizationTips = result.OptimizationTips
                };
                return Ok(response);
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

        [HttpPost("optimize")]
        public async Task<IActionResult> OptimizeResume([FromForm] ResumeOptimizationRequest request)
        {
            try
            {
                string userId = _authService.ExtractUserIdFromAuthHeader(Request.Headers["Authorization"].ToString());
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { error = "Invalid or missing authorization token" });
                if (request.File == null || request.File.Length == 0)
                    return BadRequest(new { error = "Resume file is required" });
                if (request.File.Length > 5 * 1024 * 1024)
                    return BadRequest(new { error = "File size exceeds the 5MB limit" });
                var fileExtension = Path.GetExtension(request.File.FileName).ToLowerInvariant();
                if (fileExtension != ".pdf" && fileExtension != ".docx" && fileExtension != ".doc" && fileExtension != ".txt")
                    return BadRequest(new { error = "Only PDF, DOCX, DOC, and TXT files are supported" });
                // Get user plan
                var profile = await _userService.GetUserProfileAsync(userId);
                var isRecruiter = profile?.UserType == "recruiter";
                var subscription = isRecruiter
                    ? await _recruiterSubscriptionService.GetRecruiterSubscription(userId)
                    : await _candidateSubscriptionService.GetCandidateSubscription(userId);
                var plan = subscription?.subscription_type ?? "free";
                await _activityLogService.LogActivity(userId, "resume_optimized", "Resume optimized for ATS and best practices");
                var result = await _resumeService.OptimizeResume(request.File, plan, userId, "resume_optimization", subscription);
                // Return the full Jobscan-style optimization report as JSON
                return Ok(result);
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

        // Helper method to generate a simple PDF from text
        private byte[] GeneratePdfFromText(string text)
        {
            using (var stream = new MemoryStream())
            {
                var document = new PdfDocument();
                var page = document.AddPage();
                var gfx = XGraphics.FromPdfPage(page);
                var font = new XFont("Arial", 12, XFontStyle.Regular);
                gfx.DrawString(text, font, XBrushes.Black, new XRect(40, 40, page.Width - 80, page.Height - 80), XStringFormats.TopLeft);
                document.Save(stream, false);
                return stream.ToArray();
            }
        }
    }

    public class ResumeAnalysisRequest
    {
        public string ResumeText { get; set; } = string.Empty;
        public string JobDescription { get; set; } = string.Empty;
    }

    public class ResumeCustomizationRequest
    {
        public string ResumeText { get; set; } = string.Empty;
        public string JobDescription { get; set; } = string.Empty;
    }

    public class ResumeBenchmarkRequest
    {
        public string ResumeText { get; set; } = string.Empty;
        public string JobDescription { get; set; } = string.Empty;
    }

    public class ResumeOptimizationRequest
    {
        public string? ResumeText { get; set; }
        public string JobDescription { get; set; } = string.Empty;
        public IFormFile? File { get; set; }
        public IFormFile? JobDescriptionFile { get; set; } // <-- Add this line
    }
}
