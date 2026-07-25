-- Migration: Rate limit votes
-- Prevents a single user from voting more than 30 times per minute

CREATE OR REPLACE FUNCTION toggle_vote(
  p_user_id UUID,
  p_entity_id UUID,
  p_entity_type TEXT,
  p_vote_type TEXT
)
RETURNS VOID AS $$
DECLARE
  existing_vote TEXT;
  recent_votes_count INT;
BEGIN
  -- Rate limiting: Check how many votes this user has made in the last minute
  SELECT COUNT(*) INTO recent_votes_count
  FROM thread_votes
  WHERE user_id = p_user_id
    AND created_at > now() - interval '1 minute';

  IF recent_votes_count >= 30 THEN
    RAISE EXCEPTION 'Rate limit exceeded: You are voting too fast.';
  END IF;

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
