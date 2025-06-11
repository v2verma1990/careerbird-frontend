using System;
using System.Text.Json.Serialization;

namespace ResumeAI.API.Models
{
    public class User
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Email { get; set; } = string.Empty;
        public string UserType { get; set; } = string.Empty; // "candidate" or "recruiter"
    }

    public class UserProfile
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;
        [JsonPropertyName("user_type")]
        public string UserType { get; set; } = string.Empty;
        [JsonPropertyName("subscription_type")]
        public string SubscriptionType { get; set; } = string.Empty;
        [JsonPropertyName("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        [JsonPropertyName("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        [JsonPropertyName("email")]
        public string Email { get; set; } = string.Empty;
        [JsonPropertyName("default_resume_blob_name")]
        public string? DefaultResumeBlobName { get; set; } = string.Empty;
        // New fields to track usage limits
    
    }

    // Removing the duplicate Subscription class here since it exists in ActivityLog.cs

    public class AuthRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string UserType { get; set; } = "candidate";
        public string UserId { get; set; } = string.Empty;
        public string Token { get; set; } = string.Empty;
    }

    public class AuthResponse
    {
        internal string? UserType;
        internal string? SubscriptionType;

        public string UserId { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string AccessToken { get; set; } = string.Empty;
        public UserProfile Profile { get; set; } = new UserProfile();
        
    }
}
