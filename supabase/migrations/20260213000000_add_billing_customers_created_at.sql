-- Migration: Add created_at column to billing_customers
-- Date: 2026-02-13
-- Description: The billing_customers table was missing a created_at column,
-- causing edge functions (create-subscription-payment, create-checkout-session)
-- to fail silently when storing the Stripe customer mapping.
-- This resulted in "No billing account found" errors in the billing portal.

-- Add created_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'billing_customers' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.billing_customers 
        ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;
