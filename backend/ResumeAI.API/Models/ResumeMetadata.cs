using System;
using System.Collections.Generic;

namespace ResumeAI.API.Models
{
    public class ResumeMetadata
    {
        public Guid Id { get; set; }
        public string? UserId { get; set; }
        public string? BlobPath { get; set; }
        public string? FileName { get; set; }
        public int? FileSize { get; set; }
        public string? FileUrl { get; set; }
        public DateTime UploadDate { get; set; }
        public string? JobTitle { get; set; }
        public string? CurrentCompany { get; set; }
        public string? YearsOfExperience { get; set; }
        public string? ProfessionalBio { get; set; }
        public string? Location { get; set; }
        public string? PhoneNumber { get; set; }
        public List<string>? Skills { get; set; }
        public DateTime LastUpdated { get; set; }
    }
}