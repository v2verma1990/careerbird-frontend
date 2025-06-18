using System;
using System.Threading.Tasks;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Net.Http;
using System.Text;
using System.Linq;
using System.IO;
using ResumeAI.API.Models;
using System.Collections.Generic;
using ResumeAI.API.Utilities;

namespace ResumeAI.API.Services
{
    public class ProfileMetadataService
    {
        private readonly SupabaseHttpClientService _supabaseHttpClientService;
        private readonly HttpClient _httpClient;
        private readonly string _pythonApiBaseUrl;

        public ProfileMetadataService(SupabaseHttpClientService supabaseHttpClientService, IConfiguration configuration, HttpClient? httpClient = null)
        {
            _supabaseHttpClientService = supabaseHttpClientService;
            _httpClient = httpClient ?? new HttpClient();
            _pythonApiBaseUrl = configuration["PythonAPI:BaseUrl"] ?? "http://localhost:8000";
        }

        public async Task<ProfileMetadata?> GetProfileMetadataAsync(string userId)
        {
            Console.WriteLine($"GetProfileMetadataAsync for user ID: {userId}");
            
            try
            {
                // Ensure we're using the service key for admin operations
                _supabaseHttpClientService.SetServiceKey();
                
                var url = $"{_supabaseHttpClientService.Url}/rest/v1/profile_metadata?user_id=eq.{Uri.EscapeDataString(userId)}&select=*";
                Console.WriteLine($"Fetching profile metadata from: {url}");
                
                var response = await _supabaseHttpClientService.Client.GetAsync(url);
                
                if (!response.IsSuccessStatusCode)
                {
                    Console.WriteLine($"Error fetching profile metadata: {response.StatusCode}");
                    Console.WriteLine($"Response: {await response.Content.ReadAsStringAsync()}");
                    return null;
                }
                
                var content = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"Profile metadata response content: {content}");
                
                var metadataList = JsonSerializer.Deserialize<List<ProfileMetadata>>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new List<ProfileMetadata>();
                return metadataList.FirstOrDefault();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception in GetProfileMetadataAsync: {ex.Message}");
                return null;
            }
        }

        public async Task<ProfileMetadata?> CreateProfileMetadataAsync(ProfileMetadata metadata)
        {
            Console.WriteLine($"CreateProfileMetadataAsync for user ID: {metadata.UserId}");
            
            try
            {
                // Ensure we're using the service key for admin operations
                _supabaseHttpClientService.SetServiceKey();
                
                var url = $"{_supabaseHttpClientService.Url}/rest/v1/profile_metadata";
                
                // Create a simplified version of the metadata without the problematic fields
                var simplifiedMetadata = new
                {
                    id = metadata.Id,
                    user_id = metadata.UserId,
                    blob_path = metadata.BlobPath,
                    file_name = metadata.FileName,
                    file_size = metadata.FileSize,
                    file_url = metadata.FileUrl,
                    upload_date = metadata.UploadDate,
                    job_title = metadata.JobTitle,
                    current_company = metadata.CurrentCompany,
                    years_of_experience = metadata.YearsOfExperience,
                    professional_bio = metadata.ProfessionalBio,
                    location = metadata.Location,
                    phone_number = metadata.PhoneNumber,
                    skills = metadata.Skills,
                    last_updated = metadata.LastUpdated
                };
                
                var json = JsonSerializer.Serialize(simplifiedMetadata, new JsonSerializerOptions 
                { 
                    PropertyNamingPolicy = new SnakeCaseNamingPolicy(),
                    WriteIndented = true
                });
                Console.WriteLine($"Profile metadata JSON: {json}");
                
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                
                // Use Prefer header to return the inserted record
                _supabaseHttpClientService.Client.DefaultRequestHeaders.Remove("Prefer");
                _supabaseHttpClientService.Client.DefaultRequestHeaders.Add("Prefer", "return=representation");
                
                var response = await _supabaseHttpClientService.Client.PostAsync(url, content);
                
                if (!response.IsSuccessStatusCode)
                {
                    Console.WriteLine($"Error creating profile metadata: {response.StatusCode}");
                    Console.WriteLine($"Response: {await response.Content.ReadAsStringAsync()}");
                    return null;
                }
                
                var responseContent = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"Create profile metadata response: {responseContent}");
                
                var createdMetadata = JsonSerializer.Deserialize<List<ProfileMetadata>>(responseContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new List<ProfileMetadata>();
                return createdMetadata.FirstOrDefault();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception in CreateProfileMetadataAsync: {ex.Message}");
                return null;
            }
        }

