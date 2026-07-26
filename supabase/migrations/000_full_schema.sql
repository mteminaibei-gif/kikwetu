-- ============================================================
-- KikwetuConnect - Full Database Schema
-- Production-ready consolidated migration
-- Idempotent: safe to re-run (IF NOT EXISTS, CREATE OR REPLACE)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  county TEXT,
  language TEXT DEFAULT 'en' CHECK (language IN ('en', 'sw', 'sheng')),
  role TEXT DEFAULT 'member' CHECK (role IN ('visitor', 'member', 'professional', 'moderator', 'admin')),
  heshima INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  is_online BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. SPACES
-- ============================================================
CREATE TABLE IF NOT EXISTS spaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  members_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS space_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(space_id, user_id)
);

-- ============================================================
-- 3. THREADS (Posts, Questions, Polls, Audio)
-- ============================================================
CREATE TABLE IF NOT EXISTS threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT DEFAULT 'post' CHECK (type IN ('post', 'question', 'poll', 'audio')),
  space_id UUID REFERENCES spaces(id) ON DELETE SET NULL,
  bounty_amount INTEGER,
  tags TEXT[] DEFAULT '{}',
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. REPLIES
-- ============================================================
CREATE TABLE IF NOT EXISTS replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  is_accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. VOTES
-- ============================================================
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('thread', 'reply')),
  target_id UUID NOT NULL,
  value INTEGER NOT NULL CHECK (value IN (1, -1)),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, target_type, target_id)
);

-- ============================================================
-- 6. REACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('thread', 'reply')),
  target_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, target_type, target_id, emoji)
);

-- ============================================================
-- 7. PROFESSIONALS
-- ============================================================
CREATE TABLE IF NOT EXISTS professionals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  expertise TEXT[] DEFAULT '{}',
  description TEXT,
  hourly_rate INTEGER,
  is_approved BOOLEAN DEFAULT FALSE,
  rating NUMERIC(3,2) DEFAULT 0,
  sessions_count INTEGER DEFAULT 0,
  availability JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. SESSIONS (Private consultations)
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES threads(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ,
  duration_minutes INTEGER DEFAULT 30,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  meeting_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. CONVERSATIONS & MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. TIPS & PAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS tips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  platform_fee INTEGER NOT NULL,
  net_amount INTEGER NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  mpesa_receipt TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 11. NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 12. QUIZZES
-- ============================================================
CREATE TABLE IF NOT EXISTS quiz_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  quizzes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES quiz_categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  difficulty TEXT DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  questions_count INTEGER DEFAULT 0,
  estimated_minutes INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quiz_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  time_taken_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 13. MARKETPLACE (Mtaa Exchange)
-- ============================================================
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  category TEXT NOT NULL,
  location TEXT,
  images TEXT[] DEFAULT '{}',
  is_available BOOLEAN DEFAULT TRUE,
  rating NUMERIC(3,2) DEFAULT 0,
  sales_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 14. NYUMBA KUMI (Neighbourhood Safety)
-- ============================================================
CREATE TABLE IF NOT EXISTS nyumba_kumi_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('safety', 'maintenance', 'community', 'emergency')),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  county TEXT NOT NULL,
  confirmations_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 15. SAVED ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS saved_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('thread', 'reply', 'listing')),
  target_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, target_type, target_id)
);

-- ============================================================
-- 16. FOLLOWS
-- ============================================================
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- ============================================================
-- 17. REPORTS
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('thread', 'reply', 'user', 'message')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 18. AUDIT LOGS (Admin actions)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 19. PARENT LINKS (Parent-student linking)
-- ============================================================
CREATE TABLE IF NOT EXISTS parent_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(parent_id, student_id)
);

-- ============================================================
-- 20. LIVE ROOMS (Live audio rooms)
-- ============================================================
CREATE TABLE IF NOT EXISTS live_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  space_id UUID REFERENCES spaces(id) ON DELETE SET NULL,
  is_live BOOLEAN DEFAULT FALSE,
  listeners_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_county ON profiles(county);

