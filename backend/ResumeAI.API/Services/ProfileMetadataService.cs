using System;
using System.Threading.Tasks;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Net.Http;
using System.Text;
using System.Linq;
using ResumeAI.API.Models;
using System.Collections.Generic;
using ResumeAI.API.Utilities;

namespace ResumeAI.API.Services
{
    public class ProfileMetadataService
    {
        private readonly SupabaseHttpClientService _supabaseHttpClientService;

        public ProfileMetadataService(SupabaseHttpClientService supabaseHttpClientService)
        {
            _supabaseHttpClientService = supabaseHttpClientService;
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