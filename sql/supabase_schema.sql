-- ===================================================
-- GRIXCHAT SUPABASE CLEAN DATABASE SCHEMA (BULLETPROOF)
-- ===================================================
-- This script contains all tables, constraints, RPC functions,
-- public profiles syncing triggers, and indices required for GrixChat.
-- 
-- ORDER OF EXECUTION IS RESOLVED: All tables are created first,
-- followed by policies, triggers, functions, and indices to prevent dependency errors.

-- 1. CLEANUP EXISTING ARTIFACTS (Fresh Setup)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_auth_user();
DROP FUNCTION IF EXISTS public.get_direct_conversation_id(UUID, UUID);

DROP TABLE IF EXISTS public.chat_settings CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.call_candidates CASCADE;
DROP TABLE IF EXISTS public.calls CASCADE;
DROP TABLE IF EXISTS public.stories CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversation_participants CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.follows CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;


-- ===================================================
-- 2. CREATE ALL TABLES (Pre-declared to prevent constraint/policy errors)
-- ===================================================

-- Users Table
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    username TEXT UNIQUE NOT NULL CONSTRAINT username_length_check CHECK (char_length(username) <= 15),
    photo_url TEXT DEFAULT 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
    bio TEXT DEFAULT 'Available',
    is_verified BOOLEAN DEFAULT FALSE,
    profile_type TEXT DEFAULT 'personal',
    is_online BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    settings JSONB DEFAULT '{}'::jsonb, -- JSONB structure: { "active_sessions": [{"id": "sess_...", "device_name": "...", "ip_address": "...", "location": "...", "login_time": "...", "last_active": "..."}] }
    lock JSONB DEFAULT NULL,
    blocked_users TEXT[] DEFAULT '{}'::text[],
    muted_users TEXT[] DEFAULT '{}'::text[],
    favorites TEXT[] DEFAULT '{}'::text[],
    hidden_chats TEXT[] DEFAULT '{}'::text[],
    archived_chats TEXT[] DEFAULT '{}'::text[],
    hidden_chat_settings JSONB DEFAULT '{"secretCode": null, "showMenuEntry": true}'::jsonb,
    fcm_tokens TEXT[] DEFAULT '{}'::text[]
);

-- Follows Table (Connections/Friends)
CREATE TABLE public.follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    following_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT follows_unique_pair UNIQUE (follower_id, following_id)
);

-- Conversations Table
CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('direct', 'group')),
    name TEXT,
    photo_url TEXT,
    admins UUID[] DEFAULT '{}'::uuid[],
    watch_video_url TEXT,
    watch_state JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation Participants Table
CREATE TABLE public.conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT conversation_participants_unique_pair UNIQUE (conversation_id, user_id)
);

-- Messages Table
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    text TEXT,
    media_url TEXT,
    media_type TEXT,
    reply_to UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    reactions JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT FALSE,
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by UUID[] DEFAULT '{}'::UUID[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stories Table
CREATE TABLE public.stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    media_url TEXT,
    type TEXT DEFAULT 'image', -- 'image', 'text', 'video'
    text_content TEXT,
    bg_color TEXT,
    music_title TEXT,
    music_artist TEXT,
    music_url TEXT,
    filter_applied TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calls Table
CREATE TABLE public.calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caller_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT CHECK (type IN ('audio', 'video')) NOT NULL,
    status TEXT DEFAULT 'ringing' CHECK (status IN ('ringing', 'accepted', 'rejected', 'ended', 'error')),
    offer JSONB,
    answer JSONB,
    is_missed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Call ICE Candidates Table
CREATE TABLE public.call_candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID REFERENCES public.calls(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    candidate JSONB NOT NULL,
    type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat Settings Table
CREATE TABLE public.chat_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    nickname TEXT,
    custom_photo_url TEXT,
    is_muted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chat_settings_unique_pair UNIQUE (user_id, receiver_id)
);

-- Notifications Table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    from_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT,
    content TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    post_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ===================================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
-- ===================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;


-- ===================================================
-- 4. CREATE ROW LEVEL SECURITY (RLS) POLICIES
-- ===================================================

-- Policies for public.users
CREATE POLICY "Allow public read access on profiles" 
    ON public.users FOR SELECT USING (true);

CREATE POLICY "Allow users to update own profile" 
    ON public.users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow users to insert own profile" 
    ON public.users FOR INSERT WITH CHECK (auth.uid() = id);


-- Policies for public.follows
CREATE POLICY "Allow public select on active connections" 
    ON public.follows FOR SELECT USING (true);

CREATE POLICY "Allow users to follow others" 
    ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Allow users to unfollow others" 
    ON public.follows FOR DELETE USING (auth.uid() = follower_id);


-- Policies for public.conversations
CREATE POLICY "Allow authenticated users to create conversations" 
    ON public.conversations FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow users to see conversations they are part of" 
    ON public.conversations FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants 
            WHERE conversation_participants.conversation_id = conversations.id 
              AND conversation_participants.user_id = auth.uid()
        )
    );

