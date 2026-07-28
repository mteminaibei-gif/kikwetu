-- Fix likes_count / heshima triggers to respect vote value and handle UPDATE

CREATE OR REPLACE FUNCTION update_thread_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.target_type = 'thread' THEN
      UPDATE threads SET likes_count = GREATEST(0, likes_count + NEW.value) WHERE id = NEW.target_id;
    ELSIF NEW.target_type = 'reply' THEN
      UPDATE replies SET likes_count = GREATEST(0, likes_count + NEW.value) WHERE id = NEW.target_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.target_type = 'thread' THEN
      UPDATE threads SET likes_count = GREATEST(0, likes_count - OLD.value) WHERE id = OLD.target_id;
    ELSIF OLD.target_type = 'reply' THEN
      UPDATE replies SET likes_count = GREATEST(0, likes_count - OLD.value) WHERE id = OLD.target_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Switch upvote <-> downvote: apply delta of (new - old)
    IF NEW.target_type = 'thread' THEN
      UPDATE threads SET likes_count = GREATEST(0, likes_count + (NEW.value - OLD.value)) WHERE id = NEW.target_id;
    ELSIF NEW.target_type = 'reply' THEN
      UPDATE replies SET likes_count = GREATEST(0, likes_count + (NEW.value - OLD.value)) WHERE id = NEW.target_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_vote_count_change ON votes;
CREATE TRIGGER on_vote_count_change
  AFTER INSERT OR UPDATE OR DELETE ON votes
  FOR EACH ROW EXECUTE FUNCTION update_thread_counts();

-- Heshima: only count upvotes (+1), handle switch and delete
CREATE OR REPLACE FUNCTION update_heshima_on_vote()
RETURNS TRIGGER AS $$
DECLARE
  author UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.value = 1 THEN
      IF NEW.target_type = 'thread' THEN
        SELECT author_id INTO author FROM threads WHERE id = NEW.target_id;
      ELSE
        SELECT author_id INTO author FROM replies WHERE id = NEW.target_id;
      END IF;
      IF author IS NOT NULL THEN
        UPDATE profiles SET heshima = heshima + 1 WHERE id = author;
      END IF;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.value = 1 THEN
      IF OLD.target_type = 'thread' THEN
        SELECT author_id INTO author FROM threads WHERE id = OLD.target_id;
      ELSE
        SELECT author_id INTO author FROM replies WHERE id = OLD.target_id;
      END IF;
      IF author IS NOT NULL THEN
        UPDATE profiles SET heshima = GREATEST(0, heshima - 1) WHERE id = author;
      END IF;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- +1 -> -1: remove heshima; -1 -> +1: add heshima
    IF OLD.value = 1 AND NEW.value = -1 THEN
      IF NEW.target_type = 'thread' THEN
        SELECT author_id INTO author FROM threads WHERE id = NEW.target_id;
      ELSE
        SELECT author_id INTO author FROM replies WHERE id = NEW.target_id;
      END IF;
      IF author IS NOT NULL THEN
        UPDATE profiles SET heshima = GREATEST(0, heshima - 1) WHERE id = author;
      END IF;
    ELSIF OLD.value = -1 AND NEW.value = 1 THEN
      IF NEW.target_type = 'thread' THEN
        SELECT author_id INTO author FROM threads WHERE id = NEW.target_id;
      ELSE
        SELECT author_id INTO author FROM replies WHERE id = NEW.target_id;
      END IF;
      IF author IS NOT NULL THEN
        UPDATE profiles SET heshima = heshima + 1 WHERE id = author;
      END IF;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_vote_change ON votes;
CREATE TRIGGER on_vote_change
  AFTER INSERT OR UPDATE OR DELETE ON votes
  FOR EACH ROW EXECUTE FUNCTION update_heshima_on_vote();
