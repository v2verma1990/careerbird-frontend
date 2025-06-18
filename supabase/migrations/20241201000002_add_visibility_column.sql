-- Add is_visible_to_recruiters column if it doesn't exist
ALTER TABLE profile_metadata 
ADD COLUMN IF NOT EXISTS is_visible_to_recruiters BOOLEAN DEFAULT FALSE;

-- Create index for recruiter searches
CREATE INDEX IF NOT EXISTS profile_metadata_visible_idx ON profile_metadata (is_visible_to_recruiters) WHERE is_visible_to_recruiters = true;

-- Update RLS policy to allow recruiters to see visible profiles
CREATE POLICY "Recruiters can view visible profiles" ON profile_metadata
  FOR SELECT USING (is_visible_to_recruiters = true AND blob_path IS NOT NULL);