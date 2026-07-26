-- Performance indexes + content spam rate limits

-- 1. INDEXES for common query patterns
CREATE INDEX IF NOT EXISTS idx_threads_created_at ON threads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_threads_author_id ON threads (author_id);
CREATE INDEX IF NOT EXISTS idx_threads_space_id ON threads (space_id);
CREATE INDEX IF NOT EXISTS idx_threads_county ON threads (county);
CREATE INDEX IF NOT EXISTS idx_threads_type ON threads (type);

CREATE INDEX IF NOT EXISTS idx_replies_thread_id ON replies (thread_id);
CREATE INDEX IF NOT EXISTS idx_replies_author_id ON replies (author_id);
CREATE INDEX IF NOT EXISTS idx_replies_created_at ON replies (created_at);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created ON notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications (user_id) WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_thread_votes_entity ON thread_votes (entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_thread_votes_user ON thread_votes (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles (username);
CREATE INDEX IF NOT EXISTS idx_profiles_county ON profiles (county);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles (role);

CREATE INDEX IF NOT EXISTS idx_professionals_status ON professionals (verification_status);
CREATE INDEX IF NOT EXISTS idx_professional_requests_status ON professional_requests (status);

CREATE INDEX IF NOT EXISTS idx_teaching_sessions_student ON teaching_sessions (student_id);
CREATE INDEX IF NOT EXISTS idx_teaching_sessions_professional ON teaching_sessions (professional_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages (session_id, created_at);

CREATE INDEX IF NOT EXISTS idx_nyumba_posts_county ON nyumba_kumi_posts (county) WHERE true;
CREATE INDEX IF NOT EXISTS idx_nyumba_posts_created ON nyumba_kumi_posts (created_at DESC);

-- 2. CONTENT RATE LIMIT: max threads per user per minute
CREATE OR REPLACE FUNCTION enforce_thread_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  recent_count INT;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM threads
  WHERE author_id = NEW.author_id
    AND created_at > now() - interval '1 minute';

  IF recent_count >= 5 THEN
    RAISE EXCEPTION 'Rate limit exceeded: too many posts. Please wait a minute.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_thread_rate_limit ON threads;
CREATE TRIGGER trg_thread_rate_limit
  BEFORE INSERT ON threads
  FOR EACH ROW EXECUTE FUNCTION enforce_thread_rate_limit();

-- 3. CONTENT RATE LIMIT: max replies per user per minute
CREATE OR REPLACE FUNCTION enforce_reply_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  recent_count INT;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM replies
  WHERE author_id = NEW.author_id
    AND created_at > now() - interval '1 minute';

  IF recent_count >= 20 THEN
    RAISE EXCEPTION 'Rate limit exceeded: too many replies. Please wait a minute.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_reply_rate_limit ON replies;
CREATE TRIGGER trg_reply_rate_limit
  BEFORE INSERT ON replies
  FOR EACH ROW EXECUTE FUNCTION enforce_reply_rate_limit();

-- 4. CONTENT RATE LIMIT: mtaa listings (if table exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mtaa_listings') THEN
    CREATE OR REPLACE FUNCTION enforce_listing_rate_limit()
    RETURNS TRIGGER AS $fn$
    DECLARE
      recent_count INT;
    BEGIN
      SELECT COUNT(*) INTO recent_count
      FROM mtaa_listings
      WHERE seller_id = NEW.seller_id
        AND created_at > now() - interval '1 minute';

      IF recent_count >= 5 THEN
        RAISE EXCEPTION 'Rate limit exceeded: too many listings. Please wait a minute.';
      END IF;
      RETURN NEW;
    END;
    $fn$ LANGUAGE plpgsql SECURITY DEFINER;

    DROP TRIGGER IF EXISTS trg_listing_rate_limit ON mtaa_listings;
    CREATE TRIGGER trg_listing_rate_limit
      BEFORE INSERT ON mtaa_listings
      FOR EACH ROW EXECUTE FUNCTION enforce_listing_rate_limit();
  END IF;
END $$;
