-- Triggers
CREATE OR REPLACE FUNCTION update_heshima_on_vote()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.value = 1 THEN
    UPDATE profiles SET heshima = heshima + 1 WHERE id = (SELECT author_id FROM threads WHERE id = NEW.target_id AND NEW.target_type = 'thread');
    UPDATE profiles SET heshima = heshima + 1 WHERE id = (SELECT author_id FROM replies WHERE id = NEW.target_id AND NEW.target_type = 'reply');
  ELSIF TG_OP = 'DELETE' AND OLD.value = 1 THEN
    UPDATE profiles SET heshima = GREATEST(0, heshima - 1) WHERE id = (SELECT author_id FROM threads WHERE id = OLD.target_id AND OLD.target_type = 'thread');
    UPDATE profiles SET heshima = GREATEST(0, heshima - 1) WHERE id = (SELECT author_id FROM replies WHERE id = OLD.target_id AND OLD.target_type = 'reply');
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_vote_change
  AFTER INSERT OR DELETE ON votes
  FOR EACH ROW EXECUTE FUNCTION update_heshima_on_vote();

CREATE OR REPLACE FUNCTION update_thread_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.target_type = 'thread' THEN UPDATE threads SET likes_count = likes_count + 1 WHERE id = NEW.target_id;
    ELSIF NEW.target_type = 'reply' THEN UPDATE replies SET likes_count = likes_count + 1 WHERE id = NEW.target_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.target_type = 'thread' THEN UPDATE threads SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.target_id;
    ELSIF OLD.target_type = 'reply' THEN UPDATE replies SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.target_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_vote_count_change
  AFTER INSERT OR DELETE ON votes
  FOR EACH ROW EXECUTE FUNCTION update_thread_counts();

CREATE OR REPLACE FUNCTION update_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN UPDATE threads SET comments_count = comments_count + 1 WHERE id = NEW.thread_id;
  ELSIF TG_OP = 'DELETE' THEN UPDATE threads SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.thread_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_reply_count_change
  AFTER INSERT OR DELETE ON replies
  FOR EACH ROW EXECUTE FUNCTION update_reply_count();

CREATE OR REPLACE FUNCTION update_space_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN UPDATE spaces SET members_count = members_count + 1 WHERE id = NEW.space_id;
  ELSIF TG_OP = 'DELETE' THEN UPDATE spaces SET members_count = GREATEST(0, members_count - 1) WHERE id = OLD.space_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_space_member_change
  AFTER INSERT OR DELETE ON space_members
  FOR EACH ROW EXECUTE FUNCTION update_space_member_count();

CREATE OR REPLACE FUNCTION create_notification_on_reply()
RETURNS TRIGGER AS $$
DECLARE ta UUID; tt TEXT;
BEGIN
  SELECT author_id, title INTO ta, tt FROM threads WHERE id = NEW.thread_id;
  IF ta IS NOT NULL AND ta != NEW.author_id THEN
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (ta, 'reply', 'New reply', (SELECT full_name FROM profiles WHERE id = NEW.author_id) || ' replied to "' || tt || '"', jsonb_build_object('thread_id', NEW.thread_id));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_reply_created
  AFTER INSERT ON replies
  FOR EACH ROW EXECUTE FUNCTION create_notification_on_reply();

CREATE OR REPLACE FUNCTION create_notification_on_follow()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (NEW.following_id, 'follow', 'New follower', (SELECT full_name FROM profiles WHERE id = NEW.follower_id) || ' started following you', jsonb_build_object('follower_id', NEW.follower_id));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_follow_created
  AFTER INSERT ON follows
  FOR EACH ROW EXECUTE FUNCTION create_notification_on_follow();

-- Seed spaces
INSERT INTO spaces (name, description, icon, color) VALUES
  ('KilimoSmart', 'Agriculture and farming tips', '🌾', '#4CAF50'),
  ('NairobiTech', 'Tech news and startups', '💻', '#2196F3'),
  ('Swahili Folklore', 'Traditional stories and culture', '📖', '#FF9800'),
  ('Mombasa Trade', 'Buy and sell at the Coast', '🤝', '#E91E63'),
  ('Nyumba Kumi', 'Neighbourhood safety', '🏠', '#9C27B0'),
  ('Learn Together', 'Study groups and quizzes', '📚', '#00BCD4'),
  ('County Politics', 'Civic issues discussion', '🏛️', '#795548'),
  ('Biashara and Hustles', 'Business and entrepreneurship', '💰', '#FF5722')
ON CONFLICT DO NOTHING;

-- Seed quiz categories
INSERT INTO quiz_categories (name, icon, color) VALUES
  ('Counties', '🗺️', '#4CAF50'),
  ('Agriculture', '🌾', '#8BC34A'),
  ('Culture', '🎭', '#FF9800'),
  ('Rights', '⚖️', '#2196F3'),
  ('Biashara', '💰', '#E91E63'),
  ('Tech', '💻', '#9C27B0'),
  ('Health', '🏥', '#F44336')
ON CONFLICT DO NOTHING;
