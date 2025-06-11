-- Add a column to profiles to reference the default resume blob
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS default_resume_blob_name TEXT;