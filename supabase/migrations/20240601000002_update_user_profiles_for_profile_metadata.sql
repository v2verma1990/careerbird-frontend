-- Add a reference to the profile_metadata table in the user_profiles table
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS profile_metadata_id UUID REFERENCES profile_metadata(id) ON DELETE SET NULL;

-- Create an index on profile_metadata_id for faster lookups
CREATE INDEX IF NOT EXISTS user_profiles_profile_metadata_id_idx ON user_profiles(profile_metadata_id);

-- Create a function to update the profile_metadata_id in user_profiles when a new profile_metadata is created
CREATE OR REPLACE FUNCTION update_user_profile_metadata()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_profiles
  SET profile_metadata_id = NEW.id
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update the user_profiles table when a new profile_metadata is created
CREATE TRIGGER update_user_profile_metadata
AFTER INSERT OR UPDATE ON profile_metadata
FOR EACH ROW
EXECUTE FUNCTION update_user_profile_metadata();