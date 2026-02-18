-- Migration: Mark existing users' profiles as complete
-- Date: 2026-01-01
-- Description: Existing users should not be required to complete profile setup
-- This marks all existing user profiles as "complete" so they can access the app

-- Mark all existing profiles that were backfilled (profile_edited = false, gender is null)
-- as profile_complete = true (legacy users)
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS is_legacy_user BOOLEAN NOT NULL DEFAULT FALSE;

-- Mark existing users as legacy (they don't need mandatory profile)
-- New users (created after this migration) will have is_legacy_user = false
UPDATE public.user_profiles 
SET is_legacy_user = TRUE 
WHERE profile_edited = FALSE 
  AND gender IS NULL 
  AND date_of_birth IS NULL;

-- Update the trigger function for new users to set is_legacy_user = false
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (user_id, is_legacy_user)
    VALUES (NEW.id, FALSE)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
