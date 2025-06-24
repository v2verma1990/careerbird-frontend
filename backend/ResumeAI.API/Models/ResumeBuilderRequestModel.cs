using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;

namespace ResumeAI.API.Models
{
    public class ResumeBuilderRequestModel
    {
        public IFormFile? ResumeFile { get; set; }
        public string? ResumeData { get; set; }
        [Required]
        public string TemplateId { get; set; } = string.Empty;
        public string? Color { get; set; } // Primary color for the template
    }

    public class ResumeOptimizeRequestModel
    {
        [Required]
        public string ResumeData { get; set; } = string.Empty;
        [Required]
        public string TemplateId { get; set; } = string.Empty;
    }

    public class GeneratePdfRequestModel
    {
        [Required]
        public string Html { get; set; } = string.Empty;
        public string Css { get; set; } = string.Empty;
        [Required]
        public string Filename { get; set; } = string.Empty;
        [Required]
        public string TemplateId { get; set; } = string.Empty;
        [Required]
        public string Color { get; set; } = string.Empty;
    }

    public class ResumeTemplateModel
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Thumbnail { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
    }

    public class ResumeDataModel
    {
        public string Name { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string LinkedIn { get; set; } = string.Empty;
        public string Website { get; set; } = string.Empty;
        public string Summary { get; set; } = string.Empty;
        public string Photo { get; set; } = string.Empty; // URL or base64 image data
        public string Color { get; set; } = "#2196F3"; // Default color (blue)
        public List<string> Skills { get; set; } = new List<string>();
        public List<ExperienceItem> Experience { get; set; } = new List<ExperienceItem>();
        public List<EducationItem> Education { get; set; } = new List<EducationItem>();
        public List<CertificationItem> Certifications { get; set; } = new List<CertificationItem>();
        public List<ProjectItem> Projects { get; set; } = new List<ProjectItem>();
        public List<ReferenceItem> References { get; set; } = new List<ReferenceItem>();
        public List<string> Achievements { get; set; } = new List<string>();
    }

    public class ExperienceItem
    {
        public string Title { get; set; } = string.Empty;
        public string Company { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string StartDate { get; set; } = string.Empty;
        public string EndDate { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public List<ProjectItem> Projects { get; set; } = new List<ProjectItem>();
    }

    public class EducationItem
    {
        public string Degree { get; set; } = string.Empty;
        public string Institution { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string StartDate { get; set; } = string.Empty;
        public string EndDate { get; set; } = string.Empty;
        public string GPA { get; set; } = string.Empty;
    }

    public class CertificationItem
    {
        public string Name { get; set; } = string.Empty;
        public string Issuer { get; set; } = string.Empty;
        public string Date { get; set; } = string.Empty;
    }

    public class ProjectItem
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Technologies { get; set; } = string.Empty;
    }

    public class ReferenceItem
    {
        public string Name { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Contact { get; set; } = string.Empty;
    }
}