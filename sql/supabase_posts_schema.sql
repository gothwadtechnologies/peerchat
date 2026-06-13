-- SQL Migration script for GrixChat Posts Database Structure
-- Copy and execute this in your Supabase SQL Editor to enable the Posts, Likes, and Comments features.

-- Ensure RLS is enabled on all tables for maximum security.

-- 1. Create Posts Table
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for public.posts
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Post Policies
CREATE POLICY "Allow public read access for posts" 
ON public.posts FOR SELECT 
USING (true);

CREATE POLICY "Allow authenticated insert for posts" 
ON public.posts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own posts" 
ON public.posts FOR DELETE 
USING (auth.uid() = user_id);


-- 2. Create Post Likes Table for Track Heart clicks
CREATE TABLE IF NOT EXISTS public.post_likes (
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (post_id, user_id)
);

-- Enable RLS for public.post_likes
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- Post Likes Policies
CREATE POLICY "Allow public read access for post likes" 
ON public.post_likes FOR SELECT 
USING (true);

CREATE POLICY "Allow authenticated insert for post likes" 
ON public.post_likes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to remove their likes" 
ON public.post_likes FOR DELETE 
USING (auth.uid() = user_id);


-- 3. Create Post Comments Table for Interactive feedback
CREATE TABLE IF NOT EXISTS public.post_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for public.post_comments
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- Post Comments Policies
CREATE POLICY "Allow public read access for post comments" 
ON public.post_comments FOR SELECT 
USING (true);

CREATE POLICY "Allow authenticated insert for post comments" 
ON public.post_comments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own comments" 
ON public.post_comments FOR DELETE 
USING (auth.uid() = user_id);