CREATE POLICY "Allow participants to update conversation details" 
    ON public.conversations FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants 
            WHERE conversation_participants.conversation_id = conversations.id 
              AND conversation_participants.user_id = auth.uid()
        )
    );

CREATE POLICY "Allow group admins or members to delete a conversation" 
    ON public.conversations FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants 
            WHERE conversation_participants.conversation_id = conversations.id 
              AND conversation_participants.user_id = auth.uid()
        )
    );


-- Policies for public.conversation_participants
CREATE POLICY "Allow authenticated users to view participant rosters" 
    ON public.conversation_participants FOR SELECT USING (true);

CREATE POLICY "Allow users to join or be added to conversations" 
    ON public.conversation_participants FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow users to leave or remove members from conversations" 
    ON public.conversation_participants FOR DELETE USING (auth.role() = 'authenticated');


-- Policies for public.messages
CREATE POLICY "Allow members of conversation to view messages" 
    ON public.messages FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants 
            WHERE conversation_participants.conversation_id = messages.conversation_id 
              AND conversation_participants.user_id = auth.uid()
        )
    );

CREATE POLICY "Allow database users to send messages to their chats" 
    ON public.messages FOR INSERT WITH CHECK (
        auth.uid() = sender_id 
        AND EXISTS (
            SELECT 1 FROM public.conversation_participants 
            WHERE conversation_participants.conversation_id = messages.conversation_id 
              AND conversation_participants.user_id = auth.uid()
        )
    );

CREATE POLICY "Allow participants to update messages" 
    ON public.messages FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants 
            WHERE conversation_participants.conversation_id = messages.conversation_id 
              AND conversation_participants.user_id = auth.uid()
        )
    );

CREATE POLICY "Allow participants to delete messages" 
    ON public.messages FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants 
            WHERE conversation_participants.conversation_id = messages.conversation_id 
              AND conversation_participants.user_id = auth.uid()
        )
    );


-- Policies for public.stories
CREATE POLICY "Allow authenticated users to view active stories" 
    ON public.stories FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow users to post stories" 
    ON public.stories FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to remove their stories" 
    ON public.stories FOR DELETE USING (auth.uid() = user_id);


-- Policies for public.calls
CREATE POLICY "Allow users to see call records they are part of" 
    ON public.calls FOR SELECT USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

CREATE POLICY "Allow users to spawn new call actions" 
    ON public.calls FOR INSERT WITH CHECK (auth.uid() = caller_id);

CREATE POLICY "Allow callers or receivers to update call descriptors" 
    ON public.calls FOR UPDATE USING (auth.uid() = caller_id OR auth.uid() = receiver_id);


-- Policies for public.call_candidates
CREATE POLICY "Allow access to call candidates for call participants" 
    ON public.call_candidates FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.calls 
            WHERE calls.id = call_candidates.call_id 
              AND (calls.caller_id = auth.uid() OR calls.receiver_id = auth.uid())
        )
    );

