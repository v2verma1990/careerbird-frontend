using ResumeAI.API.Models;
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Text;
using Microsoft.Extensions.Logging;

namespace ResumeAI.API.Services
{
    public class JobsService
    {
        private readonly HttpClient _httpClient;
        private readonly string _pythonApiBaseUrl = "http://localhost:8000/recruiter"; // Adjust if needed
        private readonly ILogger<JobsService> _logger;

        public JobsService(ILogger<JobsService> logger)
        {
            _httpClient = new HttpClient();
            _logger = logger;
        }

        public OptimizedJobDescription OptimizeJobDescription(string originalJobDescription, string plan = "free")
        {
            try
            {
                var form = new MultipartFormDataContent();
                form.Add(new StringContent(originalJobDescription), "job_description");
                form.Add(new StringContent(plan), "plan");
                var response = _httpClient.PostAsync($"{_pythonApiBaseUrl}/optimize_job", form).Result;
                response.EnsureSuccessStatusCode();
                var json = response.Content.ReadAsStringAsync().Result;
                var result = JsonSerializer.Deserialize<OptimizedJobDescription>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                if (result == null)
                    throw new Exception("Failed to parse response from job optimization service.");
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error optimizing job description");
                throw;
            }
        }

        public List<Candidate> FindBestCandidates(string jobDescription, string plan = "free")
        {
            try
            {
                var form = new MultipartFormDataContent();
                form.Add(new StringContent(jobDescription), "job_description");
                form.Add(new StringContent(plan), "plan");
                var response = _httpClient.PostAsync($"{_pythonApiBaseUrl}/find_best_candidates", form).Result;
                response.EnsureSuccessStatusCode();
                var json = response.Content.ReadAsStringAsync().Result;
                var result = JsonSerializer.Deserialize<List<Candidate>>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                if (result == null)
                    throw new Exception("Failed to parse response from candidate search service.");
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error finding best candidates");
                throw;
            }
        }

        public List<InterviewQuestion> GenerateInterviewQuestions(string jobTitle, string plan = "free")
        {
            try
            {
                var form = new MultipartFormDataContent();
                form.Add(new StringContent(jobTitle), "job_title");
                form.Add(new StringContent(plan), "plan");
                var response = _httpClient.PostAsync($"{_pythonApiBaseUrl}/generate_interview_questions", form).Result;
                response.EnsureSuccessStatusCode();
                var json = response.Content.ReadAsStringAsync().Result;
                var result = JsonSerializer.Deserialize<List<InterviewQuestion>>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                if (result == null)
                    throw new Exception("Failed to parse response from interview question service.");
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating interview questions");
                throw;
            }
        }

        public CoverLetter GenerateCoverLetter(string jobTitle, string company, string jobDescription, string plan = "free")
        {
            try
            {
                var form = new MultipartFormDataContent();
                form.Add(new StringContent(jobTitle), "job_title");
                form.Add(new StringContent(company), "company");
                form.Add(new StringContent(jobDescription), "job_description");
                form.Add(new StringContent(plan), "plan");
                var response = _httpClient.PostAsync($"{_pythonApiBaseUrl}/generate_cover_letter", form).Result;
                response.EnsureSuccessStatusCode();
                var json = response.Content.ReadAsStringAsync().Result;
                var result = JsonSerializer.Deserialize<CoverLetter>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                if (result == null)
                    throw new Exception("Failed to parse response from cover letter service.");
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating cover letter");
                throw;
            }
        }

        public OptimizedResume OptimizeResume(string resumeContent, string jobDescription, string plan = "free")
        {
            try
            {
                var form = new MultipartFormDataContent();
                form.Add(new StringContent(resumeContent), "resume");
                form.Add(new StringContent(jobDescription), "job_description");
                form.Add(new StringContent(plan), "plan");
                var response = _httpClient.PostAsync($"{_pythonApiBaseUrl}/optimize_resume", form).Result;
                response.EnsureSuccessStatusCode();
                var json = response.Content.ReadAsStringAsync().Result;
                var result = JsonSerializer.Deserialize<OptimizedResume>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                if (result == null)
                    throw new Exception("Failed to parse response from resume optimization service.");
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error optimizing resume");
                throw;
            }
        }

        public ATSScanResult ScanResumeWithATS(string resumeContent, string plan = "free", string jobDescription = "")
        {
            try
            {
                var form = new MultipartFormDataContent();
                form.Add(new StringContent(resumeContent), "resume");
                form.Add(new StringContent(plan), "plan");
                if (!string.IsNullOrEmpty(jobDescription))
                    form.Add(new StringContent(jobDescription), "job_description");
                var response = _httpClient.PostAsync($"{_pythonApiBaseUrl}/ats_scan", form).Result;
                response.EnsureSuccessStatusCode();
                var json = response.Content.ReadAsStringAsync().Result;
                var result = JsonSerializer.Deserialize<ATSScanResult>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                if (result == null)
                    throw new Exception("Failed to parse response from ATS scan service.");
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error scanning resume with ATS");
                throw;
            }
        }
    }
}
