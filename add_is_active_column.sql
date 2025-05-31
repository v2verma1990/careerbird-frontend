-- Add is_active column to subscriptions table
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Update existing records to set is_active based on is_cancelled and end_date
UPDATE subscriptions 
SET is_active = NOT is_cancelled AND (end_date IS NULL OR end_date > NOW());

-- Add a comment to the column
COMMENT ON COLUMN subscriptions.is_active IS 'Indicates if the subscription is currently active';