using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System;
using System.IO;
using System.Threading.Tasks;
using ResumeAI.API.Services;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace ResumeAI.API.Controllers
{
    [ApiController]
    [Route("api/resume/default")]
    [Authorize]
    public class DefaultResumeController : ControllerBase
    {
        private readonly IStorageService _storageService;
        private readonly AuthService _authService;
        private readonly UserService _userService;

        public DefaultResumeController(IStorageService storageService, AuthService authService, UserService userService)
        {
            _storageService = storageService;
            _authService = authService;
            _userService = userService;
        }

        [HttpGet]
        public async Task<IActionResult> GetDefaultResume()
        {
            try
            {
                string userId = _authService.ExtractUserIdFromAuthHeader(Request.Headers["Authorization"].ToString());
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { error = "Invalid or missing authorization token" });

                // Get user profile to check if they have a default resume
                var profile = await _userService.GetUserProfileAsync(userId);
                
                if (profile == null || string.IsNullOrEmpty(profile.DefaultResumeBlobName))
                {
                    return Ok(new { message = "No default resume found" });
                }

                try
                {
                    // Get the blob details
                    var blobDetails = await _storageService.GetBlobDetailsAsync(profile.DefaultResumeBlobName);
                    
                    return Ok(new
                    {
                        fileUrl = $"/api/resume/default/download", // The frontend will use this endpoint to download the file
                        fileName = blobDetails.FileName,
                        fileSize = blobDetails.Size,
                        uploadDate = blobDetails.UploadDate
                    });
                }
                catch (FileNotFoundException)
                {
                    // If the blob doesn't exist, clear the reference in the user profile
                    await _userService.UpdateUserProfileAsync(userId, defaultResumeBlobName: null);
                    return Ok(new { message = "No default resume found" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> UploadDefaultResume([FromForm] IFormFile file)
        {
            try
            {
                string userId = _authService.ExtractUserIdFromAuthHeader(Request.Headers["Authorization"].ToString());
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { error = "Invalid or missing authorization token" });

                if (file == null || file.Length == 0)
                    return BadRequest(new { error = "Resume file is required" });

                if (file.Length > 5 * 1024 * 1024)
                    return BadRequest(new { error = "File size exceeds the 5MB limit" });

                var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (!new[] { ".pdf", ".docx", ".doc", ".txt" }.Contains(fileExtension))
                    return BadRequest(new { error = "Only PDF, DOCX, DOC, and TXT files are supported" });

                // Get user profile to check if they already have a default resume
                var profile = await _userService.GetUserProfileAsync(userId);
                
                // If they have an existing default resume, delete it
                if (profile != null && !string.IsNullOrEmpty(profile.DefaultResumeBlobName))
                {
                    await _storageService.DeleteFileAsync(profile.DefaultResumeBlobName);
                }

                // Upload the new file
                using (var stream = file.OpenReadStream())
                {
                    string blobName = await _storageService.UploadFileAsync(userId, stream, file.FileName, file.ContentType);
                    
                    // Update the user profile with the new blob name
                    await _userService.UpdateUserProfileAsync(userId, defaultResumeBlobName: blobName);
                    
                    // Get the blob details for the response
                    var blobDetails = await _storageService.GetBlobDetailsAsync(blobName);
                    
                    return Ok(new
                    {
                        fileUrl = $"/api/resume/default/download",
                        fileName = file.FileName,
                        fileSize = file.Length,
                        uploadDate = DateTime.UtcNow
                    });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpDelete]
        public async Task<IActionResult> DeleteDefaultResume()
        {
            try
            {
                string userId = _authService.ExtractUserIdFromAuthHeader(Request.Headers["Authorization"].ToString());
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { error = "Invalid or missing authorization token" });

                // Get user profile to check if they have a default resume
                var profile = await _userService.GetUserProfileAsync(userId);
                
                if (profile == null || string.IsNullOrEmpty(profile.DefaultResumeBlobName))
                {
                    return Ok(new { message = "No default resume found" });
                }

                // Delete the blob
                await _storageService.DeleteFileAsync(profile.DefaultResumeBlobName);
                
                // Update the user profile to remove the reference
                await _userService.UpdateUserProfileAsync(userId, defaultResumeBlobName: null);
                
                return Ok(new { message = "Default resume deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("download")]
        public async Task<IActionResult> DownloadDefaultResume()
        {
            try
            {
                string userId = _authService.ExtractUserIdFromAuthHeader(Request.Headers["Authorization"].ToString());
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { error = "Invalid or missing authorization token" });

                // Get user profile to check if they have a default resume
                var profile = await _userService.GetUserProfileAsync(userId);
                
                if (profile == null || string.IsNullOrEmpty(profile.DefaultResumeBlobName))
                {
                    return NotFound(new { error = "No default resume found" });
                }

                try
                {
                    // Download the file
                    var (content, contentType, fileName) = await _storageService.DownloadFileAsync(profile.DefaultResumeBlobName);
                    
                    return File(content, contentType, fileName);
                }
                catch (FileNotFoundException)
                {
                    // If the blob doesn't exist, clear the reference in the user profile
                    await _userService.UpdateUserProfileAsync(userId, defaultResumeBlobName: null);
                    return NotFound(new { error = "Default resume file not found" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}