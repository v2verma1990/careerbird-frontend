using ResumeAI.API.Models;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using System.Linq;
using System.IO;
using System.Collections.Generic;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Http;

namespace ResumeAI.API.Services
{
    public class AuthService
    {
        private readonly UserService _userService;
        private readonly ActivityLogService _activityService;
        private readonly IConfiguration _configuration;

        public AuthService(UserService userService, ActivityLogService activityService, IConfiguration configuration)
        {
            _userService = userService;
            _activityService = activityService;
            _configuration = configuration;
        }       

        public async Task<AuthResponse> Authenticate(AuthRequest request)
        {
            if (string.IsNullOrEmpty(request.Email))
            {
                throw new UnauthorizedAccessException("Email is required");
            }

            Console.WriteLine($"Authenticating user: {request.Email}");
            
            // Try to find existing user
            var user = await _userService.GetUserByEmailAsync(request.Email);

            Console.WriteLine($"Found user: {user.Id}, type: {user.UserType}");
            
            // If user doesn't exist, throw error instead of creating new user
            if (string.IsNullOrEmpty(user.Id))
            {
                throw new UnauthorizedAccessException("User not found");
            }

            // Get user profile
            var userProfile = await _userService.GetUserProfileAsync(user.Id);
            Console.WriteLine($"Found profile: {userProfile.Id}, email: '{userProfile.Email}', type: {userProfile.UserType}, subscription: {userProfile.SubscriptionType}");
            
            // Check if this is a new user (profile doesn't exist or has minimal data)
            bool isNewUser = string.IsNullOrEmpty(userProfile.UserType) || userProfile.UserType == "undefined";
            bool needsUpdate = false;
            
            // Also check if email is missing (common issue with trigger)
            bool emailMissing = string.IsNullOrEmpty(userProfile.Email);
            
            if (isNewUser)
            {
                Console.WriteLine("New user detected - creating default profile");
                
                // Set default values for new user
                userProfile.Id = user.Id;
                userProfile.Email = !string.IsNullOrEmpty(user.Email) ? user.Email : request.Email;
                userProfile.UserType = user.UserType ?? request.UserType ?? "candidate";
                userProfile.SubscriptionType = "free"; // Default subscription type
                userProfile.CreatedAt = DateTime.UtcNow;
                userProfile.UpdatedAt = DateTime.UtcNow;
                needsUpdate = true;
                
                // Create a default free subscription for new users
                try
                {
                    Console.WriteLine($"Creating default free subscription for new user: {user.Id}");
                    await _userService.CreateOrUpdateSubscription(user.Id, "free");
                    Console.WriteLine("Default subscription created successfully");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Warning: Failed to create default subscription: {ex.Message}");
                    // Don't fail authentication if subscription creation fails
                }
            }
            else if (emailMissing)
            {
                Console.WriteLine("Existing user with missing email - updating profile");
                
                // Fix missing email for existing user
                userProfile.Email = !string.IsNullOrEmpty(user.Email) ? user.Email : request.Email;
                userProfile.UpdatedAt = DateTime.UtcNow;
                needsUpdate = true;
            }
            else if (string.IsNullOrEmpty(userProfile.UserType) || userProfile.UserType == "undefined")
            {
                // Update existing profile with missing user type
                userProfile.UserType = user.UserType ?? request.UserType ?? "candidate";
                needsUpdate = true;
            }
            
            if (needsUpdate)
            {
                Console.WriteLine($"Updating profile with userId: {user.Id}, userType: {userProfile.UserType}, subscriptionType: {userProfile.SubscriptionType}");
                await _userService.AddOrUpdateUserProfileAsync(userProfile);
            }

            // Ensure user has a subscription - check and create if missing
            try
            {
                Console.WriteLine($"Checking subscription for user: {user.Id}");
                var activeSubscription = await _userService.GetUserSubscriptionAsync(user.Id);
                Console.WriteLine($"Found subscription: {activeSubscription.subscription_type}, active: {activeSubscription.is_active}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"No subscription found for user {user.Id}: {ex.Message}");
                Console.WriteLine("Creating default free subscription for user without subscription");
                
                try
                {
                    await _userService.CreateOrUpdateSubscription(user.Id, "free");
                    Console.WriteLine("Default subscription created successfully for existing user");
                }
                catch (Exception createEx)
                {
                    Console.WriteLine($"Failed to create subscription for existing user: {createEx.Message}");
                    // Continue with authentication even if subscription creation fails
                }
            }

            // Use the token from the request if available
            string accessToken = !string.IsNullOrEmpty(request.Token) ? request.Token : "";

            return new AuthResponse
            {
                UserId = user.Id,
                Email = user.Email,
                UserType = userProfile.UserType, // Use profile's UserType which is now properly set
                SubscriptionType = userProfile.SubscriptionType,
                Profile = userProfile,
                AccessToken = accessToken
            };
        }

        // Extract user ID from authorization header
        public string ExtractUserIdFromAuthHeader(string? authorizationHeader)
        {
            Console.WriteLine($"Extracting user ID from auth header: {authorizationHeader?.Substring(0, Math.Min(30, authorizationHeader?.Length ?? 0))}...");
            if (string.IsNullOrEmpty(authorizationHeader))
            {
                Console.WriteLine("Auth header is null or empty");
                return string.Empty;
            }
                
            if (authorizationHeader.StartsWith("Bearer "))
            {
                var token = authorizationHeader.Substring("Bearer ".Length).Trim();
                var userId = ExtractUserIdFromToken(token);
                Console.WriteLine($"Extracted user ID: {userId}");
                return userId;
            }
            Console.WriteLine("Auth header doesn't start with 'Bearer'");
            
            return string.Empty;
        }

        // Extract user ID from JWT token
        public string ExtractUserIdFromToken(string token)
        {
            Console.WriteLine("ExtractUserIdFromToken Method");
            if (string.IsNullOrEmpty(token))
            {
                Console.WriteLine("Token is null or empty");
                return string.Empty;
            }
                
            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var jwtToken = tokenHandler.ReadJwtToken(token);
                
                // For Supabase tokens, the user ID is in the 'sub' claim
                var userIdClaim = jwtToken.Claims.FirstOrDefault(x => x.Type == "sub");
                
                if (userIdClaim != null)
                {
                    Console.WriteLine($"Found user ID in token sub claim: {userIdClaim.Value}");
                    return userIdClaim.Value;
                }
                
                // Try other common claim types
                userIdClaim = jwtToken.Claims.FirstOrDefault(x => x.Type == "userId" || 
                                                                  x.Type == "user_id" ||
                                                                  x.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier");
                if (userIdClaim != null)
                {
                    Console.WriteLine($"Found user ID in token other claim: {userIdClaim.Value}");
                    return userIdClaim.Value;
                }
                
                Console.WriteLine("All claims in token:");
                foreach (var claim in jwtToken.Claims)
                {
                    Console.WriteLine($"  {claim.Type}: {claim.Value}");
                }
                
                Console.WriteLine("No user ID found in token claims");
                
                return string.Empty;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error extracting user ID from token: {ex.Message}");
                return string.Empty;
            }
        }

        // Get user ID from request (auth header or body)
        public string GetUserIdFromRequest(HttpRequest request)
        {
            // First try to get from auth header
            string userId = ExtractUserIdFromAuthHeader(request.Headers["Authorization"].ToString());
            if (!string.IsNullOrEmpty(userId))
            {
                Console.WriteLine($"Got user ID from auth header: {userId}");
                return userId;
            }
            Console.WriteLine("No user ID in auth header, checking request body");
            
            // Fall back to body if available
            if (request.HasJsonContentType())
            {
                try
                {
                    request.EnableBuffering();
                    using (var reader = new StreamReader(request.Body, leaveOpen: true))
                    {
                        request.Body.Position = 0; // Reset the position to read from start
                        var bodyStr = reader.ReadToEndAsync().Result;
                        request.Body.Position = 0; // Reset again for model binding
                        Console.WriteLine($"Request body: {bodyStr}");
                        if (!string.IsNullOrEmpty(bodyStr))
                        {
                            var bodyJson = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(bodyStr);
                            if (bodyJson != null && bodyJson.TryGetValue("userId", out var bodyUserId) && bodyUserId != null)
                            {
                                Console.WriteLine($"Got user ID from request body: {bodyUserId}");
                                return bodyUserId.ToString() ?? string.Empty;
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    // Log but continue - just means we couldn't extract from body
                    Console.WriteLine($"Error parsing request body: {ex.Message}");
                }
            }
            
            // Try form data as last resort
            if (request.HasFormContentType)
            {
                var formUserId = request.Form["userId"].ToString();
                if (!string.IsNullOrEmpty(formUserId))
                {
                    Console.WriteLine($"Got user ID from form data: {formUserId}");
                    return formUserId;
                }
            }
            Console.WriteLine("No user ID found in request");
            return string.Empty;
        }
    }
}
