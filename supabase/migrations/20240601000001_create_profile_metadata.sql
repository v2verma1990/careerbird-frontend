-- Create the profile_metadata table
CREATE TABLE IF NOT EXISTS profile_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blob_path TEXT,
  file_name TEXT,
  file_size INTEGER,
  file_url TEXT,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  job_title TEXT,
  current_company TEXT,
  years_of_experience TEXT,
  professional_bio TEXT,
  location TEXT,
  phone_number TEXT,
  skills TEXT[],
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add RLS policies
ALTER TABLE profile_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile metadata"
  ON profile_metadata FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile metadata"
  ON profile_metadata FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile metadata"
  ON profile_metadata FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile metadata"
  ON profile_metadata FOR DELETE
  USING (auth.uid() = user_id);