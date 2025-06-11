using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;

namespace ResumeAI.API.Services
{
    public interface IStorageService
    {
        Task<string> UploadFileAsync(string userId, Stream fileStream, string fileName, string contentType);
        Task<(Stream Content, string ContentType, string FileName)> DownloadFileAsync(string blobName);
        Task DeleteFileAsync(string blobName);
        Task<List<string>> ListUserFilesAsync(string userId);
        Task<(string FileName, long Size, DateTime UploadDate)> GetBlobDetailsAsync(string blobName);
    }
}