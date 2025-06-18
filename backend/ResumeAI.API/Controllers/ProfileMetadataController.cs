using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using System;
using System.Threading.Tasks;
using ResumeAI.API.Services;
using Microsoft.AspNetCore.Authorization;
using ResumeAI.API.Models;
using System.Collections.Generic;

namespace ResumeAI.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProfileMetadataController : ControllerBase
    {
        private readonly ProfileMetadataService _profileMetadataService;
        private readonly AuthService _authService;
        private readonly UserService _userService;

        public ProfileMetadataController(
            ProfileMetadataService profileMetadataService,
            AuthService authService,
            UserService userService)
        {
            _profileMetadataService = profileMetadataService;
            _authService = authService;
            _userService = userService;
        }

        [HttpGet]
        public async Task<IActionResult> GetProfileMetadata()
        {
            try
            {
                string userId = _authService.ExtractUserIdFromAuthHeader(Request.Headers["Authorization"].ToString());
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { error = "Invalid or missing authorization token" });

                var metadata = await _profileMetadataService.GetProfileMetadataAsync(userId);
                // We no longer create default metadata on first login
                if (metadata == null)
                {
                    // Return structured response with profile status information
                    return Ok(new { 
                        exists = false,
                        message = "No profile metadata found. Please complete your profile in the Account section.",
                        profileStatus = new {
                            hasResume = false,
                            hasBasicInfo = false,
                            hasDetailedInfo = false,
                            completionPercentage = 0,
                            nextSteps = new[] {
                                "Upload your resume in the Account section",
                                "Complete your basic profile information",
                                "Add skills and professional details"
                            }
                        }
                    });
                }

                // Calculate profile completion for existing profiles
                var completionPercentage = CalculateProfileCompletionPercentage(metadata);
                
                // Check if resume exists by verifying both FileName and BlobPath
                var hasResume = !string.IsNullOrEmpty(metadata.FileName) && !string.IsNullOrEmpty(metadata.BlobPath);
                
                // Log resume status for debugging
                Console.WriteLine($"Resume status check - FileName: '{metadata.FileName}', BlobPath: '{metadata.BlobPath}', HasResume: {hasResume}");
                Console.WriteLine($"Profile completion percentage: {completionPercentage}%");
                
                // Explicitly include all the resume-related fields in the response
                return Ok(new {
                    exists = true,
                    // Resume file information
                    fileUrl = metadata.FileUrl,
                    fileName = metadata.FileName,
                    fileSize = metadata.FileSize,
                    uploadDate = metadata.UploadDate,
                    blobPath = metadata.BlobPath,
                    
                    // Profile metadata
                    metadata = new {
                        jobTitle = metadata.JobTitle,
                        currentCompany = metadata.CurrentCompany,
                        yearsOfExperience = metadata.YearsOfExperience,
                        professionalBio = metadata.ProfessionalBio,
                        location = metadata.Location,
                        phoneNumber = metadata.PhoneNumber,
                        skills = metadata.Skills,
                        lastUpdated = metadata.LastUpdated
                    },
                    
                    // Profile status
                    profileStatus = new {
                        hasResume,
                        hasBasicInfo = !string.IsNullOrEmpty(metadata.JobTitle) && !string.IsNullOrEmpty(metadata.Location),
                        hasDetailedInfo = !string.IsNullOrEmpty(metadata.ProfessionalBio) && metadata.Skills.Count > 0,
                        completionPercentage,
                        lastUpdated = metadata.LastUpdated
                    }
                });
            }
            catch (Exception ex)
            {
                // Log the exception
                Console.WriteLine($"Error in GetProfileMetadata: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                
                return StatusCode(500, new { 
                    error = "An error occurred while retrieving profile data",
                    errorDetail = ex.Message,
                    errorCode = "PROFILE_FETCH_ERROR"
                });
            }
        }
        
        // Helper method to calculate profile completion percentage
        private int CalculateProfileCompletionPercentage(ProfileMetadata metadata)
        {
            if (metadata == null) return 0;
            
            // Define fields that contribute to profile completion
            var fields = new Dictionary<string, bool>
            {
                { "Resume", !string.IsNullOrEmpty(metadata.FileName) && !string.IsNullOrEmpty(metadata.BlobPath) },
                { "JobTitle", !string.IsNullOrEmpty(metadata.JobTitle) },
                { "Company", !string.IsNullOrEmpty(metadata.CurrentCompany) },
                { "Experience", !string.IsNullOrEmpty(metadata.YearsOfExperience) },
                { "Bio", !string.IsNullOrEmpty(metadata.ProfessionalBio) },
                { "Location", !string.IsNullOrEmpty(metadata.Location) },
                { "Phone", !string.IsNullOrEmpty(metadata.PhoneNumber) },
                { "Skills", metadata.Skills != null && metadata.Skills.Count > 0 }
            };
            
            // Log the completion status of each field
            foreach (var field in fields)
            {
                Console.WriteLine($"Profile completion field: {field.Key} = {field.Value}");
            }
            
            // Calculate percentage
            int completedFields = fields.Count(f => f.Value);
            int percentage = (int)Math.Round((double)completedFields / fields.Count * 100);
            
            Console.WriteLine($"Profile completion: {completedFields}/{fields.Count} fields completed = {percentage}%");
            
            return percentage;
        }

        [HttpPost]
        public async Task<IActionResult> CreateOrUpdateProfileMetadata([FromBody] ProfileMetadata metadata)
        {
            try
            {
                string userId = _authService.ExtractUserIdFromAuthHeader(Request.Headers["Authorization"].ToString());
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { error = "Invalid or missing authorization token" });

                // Ensure the user ID in the metadata matches the authenticated user
                metadata.UserId = userId;

                var existingMetadata = await _profileMetadataService.GetProfileMetadataAsync(userId);
                ProfileMetadata? result;

                if (existingMetadata != null)
                {
                    // Preserve existing file information
                    metadata.BlobPath = existingMetadata.BlobPath;
                    metadata.FileName = existingMetadata.FileName;
                    metadata.FileSize = existingMetadata.FileSize;
                    metadata.FileUrl = existingMetadata.FileUrl;
                    metadata.UploadDate = existingMetadata.UploadDate;
                    
                    result = await _profileMetadataService.UpdateProfileMetadataAsync(metadata);
                }
                else
                {
                    result = await _profileMetadataService.CreateProfileMetadataAsync(metadata);
                }

                if (result == null)
                {
                    return StatusCode(500, new { error = "Failed to create or update profile metadata" });
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpDelete]
        public async Task<IActionResult> DeleteProfileMetadata()
        {
            try
            {
                string userId = _authService.ExtractUserIdFromAuthHeader(Request.Headers["Authorization"].ToString());
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { error = "Invalid or missing authorization token" });

                var success = await _profileMetadataService.DeleteProfileMetadataAsync(userId);
                if (!success)
                    return NotFound(new { error = "No profile metadata found" });

                return Ok(new { message = "Profile metadata deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPatch("file-info")]
        public async Task<IActionResult> UpdateResumeFileInfo([FromBody] UpdateResumeFileInfoRequest request)
        {
            try
            {
                Console.WriteLine("UpdateResumeFileInfo endpoint called");
                Console.WriteLine($"Request: BlobPath={request.BlobPath}, FileName={request.FileName}, FileSize={request.FileSize}");
                
                // Log the authorization header (partially)
                var authHeader = Request.Headers["Authorization"].ToString();
                if (!string.IsNullOrEmpty(authHeader) && authHeader.Length > 20)
                {
                    Console.WriteLine($"Auth header: {authHeader.Substring(0, 20)}...");
                }
                else
                {
                    Console.WriteLine("Auth header is missing or too short");
                }
                
                string userId = _authService.ExtractUserIdFromAuthHeader(authHeader);
                Console.WriteLine($"Extracted user ID: {userId}");
                
                if (string.IsNullOrEmpty(userId))
                {
                    Console.WriteLine("User ID extraction failed - unauthorized");
                    return Unauthorized(new { error = "Invalid or missing authorization token" });
                }

                try
                {
                    var result = await _profileMetadataService.UpdateResumeFileInfoAsync(
                        userId,
                        request.BlobPath,
                        request.FileName,
                        request.FileSize,
                        request.FileUrl
                    );

                    if (result == null)
                    {
                        Console.WriteLine("UpdateResumeFileInfoAsync returned null");
                        return StatusCode(500, new { error = "Failed to update resume file information" });
                    }

                    Console.WriteLine("UpdateResumeFileInfoAsync succeeded");
                    return Ok(result);
                }
                catch (Exception serviceEx)
                {
                    Console.WriteLine($"Service exception: {serviceEx.Message}");
                    Console.WriteLine($"Service exception stack trace: {serviceEx.StackTrace}");
                    return StatusCode(500, new { error = $"Service error: {serviceEx.Message}" });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Controller exception: {ex.Message}");
                Console.WriteLine($"Controller exception stack trace: {ex.StackTrace}");
                return StatusCode(500, new { error = $"Controller error: {ex.Message}" });
            }
        }

        [HttpPatch("visibility")]
        public async Task<IActionResult> UpdateResumeVisibility([FromBody] UpdateResumeVisibilityRequest request)
        {
            try
            {
                string userId = _authService.ExtractUserIdFromAuthHeader(Request.Headers["Authorization"].ToString());
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { error = "Invalid or missing authorization token" });

                var existingMetadata = await _profileMetadataService.GetProfileMetadataAsync(userId);
                if (existingMetadata == null)
                {
                    return NotFound(new { error = "Profile metadata not found for user." });
                }

                // Update the visibility setting
                var result = await _profileMetadataService.UpdateResumeVisibilityAsync(userId, request.IsVisibleToRecruiters);
                
                if (result == null)
                {
                    return StatusCode(500, new { error = "Failed to update resume visibility" });
                }

                return Ok(new { isVisibleToRecruiters = result.IsVisibleToRecruiters });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPatch("metadata")]
        public async Task<IActionResult> UpdateProfileMetadataFields([FromBody] Dictionary<string, object> updates)
        {
            try
            {
                string userId = _authService.ExtractUserIdFromAuthHeader(Request.Headers["Authorization"].ToString());
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { error = "Invalid or missing authorization token" });

                var existingMetadata = await _profileMetadataService.GetProfileMetadataAsync(userId);
                if (existingMetadata == null)
                {
                    return NotFound(new { error = "Profile metadata not found for user." });
                }

                // Only allow updating specific fields
                var allowedFields = new HashSet<string> {
                    "jobTitle", "currentCompany", "yearsOfExperience", "professionalBio", "location", "phoneNumber", "skills"
                };

                foreach (var kvp in updates)
                {
                    if (!allowedFields.Contains(kvp.Key)) continue;
                    switch (kvp.Key)
                    {
                        case "jobTitle":
                            existingMetadata.JobTitle = kvp.Value?.ToString() ?? string.Empty;
                            break;
                        case "currentCompany":
                            existingMetadata.CurrentCompany = kvp.Value?.ToString() ?? string.Empty;
                            break;
                        case "yearsOfExperience":
                            existingMetadata.YearsOfExperience = kvp.Value?.ToString() ?? string.Empty;
                            break;
                        case "professionalBio":
                            existingMetadata.ProfessionalBio = kvp.Value?.ToString() ?? string.Empty;
                            break;
                        case "location":
                            existingMetadata.Location = kvp.Value?.ToString() ?? string.Empty;
                            break;
                        case "phoneNumber":
                            existingMetadata.PhoneNumber = kvp.Value?.ToString() ?? string.Empty;
                            break;
                        case "skills":
                            if (kvp.Value is System.Text.Json.JsonElement elem && elem.ValueKind == System.Text.Json.JsonValueKind.Array)
                            {
                                var skills = new List<string>();
                                foreach (var item in elem.EnumerateArray())
                                {
                                    if (item.ValueKind == System.Text.Json.JsonValueKind.String)
                                        skills.Add(item.GetString() ?? string.Empty);
                                }
                                existingMetadata.Skills = skills;
                            }
                            else if (kvp.Value is IEnumerable<object> objList)
                            {
                                existingMetadata.Skills = objList.Select(x => x?.ToString() ?? string.Empty).ToList();
                            }
                            break;
                    }
                }

                existingMetadata.LastUpdated = DateTime.UtcNow;
                existingMetadata.UpdatedAt = DateTime.UtcNow;

                var result = await _profileMetadataService.UpdateProfileMetadataAsync(existingMetadata);
                if (result == null)
                {
                    return StatusCode(500, new { error = "Failed to update profile metadata." });
                }

                // Return only the updated metadata fields
                return Ok(new {
                    jobTitle = result.JobTitle,
                    currentCompany = result.CurrentCompany,
                    yearsOfExperience = result.YearsOfExperience,
                    professionalBio = result.ProfessionalBio,
                    location = result.Location,
                    phoneNumber = result.PhoneNumber,
                    skills = result.Skills,
                    lastUpdated = result.LastUpdated
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in UpdateProfileMetadataFields: {ex.Message}");
                return StatusCode(500, new { error = "An error occurred while updating profile metadata.", errorDetail = ex.Message });
            }
        }

        /// <summary>
        /// Enable resume visibility with premium subscription check
        /// </summary>
        [HttpPost("enable-visibility")]
        public async Task<IActionResult> EnableResumeVisibility()
        {
            try
            {
                string userId = _authService.ExtractUserIdFromAuthHeader(Request.Headers["Authorization"].ToString());
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { error = "Invalid or missing authorization token" });

                var (success, message) = await _profileMetadataService.EnableResumeVisibilityAsync(userId, _userService);
                
                if (success)
                {
                    return Ok(new { success = true, message = message });
                }
                else
                {
                    return BadRequest(new { success = false, error = message });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        /// <summary>
        /// Refresh resume data retention when user updates resume
        /// </summary>
        [HttpPost("refresh-retention")]
        public async Task<IActionResult> RefreshResumeDataRetention()
        {
            try
            {
                string userId = _authService.ExtractUserIdFromAuthHeader(Request.Headers["Authorization"].ToString());
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { error = "Invalid or missing authorization token" });

                var (success, message) = await _profileMetadataService.RefreshResumeDataRetentionAsync(userId);
                
                if (success)
                {
                    return Ok(new { success = true, message = message });
                }
                else
                {
                    return BadRequest(new { success = false, error = message });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        /// <summary>
        /// Get resume data retention status
        /// </summary>
        [HttpGet("retention-status")]
        public async Task<IActionResult> GetResumeRetentionStatus()
        {
            try
            {
                string userId = _authService.ExtractUserIdFromAuthHeader(Request.Headers["Authorization"].ToString());
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { error = "Invalid or missing authorization token" });

                var metadata = await _profileMetadataService.GetProfileMetadataAsync(userId);
                if (metadata == null)
                {
                    return NotFound(new { error = "No resume found" });
                }

                var deletionDate = metadata.UploadDate.AddMonths(6);
                var daysUntilDeletion = (deletionDate - DateTime.UtcNow).Days;

                return Ok(new 
                { 
                    uploadDate = metadata.UploadDate,
                    deletionDate = deletionDate,
                    daysUntilDeletion = Math.Max(0, daysUntilDeletion),
                    isVisibleToRecruiters = metadata.IsVisibleToRecruiters,
                    hasResumeData = !string.IsNullOrEmpty(metadata.BlobPath)
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        /// <summary>
        /// Extract text from uploaded resume for search functionality
        /// </summary>
        [HttpPost("extract-text")]
        public async Task<IActionResult> ExtractResumeText()
        {
            try
            {
                string userId = _authService.ExtractUserIdFromAuthHeader(Request.Headers["Authorization"].ToString());
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { error = "Invalid or missing authorization token" });

                var metadata = await _profileMetadataService.GetProfileMetadataAsync(userId);
                if (metadata == null || string.IsNullOrEmpty(metadata.BlobPath))
                {
                    return NotFound(new { error = "No resume found for text extraction" });
                }

                // Extract text using the existing Python service
                var extractedText = await _profileMetadataService.ExtractAndSaveResumeTextAsync(userId);
                
                if (!string.IsNullOrEmpty(extractedText))
                {
                    return Ok(new { 
                        success = true, 
                        message = "Text extracted successfully",
                        textLength = extractedText.Length 
                    });
                }
                else
                {
                    return BadRequest(new { 
                        success = false, 
                        error = "Failed to extract text from resume" 
                    });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in ExtractResumeText: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }

    // Using the existing UpdateResumeFileInfoRequest class from ResumeMetadataController
}