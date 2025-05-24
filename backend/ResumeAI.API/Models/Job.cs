
using System;
using System.Collections.Generic;

namespace ResumeAI.API.Models
{
    public class OptimizedJobDescription
    {
        public string OriginalContent { get; set; } = string.Empty;
        public string OptimizedContent { get; set; } = string.Empty;
        public List<string> Insights { get; set; } = new List<string>();
    }

    public class Candidate
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int MatchScore { get; set; }
        public string Experience { get; set; } = string.Empty;
        public List<string> Skills { get; set; } = new List<string>();
        public string NoticePeriod { get; set; } = string.Empty;
        public string Education { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
    }
    
    public class InterviewQuestion
    {
        public string Question { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
    }
    
    public class CoverLetter
    {
        public string Content { get; set; } = string.Empty;
        public string JobTitle { get; set; } = string.Empty;
        public string Company { get; set; } = string.Empty;
    }
    
    public class OptimizedResume
    {
        public string Content { get; set; } = string.Empty;
        public List<string> Improvements { get; set; } = new List<string>();
        public int OverallScore { get; set; }
    }

    public class ATSScanResult
    {
        public int Score { get; set; }
        public List<string> Keywords { get; set; } = new List<string>();
        public List<string> MissingKeywords { get; set; } = new List<string>();
        public List<KeywordCategory> KeywordCategories { get; set; } = new List<KeywordCategory>();
        public List<string> Recommendations { get; set; } = new List<string>();
    }

    public class KeywordCategory
    {
        public string Name { get; set; } = string.Empty;
        public int Count { get; set; }
        public double Percentage { get; set; }
    }
}
