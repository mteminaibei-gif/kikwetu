-- =============================================================================
-- KikwetuConnect: Voting system migration
-- Run this entire file in Supabase Dashboard → SQL Editor → New query → Run
-- Project: xzfsthlurdlrnegzejeo
-- =============================================================================

-- 1) VOTES TABLE
CREATE TABLE IF NOT EXISTS public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('thread', 'reply')),
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT votes_user_entity_unique UNIQUE (user_id, entity_id)
);

CREATE INDEX IF NOT EXISTS votes_entity_idx ON public.votes (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS votes_user_idx ON public.votes (user_id);

-- 2) Ensure counter columns exist on threads / replies
ALTER TABLE public.threads
  ADD COLUMN IF NOT EXISTS upvotes_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.replies
  ADD COLUMN IF NOT EXISTS upvotes_count INTEGER NOT NULL DEFAULT 0;

-- 3) RLS on votes
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read votes" ON public.votes;
CREATE POLICY "Anyone can read votes"
  ON public.votes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert own votes" ON public.votes;
CREATE POLICY "Users can insert own votes"
  ON public.votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own votes" ON public.votes;
CREATE POLICY "Users can update own votes"
  ON public.votes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own votes" ON public.votes;
CREATE POLICY "Users can delete own votes"
  ON public.votes FOR DELETE
  USING (auth.uid() = user_id);

-- 4) Helper: apply delta to the right table
CREATE OR REPLACE FUNCTION public.apply_vote_delta(
  p_entity_id UUID,
  p_entity_type TEXT,
  p_delta INTEGER
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  IF p_entity_type = 'thread' THEN
    UPDATE public.threads
    SET upvotes_count = GREATEST(0, COALESCE(upvotes_count, 0) + p_delta)
    WHERE id = p_entity_id
    RETURNING upvotes_count INTO new_count;
  ELSIF p_entity_type = 'reply' THEN
    UPDATE public.replies
    SET upvotes_count = GREATEST(0, COALESCE(upvotes_count, 0) + p_delta)
    WHERE id = p_entity_id
    RETURNING upvotes_count INTO new_count;
  ELSE
    RAISE EXCEPTION 'Invalid entity_type: %', p_entity_type;
  END IF;

  RETURN COALESCE(new_count, 0);
END;
$$;

-- 5) MAIN RPC: toggle_vote
-- Called from frontend as:
--   sb.rpc('toggle_vote', {
--     p_user_id, p_entity_id, p_entity_type, p_vote_type
--   })
--
-- Behaviour:
--   - no existing vote  → insert, +1 (up) or -1 (down)
--   - same vote_type    → delete (toggle off), reverse delta
--   - different type    → update type, ±2 net change
-- Returns the new upvotes_count (integer).
CREATE OR REPLACE FUNCTION public.toggle_vote(
  p_user_id UUID,
  p_entity_id UUID,
  p_entity_type TEXT,
  p_vote_type TEXT
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_type TEXT;
  delta INTEGER := 0;
  new_count INTEGER;
BEGIN
  -- Auth: only the caller can vote as themselves (or service role)
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Not allowed to vote as another user';
  END IF;

  IF p_entity_type NOT IN ('thread', 'reply') THEN
    RAISE EXCEPTION 'Invalid entity_type';
  END IF;
  IF p_vote_type NOT IN ('up', 'down') THEN
    RAISE EXCEPTION 'Invalid vote_type';
  END IF;

  SELECT vote_type INTO existing_type
  FROM public.votes
  WHERE user_id = p_user_id AND entity_id = p_entity_id
  FOR UPDATE;

  IF existing_type IS NULL THEN
    -- New vote
    INSERT INTO public.votes (user_id, entity_id, entity_type, vote_type)
    VALUES (p_user_id, p_entity_id, p_entity_type, p_vote_type);
    delta := CASE WHEN p_vote_type = 'up' THEN 1 ELSE -1 END;
  ELSIF existing_type = p_vote_type THEN
    -- Toggle off
    DELETE FROM public.votes
    WHERE user_id = p_user_id AND entity_id = p_entity_id;
    delta := CASE WHEN p_vote_type = 'up' THEN -1 ELSE 1 END;
  ELSE
    -- Switch up ↔ down
    UPDATE public.votes
    SET vote_type = p_vote_type
    WHERE user_id = p_user_id AND entity_id = p_entity_id;
    -- up→down: -2, down→up: +2
    delta := CASE WHEN p_vote_type = 'up' THEN 2 ELSE -2 END;
  END IF;

  new_count := public.apply_vote_delta(p_entity_id, p_entity_type, delta);
  RETURN new_count;
END;
$$;

-- Allow authenticated clients to call the RPC
GRANT EXECUTE ON FUNCTION public.toggle_vote(UUID, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_vote(UUID, UUID, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.apply_vote_delta(UUID, TEXT, INTEGER) TO authenticated;

-- 6) Optional: backfill counts from existing votes (safe to re-run)
UPDATE public.threads t
SET upvotes_count = sub.score
FROM (
  SELECT
    entity_id,
    GREATEST(0,
      COALESCE(SUM(CASE WHEN vote_type = 'up' THEN 1 WHEN vote_type = 'down' THEN -1 ELSE 0 END), 0)
    )::INTEGER AS score
  FROM public.votes
  WHERE entity_type = 'thread'
  GROUP BY entity_id
) sub
WHERE t.id = sub.entity_id;

UPDATE public.replies r
SET upvotes_count = sub.score
FROM (
  SELECT
    entity_id,
    GREATEST(0,
      COALESCE(SUM(CASE WHEN vote_type = 'up' THEN 1 WHEN vote_type = 'down' THEN -1 ELSE 0 END), 0)
    )::INTEGER AS score
  FROM public.votes
  WHERE entity_type = 'reply'
  GROUP BY entity_id
) sub
WHERE r.id = sub.entity_id;

-- 7) Realtime: ensure threads & replies changes are published
-- (ignore errors if already added)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.threads;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.replies;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- 8) Notifications table: make sure columns match frontend inserts
-- Frontend inserts: user_id, actor_id, type, entity_type, entity_id
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  title TEXT,
  body TEXT,
  entity_type TEXT,
  entity_id UUID,
  related_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Add missing columns if table already existed with older shape
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS entity_type TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS entity_id UUID;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS related_id UUID;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS body TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT false;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- Done. Test with:
-- SELECT public.toggle_vote('YOUR_USER_UUID', 'SOME_THREAD_UUID', 'thread', 'up');
