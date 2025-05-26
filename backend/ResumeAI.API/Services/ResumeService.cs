using ResumeAI.API.Models;
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using System.IO;

namespace ResumeAI.API.Services
{
    public class ResumeService
    {
        
        private readonly ActivityLogService _activityLogService;
        private readonly Random _random = new Random();
        private readonly HttpClient _httpClient;
        private readonly string _pythonApiBaseUrl = "http://localhost:8000/candidate"; // Adjust if needed

        public ResumeService(ActivityLogService activityLogService)
        {           
            _activityLogService = activityLogService;
            _httpClient = new HttpClient();
        }

        public async Task<ResumeAnalysisResult> AnalyzeResume(string resumeText, string jobDescription, string plan, string userId, string featureType, Subscription? subscription = null)
        {
            var form = new MultipartFormDataContent();
            form.Add(new StringContent(jobDescription), "job_description");
            form.Add(new StringContent(resumeText, Encoding.UTF8), "resume", "resume.txt");
            form.Add(new StringContent(plan), "plan");
            var response = await _httpClient.PostAsync($"{_pythonApiBaseUrl}/analyze", form);
            response.EnsureSuccessStatusCode();
            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<ResumeAnalysisResult>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            if (result == null)
                throw new Exception("Failed to parse response from resume analysis service.");
            // Only increment usage if success
            await _activityLogService.TrackFeatureUsage(userId, featureType, subscription);
            return result;
        }
        
        public async Task<ResumeOptimizationResult> OptimizeResume(IFormFile file, string plan, string userId, string featureType, Subscription? subscription = null)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("Resume file is required", nameof(file));
            var form = new MultipartFormDataContent
            {
                { new StreamContent(file.OpenReadStream()), "resume", file.FileName },
                { new StringContent(plan), "plan" }
            };
            HttpResponseMessage response = await _httpClient.PostAsync($"{_pythonApiBaseUrl}/optimize", form);
            response.EnsureSuccessStatusCode();
            var json = await response.Content.ReadAsStringAsync();
            Console.WriteLine("PYTHON RAW RESPONSE for OptimizeResume: " + json); // or use your logger
            if (!response.IsSuccessStatusCode)
            {
                // Improved error extraction
                string errorMessage = $"Python API Error [{(int)response.StatusCode}]";
                try
                {
                    using var doc = JsonDocument.Parse(json);
                    if (doc.RootElement.TryGetProperty("detail", out var detailProp))
                        errorMessage = detailProp.GetString() ?? errorMessage;
                    else
                        errorMessage = json;
                }
                catch
                {
                    errorMessage = json;
                }
                throw new HttpRequestException(errorMessage);
            }

            var result = JsonSerializer.Deserialize<ResumeOptimizationResult>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            Console.WriteLine("return result from .NET: " + result); // or use your logger
            if (result == null)
                throw new Exception("Failed to parse response from resume customization service.");

            await _activityLogService.TrackFeatureUsage(userId, featureType, subscription);
            return result;
        }
        
        public async Task<JobscanReportResult> CustomizeResume(
            IFormFile file,
            string jobDescription,
            string plan,
            string userId,
            string featureType,
            IFormFile? jobDescriptionFile = null, // <-- Add this parameter
            Subscription? subscription = null)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("Resume file is required", nameof(file));

            var form = new MultipartFormDataContent
            {
                { new StreamContent(file.OpenReadStream()), "resume", file.FileName },
                { new StringContent(plan), "plan" }
            };

            // Add job description as text if provided
            if (!string.IsNullOrWhiteSpace(jobDescription))
                form.Add(new StringContent(jobDescription), "job_description");

            // Add job description file if provided
            if (jobDescriptionFile != null && jobDescriptionFile.Length > 0)
                form.Add(new StreamContent(jobDescriptionFile.OpenReadStream()), "job_description_file", jobDescriptionFile.FileName);

            HttpResponseMessage response = await _httpClient.PostAsync($"{_pythonApiBaseUrl}/customize", form);
            var json = await response.Content.ReadAsStringAsync();
            Console.WriteLine("PYTHON RAW RESPONSE for CustomizeResume: " + json); // or use your logger
            if (!response.IsSuccessStatusCode)
            {
                // Improved error extraction
                string errorMessage = $"Python API Error [{(int)response.StatusCode}]";
                try
                {
                    using var doc = JsonDocument.Parse(json);
                    if (doc.RootElement.TryGetProperty("detail", out var detailProp))
                        errorMessage = detailProp.GetString() ?? errorMessage;
                    else
                        errorMessage = json;
                }
                catch
                {
                    errorMessage = json;
                }
                throw new HttpRequestException(errorMessage);
            }

            var result = JsonSerializer.Deserialize<JobscanReportResult>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            Console.WriteLine("return result from .NET: " + result); // or use your logger
            if (result == null)
                throw new Exception("Failed to parse response from resume customization service.");

