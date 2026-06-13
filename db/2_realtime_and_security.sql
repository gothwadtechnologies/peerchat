-- =========================================================================
-- GRIXCHAT REALTIME REPLICATION & ROW LEVEL SECURITY (RLS) POLICIES
-- File Path: /db/2_realtime_and_security.sql
-- Description: Enables secure data storage access rules, creates indexing structures,
--              activates high-speed replication streaming, and implements triggers.
-- =========================================================================

-- Enable RLS across all GrixChat tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_call_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_settings ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------------------
-- 1. ROW LEVEL SECURITY (RLS) POLICIES
-- -------------------------------------------------------------------------

-- A. USERS TABLE POLICIES
DROP POLICY IF EXISTS "Allow public read access to profiles" ON public.users;
CREATE POLICY "Allow public read access to profiles" 
    ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow users to update own profile" ON public.users;
CREATE POLICY "Allow users to update own profile" 
    ON public.users FOR UPDATE USING (auth.uid() = id);

-- B. CONVERSATIONS TABLE POLICIES
DROP POLICY IF EXISTS "Allow participants to view conversations" ON public.conversations;
CREATE POLICY "Allow participants to view conversations" 
    ON public.conversations FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants 
            WHERE conversation_participants.conversation_id = id 
              AND conversation_participants.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Allow registered users to insert conversations" ON public.conversations;
CREATE POLICY "Allow registered users to insert conversations" 
    ON public.conversations FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL);

-- C. CONVERSATION PARTICIPANTS TABLE POLICIES
DROP POLICY IF EXISTS "Allow participants to read members list" ON public.conversation_participants;
CREATE POLICY "Allow participants to read members list" 
    ON public.conversation_participants FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants AS cp 
            WHERE cp.conversation_id = conversation_id 
              AND cp.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Allow members to join conversations" ON public.conversation_participants;
CREATE POLICY "Allow members to join conversations" 
    ON public.conversation_participants FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Allow admins or owners to update participant settings" ON public.conversation_participants;
CREATE POLICY "Allow admins or owners to update participant settings" 
    ON public.conversation_participants FOR UPDATE 
    USING (auth.uid() = user_id);

-- D. MESSAGES TABLE POLICIES
DROP POLICY IF EXISTS "Allow users to read conversation messages" ON public.messages;
CREATE POLICY "Allow users to read conversation messages" 
    ON public.messages FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants 
            WHERE conversation_participants.conversation_id = conversation_id 
              AND conversation_participants.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Allow users to send messages to active chats" ON public.messages;
CREATE POLICY "Allow users to send messages to active chats" 
    ON public.messages FOR INSERT 
    WITH CHECK (
        auth.uid() = sender_id 
        AND EXISTS (
            SELECT 1 FROM public.conversation_participants 
            WHERE conversation_participants.conversation_id = conversation_id 
              AND conversation_participants.user_id = auth.uid()
        )
    );

-- E. CORES SIGNALS: CALLS TABLE POLICIES
DROP POLICY IF EXISTS "Allow user to view their calls" ON public.calls;
CREATE POLICY "Allow user to view their calls" 
    ON public.calls FOR SELECT 
    USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Allow user to initiate a call" ON public.calls;
CREATE POLICY "Allow user to initiate a call" 
    ON public.calls FOR INSERT 
    WITH CHECK (auth.uid() = caller_id);

DROP POLICY IF EXISTS "Allow callers or receivers to update call state" ON public.calls;
CREATE POLICY "Allow callers or receivers to update call state" 
    ON public.calls FOR UPDATE 
    USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

-- F. CALL ICE CANDIDATES TABLE POLICIES
DROP POLICY IF EXISTS "Candidates read selection" ON public.call_candidates;
CREATE POLICY "Candidates read selection" 
    ON public.call_candidates FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.calls 
            WHERE calls.id = call_id 
              AND (calls.caller_id = auth.uid() OR calls.receiver_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Candidates insert validation" ON public.call_candidates;
CREATE POLICY "Candidates insert validation" 
    ON public.call_candidates FOR INSERT 
    WITH CHECK (
        auth.uid() = user_id 
        AND EXISTS (
            SELECT 1 FROM public.calls 
            WHERE calls.id = call_id 
              AND (calls.caller_id = auth.uid() OR calls.receiver_id = auth.uid())
        )
    );

-- -------------------------------------------------------------------------
-- 2. HIGH PERFORMANCE LOOKUP INDEXES
-- -------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_conv_participants_user ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conv_participants_composite ON public.conversation_participants(conversation_id, user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_participants ON public.calls(caller_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_candidates_call_id ON public.call_candidates(call_id);
CREATE INDEX IF NOT EXISTS idx_group_call_conversation ON public.group_call_participants(conversation_id);

-- -------------------------------------------------------------------------
-- 3. ENABLE SUPABASE REALTIME REPLICATION FOR WEBRTC SIGNALING & DIRECT CHATS
-- -------------------------------------------------------------------------
-- Enabling REPLICA IDENTITY FULL ensures old row configurations are broadcasted.
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.calls REPLICA IDENTITY FULL;
ALTER TABLE public.call_candidates REPLICA IDENTITY FULL;
ALTER TABLE public.group_call_participants REPLICA IDENTITY FULL;

-- Robust procedural publishing block supporting dynamic schema state
DO $$
BEGIN
    -- Check and drop tables from replication to refresh list safely
    IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages') THEN
        ALTER PUBLICATION supabase_realtime DROP TABLE public.messages;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'calls') THEN
        ALTER PUBLICATION supabase_realtime DROP TABLE public.calls;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'call_candidates') THEN
        ALTER PUBLICATION supabase_realtime DROP TABLE public.call_candidates;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'group_call_participants') THEN
        ALTER PUBLICATION supabase_realtime DROP TABLE public.group_call_participants;
    END IF;
END $$;

-- Add cleanest publish targets to stream updates instantly 
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.calls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_candidates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_call_participants;

-- -------------------------------------------------------------------------
-- 4. HOUSEKEEPING: PREVENT DB BLOAT BY AUTOMATIC PRUNING
-- -------------------------------------------------------------------------
-- Keep database weights lightweight (under Free-Tier 0B storage caps) by
-- automatically trimming historical logs.

CREATE OR REPLACE FUNCTION prune_past_calls()
RETURNS TRIGGER AS $$
DECLARE
    user_to_check UUID;
BEGIN
    user_to_check := NEW.caller_id;
    
    -- Limit the user calling logs to newest 40 records in bulk
    DELETE FROM public.calls
    WHERE (caller_id = user_to_check OR receiver_id = user_to_check)
      AND id NOT IN (
          SELECT id FROM public.calls
          WHERE caller_id = user_to_check OR receiver_id = user_to_check
          ORDER BY created_at DESC
          LIMIT 40
      );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prune_past_calls ON public.calls;
CREATE TRIGGER trg_prune_past_calls
AFTER INSERT ON public.calls
FOR EACH ROW
EXECUTE FUNCTION prune_past_calls();