        public async Task<ProfileMetadata?> UpdateProfileMetadataAsync(ProfileMetadata metadata)
        {
            Console.WriteLine($"UpdateProfileMetadataAsync for user ID: {metadata.UserId}");
            Console.WriteLine($"File info being updated - FileName: {metadata.FileName}, BlobPath: {metadata.BlobPath}");
            
            try
            {
                // Ensure we're using the service key for admin operations
                _supabaseHttpClientService.SetServiceKey();
                
                var url = $"{_supabaseHttpClientService.Url}/rest/v1/profile_metadata?user_id=eq.{Uri.EscapeDataString(metadata.UserId)}";
                
                // Create a simplified version of the metadata without the problematic fields
                var simplifiedMetadata = new
                {
                    id = metadata.Id,
                    user_id = metadata.UserId,
                    blob_path = metadata.BlobPath,
                    file_name = metadata.FileName,
                    file_size = metadata.FileSize,
                    file_url = metadata.FileUrl,
                    upload_date = metadata.UploadDate,
                    job_title = metadata.JobTitle,
                    current_company = metadata.CurrentCompany,
                    years_of_experience = metadata.YearsOfExperience,
                    professional_bio = metadata.ProfessionalBio,
                    location = metadata.Location,
                    phone_number = metadata.PhoneNumber,
                    skills = metadata.Skills,
                    last_updated = metadata.LastUpdated
                };
                
                var json = JsonSerializer.Serialize(simplifiedMetadata, new JsonSerializerOptions 
                { 
                    PropertyNamingPolicy = new SnakeCaseNamingPolicy(),
                    WriteIndented = true
                });
                Console.WriteLine($"Profile metadata JSON for update: {json}");
                
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                
                // Use Prefer header to return the updated record
                _supabaseHttpClientService.Client.DefaultRequestHeaders.Remove("Prefer");
                _supabaseHttpClientService.Client.DefaultRequestHeaders.Add("Prefer", "return=representation");
                
                var response = await _supabaseHttpClientService.Client.PatchAsync(url, content);
                
                if (!response.IsSuccessStatusCode)
                {
                    Console.WriteLine($"Error updating profile metadata: {response.StatusCode}");
                    Console.WriteLine($"Response: {await response.Content.ReadAsStringAsync()}");
                    return null;
                }
                
                var responseContent = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"Update profile metadata response: {responseContent}");
                
                var updatedMetadata = JsonSerializer.Deserialize<List<ProfileMetadata>>(responseContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new List<ProfileMetadata>();
                var result = updatedMetadata.FirstOrDefault();
                
                if (result != null)
                {
                    Console.WriteLine($"Updated metadata retrieved - FileName: {result.FileName}, BlobPath: {result.BlobPath}");
                    
                    // Verify if the file information was properly updated
                    if (string.IsNullOrEmpty(result.FileName) && !string.IsNullOrEmpty(metadata.FileName))
                    {
                        Console.WriteLine("WARNING: FileName is empty in the updated record but was provided in the update!");
                    }
                }
                else
                {
                    Console.WriteLine("No updated metadata returned from the database");
                }
                
                return result;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception in UpdateProfileMetadataAsync: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return null;
            }
        }

        public async Task<bool> DeleteProfileMetadataAsync(string userId)
        {
            Console.WriteLine($"DeleteProfileMetadataAsync for user ID: {userId}");
            
            try
            {
                // Ensure we're using the service key for admin operations
                _supabaseHttpClientService.SetServiceKey();
                
                var url = $"{_supabaseHttpClientService.Url}/rest/v1/profile_metadata?user_id=eq.{Uri.EscapeDataString(userId)}";
                
                var response = await _supabaseHttpClientService.Client.DeleteAsync(url);
                
                if (!response.IsSuccessStatusCode)
                {
                    Console.WriteLine($"Error deleting profile metadata: {response.StatusCode}");
                    Console.WriteLine($"Response: {await response.Content.ReadAsStringAsync()}");
                    return false;
                }
                
                Console.WriteLine("Profile metadata deleted successfully");
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception in DeleteProfileMetadataAsync: {ex.Message}");
                return false;
            }
        }

