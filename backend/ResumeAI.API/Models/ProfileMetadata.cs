using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace ResumeAI.API.Models
{
    public class ProfileMetadata
    {
        [JsonPropertyName("id")]
        public Guid Id { get; set; }
        
        [JsonPropertyName("user_id")]
        public required string UserId { get; set; }
        
        [JsonPropertyName("blob_path")]
        public required string BlobPath { get; set; }
        
        [JsonPropertyName("file_name")]
        public required string FileName { get; set; }
        
        [JsonPropertyName("file_size")]
        public int? FileSize { get; set; }
        
        [JsonPropertyName("file_url")]
        public required string FileUrl { get; set; }
        
        [JsonPropertyName("upload_date")]
        public DateTime UploadDate { get; set; }
        
        [JsonPropertyName("job_title")]
        public required string JobTitle { get; set; }
        
        [JsonPropertyName("current_company")]
        public required string CurrentCompany { get; set; }
        
        [JsonPropertyName("years_of_experience")]
        public required string YearsOfExperience { get; set; }
        
        [JsonPropertyName("professional_bio")]
        public required string ProfessionalBio { get; set; }
        
        [JsonPropertyName("location")]
        public required string Location { get; set; }
        
        [JsonPropertyName("phone_number")]
        public required string PhoneNumber { get; set; }
        
        [JsonPropertyName("skills")]
        public required List<string> Skills { get; set; }
        
        [JsonPropertyName("last_updated")]
        public DateTime LastUpdated { get; set; }
        
        [JsonPropertyName("created_at")]
        public DateTime? CreatedAt { get; set; }
        
        [JsonPropertyName("updated_at")]
        public DateTime? UpdatedAt { get; set; }
        
        [JsonPropertyName("is_visible_to_recruiters")]
        public bool IsVisibleToRecruiters { get; set; }
        
        // Resume Text Content for Search
        [JsonPropertyName("resume_text")]
        public string? ResumeText { get; set; }
    }
}