-- Migration: Thread votes + toggle_vote RPC + upvotes_count triggers
-- Run this in your Supabase SQL Editor

-- 1. THREAD VOTES TABLE (upvotes and downvotes on threads and replies)
CREATE TABLE IF NOT EXISTS thread_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('thread', 'reply')),
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, entity_id, entity_type)
);

ALTER TABLE thread_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read votes"
  ON thread_votes FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert votes"
  ON thread_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own votes"
  ON thread_votes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes"
  ON thread_votes FOR DELETE
  USING (auth.uid() = user_id);

-- 2. TOGGLE VOTE RPC: inserts/updates/deletes a vote and refreshes counts
CREATE OR REPLACE FUNCTION toggle_vote(
  p_user_id UUID,
  p_entity_id UUID,
  p_entity_type TEXT,
  p_vote_type TEXT
)
RETURNS VOID AS $$
DECLARE
  existing_vote TEXT;
BEGIN
  -- Check for existing vote
  SELECT vote_type INTO existing_vote
  FROM thread_votes
  WHERE user_id = p_user_id
    AND entity_id = p_entity_id
    AND entity_type = p_entity_type;

  IF existing_vote IS NULL THEN
    -- No existing vote: insert new
    INSERT INTO thread_votes (user_id, entity_id, entity_type, vote_type)
    VALUES (p_user_id, p_entity_id, p_entity_type, p_vote_type);
  ELSIF existing_vote = p_vote_type THEN
    -- Same vote type: toggle off (remove vote)
    DELETE FROM thread_votes
    WHERE user_id = p_user_id
      AND entity_id = p_entity_id
      AND entity_type = p_entity_type;
  ELSE
    -- Different vote type: switch vote
    UPDATE thread_votes
    SET vote_type = p_vote_type
    WHERE user_id = p_user_id
      AND entity_id = p_entity_id
      AND entity_type = p_entity_type;
  END IF;

  -- Refresh the upvotes_count on the parent entity
  IF p_entity_type = 'thread' THEN
    UPDATE threads SET upvotes_count = (
      SELECT COUNT(*) FILTER (WHERE vote_type = 'up') - COUNT(*) FILTER (WHERE vote_type = 'down')
      FROM thread_votes WHERE entity_id = p_entity_id AND entity_type = 'thread'
    ) WHERE id = p_entity_id;
  ELSIF p_entity_type = 'reply' THEN
    UPDATE replies SET upvotes_count = (
      SELECT COUNT(*) FILTER (WHERE vote_type = 'up') - COUNT(*) FILTER (WHERE vote_type = 'down')
      FROM thread_votes WHERE entity_id = p_entity_id AND entity_type = 'reply'
    ) WHERE id = p_entity_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Ensure upvotes_count column exists with default 0
ALTER TABLE threads ADD COLUMN IF NOT EXISTS upvotes_count INTEGER DEFAULT 0;
ALTER TABLE replies ADD COLUMN IF NOT EXISTS upvotes_count INTEGER DEFAULT 0;

-- 4. Backfill: set correct upvotes_count from any existing thread_votes rows
UPDATE threads SET upvotes_count = COALESCE((
  SELECT COUNT(*) FILTER (WHERE vote_type = 'up') - COUNT(*) FILTER (WHERE vote_type = 'down')
  FROM thread_votes WHERE entity_id = threads.id AND entity_type = 'thread'
), 0);

UPDATE replies SET upvotes_count = COALESCE((
  SELECT COUNT(*) FILTER (WHERE vote_type = 'up') - COUNT(*) FILTER (WHERE vote_type = 'down')
  FROM thread_votes WHERE entity_id = replies.id AND entity_type = 'reply'
), 0);

-- 5. Ensure reply_count column exists and add auto-increment trigger
ALTER TABLE threads ADD COLUMN IF NOT EXISTS reply_count INTEGER DEFAULT 0;

CREATE OR REPLACE FUNCTION update_thread_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE threads SET reply_count = reply_count + 1 WHERE id = NEW.thread_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE threads SET reply_count = GREATEST(reply_count - 1, 0) WHERE id = OLD.thread_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_reply_change ON replies;
CREATE TRIGGER on_reply_change
  AFTER INSERT OR DELETE ON replies
  FOR EACH ROW EXECUTE FUNCTION update_thread_reply_count();

-- Backfill reply counts
UPDATE threads SET reply_count = (
  SELECT COUNT(*) FROM replies WHERE replies.thread_id = threads.id
);

-- 6. Ensure notifications table columns for vote/emoji notifications
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS actor_id UUID REFERENCES profiles(id);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS entity_type TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS entity_id UUID;