        public async Task<ProfileMetadata?> UpdateResumeVisibilityAsync(string userId, bool isVisibleToRecruiters)
        {
            Console.WriteLine($"UpdateResumeVisibilityAsync for user ID: {userId}");
            Console.WriteLine($"IsVisibleToRecruiters: {isVisibleToRecruiters}");
            
            try
            {
                // Check if the user already has a profile metadata record
                var existingMetadata = await GetProfileMetadataAsync(userId);
                Console.WriteLine($"Existing metadata found: {existingMetadata != null}");

                if (existingMetadata == null)
                {
                    Console.WriteLine("No existing metadata found for user");
                    return null;
                }

                // Update the visibility setting
                existingMetadata.IsVisibleToRecruiters = isVisibleToRecruiters;
                existingMetadata.LastUpdated = DateTime.UtcNow;
                
                // Update the record in the database
                _supabaseHttpClientService.SetServiceKey();
                
                var url = $"{_supabaseHttpClientService.Url}/rest/v1/profile_metadata?user_id=eq.{Uri.EscapeDataString(userId)}";
                Console.WriteLine($"Updating profile metadata at: {url}");
                
                var updateData = new Dictionary<string, object>
                {
                    { "is_visible_to_recruiters", isVisibleToRecruiters },
                    { "last_updated", DateTime.UtcNow }
                };
                
                var content = new StringContent(
                    JsonSerializer.Serialize(updateData),
                    Encoding.UTF8,
                    "application/json");
                
                var response = await _supabaseHttpClientService.Client.PatchAsync(url, content);
                
                if (!response.IsSuccessStatusCode)
                {
                    Console.WriteLine($"Error updating profile metadata visibility: {response.StatusCode}");
                    Console.WriteLine($"Response: {await response.Content.ReadAsStringAsync()}");
                    return null;
                }
                
                Console.WriteLine("Resume visibility updated successfully");
                return existingMetadata;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception in UpdateResumeVisibilityAsync: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return null;
            }
        }

        /// <summary>
        /// Enable resume visibility with premium subscription check
        /// </summary>
        public async Task<(bool Success, string Message)> EnableResumeVisibilityAsync(string userId, UserService userService)
        {
            Console.WriteLine($"EnableResumeVisibilityAsync for user ID: {userId}");
            
            try
            {
                var existingMetadata = await GetProfileMetadataAsync(userId);
                if (existingMetadata == null)
                {
                    return (false, "No resume found. Please upload a resume first.");
                }

                // If already visible, provide status information
                if (existingMetadata.IsVisibleToRecruiters)
                {
                    var deletionDate = existingMetadata.UploadDate.AddMonths(6);
                    var daysUntilDeletion = (deletionDate - DateTime.UtcNow).Days;
                    
                    return (true, $"Resume visibility is already enabled. Your resume will remain visible to recruiters for {Math.Max(0, daysUntilDeletion)} more days (until {deletionDate:yyyy-MM-dd}). Update your resume anytime to extend this for another 6 months, regardless of your subscription status.");
                }

                // Check if user has premium subscription (only required for initial enable)
                var hasActivePremium = await userService.HasActivePremiumSubscriptionAsync(userId);
                if (!hasActivePremium)
                {
                    return (false, "Premium subscription required to enable resume visibility. Once enabled, your resume will remain visible to recruiters for 6 months even if you downgrade your subscription.");
                }

                // Enable visibility
                var result = await UpdateResumeVisibilityAsync(userId, true);
                if (result != null)
                {
                    var deletionDate = existingMetadata.UploadDate.AddMonths(6);
                    return (true, $"🎉 Resume visibility enabled! Your resume will be visible to recruiters for 6 months (until {deletionDate:yyyy-MM-dd}). This visibility will continue even if you downgrade your subscription. Update your resume anytime to extend this period for another 6 months.");
                }

                return (false, "Failed to enable resume visibility.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception in EnableResumeVisibilityAsync: {ex.Message}");
                return (false, "An error occurred while enabling resume visibility.");
            }
        }

