namespace ResumeAI.API.Models
{
    public class UpdateResumeFileInfoRequest
    {
        public required string BlobPath { get; set; }
        public required string FileName { get; set; }
        public int FileSize { get; set; }
        public required string FileUrl { get; set; }
    }
}