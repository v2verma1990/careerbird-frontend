
namespace ResumeAI.API.Models
{
    public class Resume
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string UserId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public bool IsOptimized { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class ResumeOptimization
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string ResumeId { get; set; } = string.Empty;
        public int OverallScore { get; set; }
        public string JobDescription { get; set; } = string.Empty;
        public string OptimizedContent { get; set; } = string.Empty;
        public List<string> Recommendations { get; set; } = new List<string>();
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class BenchmarkResult
    {
        public int OverallScore { get; set; }
        public int IndustryAverage { get; set; }
        public int TopCandidateAverage { get; set; }
        public CategoryScores CategoryScores { get; set; } = new CategoryScores();
        public int IndustryRanking { get; set; }
        public List<string> Recommendations { get; set; } = new List<string>();
        public List<string> Strengths { get; set; } = new List<string>();
        public List<string> Weaknesses { get; set; } = new List<string>();
    }

    public class CategoryScores
    {
        public int Experience { get; set; }
        public int Education { get; set; }
        public int Skills { get; set; }
        public int Achievements { get; set; }
        public int Formatting { get; set; }
    }
     public class OptimizeResumeRequest
    {
        public string UserId { get; set; } = string.Empty;
        public string ResumeContent { get; set; } = string.Empty;
        public string JobDescription { get; set; } = string.Empty;
        public string ResumeId { get; set; } = string.Empty;
    }
    
    public class CoverLetterRequest
    {
        public string UserId { get; set; } = string.Empty;
        public string JobTitle { get; set; } = string.Empty;
        public string Company { get; set; } = string.Empty;
        public string JobDescription { get; set; } = string.Empty;
        public string ResumeId { get; set; } = string.Empty;
    }
    
    public class InterviewQuestionsRequest
    {
        public string UserId { get; set; } = string.Empty;
        public string JobTitle { get; set; } = string.Empty;
        public string JobDescription { get; set; } = string.Empty;
    }
}