        /// <summary>
        /// Refresh resume data retention when user updates/replaces resume
        /// </summary>
        public async Task<(bool Success, string Message)> RefreshResumeDataRetentionAsync(string userId)
        {
            Console.WriteLine($"RefreshResumeDataRetentionAsync for user ID: {userId}");
            
            try
            {
                var existingMetadata = await GetProfileMetadataAsync(userId);
                if (existingMetadata == null)
                {
                    return (false, "No resume metadata found.");
                }

                // Update upload_date to reset the 6-month timer
                existingMetadata.UploadDate = DateTime.UtcNow;
                existingMetadata.LastUpdated = DateTime.UtcNow;

                var result = await UpdateProfileMetadataAsync(existingMetadata);
                if (result != null)
                {
                    var newDeletionDate = DateTime.UtcNow.AddMonths(6);
                    return (true, $"Resume data retention refreshed. New deletion date: {newDeletionDate:yyyy-MM-dd}");
                }

                return (false, "Failed to refresh resume data retention.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception in RefreshResumeDataRetentionAsync: {ex.Message}");
                return (false, "An error occurred while refreshing resume data retention.");
            }
        }

        /// <summary>
        /// Get resumes that are approaching deletion (for notifications)
        /// </summary>
        public async Task<List<ProfileMetadata>> GetResumesApproachingDeletionAsync(int daysBeforeDeletion = 30)
        {
            Console.WriteLine($"GetResumesApproachingDeletionAsync - checking for resumes expiring in {daysBeforeDeletion} days");
            
            try
            {
                _supabaseHttpClientService.SetServiceKey();
                
                var cutoffDate = DateTime.UtcNow.AddMonths(6).AddDays(-daysBeforeDeletion);
                var maxDate = DateTime.UtcNow.AddMonths(6).AddDays(-daysBeforeDeletion + 1);
                
                var url = $"{_supabaseHttpClientService.Url}/rest/v1/profile_metadata?upload_date=gte.{cutoffDate:yyyy-MM-ddTHH:mm:ssZ}&upload_date=lt.{maxDate:yyyy-MM-ddTHH:mm:ssZ}&select=*";
                
                var response = await _supabaseHttpClientService.Client.GetAsync(url);
                
                if (!response.IsSuccessStatusCode)
                {
                    Console.WriteLine($"Error fetching resumes approaching deletion: {response.StatusCode}");
                    return new List<ProfileMetadata>();
                }
                
                var content = await response.Content.ReadAsStringAsync();
                var metadataList = JsonSerializer.Deserialize<List<ProfileMetadata>>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new List<ProfileMetadata>();
                
                Console.WriteLine($"Found {metadataList.Count} resumes approaching deletion");
                return metadataList;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception in GetResumesApproachingDeletionAsync: {ex.Message}");
                return new List<ProfileMetadata>();
            }
        }

        /// <summary>
        /// Get resumes that should be deleted (older than 6 months)
        /// </summary>
        public async Task<List<ProfileMetadata>> GetExpiredResumesAsync()
        {
            Console.WriteLine("GetExpiredResumesAsync - checking for resumes older than 6 months");
            
            try
            {
                _supabaseHttpClientService.SetServiceKey();
                
                var cutoffDate = DateTime.UtcNow.AddMonths(-6);
                var url = $"{_supabaseHttpClientService.Url}/rest/v1/profile_metadata?upload_date=lt.{cutoffDate:yyyy-MM-ddTHH:mm:ssZ}&blob_path=not.is.null&select=*";
                
                var response = await _supabaseHttpClientService.Client.GetAsync(url);
                
                if (!response.IsSuccessStatusCode)
                {
                    Console.WriteLine($"Error fetching expired resumes: {response.StatusCode}");
                    return new List<ProfileMetadata>();
                }
                
                var content = await response.Content.ReadAsStringAsync();
                var metadataList = JsonSerializer.Deserialize<List<ProfileMetadata>>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new List<ProfileMetadata>();
                
                Console.WriteLine($"Found {metadataList.Count} expired resumes");
                return metadataList;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception in GetExpiredResumesAsync: {ex.Message}");
                return new List<ProfileMetadata>();
            }
        }

