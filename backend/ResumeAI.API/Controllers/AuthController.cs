
using Microsoft.AspNetCore.Mvc;
using ResumeAI.API.Models;
using ResumeAI.API.Services;
using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;

namespace ResumeAI.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserService _userService;
        private readonly AuthService _authService;
        private readonly ActivityLogService _activityLogService;

        public AuthController(AuthService authService, UserService userService, ActivityLogService activityLogService)
        {
            _userService = userService;
            _activityLogService = activityLogService;
            _authService = authService;
        }

        [HttpPost("login")]
       // [AllowAnonymous] // Allow anonymous access for login
        public async Task<IActionResult> Login([FromBody] AuthRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.Email))
                {
                    return BadRequest(new { error = "Email is required" });
                }
                
                // Extract token from request header if available
                string authHeader = Request.Headers["Authorization"].ToString();
                if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer "))
                {
                    request.Token = authHeader.Substring("Bearer ".Length).Trim();
                }
                
                var response = await _authService.Authenticate(request);
                
                // Log successful login
                await _activityLogService.LogActivity(response.UserId, "login", $"User logged in as {request.UserType}");
                
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

        [HttpPost("signup")]
        [AllowAnonymous] // Allow anonymous access for signup
        public async Task<IActionResult> Signup([FromBody] AuthRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.Email))
                {
                    return BadRequest(new { error = "Email is required" });
                }
                
                // Extract token from request header if available
                string authHeader = Request.Headers["Authorization"].ToString();
                if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer "))
                {
                    request.Token = authHeader.Substring("Bearer ".Length).Trim();
                }
                
                var response = await _authService.Authenticate(request);
                
                // Log successful signup
                await _activityLogService.LogActivity(response.UserId, "signup", $"New {request.UserType} account created");
                
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
        
        [HttpGet("profile")]
        [Authorize] // Require authentication for profile
        public async Task<IActionResult> GetProfile()
        {
            try
            {
                // Extract user ID from the Authorization header
                string authHeader = Request.Headers["Authorization"].ToString();
                Console.WriteLine($"Auth Header: {authHeader}");
                
                string userId = _authService.ExtractUserIdFromAuthHeader(authHeader);
                Console.WriteLine($"Extracted User ID: {userId}");
                
                if (string.IsNullOrEmpty(userId))
                {
                    Console.WriteLine("No user ID found in token");
                    return Unauthorized(new { error = "Invalid or missing authorization token" });
                }
                
                var profile = await _userService.GetProfile(userId);
                Console.WriteLine($"Retrieved profile for user: {profile.Id} of type: {profile.UserType}");
                
                return Ok(profile);
            }
            catch (UnauthorizedAccessException ex)
            {
                Console.WriteLine($"Unauthorized access: {ex.Message}");
                return Unauthorized(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetProfile: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}
