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
    public class ResumeMetadataController : ControllerBase
    {
        private readonly ResumeMetadataService _resumeMetadataService;
        private readonly AuthService _authService;
        private readonly UserService _userService;

        public ResumeMetadataController(
            ResumeMetadataService resumeMetadataService,
            AuthService authService,
            UserService userService)
        {
            _resumeMetadataService = resumeMetadataService;
            _authService = authService;
            _userService = userService;
        }

        [HttpGet]
        public async Task<IActionResult> GetResumeMetadata()
        {
            try
            {
                string userId = _authService.ExtractUserIdFromAuthHeader(Request.Headers["Authorization"].ToString());
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { error = "Invalid or missing authorization token" });

                var metadata = await _resumeMetadataService.GetResumeMetadataAsync(userId);
                if (metadata == null)
                    return NotFound(new { error = "No resume metadata found" });

                return Ok(metadata);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateOrUpdateResumeMetadata([FromBody] ResumeMetadata metadata)
        {
            try
            {
                string userId = _authService.ExtractUserIdFromAuthHeader(Request.Headers["Authorization"].ToString());
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { error = "Invalid or missing authorization token" });

                // Ensure the user ID in the metadata matches the authenticated user
                metadata.UserId = userId;

                var existingMetadata = await _resumeMetadataService.GetResumeMetadataAsync(userId);
                ResumeMetadata result;

                if (existingMetadata != null)
                {
                    // Preserve existing file information
                    metadata.BlobPath = existingMetadata.BlobPath;
                    metadata.FileName = existingMetadata.FileName;
                    metadata.FileSize = existingMetadata.FileSize;
                    metadata.FileUrl = existingMetadata.FileUrl;
                    
                    // Handle DateTime properties
                    // UploadDate is non-nullable, so we need to provide a valid date
                    // If the existing date is the default value (01/01/0001), use current UTC time instead
                    metadata.UploadDate = existingMetadata.UploadDate > DateTime.MinValue ? existingMetadata.UploadDate : DateTime.UtcNow;
                    
                    // LastUpdated is also non-nullable, always set it to current time when updating
                    metadata.LastUpdated = DateTime.UtcNow;
                    
                    var updateResult = await _resumeMetadataService.UpdateResumeMetadataAsync(metadata);
                    if (updateResult == null)
                        return StatusCode(500, new { error = "Failed to update resume metadata." });
                    result = updateResult;
                }
                else
                {
                    // For new records, ensure required DateTime fields are set
                    metadata.UploadDate = DateTime.UtcNow;
                    metadata.LastUpdated = DateTime.UtcNow;
                    
                    var createResult = await _resumeMetadataService.CreateResumeMetadataAsync(metadata);
                    if (createResult == null)
                        return StatusCode(500, new { error = "Failed to create resume metadata." });
                    result = createResult;
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpDelete]
        public async Task<IActionResult> DeleteResumeMetadata()
        {
            try
            {
                string userId = _authService.ExtractUserIdFromAuthHeader(Request.Headers["Authorization"].ToString());
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { error = "Invalid or missing authorization token" });

                var success = await _resumeMetadataService.DeleteResumeMetadataAsync(userId);
                if (!success)
                    return NotFound(new { error = "No resume metadata found" });

                return Ok(new { message = "Resume metadata deleted successfully" });
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
                string userId = _authService.ExtractUserIdFromAuthHeader(Request.Headers["Authorization"].ToString());
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { error = "Invalid or missing authorization token" });

                var result = await _resumeMetadataService.UpdateResumeFileInfoAsync(
                    userId,
                    request.BlobPath,
                    request.FileName,
                    request.FileSize,
                    request.FileUrl
                );

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }

    // Using the shared UpdateResumeFileInfoRequest class from Models namespace
}