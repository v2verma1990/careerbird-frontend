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
using System.ComponentModel.DataAnnotations;

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
        public async Task<IActionResult> CustomizeResume([FromForm] ResumeCustomizationRequestModel request)
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
                if (!new[] { ".pdf", ".docx", ".doc", ".txt" }.Contains(fileExtension))
                    return BadRequest(new { error = "Only PDF, DOCX, DOC, and TXT files are supported" });

                string jobDescriptionText = request.JobDescription ?? string.Empty;
                IFormFile? jobDescriptionFile = request.JobDescriptionFile;

                // If a file is uploaded, ignore the text and send only the file
                if (jobDescriptionFile != null && jobDescriptionFile.Length > 0)
                {
                    jobDescriptionText = string.Empty;
                }

                // If neither text nor file is provided, return an error
                if (string.IsNullOrWhiteSpace(jobDescriptionText) && (jobDescriptionFile == null || jobDescriptionFile.Length == 0))
                    return BadRequest(new { error = "Job description is required (either as text or file)." });

                // Get user plan
                var profile = await _userService.GetUserProfileAsync(userId);
                var isRecruiter = profile?.UserType == "recruiter";
                var subscription = isRecruiter
                    ? await _recruiterSubscriptionService.GetRecruiterSubscription(userId)
                    : await _candidateSubscriptionService.GetCandidateSubscription(userId);
                var plan = subscription?.subscription_type ?? "free";

                await _activityLogService.LogActivity(userId, "resume_customized", "Resume customized for job description");

                try
                {
                    var result = await _resumeService.CustomizeResume(
                        request.File,
                        jobDescriptionText,
                        plan,
                        userId,
                        "resume_customization",
                        jobDescriptionFile,
                        subscription
                    );
                    return Ok(result);
                }
                catch (HttpRequestException ex)  // 🌟 Captures Python API errors & forwards them correctly
                {
                    return StatusCode(500, new { error = ex.Message });
                }
                catch (ArgumentException ex)  // 🌟 Handles validation errors separately
                {
                    return BadRequest(new { error = ex.Message });
                }
                catch (Exception ex)  // 🌟 Handles unexpected .NET errors gracefully
                {
                    return StatusCode(500, new { error = $"Internal Server Error: {ex.Message}" });
                }
            }
            catch (UnauthorizedAccessException ex)  // 🌟 Handles authorization errors explicitly
            {
                return Unauthorized(new { error = ex.Message });
            }
        }

        [HttpPost("optimize")]
        public async Task<IActionResult> OptimizeResume([FromForm] ResumeOptimizationRequestModel request)
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
                if (!new[] { ".pdf", ".docx", ".doc", ".txt" }.Contains(fileExtension))
                    return BadRequest(new { error = "Only PDF, DOCX, DOC, and TXT files are supported" });

                // Get user plan
                var profile = await _userService.GetUserProfileAsync(userId);
                var isRecruiter = profile?.UserType == "recruiter";
                var subscription = isRecruiter
                    ? await _recruiterSubscriptionService.GetRecruiterSubscription(userId)
                    : await _candidateSubscriptionService.GetCandidateSubscription(userId);
                var plan = subscription?.subscription_type ?? "free";
                await _activityLogService.LogActivity(userId, "resume_optimized", "Resume optimized for ATS and best practices");
                try
                {
                    var result = await _resumeService.OptimizeResume(
                        request.File,
                        plan,
                        userId,
                        "resume_optimization",
                        subscription
                    );
                    return Ok(result);
                }
                catch (HttpRequestException ex)  // 🌟 Captures Python API errors & forwards them correctly
                {
                    return StatusCode(500, new { error = ex.Message });
                }
                catch (ArgumentException ex)  // 🌟 Handles validation errors separately
                {
                    return BadRequest(new { error = ex.Message });
                }
                catch (Exception ex)  // 🌟 Handles unexpected .NET errors gracefully
                {
                    return StatusCode(500, new { error = $"Internal Server Error: {ex.Message}" });
                }
            }
            catch (UnauthorizedAccessException ex)  // 🌟 Handles authorization errors explicitly
            {
                return Unauthorized(new { error = ex.Message });
            }
        }

        [HttpPost("scan-ats")]
        public async Task<IActionResult> ScanResumeWithATS([FromForm] ResumeATSRequestModel request)
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
                if (!new[] { ".pdf", ".docx", ".doc", ".txt" }.Contains(fileExtension))
                    return BadRequest(new { error = "Only PDF, DOCX, DOC, and TXT files are supported" });

                // Get user plan
                var profile = await _userService.GetUserProfileAsync(userId);
                var isRecruiter = profile?.UserType == "recruiter";
                var subscription = isRecruiter
                    ? await _recruiterSubscriptionService.GetRecruiterSubscription(userId)
                    : await _candidateSubscriptionService.GetCandidateSubscription(userId);
                var plan = subscription?.subscription_type ?? "free";
                await _activityLogService.LogActivity(userId, "resume_ATS Scan", "Resume scan for ATS and recomendations");
                try
                {
                    var result = await _resumeService.ScanResumeWithATS(
                        request.File,
                        plan,
                        userId,
                        "ats_scan",
                        subscription
                    );
                    return Ok(result);
                }
                catch (HttpRequestException ex)  // 🌟 Captures Python API errors & forwards them correctly
                {
                    return StatusCode(500, new { error = ex.Message });
                }
                catch (ArgumentException ex)  // 🌟 Handles validation errors separately
                {
                    return BadRequest(new { error = ex.Message });
                }
                catch (Exception ex)  // 🌟 Handles unexpected .NET errors gracefully
                {
                    return StatusCode(500, new { error = $"Internal Server Error: {ex.Message}" });
                }
            }
            catch (UnauthorizedAccessException ex)  // 🌟 Handles authorization errors explicitly
            {
                return Unauthorized(new { error = ex.Message });
            }
        }

        [HttpPost("salary-insights")]
        public async Task<IActionResult> GetSalaryInsights([FromForm] SalaryInsightsRequestModel request)
        {
            try
            {
                string userId = _authService.ExtractUserIdFromAuthHeader(Request.Headers["Authorization"].ToString());

                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { error = "Invalid or missing authorization token" });
                if (string.IsNullOrEmpty(request.JobTitle) || string.IsNullOrEmpty(request.Location))
                    return BadRequest(new { error = "Job title and location are required" });
                if (request.YearsExperience < 0)
                    return BadRequest(new { error = "Years of experience cannot be negative" });
                if (request.Resume != null && request.Resume.Length > 5 * 1024 * 1024)
                    return BadRequest(new { error = "Resume file size exceeds the 5MB limit" });
                var fileExtension = request.Resume != null ? Path.GetExtension(request.Resume.FileName).ToLowerInvariant() : string.Empty;
                if (request.Resume != null && !new[] { ".pdf", ".docx", ".doc", ".txt" }.Contains(fileExtension))
                    return BadRequest(new { error = "Only PDF, DOCX, DOC, and TXT files are supported for resume" });
                // Get user plan
                var profile = await _userService.GetUserProfileAsync(userId);
                var isRecruiter = profile?.UserType == "recruiter";
                var subscription = isRecruiter
                    ? await _recruiterSubscriptionService.GetRecruiterSubscription(userId)
                    : await _candidateSubscriptionService.GetCandidateSubscription(userId);
                var plan = subscription?.subscription_type ?? "free";
                await _activityLogService.LogActivity(userId, "salary_insights_requested", "Salary insights requested for job title and location");
                try
                {
                    var result = await _resumeService.GetSalaryInsightsAsync(
                        request.JobTitle,
                        request.Location,
                        request.Industry,
                        request.YearsExperience,
                        plan,
                        userId,
                        "salary_insights",
                        subscription,
                        request.EducationLevel,
                        request.Resume
                    );
                    return Ok(result);
                }
                catch (HttpRequestException ex)  // 🌟 Captures Python API errors & forwards them correctly
                {
                    return StatusCode(500, new { error = ex.Message });
                }
                catch (ArgumentException ex)  // 🌟 Handles validation errors separately
                {
                    return BadRequest(new { error = ex.Message });
                }
                catch (Exception ex)  // 🌟 Handles unexpected .NET errors gracefully
                {
                    return StatusCode(500, new { error = $"Internal Server Error: {ex.Message}" });
                }
            }
            catch (UnauthorizedAccessException ex)  // 🌟 Handles authorization errors explicitly
            {
                return Unauthorized(new { error = ex.Message });
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

        public class ResumeCustomizationRequestModel
        {
            
            public string? ResumeText { get; set; }
            public string JobDescription { get; set; } = string.Empty;
            public IFormFile? File { get; set; }
            public IFormFile? JobDescriptionFile { get; set; } // <-- Add this line
        }
        public class ResumeOptimizationRequestModel
        {
            [Required]
            public IFormFile? File { get; set; }
        }
        public class ResumeATSRequestModel
        {
            [Required]
            public IFormFile? File { get; set; }
        }

        public class SalaryInsightsRequestModel
        {
            [Required]
            public required string JobTitle { get; set; } 
            [Required]
            public required string Location { get; set; } 
            [Required]
            public required string Industry { get; set; } 
            [Required]
            public required int YearsExperience { get; set; }
            public string? EducationLevel { get; set; }
            public IFormFile? Resume { get; set; }
        }
    }
}
