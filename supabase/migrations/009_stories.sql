-- Stories (New Ideas) table
-- Each story is a short image or video (<15s) post that expires after 24h

CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  media_duration_seconds REAL DEFAULT NULL,
  caption TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours')
);

CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON stories(expires_at);

-- Story views
CREATE TABLE IF NOT EXISTS story_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(story_id, viewer_id)
);

CREATE INDEX IF NOT EXISTS idx_story_views_story_id ON story_views(story_id);

-- Storage bucket for story media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'stories',
  'stories',
  true,
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime']
) ON CONFLICT (id) DO NOTHING;

-- RLS: stories table
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stories are viewable by everyone"
  ON stories FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own stories"
  ON stories FOR INSERT
  WITH CHECK (auth.uid() = (
    SELECT user_id FROM profiles WHERE id = stories.user_id
  ));

CREATE POLICY "Users can delete their own stories"
  ON stories FOR DELETE
  USING (auth.uid() = (
    SELECT user_id FROM profiles WHERE id = stories.user_id
  ));

-- Auto-expire old stories
CREATE OR REPLACE FUNCTION delete_expired_stories()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM stories WHERE expires_at < now();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_delete_expired_stories
  AFTER INSERT ON stories
  EXECUTE FUNCTION delete_expired_stories();

-- RLS: story_views
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Story views are viewable by story owner"
  ON story_views FOR SELECT
  USING (
    story_id IN (SELECT id FROM stories WHERE user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()))
  );

CREATE POLICY "Users can insert their own views"
  ON story_views FOR INSERT
  WITH CHECK (auth.uid() = (
    SELECT user_id FROM profiles WHERE id = story_views.viewer_id
  ));

-- RLS: storage.objects for stories bucket
CREATE POLICY "Story media is publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'stories');

CREATE POLICY "Authenticated users can upload story media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'stories' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own story media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'stories' AND auth.uid() = (
    SELECT user_id FROM profiles WHERE id::text = (storage.foldername(name))[1]
  ));
