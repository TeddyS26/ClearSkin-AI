-- Migration: Add user_profiles table and skin_age to scan_sessions
-- Date: 2026-01-01
-- Description: Adds user profile data (age, gender) for personalized AI analysis and skin age estimation

-- ============================================
-- 1. Create user_profiles table
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Demographics
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    
    -- Computed/cached age (updated on profile edit or scan)
    age INT,
    
    -- Track if profile has been edited (one-time edit allowed)
    profile_edited BOOLEAN NOT NULL DEFAULT FALSE,
    profile_edited_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- One profile per user
    CONSTRAINT unique_user_profile UNIQUE (user_id)
);

-- ============================================
-- 2. Add skin_age columns to scan_sessions
-- ============================================
ALTER TABLE public.scan_sessions 
ADD COLUMN IF NOT EXISTS skin_age INT,
ADD COLUMN IF NOT EXISTS skin_age_comparison TEXT,
ADD COLUMN IF NOT EXISTS skin_age_confidence INT;

-- skin_age: The estimated age of the user's skin (e.g., 28)
-- skin_age_comparison: Text like "5 years younger" or "3 years older"
-- skin_age_confidence: Confidence level 0-100 of the skin age estimate

-- ============================================
-- 3. Add monthly free scan tracking columns
-- ============================================
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS free_scan_used_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS free_scan_month INT,
ADD COLUMN IF NOT EXISTS free_scan_year INT;

-- free_scan_used_at: When the free scan was used
-- free_scan_month: Month (1-12) when free scan was used
-- free_scan_year: Year when free scan was used

-- ============================================
-- 4. Row Level Security (RLS) for user_profiles
-- ============================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can only read their own profile
CREATE POLICY "Users can view own profile" 
    ON public.user_profiles 
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" 
    ON public.user_profiles 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile (with restrictions handled in app logic)
CREATE POLICY "Users can update own profile" 
    ON public.user_profiles 
    FOR UPDATE 
    USING (auth.uid() = user_id);

-- ============================================
-- 5. Create indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id 
    ON public.user_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_scan_sessions_skin_age 
    ON public.scan_sessions(skin_age);

-- ============================================
-- 6. Function to auto-create profile for new users
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_profile();

-- ============================================
-- 7. Backfill profiles for existing users
-- ============================================
INSERT INTO public.user_profiles (user_id, created_at)
SELECT id, created_at
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_profiles)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- 8. Function to update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION public.update_user_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_profile_timestamp ON public.user_profiles;
CREATE TRIGGER update_user_profile_timestamp
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_profile_updated_at();

-- ============================================
-- 9. Grant permissions
-- ============================================
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
