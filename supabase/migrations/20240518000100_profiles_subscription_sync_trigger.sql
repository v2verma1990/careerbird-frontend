-- Supabase SQL migration: Keep profiles.subscription_type in sync with latest subscription
-- This trigger updates the user's profile whenever a new subscription is inserted or updated

create or replace function update_profile_subscription_type()
returns trigger as $$
begin
  update profiles
    set subscription_type = NEW.subscription_type,
        updated_at = now()
    where id = NEW.user_id;
  return NEW;
end;
$$ language plpgsql;

-- Trigger for INSERT and UPDATE on subscriptions
drop trigger if exists trg_update_profile_subscription_type on subscriptions;
create trigger trg_update_profile_subscription_type
  after insert or update on subscriptions
  for each row
  execute procedure update_profile_subscription_type();