        /// <summary>
        /// Delete expired resume data (keep profile metadata but remove file references)
        /// </summary>
        public async Task<int> DeleteExpiredResumeDataAsync()
        {
            Console.WriteLine("DeleteExpiredResumeDataAsync - deleting expired resume data");
            
            try
            {
                var expiredResumes = await GetExpiredResumesAsync();
                int deletedCount = 0;

                foreach (var resume in expiredResumes)
                {
                    // Clear file data but keep profile metadata
                    var updateData = new Dictionary<string, object?>
                    {
                        { "blob_path", null },
                        { "file_name", null },
                        { "file_size", null },
                        { "file_url", null },
                        { "is_visible_to_recruiters", false },
                        { "last_updated", DateTime.UtcNow }
                    };

                    _supabaseHttpClientService.SetServiceKey();
                    var url = $"{_supabaseHttpClientService.Url}/rest/v1/profile_metadata?user_id=eq.{Uri.EscapeDataString(resume.UserId)}";
                    
                    var content = new StringContent(
                        JsonSerializer.Serialize(updateData),
                        Encoding.UTF8,
                        "application/json");
                    
                    var response = await _supabaseHttpClientService.Client.PatchAsync(url, content);
                    
                    if (response.IsSuccessStatusCode)
                    {
                        deletedCount++;
                        Console.WriteLine($"Deleted resume data for user: {resume.UserId}");
                    }
                    else
                    {
                        Console.WriteLine($"Failed to delete resume data for user: {resume.UserId}");
                    }
                }

                Console.WriteLine($"Deleted {deletedCount} expired resume records");
                return deletedCount;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception in DeleteExpiredResumeDataAsync: {ex.Message}");
                return 0;
            }
        }

        /// <summary>
        /// Extract text from resume using Python microservice
        /// </summary>
        public async Task<string?> ExtractResumeTextAsync(Stream fileStream, string fileName)
        {
            try
            {
                Console.WriteLine($"Extracting text from {fileName} using Python microservice");

                // Create multipart form content (similar to ResumeBuilderService)
                using var formContent = new MultipartFormDataContent();
                using var fileContent = new StreamContent(fileStream);
                
                // Set content type for the file
                fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(GetContentType(fileName));
                
                formContent.Add(fileContent, "resume", fileName);
                formContent.Add(new StringContent("free"), "plan");

                Console.WriteLine($"Sending request to Python API: {_pythonApiBaseUrl}/candidate/extract_resume_data");
                
                // Send request to Python microservice (reuse existing endpoint)
                var response = await _httpClient.PostAsync($"{_pythonApiBaseUrl}/candidate/extract_resume_data", formContent);
                
                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"Error response from Python API: {errorContent}");
                    return null;
                }

