-- Migration: Add Critical RLS Policies
-- Date: 2026-01-01
-- Description: CRITICAL SECURITY FIX - Add Row Level Security to all tables
-- Priority: URGENT - Without these policies, users can access other users' data

-- ============================================
-- 1. Enable RLS on scan_sessions
-- ============================================
ALTER TABLE public.scan_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only view their own scans
CREATE POLICY "Users can view own scans" 
    ON public.scan_sessions 
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Users can only insert scans for themselves
CREATE POLICY "Users can insert own scans" 
    ON public.scan_sessions 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Users can only update their own scans
CREATE POLICY "Users can update own scans" 
    ON public.scan_sessions 
    FOR UPDATE 
    USING (auth.uid() = user_id);

-- Users can only delete their own scans
CREATE POLICY "Users can delete own scans" 
    ON public.scan_sessions 
    FOR DELETE 
    USING (auth.uid() = user_id);

-- ============================================
-- 2. Enable RLS on subscriptions
-- ============================================
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only view their own subscriptions
CREATE POLICY "Users can view own subscriptions" 
    ON public.subscriptions 
    FOR SELECT 
    USING (auth.uid() = user_id);

-- INSERT/UPDATE/DELETE only via service role (webhook uses SERVICE_ROLE_KEY)
-- No INSERT policy for authenticated users - only webhooks can create subscriptions
-- This prevents users from creating fake subscriptions

-- ============================================
-- 3. Enable RLS on billing_customers (defense in depth)
-- ============================================
ALTER TABLE public.billing_customers ENABLE ROW LEVEL SECURITY;

-- Users can view their own billing customer record
CREATE POLICY "Users can view own billing customer" 
    ON public.billing_customers 
    FOR SELECT 
    USING (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE for authenticated users - only service role operations

-- ============================================
-- 4. Enable RLS on scan_credits (defense in depth)
-- ============================================
ALTER TABLE public.scan_credits ENABLE ROW LEVEL SECURITY;

-- Users can view their own credits
CREATE POLICY "Users can view own credits" 
    ON public.scan_credits 
    FOR SELECT 
    USING (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE for authenticated users - only service role operations

-- ============================================
-- 5. Grant minimal permissions
-- ============================================
-- Authenticated users need SELECT on their own data (enforced by RLS above)
GRANT SELECT ON public.scan_sessions TO authenticated;
GRANT INSERT ON public.scan_sessions TO authenticated;
GRANT UPDATE ON public.scan_sessions TO authenticated;
GRANT DELETE ON public.scan_sessions TO authenticated;

GRANT SELECT ON public.subscriptions TO authenticated;
-- No INSERT/UPDATE/DELETE grants - webhooks use service role

GRANT SELECT ON public.billing_customers TO authenticated;
-- No INSERT/UPDATE/DELETE grants - checkout uses service role

GRANT SELECT ON public.scan_credits TO authenticated;
-- No INSERT/UPDATE/DELETE grants - authorize-scan uses service role

-- ============================================
-- 6. Verify storage bucket RLS
-- ============================================
-- Note: Supabase Storage uses its own policies.
-- Verify in Supabase Dashboard that 'scan' bucket has proper policies:
-- - Users can only upload to user/{user_id}/*
-- - Users can only read from user/{user_id}/*

-- ============================================
-- 7. Add index for RLS performance
-- ============================================
-- These indexes speed up RLS policy evaluation
CREATE INDEX IF NOT EXISTS idx_scan_sessions_user_id 
    ON public.scan_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id 
    ON public.subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_billing_customers_user_id 
    ON public.billing_customers(user_id);

CREATE INDEX IF NOT EXISTS idx_scan_credits_user_id 
    ON public.scan_credits(user_id);
