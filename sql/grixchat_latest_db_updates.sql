-- ==========================================
-- GRIXCHAT DATABASE OVERHAUL & BUGFIX MIGRATION 
-- ==========================================
-- Target: Supabase Consolidated Schema Updates
-- Run this block inside your Supabase dashboard SQL Editor!

-- 1. FIX APP LOCK - SCHEMA CACHE COLUMN MISSING (PGRST204)
-- This command safely appends the 'lock' JSONB column to track passcode hashes
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS lock JSONB DEFAULT NULL;

-- 2. RE-ENABLE ROW LEVEL SECURITY POLICIES (RLS) FOR USER PROFILE UPDATES
-- Ensures users have absolute authorization to write/update their own lock preferences
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on profiles" 
ON public.users FOR SELECT USING (true);

-- Policy to permit setting up and verifying lock codes securely 
DROP POLICY IF EXISTS "Allow users to update own profile" ON public.users;
CREATE POLICY "Allow users to update own profile" 
ON public.users FOR UPDATE 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- 3. ENSURE REALTIME REPLICAS CAN SYNC CHANGES INSTANTLY
-- This enables native websocket replication for messages & locking state
ALTER TABLE public.users REPLICA IDENTITY FULL;

-- 4. AUTOMATICALLY TRUNCATE EXISTING USERNAMES TO 15 CHARACTERS MAXIMUM
-- Uses a bulletproof PL/pgSQL block to loop through every long username and resolve uniqueness conflicts iteratively
DO $$
DECLARE
    r RECORD;
    new_username TEXT;
    suffix INT;
BEGIN
    FOR r IN (SELECT id, username FROM public.users WHERE char_length(username) > 15 ORDER BY id) LOOP
        new_username := SUBSTRING(r.username, 1, 15);
        suffix := 1;
        
        -- If this truncated username already exists for another user, add numerical suffix
        WHILE EXISTS (SELECT 1 FROM public.users WHERE username = new_username AND id != r.id) LOOP
            new_username := SUBSTRING(SUBSTRING(r.username, 1, 15), 1, 15 - length(suffix::text) - 1) || '_' || suffix;
            suffix := suffix + 1;
        END LOOP;
        
        -- Update the user row with the guaranteed unique <= 15-char username
        UPDATE public.users SET username = new_username WHERE id = r.id;
    END LOOP;
END $$;

-- 5. ENFORCE 15-CHARACTER MAXIMUM LIMIT VIA DATABASE CHECK CONSTRAINT
-- Ensures that the database will strictly reject any future username exceeding 15 characters
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS username_length_check;
ALTER TABLE public.users ADD CONSTRAINT username_length_check CHECK (char_length(username) <= 15);

-- 6. REAL-TIME BULK MESSAGE-PRUNING TO REDUCE SUPABASE PLAN STORAGE FOOTPRINT
-- Keep database size small and cost-effective.
-- Cap absolute messages inside any single conversation to the last 60.
-- On reaching >= 60, all excess messages are purged in bulk leaving only the 40 newest ones.
-- This instantly trims legacy chats with 1,000+ messages down to exactly 40 on the next message!
-- Local device cache maintains scrollbacks seamlessly!
CREATE OR REPLACE FUNCTION prune_past_messages()
RETURNS TRIGGER AS $$
DECLARE
    msg_count INT;
BEGIN
    SELECT COUNT(*) INTO msg_count 
    FROM public.messages 
    WHERE conversation_id = NEW.conversation_id;

    IF msg_count >= 60 THEN
        DELETE FROM public.messages
        WHERE conversation_id = NEW.conversation_id
          AND id NOT IN (
              SELECT subquery.id FROM (
                  SELECT id FROM public.messages
                  WHERE conversation_id = NEW.conversation_id
                  ORDER BY created_at DESC, id DESC
                  LIMIT 40
              ) subquery
          );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prune_past_messages ON public.messages;
