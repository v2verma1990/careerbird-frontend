using System;
using System.Text.Json.Serialization;

namespace ResumeAI.API.Models
{
    public class ActivityLog
    {
        public string id { get; set; } = Guid.NewGuid().ToString();
        public string user_id { get; set; } = string.Empty;
        public string action_type { get; set; } = string.Empty;
        public string? description { get; set; }
        public DateTime created_at  { get; set; } = DateTime.UtcNow;
       // public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }

    public class UsageTracking
    {
        public string id { get; set; } = Guid.NewGuid().ToString();
        public string user_id { get; set; } = string.Empty;
        public string feature_type { get; set; } = string.Empty;
        public int usage_count { get; set; } = 0;
        public DateTime last_used { get; set; } = DateTime.UtcNow;
        public DateTime created_at { get; set; } = DateTime.UtcNow;
        public DateTime updated_at { get; set; } = DateTime.UtcNow;
        public string plan { get; set; } = string.Empty; // NEW: plan/subscription_type for per-plan usage tracking
    }

    public class Subscription
    {
        // Using consistent casing (PascalCase) for all properties to avoid confusion
        public string id { get; set; } = Guid.NewGuid().ToString();
        public string user_id { get; set; } = string.Empty;
        public string subscription_type { get; set; } = "free";
        public DateTime start_date { get; set; } = DateTime.UtcNow;
        public DateTime? end_date { get; set; } = null;
        public DateTime created_at { get; set; } = DateTime.UtcNow;
        public DateTime updated_at { get; set; } = DateTime.UtcNow;
        
        // // Add these properties to match what's used in Supabase
        // public DateTime created_at { 
        //     get { return CreatedAt; } 
        //     set { CreatedAt = value; } 
        // }
        // public DateTime updated_at { 
        //     get { return UpdatedAt; } 
        //     set { UpdatedAt = value; } 
        // }
    }
}