-- Threads
CREATE INDEX IF NOT EXISTS idx_threads_author ON threads(author_id);
CREATE INDEX IF NOT EXISTS idx_threads_space ON threads(space_id);
CREATE INDEX IF NOT EXISTS idx_threads_type ON threads(type);
CREATE INDEX IF NOT EXISTS idx_threads_created ON threads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_threads_bounty ON threads(bounty_amount) WHERE bounty_amount IS NOT NULL;

-- Replies
CREATE INDEX IF NOT EXISTS idx_replies_thread ON replies(thread_id);
CREATE INDEX IF NOT EXISTS idx_replies_author ON replies(author_id);

-- Votes
CREATE INDEX IF NOT EXISTS idx_votes_target ON votes(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_votes_user ON votes(user_id);

-- Reactions
CREATE INDEX IF NOT EXISTS idx_reactions_target ON reactions(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON reactions(user_id);

-- Messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

-- Tips
CREATE INDEX IF NOT EXISTS idx_tips_from ON tips(from_user_id);
CREATE INDEX IF NOT EXISTS idx_tips_to ON tips(to_user_id);

-- Marketplace
CREATE INDEX IF NOT EXISTS idx_marketplace_category ON marketplace_listings(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_seller ON marketplace_listings(seller_id);

-- Nyumba Kumi
CREATE INDEX IF NOT EXISTS idx_nyumba_kumi_status ON nyumba_kumi_alerts(status, county);

-- Space members
CREATE INDEX IF NOT EXISTS idx_space_members_user ON space_members(user_id);

-- Professionals
CREATE INDEX IF NOT EXISTS idx_professionals_user ON professionals(user_id);

-- Follows
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

-- Audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- Live rooms
CREATE INDEX IF NOT EXISTS idx_live_rooms_host ON live_rooms(host_id);
CREATE INDEX IF NOT EXISTS idx_live_rooms_space ON live_rooms(space_id);
CREATE INDEX IF NOT EXISTS idx_live_rooms_live ON live_rooms(is_live) WHERE is_live = TRUE;

-- Parent links
CREATE INDEX IF NOT EXISTS idx_parent_links_parent ON parent_links(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_links_student ON parent_links(student_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE nyumba_kumi_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_rooms ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Profiles
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Threads
CREATE POLICY "Threads are viewable by everyone" ON threads FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create threads" ON threads FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own threads" ON threads FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete own threads" ON threads FOR DELETE USING (auth.uid() = author_id);

-- Replies
CREATE POLICY "Replies are viewable by everyone" ON replies FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create replies" ON replies FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own replies" ON replies FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete own replies" ON replies FOR DELETE USING (auth.uid() = author_id);

-- Votes
CREATE POLICY "Votes are viewable by everyone" ON votes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can vote" ON votes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own votes" ON votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own votes" ON votes FOR DELETE USING (auth.uid() = user_id);

-- Reactions
CREATE POLICY "Reactions are viewable by everyone" ON reactions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can react" ON reactions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can delete own reactions" ON reactions FOR DELETE USING (auth.uid() = user_id);

-- Spaces
CREATE POLICY "Spaces are viewable by everyone" ON spaces FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create spaces" ON spaces FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Space members
CREATE POLICY "Space members are viewable by everyone" ON space_members FOR SELECT USING (true);
CREATE POLICY "Authenticated users can join spaces" ON space_members FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can leave spaces" ON space_members FOR DELETE USING (auth.uid() = user_id);

-- Professionals
CREATE POLICY "Professionals are viewable by everyone" ON professionals FOR SELECT USING (true);
CREATE POLICY "Authenticated users can apply" ON professionals FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own professional profile" ON professionals FOR UPDATE USING (auth.uid() = user_id);

-- Sessions
CREATE POLICY "Sessions viewable by participants" ON sessions FOR SELECT USING (auth.uid() = student_id OR auth.uid() = professional_id);
CREATE POLICY "Authenticated users can create sessions" ON sessions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own sessions" ON sessions FOR UPDATE USING (auth.uid() = student_id OR auth.uid() = professional_id);

-- Messages
CREATE POLICY "Messages viewable by participants" ON messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
  )
);
CREATE POLICY "Authenticated users can send messages" ON messages FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = sender_id);

-- Conversations
CREATE POLICY "Conversations viewable by participants" ON conversations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = conversations.id AND user_id = auth.uid()
  )
);

