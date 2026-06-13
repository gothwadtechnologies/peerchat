-- =========================================================================
-- GRIXCHAT COMPLETE DATABASE SCHEMA
-- File Path: /db/1_complete_schema.sql
-- Description: Core table definitions for GrixChat, declaring relationships,
--              constraints, cascade actions, and group calling structures.
-- =========================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean up any existing tables gracefully if needed
-- DROP TABLE IF EXISTS public.call_candidates CASCADE;
-- DROP TABLE IF EXISTS public.calls CASCADE;
-- DROP TABLE IF EXISTS public.group_call_participants CASCADE;
-- DROP TABLE IF EXISTS public.messages CASCADE;
-- DROP TABLE IF EXISTS public.conversation_participants CASCADE;
-- DROP TABLE IF EXISTS public.conversations CASCADE;
-- DROP TABLE IF EXISTS public.users CASCADE;

-- -------------------------------------------------------------------------
-- 1. USERS PROFILE TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    bio TEXT DEFAULT 'Available',
    photo_url TEXT,
    status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'away')),
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    fcm_tokens TEXT[] DEFAULT '{}',
    muted_users UUID[] DEFAULT '{}',
    settings JSONB DEFAULT '{
        "theme": "dark",
        "notifications": {
            "vibrate": true,
            "highPriority": true,
            "conversationTones": true,
            "groupHighPriority": true
        }
    }'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------------------
-- 2. CONVERSATIONS TABLE (Direct or Group chats)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT, -- Null for 1-on-1 private chats, string for custom named group chats
    is_group BOOLEAN DEFAULT FALSE,
    group_avatar TEXT,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adjust constraint safely if needed
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_is_group_check;
ALTER TABLE public.conversations ADD CONSTRAINT conversations_is_group_check CHECK (is_group IN (TRUE, FALSE));

-- -------------------------------------------------------------------------
-- 3. CONVERSATION PARTICIPANTS (Join Table linking Users and Conversations)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin', 'owner')),
    nickname TEXT, -- Custom contact alias (1-on-1 chats)
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);

-- -------------------------------------------------------------------------
-- 4. MESSAGES TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    text TEXT,
    media_url TEXT, -- Store image path, video path, voice notes, or file links
    media_type TEXT CHECK (media_type IN ('image', 'video', 'voice', 'document')),
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
    is_edited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------------------
-- 5. 1-ON-1 CALLS TABLE (Active & Historical Voice/Video Signalings)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caller_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT CHECK (type IN ('audio', 'video')) NOT NULL,
    status TEXT DEFAULT 'ringing' CHECK (status IN ('ringing', 'accepted', 'rejected', 'ended', 'error')),
    offer JSONB,   -- Session Description Protocol (SDP) offer object
    answer JSONB,  -- Session Description Protocol (SDP) answer object
    is_missed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------------------
-- 6. CALL ICE CANDIDATES (WebRTC Signaling Pathway for Network Traversals)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.call_candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID REFERENCES public.calls(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    candidate JSONB NOT NULL, -- ICE candidate object details
    type TEXT NOT NULL,      -- 'offer' or 'answer' to specify origin peer
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------------------
-- 7. GROUP CALL PARTICIPANTS (WebRTC signaling extension for multiple users)
-- -------------------------------------------------------------------------
-- This allows group rooms to coordinate multiple connection pathways
CREATE TABLE IF NOT EXISTS public.group_call_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    sdp_offer JSONB,
    sdp_answer JSONB,
    status TEXT DEFAULT 'joined' CHECK (status IN ('joined', 'muted', 'camera_off', 'left')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);

-- -------------------------------------------------------------------------
-- 8. CUSTOM CHAT SETTINGS / ARCHIVE TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chat_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    is_archived BOOLEAN DEFAULT FALSE,
    is_muted BOOLEAN DEFAULT FALSE,
    pinned_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, conversation_id)
);
