-- ===================================================
-- GRIXCHAT SUPABASE SUPPORT TICKETS SCHEMA
-- ===================================================
-- Run this in your Supabase SQL Editor to enable persistent
-- support/contact form submissions.

CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    category TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'open', -- 'open', 'in_progress', 'resolved'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Drop policy if exists
DROP POLICY IF EXISTS "Allow anonymous and authenticated ticket insertion" ON public.support_tickets;
DROP POLICY IF EXISTS "Allow users to view own tickets" ON public.support_tickets;

-- Create Policies
CREATE POLICY "Allow anonymous and authenticated ticket insertion" 
    ON public.support_tickets 
    FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Allow users to view own tickets" 
    ON public.support_tickets 
    FOR SELECT 
    USING (auth.uid() = user_id);
