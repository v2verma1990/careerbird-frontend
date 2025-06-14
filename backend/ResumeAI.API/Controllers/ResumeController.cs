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
using System.Linq;

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
        private readonly IStorageService _storageService;
        private readonly ProfileMetadataService _profileMetadataService;

        public ResumeController(
            ResumeService resumeService,
            AuthService authService,
            ActivityLogService activityLogService,
            RecruiterSubscriptionService recruiterSubscriptionService,
            CandidateSubscriptionService candidateSubscriptionService,
            UserService userService,
            IStorageService storageService,
            ProfileMetadataService profileMetadataService)
        {
            _resumeService = resumeService;
            _authService = authService;
            _activityLogService = activityLogService;
            _recruiterSubscriptionService = recruiterSubscriptionService;
            _candidateSubscriptionService = candidateSubscriptionService;
            _userService = userService;
            _storageService = storageService;
            _profileMetadataService = profileMetadataService;
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
                var userProfile = await _userService.GetUserProfileAsync(userId);
                var isRecruiter = userProfile?.UserType == "recruiter";
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

                IFormFile? resumeFile = request.File;

                // Check if we should use the default resume
                if (request.UseDefaultResume)
                {
                    // Fetch the user's profile metadata instead of the main profile
                    var profileMeta = await _profileMetadataService.GetProfileMetadataAsync(userId);
                    if (profileMeta == null || string.IsNullOrEmpty(profileMeta.BlobPath))
                    {
                        return BadRequest(new { error = "No default resume found. Please upload a resume file or set a default resume." });
                    }

                    try
                    {
                        // Download the default resume to a memory stream
                        (Stream content, string contentType, string fileName) = await _storageService.DownloadFileAsync(profileMeta.BlobPath);

                        // Create a temporary file
                        var tempFilePath = Path.GetTempFileName();
                        using (var writeFileStream1 = new FileStream(tempFilePath, FileMode.Create, FileAccess.Write))
                        {
                            await content.CopyToAsync(writeFileStream1);
                        }

                        // Create a FormFile from the temporary file
                        var fileInfo = new FileInfo(tempFilePath);
                        var readFileStream1 = new FileStream(tempFilePath, FileMode.Open, FileAccess.Read);

                        resumeFile = new FormFile(
                            readFileStream1,
                            0,
                            fileInfo.Length,
                            "file",
                            fileName)
                        {
                            Headers = new HeaderDictionary(),
                            ContentType = contentType
                        };
                    }
                    catch (FileNotFoundException)
                    {
                        // If the blob doesn't exist, clear the reference in the user profile
                        await _userService.UpdateUserProfileAsync(userId, defaultResumeBlobName: null);
                        return BadRequest(new { error = "Default resume not found. Please upload a resume file." });
                    }
                }
                else if (resumeFile == null || resumeFile.Length == 0)
                {
                    return BadRequest(new { error = "Resume file is required" });
                }

                // At this point, resumeFile is guaranteed to be non-null and have content
                if (resumeFile.Length > 5 * 1024 * 1024)
                    return BadRequest(new { error = "File size exceeds the 5MB limit" });

                var fileExtension = Path.GetExtension(resumeFile.FileName).ToLowerInvariant();
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
                var userProfile2 = await _userService.GetUserProfileAsync(userId);
                var isRecruiter = userProfile2?.UserType == "recruiter";
                var subscription = isRecruiter
                    ? await _recruiterSubscriptionService.GetRecruiterSubscription(userId)
                    : await _candidateSubscriptionService.GetCandidateSubscription(userId);
                var plan = subscription?.subscription_type ?? "free";

                await _activityLogService.LogActivity(userId, "resume_customized", "Resume customized for job description");

                try
                {
                    var result = await _resumeService.CustomizeResume(
                        resumeFile,
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

                IFormFile? resumeFile = request.File;

                // Check if we should use the default resume
                if (request.UseDefaultResume)
                {
                    // Fetch the user's profile metadata instead of the main profile
                    var profileMeta = await _profileMetadataService.GetProfileMetadataAsync(userId);
                    if (profileMeta == null || string.IsNullOrEmpty(profileMeta.BlobPath))
                    {
                        return BadRequest(new { error = "No default resume found. Please upload a resume file or set a default resume." });
                    }

                    try
                    {
                        // Download the default resume to a memory stream
                        (Stream content, string contentType, string fileName) = await _storageService.DownloadFileAsync(profileMeta.BlobPath);

                        // Create a temporary file
                        var tempFilePath = Path.GetTempFileName();
                        using (var writeFileStream2 = new FileStream(tempFilePath, FileMode.Create, FileAccess.Write))
                        {
                            await content.CopyToAsync(writeFileStream2);
                        }

                        // Create a FormFile from the temporary file
                        var fileInfo = new FileInfo(tempFilePath);
                        var readFileStream2 = new FileStream(tempFilePath, FileMode.Open, FileAccess.Read);

                        resumeFile = new FormFile(
                            readFileStream2,
                            0,
                            fileInfo.Length,
                            "file",
                            fileName)
                        {
                            Headers = new HeaderDictionary(),
                            ContentType = contentType
                        };
                    }
                    catch (FileNotFoundException)
                    {
                        // If the blob doesn't exist, clear the reference in the user profile
                        await _userService.UpdateUserProfileAsync(userId, defaultResumeBlobName: null);
                        return BadRequest(new { error = "Default resume not found. Please upload a resume file." });
                    }
                }
                else if (resumeFile == null || resumeFile.Length == 0)
                {
                    return BadRequest(new { error = "Resume file is required" });
                }

                // At this point, resumeFile is guaranteed to be non-null and have content
                if (resumeFile.Length > 5 * 1024 * 1024)
                    return BadRequest(new { error = "File size exceeds the 5MB limit" });

                var fileExtension = Path.GetExtension(resumeFile.FileName).ToLowerInvariant();
                if (!new[] { ".pdf", ".docx", ".doc", ".txt" }.Contains(fileExtension))
                    return BadRequest(new { error = "Only PDF, DOCX, DOC, and TXT files are supported" });

                // Get user plan
                var userProfile4 = await _userService.GetUserProfileAsync(userId);
                var isRecruiter = userProfile4?.UserType == "recruiter";
                var subscription = isRecruiter
                    ? await _recruiterSubscriptionService.GetRecruiterSubscription(userId)
                    : await _candidateSubscriptionService.GetCandidateSubscription(userId);
                var plan = subscription?.subscription_type ?? "free";
                await _activityLogService.LogActivity(userId, "resume_optimized", "Resume optimized for ATS and best practices");
                try
                {
                    var result = await _resumeService.OptimizeResume(
                        resumeFile,
                        plan,
                        userId,
                        "resume_optimization",
                        subscription
                    );
                    return Ok(result);
                }
                catch (HttpRequestException ex)
                {
                    return StatusCode(500, new { error = ex.Message });
                }
                catch (ArgumentException ex)
                {
                    return BadRequest(new { error = ex.Message });
                }
                catch (Exception ex)
                {
                    return StatusCode(500, new { error = $"Internal Server Error: {ex.Message}" });
                }
            }
            catch (UnauthorizedAccessException ex)
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
                IFormFile? resumeFile = request.File;             

                // Check if we should use the default resume
                if (request.UseDefaultResume)
                {
                    // Fetch the user's profile metadata instead of the main profile
                    var profileMeta = await _profileMetadataService.GetProfileMetadataAsync(userId);
                    if (profileMeta == null || string.IsNullOrEmpty(profileMeta.BlobPath))
                    {
                        return BadRequest(new { error = "No default resume found. Please upload a resume file or set a default resume." });
                    }

                    try
                    {
                        // Download the default resume to a memory stream
                        (Stream content, string contentType, string fileName) = await _storageService.DownloadFileAsync(profileMeta.BlobPath);

                        // Create a temporary file
                        var tempFilePath = Path.GetTempFileName();
                        using (var writeFileStream2 = new FileStream(tempFilePath, FileMode.Create, FileAccess.Write))
                        {
                            await content.CopyToAsync(writeFileStream2);
                        }

                        // Create a FormFile from the temporary file
                        var fileInfo = new FileInfo(tempFilePath);
                        var readFileStream2 = new FileStream(tempFilePath, FileMode.Open, FileAccess.Read);

                        resumeFile = new FormFile(
                            readFileStream2,
                            0,
                            fileInfo.Length,
                            "file",
                            fileName)
                        {
                            Headers = new HeaderDictionary(),
                            ContentType = contentType
                        };
                    }
                    catch (FileNotFoundException)
                    {
                        // If the blob doesn't exist, clear the reference in the user profile
                        await _userService.UpdateUserProfileAsync(userId, defaultResumeBlobName: null);
                        return BadRequest(new { error = "Default resume not found. Please upload a resume file." });
                    }
                }
                else if (resumeFile == null || resumeFile.Length == 0)
                {
                    return BadRequest(new { error = "Resume file is required" });
                }

                // At this point, resumeFile is guaranteed to be non-null and have content

                if (resumeFile.Length > 5 * 1024 * 1024)
                    return BadRequest(new { error = "File size exceeds the 5MB limit" });

                var fileExtension = Path.GetExtension(resumeFile.FileName).ToLowerInvariant();
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
                        resumeFile,
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
                IFormFile? resumeFile = request.File;
                // Check if we should use the default resume
                if (request.UseDefaultResume)
                {
                    // Fetch the user's profile metadata instead of the main profile
                    var profileMeta = await _profileMetadataService.GetProfileMetadataAsync(userId);
                    if (profileMeta == null || string.IsNullOrEmpty(profileMeta.BlobPath))
                    {
                        return BadRequest(new { error = "No default resume found. Please upload a resume file or set a default resume." });
                    }

                    try
                    {
                        // Download the default resume to a memory stream
                        (Stream content, string contentType, string fileName) = await _storageService.DownloadFileAsync(profileMeta.BlobPath);

                        // Create a temporary file
                        var tempFilePath = Path.GetTempFileName();
                        using (var writeFileStream2 = new FileStream(tempFilePath, FileMode.Create, FileAccess.Write))
                        {
                            await content.CopyToAsync(writeFileStream2);
                        }

                        // Create a FormFile from the temporary file
                        var fileInfo = new FileInfo(tempFilePath);
                        var readFileStream2 = new FileStream(tempFilePath, FileMode.Open, FileAccess.Read);

                        resumeFile = new FormFile(
                            readFileStream2,
                            0,
                            fileInfo.Length,
                            "file",
                            fileName)
                        {
                            Headers = new HeaderDictionary(),
                            ContentType = contentType
                        };
                    }
                    catch (FileNotFoundException)
                    {
                        // If the blob doesn't exist, clear the reference in the user profile
                        await _userService.UpdateUserProfileAsync(userId, defaultResumeBlobName: null);
                        return BadRequest(new { error = "Default resume not found. Please upload a resume file." });
                    }
                }
                // else if (resumeFile == null || resumeFile.Length == 0)
                // {
                //     return BadRequest(new { error = "Resume file is required" });
                // }
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { error = "Invalid or missing authorization token" });
                if (string.IsNullOrEmpty(request.JobTitle) || string.IsNullOrEmpty(request.Location))
                    return BadRequest(new { error = "Job title and location are required" });
                if (request.YearsExperience < 0)
                    return BadRequest(new { error = "Years of experience cannot be negative" });
                if (resumeFile != null && resumeFile.Length > 5 * 1024 * 1024)
                    return BadRequest(new { error = "Resume file size exceeds the 5MB limit" });
                var fileExtension = resumeFile != null ? Path.GetExtension(resumeFile.FileName).ToLowerInvariant() : string.Empty;
                if (resumeFile != null && !new[] { ".pdf", ".docx", ".doc", ".txt" }.Contains(fileExtension))
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
                        resumeFile
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
    }

    public class ResumeAnalysisRequest
    {
        [Required]
        public string ResumeText { get; set; } = string.Empty;

        [Required]
        public string JobDescription { get; set; } = string.Empty;
    }

    public class ResumeCustomizationRequestModel
    {
        public IFormFile? File { get; set; }
        public string? JobDescription { get; set; }
        public IFormFile? JobDescriptionFile { get; set; }
        public bool UseDefaultResume { get; set; } = false;
    }

    public class ResumeOptimizationRequestModel
    {
        public IFormFile? File { get; set; }
        public bool UseDefaultResume { get; set; } = false;
    }
    public class ResumeBenchmarkRequest
    {
        public string ResumeText { get; set; } = string.Empty;
        public string JobDescription { get; set; } = string.Empty;
    }
    public class ResumeATSRequestModel
    {
    
        public IFormFile? File { get; set; }
        public bool UseDefaultResume { get; set; } = false;
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
        public IFormFile? File { get; set; }
        public bool UseDefaultResume { get; set; } = false;
        }
}