-- Create a new table for resume metadata
CREATE TABLE IF NOT EXISTS resume_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blob_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  file_url TEXT,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  job_title TEXT,
  current_company TEXT,
  years_of_experience TEXT,
  professional_bio TEXT,
  location TEXT,
  phone_number TEXT,
  skills TEXT[],
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Create an index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS resume_metadata_user_id_idx ON resume_metadata(user_id);

-- Create RLS policies for the resume_metadata table
ALTER TABLE resume_metadata ENABLE ROW LEVEL SECURITY;

-- Policy for users to view only their own resume metadata
CREATE POLICY "Users can view their own resume metadata" 
  ON resume_metadata 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy for users to insert their own resume metadata
CREATE POLICY "Users can insert their own resume metadata" 
  ON resume_metadata 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own resume metadata
CREATE POLICY "Users can update their own resume metadata" 
  ON resume_metadata 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Policy for users to delete their own resume metadata
CREATE POLICY "Users can delete their own resume metadata" 
  ON resume_metadata 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create a function to update the last_updated timestamp
CREATE OR REPLACE FUNCTION update_resume_metadata_last_updated()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update the last_updated timestamp
CREATE TRIGGER update_resume_metadata_last_updated
BEFORE UPDATE ON resume_metadata
FOR EACH ROW
EXECUTE FUNCTION update_resume_metadata_last_updated();