-- Add is_visible_to_recruiters field to resume_metadata table
ALTER TABLE resume_metadata 
ADD COLUMN is_visible_to_recruiters BOOLEAN DEFAULT FALSE;

-- Create an index for faster filtering of visible resumes
CREATE INDEX IF NOT EXISTS resume_metadata_visibility_idx 
ON resume_metadata(is_visible_to_recruiters) 
WHERE is_visible_to_recruiters = TRUE;

-- Create a policy to allow recruiters to view resumes marked as visible
CREATE POLICY "Recruiters can view resumes marked as visible" 
ON resume_metadata 
FOR SELECT 
USING (
  is_visible_to_recruiters = TRUE AND 
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'user_type' = 'recruiter'
  )
);