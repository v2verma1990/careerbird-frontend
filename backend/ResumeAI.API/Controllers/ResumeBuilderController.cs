using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using ResumeAI.API.Models;
using ResumeAI.API.Services;
using Newtonsoft.Json;

namespace ResumeAI.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ResumeBuilderController : ControllerBase
    {
        private readonly ResumeBuilderService _resumeBuilderService;
        private readonly AuthService _authService;
        private readonly ActivityLogService _activityLogService;
        private readonly CandidateSubscriptionService _candidateSubscriptionService;
        private readonly UserService _userService;

        public ResumeBuilderController(
            ResumeBuilderService resumeBuilderService,
            AuthService authService,
            ActivityLogService activityLogService,
            CandidateSubscriptionService candidateSubscriptionService,
            UserService userService)
        {
            _resumeBuilderService = resumeBuilderService;
            _authService = authService;
            _activityLogService = activityLogService;
            _candidateSubscriptionService = candidateSubscriptionService;
            _userService = userService;
        }

        [HttpGet("templates")]
        public async Task<IActionResult> GetTemplates()
        {
            try
            {
                string userId = _authService.ExtractUserIdFromAuthHeader(Request.Headers["Authorization"].ToString());
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { error = "Invalid or missing authorization token" });

                var templates = await _resumeBuilderService.GetTemplatesAsync();
                return Ok(templates);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetTemplates: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("extract-data")]
        [AllowAnonymous] // Allow anonymous access for testing
        public async Task<IActionResult> ExtractResumeData([FromForm] IFormFile resumeFile)
        {
            try
            {
                if (resumeFile == null || resumeFile.Length == 0)
                    return BadRequest(new { error = "Resume file is required" });

                if (resumeFile.Length > 5 * 1024 * 1024)
                    return BadRequest(new { error = "File size exceeds the 5MB limit" });

                var fileExtension = Path.GetExtension(resumeFile.FileName).ToLowerInvariant();
                if (!new[] { ".pdf", ".docx", ".doc", ".txt" }.Contains(fileExtension))
                    return BadRequest(new { error = "Only PDF, DOCX, DOC, and TXT files are supported" });

                // Extract resume data
                var result = await _resumeBuilderService.ExtractResumeDataFromFileAsync(resumeFile);
                
                // Log the result to help with debugging
                Console.WriteLine($"Extracted resume data: Name={result.Name}, Email={result.Email}, Skills count={result.Skills.Count}");
                
                // Return the result directly without any additional processing
                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in ExtractResumeData: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("build")]
        public async Task<IActionResult> BuildResume([FromForm] ResumeBuilderRequestModel request)
        {
            try
            {
                string userId = _authService.ExtractUserIdFromAuthHeader(Request.Headers["Authorization"].ToString());
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { error = "Invalid or missing authorization token" });

                if (string.IsNullOrEmpty(request.TemplateId))
                    return BadRequest(new { error = "Template ID is required" });

                if (request.ResumeFile == null && string.IsNullOrEmpty(request.ResumeData))
                    return BadRequest(new { error = "Either resume file or resume data must be provided" });

                // Get user plan
                var profile = await _userService.GetUserProfileAsync(userId);
                var subscription = await _candidateSubscriptionService.GetCandidateSubscription(userId);
                var plan = subscription?.subscription_type ?? "free";

                // Check if user can use the resume builder feature
                if (!await _userService.CanUseFeatureAsync(userId, "resume_builder"))
                {
                    return StatusCode(403, new { error = "Usage limit reached for resume builder feature" });
                }

                // Track feature usage
                await _userService.TrackFeatureUsage(userId, "resume_builder");
                
                // Log activity
                await _activityLogService.LogActivity(userId, "resume_built", "Resume built using template");

                var result = await _resumeBuilderService.BuildResumeAsync(request, userId);
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { error = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
        
        [HttpPost("build-pdf")]
        public async Task<IActionResult> BuildResumePdf([FromForm] ResumeBuilderRequestModel request)
        {
            try
            {
                string userId = _authService.ExtractUserIdFromAuthHeader(Request.Headers["Authorization"].ToString());
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { error = "Invalid or missing authorization token" });

                if (string.IsNullOrEmpty(request.TemplateId))
                    return BadRequest(new { error = "Template ID is required" });

                if (request.ResumeFile == null && string.IsNullOrEmpty(request.ResumeData))
                    return BadRequest(new { error = "Either resume file or resume data must be provided" });

                // Get user plan
                var profile = await _userService.GetUserProfileAsync(userId);
                var subscription = await _candidateSubscriptionService.GetCandidateSubscription(userId);
                var plan = subscription?.subscription_type ?? "free";

                // Check if user can use the resume builder feature
                if (!await _userService.CanUseFeatureAsync(userId, "resume_builder"))
                {
                    return StatusCode(403, new { error = "Usage limit reached for resume builder feature" });
                }

                // Track feature usage
                await _userService.TrackFeatureUsage(userId, "resume_builder");
                
                // Log activity
                await _activityLogService.LogActivity(userId, "resume_built", "Resume built as PDF");

                // Generate PDF directly
                var pdfBytes = await _resumeBuilderService.BuildResumePdfAsync(request, userId);
                
                // Verify that we have PDF bytes
                if (pdfBytes == null || pdfBytes.Length == 0)
                {
                    return StatusCode(500, new { error = "Failed to generate PDF file" });
                }
                
                // Verify that the content is actually a PDF (starts with %PDF)
                bool isPdf = false;
                if (pdfBytes.Length > 4)
                {
                    string header = System.Text.Encoding.ASCII.GetString(pdfBytes, 0, 4);
                    isPdf = header.StartsWith("%PDF");
                }
                
                if (!isPdf)
                {
                    Console.WriteLine("Warning: Generated content does not appear to be a valid PDF");
                    // Force generation of a simple PDF instead of returning non-PDF content
                    using (var memoryStream = new MemoryStream())
                    {
                        var document = new PdfSharpCore.Pdf.PdfDocument();
                        var page = document.AddPage();
                        var gfx = PdfSharpCore.Drawing.XGraphics.FromPdfPage(page);
                        var font = new PdfSharpCore.Drawing.XFont("Arial", 12);
                        
                        gfx.DrawString("Error generating PDF. Please try again.", font, 
                            PdfSharpCore.Drawing.XBrushes.Black, 
                            new PdfSharpCore.Drawing.XRect(50, 50, page.Width - 100, 50),
                            PdfSharpCore.Drawing.XStringFormats.TopLeft);
                        
                        document.Save(memoryStream);
                        pdfBytes = memoryStream.ToArray();
                    }
                }
                
                // Get the user's name for the filename if available
                string userName = "resume";
                if (!string.IsNullOrEmpty(request.ResumeData))
                {
                    try
                    {
                        var resumeData = JsonConvert.DeserializeObject<dynamic>(request.ResumeData);
                        if (resumeData != null)
                        {
                            // Safely access the name property using dynamic
                            string? nameValue = null;
                            try
                            {
                                // Check if the name property exists and is not null
                                // Use a safer approach to handle dynamic properties
                                object? nameObj = null;
                                try {
                                    nameObj = resumeData.name;
                                } catch {
                                    // Property doesn't exist
                                }
                                
                                if (nameObj != null)
                                {
                                    nameValue = nameObj.ToString();
                                }
                            }
                            catch
                            {
                                // Property doesn't exist or is not accessible
                            }

                            if (!string.IsNullOrEmpty(nameValue))
                            {
                                userName = nameValue;
                                // Replace spaces and special characters for a valid filename
                                userName = string.Join("_", userName.Split(Path.GetInvalidFileNameChars()));
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Error extracting name for PDF filename: {ex.Message}");
                    }
                }
                
                // Return the PDF file with a proper filename
                return File(pdfBytes, "application/pdf", $"{userName.ToLower().Replace(" ", "_")}_resume_{DateTime.Now:yyyyMMdd}.pdf");
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { error = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in BuildResumePdf: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { error = ex.Message });
            }
        }
        
        [HttpPost("optimize-ai")]
        public async Task<IActionResult> OptimizeResumeForResumeBuilder([FromBody] ResumeOptimizeRequestModel request)
        {
            try
            {
                string userId = _authService.ExtractUserIdFromAuthHeader(Request.Headers["Authorization"].ToString());
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { error = "Invalid or missing authorization token" });

                if (string.IsNullOrEmpty(request.TemplateId))
                    return BadRequest(new { error = "Template ID is required" });

                if (string.IsNullOrEmpty(request.ResumeData))
                    return BadRequest(new { error = "Resume data is required" });

                // Get user plan
                var profile = await _userService.GetUserProfileAsync(userId);
                var subscription = await _candidateSubscriptionService.GetCandidateSubscription(userId);
                var plan = subscription?.subscription_type ?? "free";

                // Check if user can use the resume optimization feature
                if (!await _userService.CanUseFeatureAsync(userId, "resume_optimization"))
                {
                    return StatusCode(403, new { error = "Usage limit reached for resume optimization feature" });
                }

                // Track feature usage
                await _userService.TrackFeatureUsage(userId, "resume_optimization");
                
                // Log activity
                await _activityLogService.LogActivity(userId, "resume_optimized", "Resume optimized with AI suggestions");

                var result = await _resumeBuilderService.OptimizeResumeAsync(request.ResumeData, request.TemplateId, userId, plan);
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { error = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error optimizing resume: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("download")]
        public async Task<IActionResult> DownloadResume([FromBody] DownloadResumeRequest request)
        {
            try
            {
                string userId = _authService.ExtractUserIdFromAuthHeader(Request.Headers["Authorization"].ToString());
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { error = "Invalid or missing authorization token" });

                if (string.IsNullOrEmpty(request.ResumeText))
                    return BadRequest(new { error = "Resume text is required" });

                // Call your service to proxy the request to Python and get the file
                (byte[] fileBytes, string fileName, string contentType) = await _resumeBuilderService.DownloadResumeAsync(request.ResumeText, request.Format, userId);

                return File(fileBytes, contentType, fileName);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // Add this DTO if not present
        public class DownloadResumeRequest
        {
            public string ResumeText { get; set; } = string.Empty;
            public string Format { get; set; } = "pdf";
        }
    }
}