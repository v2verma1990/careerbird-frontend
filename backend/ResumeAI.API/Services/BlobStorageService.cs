using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;

namespace ResumeAI.API.Services
{
    public class BlobStorageService : IStorageService
    {
        private readonly BlobServiceClient _blobServiceClient;
        private readonly string _containerName;

        public BlobStorageService(IConfiguration configuration)
        {
            var connectionString = configuration["AzureBlobStorage:ConnectionString"] 
                ?? throw new ArgumentNullException("AzureBlobStorage:ConnectionString", "Blob storage connection string is not configured.");
            
            _containerName = configuration["AzureBlobStorage:ContainerName"] 
                ?? throw new ArgumentNullException("AzureBlobStorage:ContainerName", "Blob storage container name is not configured.");
            
            _blobServiceClient = new BlobServiceClient(connectionString);
        }

        public async Task<BlobContainerClient> GetContainerClientAsync()
        {
            var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
            await containerClient.CreateIfNotExistsAsync(PublicAccessType.None);
            return containerClient;
        }

        public async Task<string> UploadFileAsync(string userId, Stream fileStream, string fileName, string contentType)
        {
            var containerClient = await GetContainerClientAsync();
            
            // Create a unique blob name using the user ID and a timestamp
            string blobName = $"{userId}/{Guid.NewGuid()}-{fileName}";
            
            var blobClient = containerClient.GetBlobClient(blobName);
            
            // Upload the file with metadata
            var blobUploadOptions = new BlobUploadOptions
            {
                HttpHeaders = new BlobHttpHeaders
                {
                    ContentType = contentType
                },
                Metadata = new Dictionary<string, string>
                {
                    { "userId", userId },
                    { "originalFileName", fileName },
                    { "uploadDate", DateTime.UtcNow.ToString("o") }
                }
            };
            
            await blobClient.UploadAsync(fileStream, blobUploadOptions);
            
            return blobName;
        }

        public async Task<(Stream Content, string ContentType, string FileName)> DownloadFileAsync(string blobName)
        {
            var containerClient = await GetContainerClientAsync();
            var blobClient = containerClient.GetBlobClient(blobName);
            
            if (!await blobClient.ExistsAsync())
            {
                throw new FileNotFoundException($"File {blobName} not found in blob storage.");
            }
            
            var properties = await blobClient.GetPropertiesAsync();
            var contentType = properties.Value.ContentType;
            
            // Get original filename from metadata if available
            string fileName = blobName;
            if (properties.Value.Metadata.TryGetValue("originalFileName", out string? originalFileName) && !string.IsNullOrEmpty(originalFileName))
            {
                fileName = originalFileName;
            }
            
            var downloadInfo = await blobClient.DownloadAsync();
            
            return (downloadInfo.Value.Content, contentType, fileName);
        }

        public async Task DeleteFileAsync(string blobName)
        {
            var containerClient = await GetContainerClientAsync();
            var blobClient = containerClient.GetBlobClient(blobName);
            
            await blobClient.DeleteIfExistsAsync();
        }

        public async Task<List<string>> ListUserFilesAsync(string userId)
        {
            var containerClient = await GetContainerClientAsync();
            var blobs = new List<string>();
            
            await foreach (var blob in containerClient.GetBlobsAsync(prefix: $"{userId}/"))
            {
                blobs.Add(blob.Name);
            }
            
            return blobs;
        }
        
        public async Task<(string FileName, long Size, DateTime UploadDate)> GetBlobDetailsAsync(string blobName)
        {
            var containerClient = await GetContainerClientAsync();
            var blobClient = containerClient.GetBlobClient(blobName);
            
            if (!await blobClient.ExistsAsync())
            {
                throw new FileNotFoundException($"File {blobName} not found in blob storage.");
            }
            
            var properties = await blobClient.GetPropertiesAsync();
            
            // Get original filename from metadata if available
            string fileName = Path.GetFileName(blobName);
            if (properties.Value.Metadata.TryGetValue("originalFileName", out string? originalFileName) && !string.IsNullOrEmpty(originalFileName))
            {
                fileName = originalFileName;
            }
            
            // Get upload date from metadata if available
            DateTime uploadDate = DateTime.UtcNow;
            if (properties.Value.Metadata.TryGetValue("uploadDate", out string? uploadDateString) && !string.IsNullOrEmpty(uploadDateString))
            {
                if (DateTime.TryParse(uploadDateString, out DateTime parsedDate))
                {
                    uploadDate = parsedDate;
                }
            }
            
            return (fileName, properties.Value.ContentLength, uploadDate);
        }
        
        // Method for diagnostic purposes
        public async Task<string> CheckBucketStatusAsync()
        {
            try
            {
                var containerClient = await GetContainerClientAsync();
                return $"Azure Blob Storage container '{_containerName}' exists and is accessible.";
            }
            catch (Exception ex)
            {
                return $"Error accessing Azure Blob Storage container: {ex.Message}";
            }
        }
    }
}