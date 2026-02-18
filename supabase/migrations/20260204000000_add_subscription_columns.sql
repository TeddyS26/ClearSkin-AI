-- Migration: Add missing columns to subscriptions table
-- This ensures the webhook can properly upsert subscription data

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'subscriptions' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.subscriptions 
        ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Add plan_code column if it doesn't exist (webhook uses this instead of 'plan')
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'subscriptions' 
        AND column_name = 'plan_code'
    ) THEN
        ALTER TABLE public.subscriptions 
        ADD COLUMN plan_code TEXT DEFAULT 'unlimited';
    END IF;
END $$;

-- Add weekly_limit column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'subscriptions' 
        AND column_name = 'weekly_limit'
    ) THEN
        ALTER TABLE public.subscriptions 
        ADD COLUMN weekly_limit INTEGER DEFAULT 100000;
    END IF;
END $$;

-- Create trigger to automatically update updated_at on row changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_subscriptions_updated_at'
    ) THEN
        CREATE TRIGGER update_subscriptions_updated_at
            BEFORE UPDATE ON public.subscriptions
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Also ensure billing_customers has updated_at
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'billing_customers' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.billing_customers 
        ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;
