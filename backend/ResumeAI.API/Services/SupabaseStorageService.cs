using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace ResumeAI.API.Services
{
    public class SupabaseStorageService : IStorageService
    {
        private readonly HttpClient _httpClient;
        private readonly string _supabaseUrl;
        private readonly string _supabaseKey;
        private readonly string _bucketName;

        public SupabaseStorageService(IConfiguration configuration, HttpClient httpClient)
        {
            _httpClient = httpClient;
            _supabaseUrl = configuration["Supabase:Url"] 
                ?? throw new ArgumentNullException("Supabase:Url", "Supabase URL is not configured.");
            _supabaseKey = configuration["Supabase:ServiceKey"] 
                ?? throw new ArgumentNullException("Supabase:ServiceKey", "Supabase service key is not configured.");
            _bucketName = configuration["Supabase:Storage:BucketName"] 
                ?? throw new ArgumentNullException("Supabase:Storage:BucketName", "Supabase storage bucket name is not configured.");
            
            ConfigureHttpClient();
            
            // Ensure the bucket exists when the service is initialized
            EnsureBucketExistsAsync().GetAwaiter().GetResult();
        }
        
        private async Task EnsureBucketExistsAsync()
        {
            try
            {
                // Check if bucket exists
                var url = $"{_supabaseUrl}/storage/v1/bucket/{_bucketName}";
                var response = await _httpClient.GetAsync(url);
                
                if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    // Bucket doesn't exist, create it
                    Console.WriteLine($"Bucket '{_bucketName}' not found. Creating it...");
                    
                    var createUrl = $"{_supabaseUrl}/storage/v1/bucket";
                    var content = new StringContent(
                        $"{{\"id\": \"{_bucketName}\", \"name\": \"{_bucketName}\", \"public\": false}}", 
                        Encoding.UTF8, 
                        "application/json");
                    
                    var createResponse = await _httpClient.PostAsync(createUrl, content);
                    
                    if (!createResponse.IsSuccessStatusCode)
                    {
                        var errorContent = await createResponse.Content.ReadAsStringAsync();
                        Console.WriteLine($"Failed to create bucket: {createResponse.StatusCode} - {errorContent}");
                        throw new Exception($"Failed to create Supabase Storage bucket: {createResponse.StatusCode} - {errorContent}");
                    }
                    
                    Console.WriteLine($"Bucket '{_bucketName}' created successfully.");
                }
                else if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"Error checking bucket: {response.StatusCode} - {errorContent}");
                }
                else
                {
                    Console.WriteLine($"Bucket '{_bucketName}' already exists.");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error ensuring bucket exists: {ex.Message}");
                throw;
            }
        }

        private void ConfigureHttpClient()
        {
            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _supabaseKey);
            _httpClient.DefaultRequestHeaders.Add("apikey", _supabaseKey);
        }

        public async Task<string> UploadFileAsync(string userId, Stream fileStream, string fileName, string contentType)
        {
            // Create a unique blob name using the user ID and a timestamp
            string blobName = $"{userId}/{Guid.NewGuid()}-{fileName}";
            
            // Create a multipart form content
            var content = new MultipartFormDataContent();
            var streamContent = new StreamContent(fileStream);
            streamContent.Headers.ContentType = new MediaTypeHeaderValue(contentType);
            content.Add(streamContent, "file", fileName);
            
            // Upload to Supabase Storage
            var url = $"{_supabaseUrl}/storage/v1/object/{_bucketName}/{blobName}";
            var response = await _httpClient.PostAsync(url, content);
            
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                throw new Exception($"Failed to upload file to Supabase Storage: {response.StatusCode} - {errorContent}");
            }
            
            // Store metadata in a separate file
            var metadata = new Dictionary<string, string>
            {
                { "userId", userId },
                { "originalFileName", fileName },
                { "contentType", contentType },
                { "uploadDate", DateTime.UtcNow.ToString("o") }
            };
            
            var metadataJson = JsonSerializer.Serialize(metadata);
            var metadataContent = new StringContent(metadataJson, Encoding.UTF8, "application/json");
            var metadataUrl = $"{_supabaseUrl}/storage/v1/object/{_bucketName}/{blobName}.metadata";
            var metadataResponse = await _httpClient.PostAsync(metadataUrl, metadataContent);
            
            if (!metadataResponse.IsSuccessStatusCode)
            {
                Console.WriteLine($"Warning: Failed to store metadata for {blobName}: {metadataResponse.StatusCode}");
            }
            
            return blobName;
        }

        public async Task<(Stream Content, string ContentType, string FileName)> DownloadFileAsync(string blobName)
        {
            // Get the file from Supabase Storage
            var url = $"{_supabaseUrl}/storage/v1/object/{_bucketName}/{blobName}";
            var response = await _httpClient.GetAsync(url);
            
            if (!response.IsSuccessStatusCode)
            {
                if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    throw new FileNotFoundException($"File {blobName} not found in Supabase storage.");
                }
                
                var errorContent = await response.Content.ReadAsStringAsync();
                throw new Exception($"Failed to download file from Supabase Storage: {response.StatusCode} - {errorContent}");
            }
            
            // Try to get metadata
            string contentType = response.Content.Headers.ContentType?.MediaType ?? "application/octet-stream";
            string fileName = Path.GetFileName(blobName);
            
            try
            {
                var metadataUrl = $"{_supabaseUrl}/storage/v1/object/{_bucketName}/{blobName}.metadata";
                var metadataResponse = await _httpClient.GetAsync(metadataUrl);
                
                if (metadataResponse.IsSuccessStatusCode)
                {
                    var metadataJson = await metadataResponse.Content.ReadAsStringAsync();
                    var metadata = JsonSerializer.Deserialize<Dictionary<string, string>>(metadataJson);
                    
                    if (metadata != null)
                    {
                        if (metadata.TryGetValue("originalFileName", out string? originalFileName) && !string.IsNullOrEmpty(originalFileName))
                        {
                            fileName = originalFileName;
                        }
                        
                        if (metadata.TryGetValue("contentType", out string? metadataContentType) && !string.IsNullOrEmpty(metadataContentType))
                        {
                            contentType = metadataContentType;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Warning: Failed to retrieve metadata for {blobName}: {ex.Message}");
            }
            
            var content = await response.Content.ReadAsStreamAsync();
            return (content, contentType, fileName);
        }

        public async Task DeleteFileAsync(string blobName)
        {
            // Delete the file from Supabase Storage
            var url = $"{_supabaseUrl}/storage/v1/object/{_bucketName}/{blobName}";
            var response = await _httpClient.DeleteAsync(url);
            
            if (!response.IsSuccessStatusCode && response.StatusCode != System.Net.HttpStatusCode.NotFound)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                throw new Exception($"Failed to delete file from Supabase Storage: {response.StatusCode} - {errorContent}");
            }
            
            // Try to delete metadata file if it exists
            try
            {
                var metadataUrl = $"{_supabaseUrl}/storage/v1/object/{_bucketName}/{blobName}.metadata";
                await _httpClient.DeleteAsync(metadataUrl);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Warning: Failed to delete metadata for {blobName}: {ex.Message}");
            }
        }

        public async Task<List<string>> ListUserFilesAsync(string userId)
        {
            // List files in the user's folder
            var url = $"{_supabaseUrl}/storage/v1/object/list/{_bucketName}?prefix={userId}/";
            var response = await _httpClient.GetAsync(url);
            
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                throw new Exception($"Failed to list files from Supabase Storage: {response.StatusCode} - {errorContent}");
            }
            
            var content = await response.Content.ReadAsStringAsync();
            var files = JsonSerializer.Deserialize<List<SupabaseStorageObject>>(content);
            
            var result = new List<string>();
            if (files != null)
            {
                foreach (var file in files)
                {
                    // Skip metadata files
                    if (!file.name.EndsWith(".metadata"))
                    {
                        result.Add(file.name);
                    }
                }
            }
            
            return result;
        }

        public async Task<(string FileName, long Size, DateTime UploadDate)> GetBlobDetailsAsync(string blobName)
        {
            // Get file details from Supabase Storage
            var url = $"{_supabaseUrl}/storage/v1/object/${_bucketName}/${blobName}";
            var headRequest = new HttpRequestMessage(HttpMethod.Head, url);
            var response = await _httpClient.SendAsync(headRequest);
            
            if (!response.IsSuccessStatusCode)
            {
                if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    throw new FileNotFoundException($"File {blobName} not found in Supabase storage.");
                }
                
                throw new Exception($"Failed to get file details from Supabase Storage: {response.StatusCode}");
            }
            
            string fileName = Path.GetFileName(blobName);
            long size = response.Content.Headers.ContentLength ?? 0;
            DateTime uploadDate = DateTime.UtcNow;
            
            // Try to get metadata
            try
            {
                var metadataUrl = $"{_supabaseUrl}/storage/v1/object/{_bucketName}/{blobName}.metadata";
                var metadataResponse = await _httpClient.GetAsync(metadataUrl);
                
                if (metadataResponse.IsSuccessStatusCode)
                {
                    var metadataJson = await metadataResponse.Content.ReadAsStringAsync();
                    var metadata = JsonSerializer.Deserialize<Dictionary<string, string>>(metadataJson);
                    
                    if (metadata != null)
                    {
                        if (metadata.TryGetValue("originalFileName", out string? originalFileName) && !string.IsNullOrEmpty(originalFileName))
                        {
                            fileName = originalFileName;
                        }
                        
                        if (metadata.TryGetValue("uploadDate", out string? uploadDateString) && !string.IsNullOrEmpty(uploadDateString))
                        {
                            if (DateTime.TryParse(uploadDateString, out DateTime parsedDate))
                            {
                                uploadDate = parsedDate;
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Warning: Failed to retrieve metadata for {blobName}: {ex.Message}");
            }
            
            return (fileName, size, uploadDate);
        }

        // Public method to check bucket status - useful for debugging
        public async Task<string> CheckBucketStatusAsync()
        {
            try
            {
                var url = $"{_supabaseUrl}/storage/v1/bucket/{_bucketName}";
                var response = await _httpClient.GetAsync(url);
                
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    return $"Bucket '{_bucketName}' exists. Details: {content}";
                }
                else if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    return $"Bucket '{_bucketName}' does not exist.";
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    return $"Error checking bucket: {response.StatusCode} - {errorContent}";
                }
            }
            catch (Exception ex)
            {
                return $"Exception checking bucket: {ex.Message}";
            }
        }

        private class SupabaseStorageObject
        {
            public string name { get; set; } = string.Empty;
            public string id { get; set; } = string.Empty;
            public long size { get; set; }
            public DateTime created_at { get; set; }
            public DateTime updated_at { get; set; }
        }
    }
}