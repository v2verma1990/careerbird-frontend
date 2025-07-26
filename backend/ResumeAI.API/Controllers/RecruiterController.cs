using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ResumeAI.API.Services;
using ResumeAI.API.Models;
using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Text.Json;
using System.Net.Http;
using System.Text;
using System.IO;
using System.ComponentModel.DataAnnotations;

namespace ResumeAI.API.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class RecruiterController : ControllerBase
    {
        private readonly UserService _userService;
        private readonly ActivityLogService _activityLogService;
        private readonly HttpClient _httpClient;
        private readonly string _pythonServiceUrl;

        public RecruiterController(UserService userService, ActivityLogService activityLogService, HttpClient httpClient)
        {
            _userService = userService;
            _activityLogService = activityLogService;
            _httpClient = httpClient;
            _pythonServiceUrl = Environment.GetEnvironmentVariable("PYTHON_AI_SERVICE_URL") ?? "http://localhost:8001";
        }

        // Dashboard Statistics
        [HttpGet("dashboard/stats/{userId}")]
        public async Task<IActionResult> GetDashboardStats(string userId)
        {
            try
            {
                // For now, return mock data. In production, this would query the database
                var stats = new
                {
                    totalResumes = 0,
                    totalAnalyses = 0,
                    totalComparisons = 0,
                    totalReports = 0,
                    averageMatchScore = 0,
                    topSkillGaps = new string[] { },
                    recentActivity = new object[] { }
                };

                return Ok(stats);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting dashboard stats: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // Job Description Management
        [HttpPost("job-descriptions")]
        public async Task<IActionResult> CreateJobDescription([FromBody] JobDescriptionRequest request)
        {
            try
            {
                // Mock implementation - in production, save to database
                var jobDescription = new
                {
                    id = Guid.NewGuid().ToString(),
                    title = request.Title,
                    description = request.Description,
                    company_name = request.CompanyName,
                    location = request.Location,
                    created_at = DateTime.UtcNow
                };

                return Ok(jobDescription);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error creating job description: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("job-descriptions/{userId}")]
        public async Task<IActionResult> GetJobDescriptions(string userId)
        {
            try
            {
                // Mock implementation - return empty array for now
                var jobDescriptions = new object[] { };
                return Ok(jobDescriptions);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting job descriptions: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // Processing Queue Management
        [HttpGet("queue/status/{userId}")]
        public async Task<IActionResult> GetQueueStatus(string userId)
        {
            try
            {
                using var scope = HttpContext.RequestServices.CreateScope();
                var queueService = scope.ServiceProvider.GetRequiredService<IQueueService>();

                var jobs = await queueService.GetUserJobsAsync(userId, 20);
                return Ok(jobs);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting queue status: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // Get specific job status
        [HttpGet("jobs/{jobId}")]
        public async Task<IActionResult> GetJobStatus(string jobId)
        {
            try
            {
                using var scope = HttpContext.RequestServices.CreateScope();
                var queueService = scope.ServiceProvider.GetRequiredService<IQueueService>();

                var job = await queueService.GetJobAsync(jobId);
                if (job == null)
                {
                    return NotFound(new { error = "Job not found" });
                }

                return Ok(job);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting job status: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // Get job progress
        [HttpGet("jobs/{jobId}/progress")]
        public async Task<IActionResult> GetJobProgress(string jobId)
        {
            try
            {
                using var scope = HttpContext.RequestServices.CreateScope();
                var queueService = scope.ServiceProvider.GetRequiredService<IQueueService>();

                var progress = await queueService.GetJobProgressAsync(jobId);
                if (progress == null)
                {
                    return NotFound(new { error = "Job not found" });
                }

                return Ok(progress);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting job progress: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // Cancel job
        [HttpPost("jobs/{jobId}/cancel")]
        public async Task<IActionResult> CancelJob(string jobId, [FromBody] CancelJobRequest request)
        {
            try
            {
                using var scope = HttpContext.RequestServices.CreateScope();
                var queueService = scope.ServiceProvider.GetRequiredService<IQueueService>();

                var cancelled = await queueService.CancelJobAsync(jobId, request.UserId);
                if (!cancelled)
                {
                    return BadRequest(new { error = "Job could not be cancelled or not found" });
                }

                return Ok(new { success = true, message = "Job cancelled successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error cancelling job: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // Queue statistics
        [HttpGet("queue/statistics")]
        public async Task<IActionResult> GetQueueStatistics()
        {
            try
            {
                using var scope = HttpContext.RequestServices.CreateScope();
                var queueService = scope.ServiceProvider.GetRequiredService<IQueueService>();

                var statistics = await queueService.GetAllQueueStatisticsAsync();
                return Ok(statistics);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting queue statistics: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // Plan Limits (database-driven like candidate dashboard)
        [HttpGet("plan-limits/{planType}")]
        public async Task<IActionResult> GetPlanLimits(string planType)
        {
            try
            {
                // This should query the plan_limits table from the database
                // For now, return default limits based on plan type
                var limits = new Dictionary<string, object>();

                switch (planType.ToLower())
                {
                    case "free":
                        limits = new Dictionary<string, object>
                        {
                            ["resume_analysis"] = new { usageLimit = 3 },
                            ["bulk_resume_processing"] = new { usageLimit = 1 },
                            ["candidate_comparison"] = new { usageLimit = 3 },
                            ["skill_gap_analysis"] = new { usageLimit = 3 },
                            ["ai_report_generation"] = new { usageLimit = 3 },
                            ["find_candidates"] = new { usageLimit = 3 },
                            ["optimize_job"] = new { usageLimit = 3 },
                            ["candidate_analysis"] = new { usageLimit = 3 }
                        };
                        break;
                    case "basic":
                        limits = new Dictionary<string, object>
                        {
                            ["resume_analysis"] = new { usageLimit = 25 },
                            ["bulk_resume_processing"] = new { usageLimit = 10 },
                            ["candidate_comparison"] = new { usageLimit = 25 },
                            ["skill_gap_analysis"] = new { usageLimit = 25 },
                            ["ai_report_generation"] = new { usageLimit = 25 },
                            ["find_candidates"] = new { usageLimit = 25 },
                            ["optimize_job"] = new { usageLimit = 25 },
                            ["candidate_analysis"] = new { usageLimit = 25 }
                        };
                        break;
                    case "premium":
                    case "recruiter":
                        limits = new Dictionary<string, object>
                        {
                            ["resume_analysis"] = new { usageLimit = 999 },
                            ["bulk_resume_processing"] = new { usageLimit = 999 },
                            ["candidate_comparison"] = new { usageLimit = 999 },
                            ["skill_gap_analysis"] = new { usageLimit = 999 },
                            ["ai_report_generation"] = new { usageLimit = 999 },
                            ["find_candidates"] = new { usageLimit = 999 },
                            ["optimize_job"] = new { usageLimit = 999 },
                            ["candidate_analysis"] = new { usageLimit = 999 }
                        };
                        break;
                    default:
                        limits = new Dictionary<string, object>
                        {
                            ["resume_analysis"] = new { usageLimit = 3 },
                            ["bulk_resume_processing"] = new { usageLimit = 1 },
                            ["candidate_comparison"] = new { usageLimit = 3 },
                            ["skill_gap_analysis"] = new { usageLimit = 3 },
                            ["ai_report_generation"] = new { usageLimit = 3 },
                            ["find_candidates"] = new { usageLimit = 3 },
                            ["optimize_job"] = new { usageLimit = 3 },
                            ["candidate_analysis"] = new { usageLimit = 3 }
                        };
                        break;
                }

                return Ok(limits);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting plan limits: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // Resume Upload with AI Processing
        [HttpPost("resumes/upload")]
        public async Task<IActionResult> UploadResumes([FromForm] ResumeUploadRequest request)
        {
            try
            {
                var uploadedResumes = new List<object>();
                
                foreach (var file in request.Files)
                {
                    if (file.Length > 0)
                    {
                        // Save file temporarily
                        var tempPath = Path.GetTempFileName();
                        using (var stream = new FileStream(tempPath, FileMode.Create))
                        {
                            await file.CopyToAsync(stream);
                        }

                        // Call Python AI service for resume parsing
                        var parseRequest = new
                        {
                            file_path = tempPath,
                            file_name = file.FileName,
                            user_id = request.UserId,
                            job_description_id = request.JobDescriptionId,
                            plan_type = request.PlanType ?? "free"
                        };

                        var jsonContent = new StringContent(
                            JsonSerializer.Serialize(parseRequest),
                            Encoding.UTF8,
                            "application/json"
                        );

                        var response = await _httpClient.PostAsync($"{_pythonServiceUrl}/parse-resume", jsonContent);
                        
                        if (response.IsSuccessStatusCode)
                        {
                            var result = await response.Content.ReadAsStringAsync();
                            var parsedData = JsonSerializer.Deserialize<object>(result);
                            uploadedResumes.Add(parsedData);
                        }
                        else
                        {
                            Console.WriteLine($"Python service error: {response.StatusCode}");
                            uploadedResumes.Add(new { 
                                file_name = file.FileName, 
                                error = "Failed to parse resume",
                                status = "failed"
                            });
                        }

                        // Clean up temp file
                        if (System.IO.File.Exists(tempPath))
                        {
                            System.IO.File.Delete(tempPath);
                        }
                    }
                }

                return Ok(new { 
                    message = "Resumes uploaded and processed",
                    results = uploadedResumes
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error uploading resumes: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // Resume Analysis with AI
        [HttpPost("analyze")]
        public async Task<IActionResult> AnalyzeResume([FromBody] AnalyzeResumeRequest request)
        {
            try
            {
                var analysisRequest = new
                {
                    resume_id = request.ResumeId,
                    job_description_id = request.JobDescriptionId,
                    user_id = request.UserId,
                    plan_type = request.PlanType ?? "free"
                };

                var jsonContent = new StringContent(
                    JsonSerializer.Serialize(analysisRequest),
                    Encoding.UTF8,
                    "application/json"
                );

                var response = await _httpClient.PostAsync($"{_pythonServiceUrl}/analyze-resume", jsonContent);
                
                if (response.IsSuccessStatusCode)
                {
                    var result = await response.Content.ReadAsStringAsync();
                    return Ok(JsonSerializer.Deserialize<object>(result));
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"Python service error: {response.StatusCode} - {errorContent}");
                    return StatusCode(500, new { error = "Failed to analyze resume" });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error analyzing resume: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // Bulk Resume Analysis - Now uses Queue System
        [HttpPost("analyze/bulk")]
        public async Task<IActionResult> BulkAnalyzeResumes([FromBody] BulkAnalyzeRequest request)
        {
            try
            {
                // Use queue service instead of direct HTTP call
                using var scope = HttpContext.RequestServices.CreateScope();
                var queueService = scope.ServiceProvider.GetRequiredService<IQueueService>();

                var queueRequest = new BulkAnalysisJobRequest
                {
                    ResumeIds = request.ResumeIds,
                    JobDescriptionId = request.JobDescriptionId,
                    UserId = request.UserId,
                    PlanType = request.PlanType ?? "free",
                    Priority = 0 // Normal priority
                };

                var jobId = await queueService.EnqueueBulkAnalysisAsync(queueRequest);

                return Ok(new
                {
                    success = true,
                    jobId = jobId,
                    message = "Bulk analysis job queued successfully",
                    estimatedCompletionTime = DateTime.UtcNow.AddMinutes(request.ResumeIds.Count * 2),
                    totalResumes = request.ResumeIds.Count,
                    status = "queued"
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in bulk analysis: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // Candidate Comparison with AI
        [HttpPost("compare")]
        public async Task<IActionResult> CompareCandidates([FromBody] CompareCandidatesRequest request)
        {
            try
            {
                var comparisonRequest = new
                {
                    resume_ids = request.ResumeIds,
                    job_description_id = request.JobDescriptionId,
                    user_id = request.UserId,
                    plan_type = request.PlanType ?? "free"
                };

                var jsonContent = new StringContent(
                    JsonSerializer.Serialize(comparisonRequest),
                    Encoding.UTF8,
                    "application/json"
                );

                var response = await _httpClient.PostAsync($"{_pythonServiceUrl}/compare-candidates", jsonContent);
                
                if (response.IsSuccessStatusCode)
                {
                    var result = await response.Content.ReadAsStringAsync();
                    return Ok(JsonSerializer.Deserialize<object>(result));
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"Python service error: {response.StatusCode} - {errorContent}");
                    return StatusCode(500, new { error = "Failed to compare candidates" });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error comparing candidates: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // Skill Gap Analysis
        [HttpPost("skill-gaps")]
        public async Task<IActionResult> AnalyzeSkillGaps([FromBody] SkillGapRequest request)
        {
            try
            {
                var skillGapRequest = new
                {
                    resume_id = request.ResumeId,
                    job_description_id = request.JobDescriptionId,
                    user_id = request.UserId,
                    plan_type = request.PlanType ?? "free"
                };

                var jsonContent = new StringContent(
                    JsonSerializer.Serialize(skillGapRequest),
                    Encoding.UTF8,
                    "application/json"
                );

                var response = await _httpClient.PostAsync($"{_pythonServiceUrl}/analyze-skill-gaps", jsonContent);
                
                if (response.IsSuccessStatusCode)
                {
                    var result = await response.Content.ReadAsStringAsync();
                    return Ok(JsonSerializer.Deserialize<object>(result));
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"Python service error: {response.StatusCode} - {errorContent}");
                    return StatusCode(500, new { error = "Failed to analyze skill gaps" });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error analyzing skill gaps: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // Report Generation (placeholder)
        [HttpPost("reports/generate")]
        public async Task<IActionResult> GenerateReport([FromBody] GenerateReportRequest request)
        {
            try
            {
                // Mock implementation for report generation
                return Ok(new { message = "Report generation endpoint - implementation coming soon" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error generating report: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // AI-powered Job Description Optimization
        [HttpPost("ai/optimize-job")]
        public async Task<IActionResult> OptimizeJobDescription([FromBody] OptimizeJobRequest request)
        {
            try
            {
                // This would integrate with the existing microservice
                // For now, return a mock response
                return Ok(new { 
                    message = "Job description optimization endpoint - implementation coming soon",
                    optimizedDescription = request.JobDescription + " (AI optimized)"
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error optimizing job description: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }

    // Request models
    public class JobDescriptionRequest
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string Requirements { get; set; } = string.Empty;
        public string SalaryRange { get; set; } = string.Empty;
        public string EmploymentType { get; set; } = "full-time";
    }

    public class ResumeUploadRequest
    {
        public IFormFile[] Files { get; set; } = new IFormFile[] { };
        public string UserId { get; set; } = string.Empty;
        public string? JobDescriptionId { get; set; }
        public string? PlanType { get; set; }
    }

    public class AnalyzeResumeRequest
    {
        public string ResumeId { get; set; } = string.Empty;
        public string JobDescriptionId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string? PlanType { get; set; }
    }

    public class BulkAnalyzeRequest
    {
        public string[] ResumeIds { get; set; } = new string[] { };
        public string JobDescriptionId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string? PlanType { get; set; }
    }

    public class CompareCandidatesRequest
    {
        public string[] ResumeIds { get; set; } = new string[] { };
        public string JobDescriptionId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string? PlanType { get; set; }
    }

    public class SkillGapRequest
    {
        public string ResumeId { get; set; } = string.Empty;
        public string JobDescriptionId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string? PlanType { get; set; }
    }

    public class GenerateReportRequest
    {
        public string ReportType { get; set; } = string.Empty;
        public string JobDescriptionId { get; set; } = string.Empty;
        public string[] ResumeAnalysisIds { get; set; } = new string[] { };
        public string UserId { get; set; } = string.Empty;
        public string? PlanType { get; set; }
    }

    public class OptimizeJobRequest
    {
        public string JobDescription { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string? PlanType { get; set; }
    }

    public class CancelJobRequest
    {
        [Required]
        public string UserId { get; set; } = string.Empty;
    }
}