CREATE POLICY "Allow participants to add call candidate elements" 
    ON public.call_candidates FOR INSERT WITH CHECK (
        auth.uid() = user_id 
        AND EXISTS (
            SELECT 1 FROM public.calls 
            WHERE calls.id = call_candidates.call_id 
              AND (calls.caller_id = auth.uid() OR calls.receiver_id = auth.uid())
        )
    );


-- Policies for public.chat_settings
CREATE POLICY "Allow users to see their own custom chat settings" 
    ON public.chat_settings FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to save or update chat settings" 
    ON public.chat_settings FOR ALL USING (auth.uid() = user_id);


-- Policies for public.notifications
CREATE POLICY "Allow users to fetch their own notifications" 
    ON public.notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users or system to insert notifications" 
    ON public.notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow users to update/acknowledge their notifications" 
    ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their notifications" 
    ON public.notifications FOR DELETE USING (auth.uid() = user_id);


-- ===================================================
-- 5. CREATE DATABASE RPC FUNCTIONS
-- ===================================================

-- Direct Conversation Quick Match RPC
CREATE OR REPLACE FUNCTION public.get_direct_conversation_id(u1 UUID, u2 UUID)
RETURNS UUID AS $$
DECLARE
    conv_id UUID;
BEGIN
    SELECT cp1.conversation_id INTO conv_id
    FROM public.conversation_participants cp1
    JOIN public.conversation_participants cp2 
      ON cp1.conversation_id = cp2.conversation_id
    JOIN public.conversations c 
      ON cp1.conversation_id = c.id
    WHERE cp1.user_id = u1 
      AND cp2.user_id = u2 
      AND c.type = 'direct'
    LIMIT 1;

    RETURN conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ===================================================
-- 6. SYSTEM TRIGGER: Auth to Public User profile sync
-- ===================================================
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    username_val TEXT;
    full_name_val TEXT;
BEGIN
    -- Extract values safely from raw_user_meta_data
    username_val := COALESCE(
        new.raw_user_meta_data->>'username', 
        split_part(new.email, '@', 1)
    );
    full_name_val := COALESCE(
        new.raw_user_meta_data->>'full_name', 
        split_part(new.email, '@', 1)
    );

    -- Ensure uniqueness of username
    IF EXISTS (SELECT 1 FROM public.users WHERE username = username_val) THEN
        username_val := username_val || '_' || substring(new.id::text, 1, 5);
    END IF;

    INSERT INTO public.users (
        id, 
        email, 
        full_name, 
        username, 
        photo_url, 
        bio
    )
    VALUES (
        new.id,
        new.email,
        full_name_val,
        LOWER(username_val),
        COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://cdn-icons-png.flaticon.com/512/149/149071.png'),
        'Available'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(public.users.full_name, EXCLUDED.full_name),
        username = COALESCE(public.users.username, EXCLUDED.username);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on auth.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();


-- ===================================================
-- 7. PERFORMANCE AND SCALABILITY INDICES
-- ===================================================
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_participants_user ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_conversation ON public.conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_users_username_lowered ON public.users(LOWER(username));
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_stories_user ON public.stories(user_id);
CREATE INDEX IF NOT EXISTS idx_calls_participants ON public.calls(caller_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_chat_settings_user ON public.chat_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);


-- ===================================================
-- 8. SUPABASE REALTIME ENABLEMENT (CRITICAL FOR INSTANT CHAT)
-- ===================================================
-- Please execute these lines in your Supabase SQL Editor to make sure 
-- instant message sync, typing indicators, and presence tracking are enabled!
-- 
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.users;

-- ===================================================
-- 9. USER TABLE DATABASE MIGRATIONS (IF YOU HAVE AN EXISTING DB)
-- ===================================================
-- If you are already running GrixChat and get a code: "PGRST204" error when setting up the app lock,
-- run this SQL command in your Supabase SQL Editor:
--
-- ALTER TABLE public.users ADD COLUMN IF NOT EXISTS lock JSONB DEFAULT NULL;


