-- ============================================================
-- AI BRIDGE: Event Like System
-- Migration: 021_event_likes.sql
-- ============================================================

-- 1. Main event_likes table
CREATE TABLE IF NOT EXISTS public.event_likes (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id   UUID        NOT NULL REFERENCES public.gallery_events(id) ON DELETE CASCADE,
    user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

    -- One like per user per event
    CONSTRAINT unique_event_like UNIQUE (event_id, user_id)
);

-- Fast lookup indexes
CREATE INDEX IF NOT EXISTS idx_el_event_id ON public.event_likes(event_id);
CREATE INDEX IF NOT EXISTS idx_el_user_id  ON public.event_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_el_created  ON public.event_likes(created_at DESC);

-- 2. Row Level Security
ALTER TABLE public.event_likes ENABLE ROW LEVEL SECURITY;

-- Anyone (logged in or guest) can read likes (public counts/avatars)
DROP POLICY IF EXISTS "anyone_can_read_likes" ON public.event_likes;
CREATE POLICY "anyone_can_read_likes"
    ON public.event_likes FOR SELECT
    USING (true);

-- Only logged-in users can like with their own auth UID
DROP POLICY IF EXISTS "users_can_like" ON public.event_likes;
CREATE POLICY "users_can_like"
    ON public.event_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- Users can only delete their own likes (unlike)
DROP POLICY IF EXISTS "users_can_unlike" ON public.event_likes;
CREATE POLICY "users_can_unlike"
    ON public.event_likes FOR DELETE
    USING (auth.uid() = user_id);

-- 3. Safe Aggregated View for Instagram-style Likes UI
-- Returns like count and the first likers (full_name and avatar_url only, no sensitive info)
CREATE OR REPLACE VIEW public.event_like_summary AS
SELECT
    el.event_id,
    COUNT(*)::int AS like_count,
    COALESCE(
        json_agg(
            json_build_object(
                'full_name',  p.full_name,
                'avatar_url', p.avatar_url
            )
            ORDER BY el.created_at ASC
        ) FILTER (WHERE p.id IS NOT NULL),
        '[]'::json
    ) AS likers
FROM public.event_likes el
JOIN public.profiles p ON p.id = el.user_id
GROUP BY el.event_id;