CREATE TRIGGER trg_prune_past_messages
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION prune_past_messages();

-- 7. CONVERSATIONS LAST MESSAGE COLUMN RETRIEVAL CACHE
-- Appends the missing columns in case they are missing from some environments to prevent PGRST204 errors
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS last_message TEXT,
ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ;

-- 8. MESSAGE DELETION (DELETE FOR ME & DELETE FOR EVERYONE) ENHANCEMENTS
-- Add message deletion columns if they don't exist
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_by UUID[] DEFAULT '{}'::UUID[];

-- Add RLS policy for deleting messages (necessary to prevent silent failures on deletion queries)
DROP POLICY IF EXISTS "Allow participants to delete messages" ON public.messages;
CREATE POLICY "Allow participants to delete messages" 
ON public.messages 
FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.conversation_participants 
        WHERE conversation_participants.conversation_id = messages.conversation_id 
          AND conversation_participants.user_id = auth.uid()
    )
);

-- Ensure "Allow participants to update messages" exists and is robust for both text and deleted_by updates
DROP POLICY IF EXISTS "Allow participants to update messages" ON public.messages;
CREATE POLICY "Allow participants to update messages" 
ON public.messages 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.conversation_participants 
        WHERE conversation_participants.conversation_id = messages.conversation_id 
          AND conversation_participants.user_id = auth.uid()
    )
);

-- Clear any potential stale schema caches
NOTIFY pgrst, 'reload schema';

-- 9. AUTOMATED TRIGGER TO SYNC LAST MESSAGE CACHES IN CONVERSATIONS
-- This automatically ensures that conversations.updated_at and last_message_at/last_message
-- are kept perfectly synchronized, regardless of where or how the message was inserted (group creation, calls, offline queue, etc.)
CREATE OR REPLACE FUNCTION update_conversation_timestamp_and_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations
    SET 
        updated_at = NEW.created_at,
        last_message = COALESCE(NEW.text, CASE WHEN NEW.media_type IS NOT NULL THEN 'Sent a ' || NEW.media_type ELSE 'Sent an attachment' END),
        last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_conversation_on_message ON public.messages;
CREATE TRIGGER trg_update_conversation_on_message
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_timestamp_and_last_message();


-- =========================================================================
-- 10. REAL-TIME BULK CALL-PRUNING TO ENFORCE 60-40-20 RETENTION LIMITS
-- =========================================================================
-- Keeps database size low & cost-effective.
-- Limits total call logs securely to 60. When 60 is touched, 
-- prunes oldest 20 in bulk (leaving the 40 most recent calls)
-- for both the caller and the receiver. It successfully handles accounts with 
1000+ histories by bringing them directly back down to 40 on next insert!
CREATE OR REPLACE FUNCTION prune_past_calls()
RETURNS TRIGGER AS $$
DECLARE
    caller_call_count INT;
    receiver_call_count INT;
BEGIN
    -- Check and prune for caller
    SELECT COUNT(*) INTO caller_call_count 
    FROM public.calls 
    WHERE caller_id = NEW.caller_id OR receiver_id = NEW.caller_id;

    IF caller_call_count >= 60 THEN
        DELETE FROM public.calls
        WHERE (caller_id = NEW.caller_id OR receiver_id = NEW.caller_id)
          AND id NOT IN (
              SELECT subquery.id FROM (
                  SELECT id FROM public.calls
                  WHERE caller_id = NEW.caller_id OR receiver_id = NEW.caller_id
                  ORDER BY created_at DESC, id DESC
                  LIMIT 40
              ) subquery
          );
    END IF;

    -- Check and prune for receiver (if any)
    IF NEW.receiver_id IS NOT NULL AND NEW.receiver_id <> NEW.caller_id THEN
        SELECT COUNT(*) INTO receiver_call_count 
        FROM public.calls 
        WHERE caller_id = NEW.receiver_id OR receiver_id = NEW.receiver_id;

        IF receiver_call_count >= 60 THEN
            DELETE FROM public.calls
            WHERE (caller_id = NEW.receiver_id OR receiver_id = NEW.receiver_id)
              AND id NOT IN (
                  SELECT subquery.id FROM (
                      SELECT id FROM public.calls
                      WHERE caller_id = NEW.receiver_id OR receiver_id = NEW.receiver_id
                      ORDER BY created_at DESC, id DESC
                      LIMIT 40
                  ) subquery
              );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prune_past_calls ON public.calls;
