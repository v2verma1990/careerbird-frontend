-- Add resume text field for search functionality
ALTER TABLE profile_metadata 
ADD COLUMN IF NOT EXISTS resume_text TEXT;

-- Create full-text search index for resume content
CREATE INDEX IF NOT EXISTS profile_metadata_resume_text_search 
ON profile_metadata USING gin(to_tsvector('english', resume_text))
WHERE resume_text IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN profile_metadata.resume_text IS 'Extracted text content from resume file for search functionality';