using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System;
using System.Threading.Tasks;
using ResumeAI.API.Services;

namespace ResumeAI.API.Controllers
{
    [ApiController]
    [Route("api/storage/diagnostics")]
    [Authorize]
    public class StorageDiagnosticsController : ControllerBase
    {
        private readonly IStorageService _storageService;
        private readonly AuthService _authService;

        public StorageDiagnosticsController(IStorageService storageService, AuthService authService)
        {
            _storageService = storageService;
            _authService = authService;
        }

        [HttpGet("bucket-status")]
        public async Task<IActionResult> CheckBucketStatus()
        {
            try
            {
                string userId = _authService.ExtractUserIdFromAuthHeader(Request.Headers["Authorization"].ToString());
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { error = "Invalid or missing authorization token" });

                string status;
                
                // Check which storage provider we're using
                if (_storageService is SupabaseStorageService supabaseStorage)
                {
                    status = await supabaseStorage.CheckBucketStatusAsync();
                }
                else if (_storageService is BlobStorageService blobStorage)
                {
                    status = await blobStorage.CheckBucketStatusAsync();
                }
                else
                {
                    status = "Unknown storage provider type";
                }
                
                return Ok(new { status });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("test-upload")]
        public async Task<IActionResult> TestUpload()
        {
            try
            {
                string userId = _authService.ExtractUserIdFromAuthHeader(Request.Headers["Authorization"].ToString());
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { error = "Invalid or missing authorization token" });

                // Create a simple test file
                var testContent = "This is a test file to verify storage functionality.";
                using var stream = new System.IO.MemoryStream(System.Text.Encoding.UTF8.GetBytes(testContent));
                
                try
                {
                    var blobName = await _storageService.UploadFileAsync(userId, stream, "test-file.txt", "text/plain");
                    return Ok(new { message = "Test upload successful", blobName });
                }
                catch (Exception ex)
                {
                    return StatusCode(500, new { error = $"Upload failed: {ex.Message}" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}