-- Conversation participants
CREATE POLICY "Conversation participants viewable by participants" ON conversation_participants FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = conversation_participants.conversation_id AND cp.user_id = auth.uid()
  )
);

-- Tips
CREATE POLICY "Tips viewable by participants" ON tips FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
CREATE POLICY "Authenticated users can create tips" ON tips FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = from_user_id);

-- Notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Quiz categories
CREATE POLICY "Quiz categories are viewable by everyone" ON quiz_categories FOR SELECT USING (true);

-- Quizzes
CREATE POLICY "Quizzes are viewable by everyone" ON quizzes FOR SELECT USING (true);

-- Quiz results
CREATE POLICY "Quiz results are viewable by everyone" ON quiz_results FOR SELECT USING (true);
CREATE POLICY "Authenticated users can submit results" ON quiz_results FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Marketplace
CREATE POLICY "Listings are viewable by everyone" ON marketplace_listings FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create listings" ON marketplace_listings FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = seller_id);
CREATE POLICY "Sellers can update own listings" ON marketplace_listings FOR UPDATE USING (auth.uid() = seller_id);

-- Nyumba Kumi
CREATE POLICY "Alerts are viewable by everyone" ON nyumba_kumi_alerts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create alerts" ON nyumba_kumi_alerts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own alerts" ON nyumba_kumi_alerts FOR UPDATE USING (auth.uid() = reporter_id);

-- Saved items
CREATE POLICY "Users can view own saved items" ON saved_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can save items" ON saved_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can delete own saved items" ON saved_items FOR DELETE USING (auth.uid() = user_id);

-- Follows
CREATE POLICY "Follows are viewable by everyone" ON follows FOR SELECT USING (true);
CREATE POLICY "Authenticated users can follow" ON follows FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can unfollow" ON follows FOR DELETE USING (auth.uid() = follower_id);

-- Reports
CREATE POLICY "Users can view own reports" ON reports FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "Authenticated users can create reports" ON reports FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Audit logs (admin-only read)
CREATE POLICY "Admins can view audit logs" ON audit_logs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
CREATE POLICY "Admins can create audit logs" ON audit_logs FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Parent links
CREATE POLICY "Parents and students can view own links" ON parent_links FOR SELECT USING (
  auth.uid() = parent_id OR auth.uid() = student_id
);
CREATE POLICY "Authenticated users can create parent links" ON parent_links FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Students can update link status" ON parent_links FOR UPDATE USING (auth.uid() = student_id);

-- Live rooms
CREATE POLICY "Live rooms are viewable by everyone" ON live_rooms FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create live rooms" ON live_rooms FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Hosts can update own live rooms" ON live_rooms FOR UPDATE USING (auth.uid() = host_id);

-- ============================================================
-- TRIGGER FUNCTIONS
-- ============================================================

