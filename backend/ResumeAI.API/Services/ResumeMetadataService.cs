using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Npgsql;
using Dapper;
using ResumeAI.API.Models;
using System.Collections.Generic;

namespace ResumeAI.API.Services
{
    public class ResumeMetadataService(IConfiguration configuration)
    {
        private readonly string _connectionString = configuration.GetConnectionString("SupabaseConnection") 
            ?? throw new ArgumentNullException(nameof(configuration), "Connection string 'SupabaseConnection' not found.");

        public async Task<ResumeMetadata?> GetResumeMetadataAsync(string userId)
        {
            using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();

            var sql = @"
                SELECT * FROM resume_metadata
                WHERE user_id = @UserId
                LIMIT 1";

            return await connection.QueryFirstOrDefaultAsync<ResumeMetadata>(sql, new { UserId = userId });
        }

        public async Task<ResumeMetadata?> CreateResumeMetadataAsync(ResumeMetadata metadata)
        {
            using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();

            var sql = @"
                INSERT INTO resume_metadata (
                    user_id, blob_path, file_name, file_size, file_url, 
                    job_title, current_company, years_of_experience, 
                    professional_bio, location, phone_number, skills
                )
                VALUES (
                    @UserId, @BlobPath, @FileName, @FileSize, @FileUrl,
                    @JobTitle, @CurrentCompany, @YearsOfExperience,
                    @ProfessionalBio, @Location, @PhoneNumber, @Skills
                )
                RETURNING *";

            return await connection.QueryFirstOrDefaultAsync<ResumeMetadata>(sql, metadata);
        }

        public async Task<ResumeMetadata?> UpdateResumeMetadataAsync(ResumeMetadata metadata)
        {
            using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();

            var sql = @"
                UPDATE resume_metadata
                SET 
                    blob_path = COALESCE(@BlobPath, blob_path),
                    file_name = COALESCE(@FileName, file_name),
                    file_size = COALESCE(@FileSize, file_size),
                    file_url = COALESCE(@FileUrl, file_url),
                    job_title = COALESCE(@JobTitle, job_title),
                    current_company = COALESCE(@CurrentCompany, current_company),
                    years_of_experience = COALESCE(@YearsOfExperience, years_of_experience),
                    professional_bio = COALESCE(@ProfessionalBio, professional_bio),
                    location = COALESCE(@Location, location),
                    phone_number = COALESCE(@PhoneNumber, phone_number),
                    skills = COALESCE(@Skills, skills)
                WHERE user_id = @UserId
                RETURNING *";

            return await connection.QueryFirstOrDefaultAsync<ResumeMetadata>(sql, metadata);
        }

        public async Task<bool> DeleteResumeMetadataAsync(string userId)
        {
            using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();

            var sql = @"
                DELETE FROM resume_metadata
                WHERE user_id = @UserId";

            var rowsAffected = await connection.ExecuteAsync(sql, new { UserId = userId });
            return rowsAffected > 0;
        }

        public async Task<ResumeMetadata?> UpdateResumeFileInfoAsync(string userId, string blobPath, string fileName, int fileSize, string fileUrl)
        {
            using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();

            // Check if the user already has a resume metadata record
            var existingMetadata = await GetResumeMetadataAsync(userId);

            if (existingMetadata != null)
            {
                // Update the existing record
                existingMetadata.BlobPath = blobPath;
                existingMetadata.FileName = fileName;
                existingMetadata.FileSize = fileSize;
                existingMetadata.FileUrl = fileUrl;
                existingMetadata.UploadDate = DateTime.UtcNow;

                return await UpdateResumeMetadataAsync(existingMetadata);
            }
            else
            {
                // Create a new record
                var newMetadata = new ResumeMetadata
                {
                    UserId = userId,
                    BlobPath = blobPath,
                    FileName = fileName,
                    FileSize = fileSize,
                    FileUrl = fileUrl,
                    UploadDate = DateTime.UtcNow,
                    LastUpdated = DateTime.UtcNow
                };

                return await CreateResumeMetadataAsync(newMetadata);
            }
        }
    }
}