CREATE TRIGGER trg_prune_past_calls
AFTER INSERT ON public.calls
FOR EACH ROW
EXECUTE FUNCTION prune_past_calls();


-- =========================================================================
-- 11. AUTOMATICALLY CLEAN UP SUPABASE STORAGE ASSETS ON CHAT MESSAGE DELETIONS
-- =========================================================================
-- NOTE: Directly deleting from storage.objects is strictly prohibited by Supabase Storage
-- rules to prevent orphaning physical assets. This trigger has been dropped to avoid
-- transaction failures during message pruning operations.
DROP TRIGGER IF EXISTS trg_delete_message_storage_file ON public.messages;
DROP FUNCTION IF EXISTS delete_message_storage_file();

-- Reload PostgreSQL schema configuration
NOTIFY pgrst, 'reload schema';


-- =========================================================================
-- 12. RETROACTIVE ONCE-OFF SWEEP: PRUNE ALL OLD EXPENDITURES ACCORDING TO 60-40-20 LAWS
-- =========================================================================
-- Instantly sanitizes historical database rows (e.g. 120+, 1000+) back 
-- down to the 40 newest records immediately for all users & conversations!
DO $$
DECLARE
    u_rec RECORD;
    conv_rec RECORD;
BEGIN
    -- 1. Prune existing calls retroactively down to 40 for every single user
    FOR u_rec IN (SELECT DISTINCT id FROM public.users) LOOP
        DELETE FROM public.calls
        WHERE (caller_id = u_rec.id OR receiver_id = u_rec.id)
          AND id NOT IN (
              SELECT subquery.id FROM (
                  SELECT id FROM public.calls
                  WHERE caller_id = u_rec.id OR receiver_id = u_rec.id
                  ORDER BY created_at DESC, id DESC
                  LIMIT 40
              ) subquery
          );
    END LOOP;

    -- 2. Prune existing messages retroactively down to 40 for every single conversation
    FOR conv_rec IN (SELECT DISTINCT id FROM public.conversations) LOOP
        DELETE FROM public.messages
        WHERE conversation_id = conv_rec.id
          AND id NOT IN (
              SELECT subquery.id FROM (
                  SELECT id FROM public.messages
                  WHERE conversation_id = conv_rec.id
                  ORDER BY created_at DESC, id DESC
                  LIMIT 40
              ) subquery
          );
    END LOOP;
END;
$$;

-- =========================================================================
-- 12. ENABLE SUPABASE REALTIME REPLICATION FOR CALLING & WEBRTC SIGNALING
-- =========================================================================
-- Ensure calling tables publish full changes on update so callers receive 
-- sdp answers and ice negotiation candidates in real time.
ALTER TABLE public.calls REPLICA IDENTITY FULL;
ALTER TABLE public.call_candidates REPLICA IDENTITY FULL;

-- Add tables to the supabase_realtime publication using a robust dynamic block
-- to avoid duplicate keys or "DROP TABLE IF EXISTS" syntax limitations in raw SQL.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
          AND schemaname = 'public' 
          AND tablename = 'calls'
    ) THEN
        ALTER PUBLICATION supabase_realtime DROP TABLE public.calls;
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
          AND schemaname = 'public' 
          AND tablename = 'call_candidates'
    ) THEN
        ALTER PUBLICATION supabase_realtime DROP TABLE public.call_candidates;
    END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.calls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_candidates;

-- Reload PostgreSQL schema configuration
NOTIFY pgrst, 'reload schema';