-- 1. Update heshima on vote
CREATE OR REPLACE FUNCTION update_heshima_on_vote()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.value = 1 THEN
    UPDATE profiles SET heshima = heshima + 1 WHERE id = (
      SELECT author_id FROM threads WHERE id = NEW.target_id AND NEW.target_type = 'thread'
    );
    UPDATE profiles SET heshima = heshima + 1 WHERE id = (
      SELECT author_id FROM replies WHERE id = NEW.target_id AND NEW.target_type = 'reply'
    );
  ELSIF TG_OP = 'DELETE' AND OLD.value = 1 THEN
    UPDATE profiles SET heshima = GREATEST(0, heshima - 1) WHERE id = (
      SELECT author_id FROM threads WHERE id = OLD.target_id AND OLD.target_type = 'thread'
    );
    UPDATE profiles SET heshima = GREATEST(0, heshima - 1) WHERE id = (
      SELECT author_id FROM replies WHERE id = OLD.target_id AND OLD.target_type = 'reply'
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_vote_change
  AFTER INSERT OR DELETE ON votes
  FOR EACH ROW EXECUTE FUNCTION update_heshima_on_vote();

-- 2. Update thread/reply likes count
CREATE OR REPLACE FUNCTION update_thread_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.target_type = 'thread' THEN
      UPDATE threads SET likes_count = likes_count + 1 WHERE id = NEW.target_id;
    ELSIF NEW.target_type = 'reply' THEN
      UPDATE replies SET likes_count = likes_count + 1 WHERE id = NEW.target_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.target_type = 'thread' THEN
      UPDATE threads SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.target_id;
    ELSIF OLD.target_type = 'reply' THEN
      UPDATE replies SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.target_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_vote_count_change
  AFTER INSERT OR DELETE ON votes
  FOR EACH ROW EXECUTE FUNCTION update_thread_counts();

-- 3. Update reply count on threads
CREATE OR REPLACE FUNCTION update_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE threads SET comments_count = comments_count + 1 WHERE id = NEW.thread_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE threads SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.thread_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_reply_count_change
  AFTER INSERT OR DELETE ON replies
  FOR EACH ROW EXECUTE FUNCTION update_reply_count();

-- 4. Update space member count
CREATE OR REPLACE FUNCTION update_space_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE spaces SET members_count = members_count + 1 WHERE id = NEW.space_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE spaces SET members_count = GREATEST(0, members_count - 1) WHERE id = OLD.space_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_space_member_change
  AFTER INSERT OR DELETE ON space_members
  FOR EACH ROW EXECUTE FUNCTION update_space_member_count();

-- 5. Update professional rating on tip insert
CREATE OR REPLACE FUNCTION update_professional_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.rating IS NOT NULL THEN
    UPDATE professionals
    SET rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM tips
      WHERE to_user_id = NEW.to_user_id
        AND status = 'completed'
        AND rating IS NOT NULL
    )
    WHERE user_id = NEW.to_user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_tip_insert
  AFTER INSERT OR UPDATE ON tips
  FOR EACH ROW EXECUTE FUNCTION update_professional_rating();

-- 6. Update listing sales count on tip insert
CREATE OR REPLACE FUNCTION update_listing_sales_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' THEN
    UPDATE marketplace_listings
    SET sales_count = sales_count + 1
    WHERE seller_id = NEW.to_user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_tip_sales_update
  AFTER INSERT OR UPDATE ON tips
  FOR EACH ROW EXECUTE FUNCTION update_listing_sales_count();

-- 7. Create notification on reply
CREATE OR REPLACE FUNCTION create_notification_on_reply()
RETURNS TRIGGER AS $$
DECLARE
  thread_author UUID;
  thread_title TEXT;
