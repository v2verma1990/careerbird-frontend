-- Add created_at and updated_at columns to profile_metadata table
ALTER TABLE profile_metadata ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE profile_metadata ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();