-- Migration: Add plan column to usage_tracking for per-plan usage tracking
ALTER TABLE usage_tracking ADD COLUMN plan TEXT;
-- Optionally, backfill with current plan from profiles or subscriptions if needed
-- UPDATE usage_tracking SET plan = (SELECT subscription_type FROM profiles WHERE profiles.id = usage_tracking.user_id);