BEGIN
  SELECT author_id, title INTO thread_author, thread_title
  FROM threads WHERE id = NEW.thread_id;

  IF thread_author IS NOT NULL AND thread_author != NEW.author_id THEN
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      thread_author,
      'reply',
      'New reply on your thread',
      (SELECT full_name FROM profiles WHERE id = NEW.author_id) || ' replied to "' || thread_title || '"',
      jsonb_build_object('thread_id', NEW.thread_id, 'reply_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_reply_created
  AFTER INSERT ON replies
  FOR EACH ROW EXECUTE FUNCTION create_notification_on_reply();

-- 8. Create notification on vote
CREATE OR REPLACE FUNCTION create_notification_on_vote()
RETURNS TRIGGER AS $$
DECLARE
  target_author UUID;
  target_title TEXT;
BEGIN
  IF NEW.target_type = 'thread' THEN
    SELECT author_id, title INTO target_author, target_title
    FROM threads WHERE id = NEW.target_id;
  ELSIF NEW.target_type = 'reply' THEN
    SELECT author_id, title INTO target_author, target_title
    FROM replies r JOIN threads t ON r.thread_id = t.id
    WHERE r.id = NEW.target_id;
  END IF;

  IF target_author IS NOT NULL AND target_author != NEW.user_id THEN
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      target_author,
      'vote',
      'Your content was upvoted',
      (SELECT full_name FROM profiles WHERE id = NEW.user_id) || ' upvoted your ' || NEW.target_type,
      jsonb_build_object('target_type', NEW.target_type, 'target_id', NEW.target_id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_vote_created
  AFTER INSERT ON votes
  FOR EACH ROW EXECUTE FUNCTION create_notification_on_vote();

-- 9. Create notification on follow
CREATE OR REPLACE FUNCTION create_notification_on_follow()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (
    NEW.following_id,
    'follow',
    'New follower',
    (SELECT full_name FROM profiles WHERE id = NEW.follower_id) || ' started following you',
    jsonb_build_object('follower_id', NEW.follower_id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_follow_created
  AFTER INSERT ON follows
  FOR EACH ROW EXECUTE FUNCTION create_notification_on_follow();

-- ============================================================
-- SEED DATA: Default Spaces
-- ============================================================
INSERT INTO spaces (name, description, icon, color, created_at) VALUES
  ('KilimoSmart',        'Agriculture, farming tips, and market prices for Kenyan farmers', '🌾', '#4CAF50', NOW()),
  ('NairobiTech',        'Tech news, startups, and developer discussions in Nairobi',       '💻', '#2196F3', NOW()),
  ('Swahili Folklore',   'Traditional stories, proverbs, and cultural heritage',            '📖', '#FF9800', NOW()),
  ('Mombasa Trade',      'Buy, sell, and trade in the Coast region',                       '🤝', '#E91E63', NOW()),
  ('Nyumba Kumi',        'Neighbourhood safety, alerts, and community watch',              '🏠', '#9C27B0', NOW()),
  ('Learn Together',     'Study groups, quizzes, and educational resources',               '📚', '#00BCD4', NOW()),
  ('County Politics',    'Discuss county governance, elections, and civic issues',          '🏛️', '#795548', NOW()),
  ('Biashara and Hustles','Side hustles, business ideas, and entrepreneurship in Kenya',   '💰', '#FF5722', NOW())
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED DATA: Quiz Categories
-- ============================================================
INSERT INTO quiz_categories (name, icon, color, created_at) VALUES
  ('Counties',   '🗺️', '#4CAF50', NOW()),
  ('Agriculture','🌾', '#8BC34A', NOW()),
  ('Culture',    '🎭', '#FF9800', NOW()),
  ('Rights',     '⚖️', '#2196F3', NOW()),
  ('Biashara',   '💰', '#E91E63', NOW()),
  ('Tech',       '💻', '#9C27B0', NOW()),
  ('Health',     '🏥', '#F44336', NOW())
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED DATA: Sample Quizzes
-- ============================================================

-- Counties
INSERT INTO quizzes (category_id, title, description, difficulty, questions_count, estimated_minutes) VALUES
  ((SELECT id FROM quiz_categories WHERE name = 'Counties'),
   'Kenya Counties 101', 'Test your knowledge of Kenya''s 47 counties', 'easy', 10, 5),
  ((SELECT id FROM quiz_categories WHERE name = 'Counties'),
   'County Capitals Challenge', 'How well do you know county capitals?', 'medium', 15, 8),
  ((SELECT id FROM quiz_categories WHERE name = 'Counties'),
   'Geography Master', 'Advanced county geography and landmarks', 'hard', 20, 12)
ON CONFLICT DO NOTHING;

-- Agriculture
INSERT INTO quizzes (category_id, title, description, difficulty, questions_count, estimated_minutes) VALUES
  ((SELECT id FROM quiz_categories WHERE name = 'Agriculture'),
   'Farming Basics', 'Essential knowledge for Kenyan farmers', 'easy', 10, 5),
  ((SELECT id FROM quiz_categories WHERE name = 'Agriculture'),
   'Crop Calendar', 'Know when to plant what in Kenya', 'medium', 12, 7),
  ((SELECT id FROM quiz_categories WHERE name = 'Agriculture'),
   'Livestock Management', 'Test your animal husbandry skills', 'hard', 15, 10)
ON CONFLICT DO NOTHING;

-- Culture
INSERT INTO quizzes (category_id, title, description, difficulty, questions_count, estimated_minutes) VALUES
  ((SELECT id FROM quiz_categories WHERE name = 'Culture'),
   'Swahili Proverbs', 'Test your knowledge of Kiswahili sayings', 'easy', 10, 5),
  ((SELECT id FROM quiz_categories WHERE name = 'Culture'),
   'Kenyan Traditions', 'Explore cultural practices across Kenya', 'medium', 12, 7),
  ((SELECT id FROM quiz_categories WHERE name = 'Culture'),
   'Tribal Knowledge', 'Deep dive into Kenya''s diverse communities', 'hard', 15, 10)
ON CONFLICT DO NOTHING;

-- Rights
INSERT INTO quizzes (category_id, title, description, difficulty, questions_count, estimated_minutes) VALUES
  ((SELECT id FROM quiz_categories WHERE name = 'Rights'),
   'Know Your Rights', 'Basic constitutional rights every Kenyan should know', 'easy', 10, 5),
  ((SELECT id FROM quiz_categories WHERE name = 'Rights'),
   'Bill of Rights', 'Test your knowledge of Chapter 4 of the Constitution', 'medium', 15, 8),
  ((SELECT id FROM quiz_categories WHERE name = 'Rights'),
   'Legal Literacy', 'Advanced legal knowledge and case law', 'hard', 20, 12)
ON CONFLICT DO NOTHING;

-- Biashara
INSERT INTO quizzes (category_id, title, description, difficulty, questions_count, estimated_minutes) VALUES
  ((SELECT id FROM quiz_categories WHERE name = 'Biashara'),
   'Business Basics', 'Entrepreneurship fundamentals', 'easy', 10, 5),
  ((SELECT id FROM quiz_categories WHERE name = 'Biashara'),
   'M-Pesa Money Moves', 'Test your digital finance knowledge', 'medium', 12, 7),
  ((SELECT id FROM quiz_categories WHERE name = 'Biashara'),
   'Startup Kenya', 'How well do you know the Kenyan startup ecosystem?', 'hard', 15, 10)
ON CONFLICT DO NOTHING;

-- Tech
INSERT INTO quizzes (category_id, title, description, difficulty, questions_count, estimated_minutes) VALUES
  ((SELECT id FROM quiz_categories WHERE name = 'Tech'),
   'Digital Literacy', 'Basic computer and internet knowledge', 'easy', 10, 5),
  ((SELECT id FROM quiz_categories WHERE name = 'Tech'),
   'Nairobi Tech Scene', 'How well do you know Kenyan tech?', 'medium', 12, 7),
  ((SELECT id FROM quiz_categories WHERE name = 'Tech'),
   'Coding Challenge', 'Programming and software development quiz', 'hard', 15, 10)
ON CONFLICT DO NOTHING;

-- Health
INSERT INTO quizzes (category_id, title, description, difficulty, questions_count, estimated_minutes) VALUES
  ((SELECT id FROM quiz_categories WHERE name = 'Health'),
   'Health Basics', 'Essential health and hygiene knowledge', 'easy', 10, 5),
  ((SELECT id FROM quiz_categories WHERE name = 'Health'),
   'Nutrition Kenya', 'Learn about healthy eating in the Kenyan context', 'medium', 12, 7),
  ((SELECT id FROM quiz_categories WHERE name = 'Health'),
   'First Aid Ready', 'Test your emergency response knowledge', 'hard', 15, 10)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Done! Full schema ready for production.
-- ============================================================