            await _activityLogService.TrackFeatureUsage(userId, featureType, subscription);
            return result;
        }
        public async Task<ResumeBenchmarkResult> BenchmarkResume(string resumeText, string jobDescription, string plan, string userId, string featureType, Subscription? subscription = null)
        {
            var form = new MultipartFormDataContent();
            form.Add(new StringContent(jobDescription), "job_description");
            form.Add(new StringContent(resumeText, Encoding.UTF8), "resume", "resume.txt");
            form.Add(new StringContent(plan), "plan");
            var response = await _httpClient.PostAsync($"{_pythonApiBaseUrl}/benchmark", form);
            response.EnsureSuccessStatusCode();
            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<ResumeBenchmarkResult>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            if (result == null)
                throw new Exception("Failed to parse response from resume benchmarking service.");
            // Only increment usage if success
            await _activityLogService.TrackFeatureUsage(userId, featureType, subscription);
            return result;
        }
        
        public async Task<ResumeATSResult> ScanResumeWithATS(string resumeText, string plan, string userId, string featureType, Subscription? subscription = null)
        {
            var form = new MultipartFormDataContent();
            form.Add(new StringContent(resumeText ?? string.Empty, Encoding.UTF8), "resume", "resume.txt");
            form.Add(new StringContent(plan), "plan");
            var response = await _httpClient.PostAsync($"{_pythonApiBaseUrl}/ats_scan", form);
            response.EnsureSuccessStatusCode();
            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<ResumeATSResult>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            if (result == null)
                throw new Exception("Failed to parse response from ATS scan service.");
            // Only increment usage if success
            await _activityLogService.TrackFeatureUsage(userId, featureType, subscription);
            return result;
        }
        
        
        #region Helper Methods
        
        // Removed mock/demo helper methods as all logic is handled by the Python microservice
        
        #endregion
    }
    
    #region Result Classes
    
    public class ResumeAnalysisResult
    {
        public int MatchScore { get; set; }
        public int KeywordMatchScore { get; set; }
        public int FormatScore { get; set; }
        public List<string> MissingKeywords { get; set; } = new List<string>();
        public List<string> Suggestions { get; set; } = new List<string>();
    }
    
   
    
    public class ResumeBenchmarkResult
    {
        public int OverallScore { get; set; }
        public int IndustryAverage { get; set; }
        public int TopCandidateAverage { get; set; }
        public Dictionary<string, int> CategoryScores { get; set; } = new Dictionary<string, int>();
        public int IndustryRanking { get; set; }
        public List<string> Recommendations { get; set; } = new List<string>();
        public List<string> Strengths { get; set; } = new List<string>();
        public List<string> Weaknesses { get; set; } = new List<string>();
    }
    
    public class ResumeATSResult
    {
        public int ATSScore { get; set; }
        public Dictionary<string, string> ParsedSections { get; set; } = new Dictionary<string, string>();
        public List<string> ParsingIssues { get; set; } = new List<string>();
        public List<string> OptimizationTips { get; set; } = new List<string>();
    }

    public class JobscanReportResult
    {
        public int MatchRate { get; set; } // Match score as per JD
        public int AtsScore { get; set; }  // ATS/formatting score
        public SkillsMatch? SkillsMatch { get; set; }
        public List<string>? AtsTips { get; set; }
        public KeywordAnalysis? KeywordAnalysis { get; set; }
        public List<string>? Recommendations { get; set; }
        public string? Summary { get; set; }
        public Dictionary<string, string>? SectionFeedback { get; set; }
        public List<ResumeHighlight>? ResumeHighlights { get; set; }
        // ...other fields as needed
    }
    public class ResumeOptimizationResult
    {
        public int AtsScore { get; set; }  // ATS/formatting score
        public int FormattingScore { get; set; }  // ATS/formatting score
        public int ReadabilityScore { get; set; }  // Readability score
        public string OptimizedContent { get; set; } = string.Empty;
        public List<string> Improvements { get; set; } = new List<string>();
        public KeywordAnalysis? KeywordAnalysis { get; set; }
        public List<string>? SpellingGrammarIssues { get; set; } = new List<string>();
        public List<string>? AtsTips { get; set; } = new List<string>();
        public string? Summary { get; set; }
        public Dictionary<string, string>? SectionFeedback { get; set; } = new Dictionary<string, string>();
        public List<ResumeHighlight>? ResumeHighlights { get; set; }
        // Add any other fields as needed from the Python response
        public string ? AdditionalInsights { get; set; } = string.Empty;
        public int ActionabilityAssessment { get; set; } 
    }

    public class SkillsMatch
    {
        public List<string>? MatchedSkills { get; set; }
        public List<string>? MissingSkills { get; set; }
    }
    public class KeywordAnalysis
    {
        public List<string>? FoundKeywords { get; set; }
        public List<string>? MissingKeywords { get; set; }
    }
    public class ResumeHighlight
    {
        public string? Text { get; set; }
        public string? Reason { get; set; }
    }

    public class ResumeOptimizeReportResult
    {
        public int AtsScore { get; set; }
        public string? OptimizedContent { get; set; }
        public List<string>? Improvements { get; set; }
        public int FormattingScore { get; set; }
        public KeywordAnalysis? KeywordAnalysis { get; set; }
        public List<string>? AtsTips { get; set; }
        public string? Summary { get; set; }
        public Dictionary<string, string>? SectionFeedback { get; set; }
        public List<ResumeHighlight>? ResumeHighlights { get; set; }
        public int ActionabilityAssessment { get; set; } 
        // Add any other fields as needed from the Python response
    }
    #endregion
}