                var responseContent = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"Successfully got response from Python API for text extraction");
                
                // Parse the response to extract just the text
                // The extract_resume_data endpoint returns structured data, but we can extract text from it
                var options = new System.Text.Json.JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true,
                    AllowTrailingCommas = true,
                    ReadCommentHandling = System.Text.Json.JsonCommentHandling.Skip
                };
                
                using var jsonDoc = System.Text.Json.JsonDocument.Parse(responseContent);
                var root = jsonDoc.RootElement;
                
                // Try to extract text from various fields in the response
                var textParts = new List<string>();
                
                // Add name, email, phone if available
                if (root.TryGetProperty("name", out var name))
                {
                    var nameValue = name.GetString();
                    if (nameValue != null)
                        textParts.Add(nameValue);
                }
                    
                if (root.TryGetProperty("email", out var email))
                {
                    var emailValue = email.GetString();
                    if (emailValue != null)
                        textParts.Add(emailValue);
                }
                    
                if (root.TryGetProperty("phone", out var phone))
                {
                    var phoneValue = phone.GetString();
                    if (phoneValue != null)
                        textParts.Add(phoneValue);
                }
                
                // Add summary/objective
                if (root.TryGetProperty("summary", out var summary))
                {
                    var summaryValue = summary.GetString();
                    if (summaryValue != null)
                        textParts.Add(summaryValue);
                }
                    
                // Add skills
                if (root.TryGetProperty("skills", out var skills) && skills.ValueKind == System.Text.Json.JsonValueKind.Array)
                {
                    foreach (var skill in skills.EnumerateArray())
                    {
                        var skillValue = skill.GetString();
                        if (skillValue != null)
                            textParts.Add(skillValue);
                    }
                }
                
                // Add experience
                if (root.TryGetProperty("experience", out var experience) && experience.ValueKind == System.Text.Json.JsonValueKind.Array)
                {
                    foreach (var exp in experience.EnumerateArray())
                    {
                        if (exp.TryGetProperty("company", out var company))
                        {
                            var companyValue = company.GetString();
                            if (companyValue != null)
                                textParts.Add(companyValue);
                        }
                        if (exp.TryGetProperty("position", out var position))
                        {
                            var positionValue = position.GetString();
                            if (positionValue != null)
                                textParts.Add(positionValue);
                        }
                        if (exp.TryGetProperty("description", out var desc))
                        {
                            var descValue = desc.GetString();
                            if (descValue != null)
                                textParts.Add(descValue);
                        }
                    }
                }
                
                // Add education
                if (root.TryGetProperty("education", out var education) && education.ValueKind == System.Text.Json.JsonValueKind.Array)
                {
                    foreach (var edu in education.EnumerateArray())
                    {
                        if (edu.TryGetProperty("institution", out var institution))
                        {
                            var institutionValue = institution.GetString();
                            if (institutionValue != null)
                                textParts.Add(institutionValue);
                        }
                        if (edu.TryGetProperty("degree", out var degree))
                        {
                            var degreeValue = degree.GetString();
                            if (degreeValue != null)
                                textParts.Add(degreeValue);
                        }
                    }
                }
                
                // Combine all text parts
                var extractedText = string.Join(" ", textParts.Where(t => !string.IsNullOrWhiteSpace(t)));
                
                if (!string.IsNullOrWhiteSpace(extractedText))
                {
                    Console.WriteLine($"Successfully extracted {extractedText.Length} characters of text");
                    return extractedText;
                }
                
                Console.WriteLine("No text could be extracted from the structured data");
                return null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error extracting text from {fileName}: {ex.Message}");
                return null;
            }
        }

        private string GetContentType(string fileName)
        {
            var extension = Path.GetExtension(fileName).ToLowerInvariant();
            return extension switch
            {
                ".pdf" => "application/pdf",
                ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ".doc" => "application/msword",
                ".txt" => "text/plain",
                _ => "application/octet-stream"
            };
        }

        /// <summary>
        /// Extract text from uploaded resume and save it to database
        /// </summary>
        public async Task<string?> ExtractAndSaveResumeTextAsync(string userId)
        {
            try
            {
                // Get the user's profile metadata
                var metadata = await GetProfileMetadataAsync(userId);
                if (metadata == null || string.IsNullOrEmpty(metadata.BlobPath))
                {
                    Console.WriteLine($"No resume file found for user {userId}");
                    return null;
                }

                // Download the file from storage (you'll need to inject IStorageService)
                // For now, let's assume we can get the file stream
                Console.WriteLine($"Extracting text for user {userId} from file {metadata.FileName}");
                
                // Create a dummy stream for now - in real implementation, download from storage
                // var fileStream = await _storageService.DownloadFileAsync("user-resumes", metadata.BlobPath);
                
                // For now, return a placeholder - you'll need to implement the actual file download
                // and text extraction using your existing Python service
                
                // Placeholder implementation
                var extractedText = $"Resume text for {metadata.FileName} - extracted on {DateTime.UtcNow}";
                
                // Update the metadata with extracted text
                _supabaseHttpClientService.SetServiceKey();
                
                var url = $"{_supabaseHttpClientService.Url}/rest/v1/profile_metadata?user_id=eq.{Uri.EscapeDataString(userId)}";
                
                var updateData = new Dictionary<string, object>
                {
                    { "resume_text", extractedText },
                    { "last_updated", DateTime.UtcNow }
                };
                
                var content = new StringContent(
                    JsonSerializer.Serialize(updateData),
                    Encoding.UTF8,
                    "application/json");

                var response = await _supabaseHttpClientService.Client.PatchAsync(url, content);

                if (response.IsSuccessStatusCode)
                {
                    Console.WriteLine($"Successfully saved extracted text for user {userId}");
                    return extractedText;
                }
                else
                {
                    Console.WriteLine($"Error updating profile metadata with extracted text: {response.StatusCode}");
                    Console.WriteLine($"Response: {await response.Content.ReadAsStringAsync()}");
                    return null;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in ExtractAndSaveResumeTextAsync for user {userId}: {ex.Message}");
                return null;
            }
        }

        public async Task<ProfileMetadata?> UpdateResumeFileInfoAsync(string userId, string blobPath, string fileName, int fileSize, string fileUrl)
        {
            Console.WriteLine($"UpdateResumeFileInfoAsync for user ID: {userId}");
            Console.WriteLine($"BlobPath: {blobPath}");
            Console.WriteLine($"FileName: {fileName}");
            Console.WriteLine($"FileSize: {fileSize}");
            Console.WriteLine($"FileUrl: {fileUrl}");
            
            try
            {
                // Check if the user already has a profile metadata record
                var existingMetadata = await GetProfileMetadataAsync(userId);
                Console.WriteLine($"Existing metadata found: {existingMetadata != null}");

                if (existingMetadata != null)
                {
                    // Update the existing record
                    Console.WriteLine("Updating existing record");
                    
                    // Ensure we're setting all file-related fields
                    existingMetadata.BlobPath = blobPath;
                    existingMetadata.FileName = fileName;
                    existingMetadata.FileSize = fileSize;
                    existingMetadata.FileUrl = fileUrl;
                    existingMetadata.UploadDate = DateTime.UtcNow;
                    existingMetadata.LastUpdated = DateTime.UtcNow;
                    
                    // Log the metadata before update
                    Console.WriteLine($"Metadata before update: BlobPath={existingMetadata.BlobPath}, FileName={existingMetadata.FileName}");
                    
                    var result = await UpdateProfileMetadataAsync(existingMetadata);
                    
                    // Log the result after update
                    if (result != null)
                    {
                        Console.WriteLine($"Update successful. Updated metadata: BlobPath={result.BlobPath}, FileName={result.FileName}");
                    }
                    else
                    {
                        Console.WriteLine("Update failed - result is null");
                    }
                    
                    return result;
                }
                else
                {
                    // Create a new record
                    Console.WriteLine("Creating new record");
                    var newMetadata = new ProfileMetadata
                    {
                        UserId = userId,
                        BlobPath = blobPath,
                        FileName = fileName,
                        FileSize = fileSize,
                        FileUrl = fileUrl,
                        UploadDate = DateTime.UtcNow,
                        LastUpdated = DateTime.UtcNow,
                        // Default values for required properties
                        JobTitle = string.Empty,
                        CurrentCompany = string.Empty,
                        YearsOfExperience = string.Empty,
                        ProfessionalBio = string.Empty,
                        Location = string.Empty,
                        PhoneNumber = string.Empty,
                        Skills = new List<string>()
                    };

                    // Log the new metadata before creation
                    Console.WriteLine($"New metadata: BlobPath={newMetadata.BlobPath}, FileName={newMetadata.FileName}");
                    
                    var result = await CreateProfileMetadataAsync(newMetadata);
                    
                    // Log the result after creation
                    if (result != null)
                    {
                        Console.WriteLine($"Creation successful. Created metadata: BlobPath={result.BlobPath}, FileName={result.FileName}");
                    }
                    else
                    {
                        Console.WriteLine("Creation failed - result is null");
                    }
                    
                    return result;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception in UpdateResumeFileInfoAsync: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                throw; // Re-throw to let the controller handle it
            }
        }
    }
}