-- ═══════════════════════════════════════════════════════════════════
-- KikwetuConnect - Production PostgreSQL Schema
-- Supabase SQL Editor: https://supabase.com/dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ═══════════════════════════════════════
-- 1. PROFILES (extends auth.users)
-- ═══════════════════════════════════════
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(30) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL DEFAULT '',
    phone VARCHAR(20),
    email VARCHAR(255),
    county VARCHAR(50) DEFAULT '',
    bio TEXT DEFAULT '',
    avatar_url TEXT DEFAULT '',
    cover_url TEXT DEFAULT '',
    preferred_lang VARCHAR(5) DEFAULT 'en',
    interests TEXT[] DEFAULT '{}',
    badges TEXT[] DEFAULT '{"Mwananchi"}',
    heshima_score INTEGER DEFAULT 100,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user','expert','moderator','admin')),
    verified BOOLEAN DEFAULT FALSE,
    profile_private BOOLEAN DEFAULT FALSE,
    follower_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    post_count INTEGER DEFAULT 0,
    answer_count INTEGER DEFAULT 0,
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_county ON profiles(county);
CREATE INDEX idx_profiles_heshima ON profiles(heshima_score DESC);
CREATE INDEX idx_profiles_search ON profiles USING GIN(to_tsvector('simple', full_name || ' ' || username));

-- Auto-create profile on signup (email, phone, or Google OAuth)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, username, full_name, phone, email, county, preferred_lang, avatar_url, interests)
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'username',
            LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), ' ', '')) || '_' || SUBSTRING(NEW.id::text, 1, 6)
        ),
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone),
        COALESCE(NEW.email, ''),
        COALESCE(NEW.raw_user_meta_data->>'county', ''),
        COALESCE(NEW.raw_user_meta_data->>'preferred_lang', 'en'),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
        COALESCE(ARRAY[NEW.raw_user_meta_data->>'interests'], '{}')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ═══════════════════════════════════════
-- 2. SPACES / COMMUNITIES
-- ═══════════════════════════════════════
CREATE TABLE spaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT DEFAULT '',
    icon VARCHAR(10) DEFAULT '',
    category VARCHAR(30) DEFAULT 'general',
    cover_url TEXT DEFAULT '',
    is_private BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    member_count INTEGER DEFAULT 0,
    thread_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_spaces_slug ON spaces(slug);
CREATE INDEX idx_spaces_category ON spaces(category);

INSERT INTO spaces (name, slug, description, icon, category, member_count) VALUES
('Kilimo Smart', 'kilimo-smart', 'Modern agronomy, soil health, crop protection, and market access for Rift Valley farmers.', '🌾', 'agriculture', 14200),
('Nairobi Tech & Startups', 'nairobi-tech', 'Full-stack engineering, Flutter, Dart, React, and local software solutions.', '💻', 'tech', 9800),
('Swahili & Folklore Hub', 'swahili-folklore', 'Preserving Kenyan storytelling, poetry, Sheng, and linguistic roots.', '📖', 'culture', 6400),
('Mombasa Business & Trade', 'mombasa-business', 'Coastal trade, logistics, tourism networks, and import/export.', '🚢', 'business', 5100),
('Elimu Yetu', 'elimu-yetu', 'KCSE, university, TVET, scholarships, and lifelong learning resources.', '🎓', 'education', 11300),
('Afya Bora', 'afya-bora', 'Community health, wellness tips, nutrition, and medical Q&A.', '🏥', 'health', 7600),
('Mchezo Bora', 'mchezo-bora', 'Football, athletics, rugby, and local sports community.', '⚽', 'sports', 8900),
('Siasa Safi', 'siasi-safi', 'Civic engagement, county governance, and fact-checked political discourse.', '🏛️', 'politics', 6100);


-- ═══════════════════════════════════════
-- 3. USER-SPACE MEMBERSHIP
-- ═══════════════════════════════════════
CREATE TABLE user_spaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('member','moderator','admin')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, space_id)
);

CREATE INDEX idx_user_spaces_user ON user_spaces(user_id);
CREATE INDEX idx_user_spaces_space ON user_spaces(space_id);


-- ═══════════════════════════════════════
-- 4. THREADS (Posts/Questions)
-- ═══════════════════════════════════════
CREATE TABLE threads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    space_id UUID REFERENCES spaces(id) ON DELETE SET NULL,
    author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type VARCHAR(20) DEFAULT 'question' CHECK (type IN ('question','educative','quiz','poll','video','article')),
    title TEXT NOT NULL,
    content TEXT DEFAULT '',
    language VARCHAR(5) DEFAULT 'en',
    media_urls TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    county VARCHAR(50) DEFAULT '',
    is_anonymous BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    upvotes_count INTEGER DEFAULT 0,
    downvotes_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    last_reply_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_threads_space ON threads(space_id);
CREATE INDEX idx_threads_author ON threads(author_id);
CREATE INDEX idx_threads_type ON threads(type);
CREATE INDEX idx_threads_created ON threads(created_at DESC);
CREATE INDEX idx_threads_upvotes ON threads(upvotes_count DESC);
CREATE INDEX idx_threads_language ON threads(language);
CREATE INDEX idx_threads_county ON threads(county);
CREATE INDEX idx_threads_tags ON threads USING GIN(tags);
CREATE INDEX idx_threads_search ON threads USING GIN(to_tsvector('english', title || ' ' || content));


-- ═══════════════════════════════════════
-- 5. REPLIES (Answers/Comments - Threaded)
-- ═══════════════════════════════════════
CREATE TABLE replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID REFERENCES threads(id) ON DELETE CASCADE,
    author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES replies(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    upvotes_count INTEGER DEFAULT 0,
    downvotes_count INTEGER DEFAULT 0,
    is_accepted BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_replies_thread ON replies(thread_id);
CREATE INDEX idx_replies_author ON replies(author_id);
CREATE INDEX idx_replies_parent ON replies(parent_id);
CREATE INDEX idx_replies_upvotes ON replies(upvotes_count DESC);


-- ═══════════════════════════════════════
-- 6. VOTES (Polymorphic: thread or reply)
-- ═══════════════════════════════════════
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL,
    entity_type VARCHAR(10) NOT NULL CHECK (entity_type IN ('thread','reply')),
    vote_type VARCHAR(4) NOT NULL CHECK (vote_type IN ('up','down')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, entity_id, entity_type)
);

CREATE INDEX idx_votes_entity ON votes(entity_id, entity_type);
CREATE INDEX idx_votes_user ON votes(user_id);


-- ═══════════════════════════════════════
-- 7. QUIZZES
-- ═══════════════════════════════════════
CREATE TABLE quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    space_id UUID REFERENCES spaces(id) ON DELETE SET NULL,
    thread_id UUID REFERENCES threads(id) ON DELETE SET NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    question TEXT NOT NULL,
    options JSONB NOT NULL DEFAULT '[]',
    correct_answer_index INTEGER NOT NULL DEFAULT 0,
    explanation TEXT DEFAULT '',
    difficulty VARCHAR(10) DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
    time_limit_seconds INTEGER DEFAULT 30,
    max_score INTEGER DEFAULT 50,
    attempts_count INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    county VARCHAR(50) DEFAULT '',
    is_daily BOOLEAN DEFAULT FALSE,
    active_from TIMESTAMPTZ DEFAULT NOW(),
    active_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE quiz_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    is_correct BOOLEAN DEFAULT FALSE,
    score INTEGER DEFAULT 0,
    time_taken_seconds INTEGER DEFAULT 0,
    completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quiz_results_user ON quiz_results(user_id);
CREATE INDEX idx_quiz_results_quiz ON quiz_results(quiz_id);

-- Seed daily quiz
INSERT INTO quizzes (question, options, correct_answer_index, explanation, county, is_daily) VALUES
('Which historical Kenyan coastal town was a major trading center with Arabia and India before the 15th century?',
 '[\"Mombasa (Gedi/Old Town)\",\"Kisumu Port\",\"Nakuru CBD\",\"Eldoret Town\"]',
 0, 'Gedi and Mombasa Old Town were major Swahili coast trading hubs dating back to the 12th century.', 'Kilifi', true),
('What is the recommended soil pH range for growing maize in Kenya?',
 '[\"4.5 - 5.5\",\"5.5 - 7.0\",\"7.5 - 8.5\",\"8.5 - 9.5\"]',
 1, 'Maize grows best in slightly acidic to neutral soil (pH 5.5-7.0).', 'Trans-Nzoia', true),
('Which programming language is primarily used for Flutter mobile app development?',
 '[\"Java\",\"Python\",\"Dart\",\"JavaScript\"]',
 2, 'Flutter uses Dart as its primary programming language, developed by Google.', 'Nairobi', true);


-- ═══════════════════════════════════════
-- 8. POLLS
-- ═══════════════════════════════════════
CREATE TABLE polls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID REFERENCES threads(id) ON DELETE CASCADE,
    options JSONB NOT NULL DEFAULT '[]',
    ends_at TIMESTAMPTZ,
    total_votes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE poll_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
    option_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, poll_id)
);


-- ═══════════════════════════════════════
-- 9. NOTIFICATIONS
-- ═══════════════════════════════════════
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL,
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    entity_type VARCHAR(20),
    entity_id UUID,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE is_read = FALSE;


-- ═══════════════════════════════════════
-- 10. FOLLOWS
-- ═══════════════════════════════════════
CREATE TABLE follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);


-- ═══════════════════════════════════════
-- 11. HESHIMA LOG (Audit Trail)
-- ═══════════════════════════════════════
CREATE TABLE heshima_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    reason VARCHAR(100) NOT NULL,
    entity_type VARCHAR(20),
    entity_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_heshima_log_user ON heshima_log(user_id, created_at DESC);


-- ═══════════════════════════════════════
-- 12. TRANSLATIONS CACHE
-- ═══════════════════════════════════════
CREATE TABLE translations_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id UUID NOT NULL,
    entity_type VARCHAR(20) NOT NULL,
    target_lang VARCHAR(5) NOT NULL,
    original_text TEXT NOT NULL,
    translated_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(entity_id, entity_type, target_lang)
);


-- ═══════════════════════════════════════
-- 13. REPORTS / MODERATION
-- ═══════════════════════════════════════
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    entity_type VARCHAR(20) NOT NULL,
    entity_id UUID NOT NULL,
    reason VARCHAR(50) NOT NULL,
    details TEXT DEFAULT '',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','reviewing','resolved','dismissed')),
    resolution TEXT DEFAULT '',
    resolved_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_reports_status ON reports(status, created_at DESC);


-- ═══════════════════════════════════════
-- 14. BOOKMARKS
-- ═══════════════════════════════════════
CREATE TABLE bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    thread_id UUID REFERENCES threads(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, thread_id)
);

CREATE INDEX idx_bookmarks_user ON bookmarks(user_id);


-- ═══════════════════════════════════════
-- 15. LIVE ROOMS (Audio Baraza)
-- ═══════════════════════════════════════
CREATE TABLE live_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT DEFAULT '',
    host_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    space_id UUID REFERENCES spaces(id) ON DELETE SET NULL,
    room_type VARCHAR(10) DEFAULT 'audio' CHECK (room_type IN ('audio','video')),
    is_active BOOLEAN DEFAULT TRUE,
    listener_count INTEGER DEFAULT 0,
    max_listeners INTEGER DEFAULT 100,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ
);

CREATE INDEX idx_live_rooms_active ON live_rooms(is_active) WHERE is_active = TRUE;


-- ═══════════════════════════════════════
-- 16. OFFLINE SYNC QUEUE
-- ═══════════════════════════════════════
CREATE TABLE offline_sync (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    action VARCHAR(30) NOT NULL,
    entity_type VARCHAR(20) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    synced BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_offline_sync_user ON offline_sync(user_id, synced);


-- ═══════════════════════════════════════
-- DATABASE FUNCTIONS & TRIGGERS
-- ═══════════════════════════════════════

-- Increment any column on any table
CREATE OR REPLACE FUNCTION increment_column(p_table TEXT, p_id UUID, p_column TEXT)
RETURNS VOID AS $$
BEGIN
    EXECUTE format('UPDATE %I SET %I = %I + 1 WHERE id = $1', p_table, p_column, p_column) USING p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decrement any column on any table (min 0)
CREATE OR REPLACE FUNCTION decrement_column(p_table TEXT, p_id UUID, p_column TEXT)
RETURNS VOID AS $$
BEGIN
    EXECUTE format('UPDATE %I SET %I = GREATEST(%I - 1, 0) WHERE id = $1', p_table, p_column, p_column) USING p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══ HESHIMA TRUST ENGINE ═══
-- Auto-increment heshima when thread receives upvote
CREATE OR REPLACE FUNCTION heshima_on_thread_upvote()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.vote_type = 'up' AND NEW.entity_type = 'thread' THEN
        UPDATE profiles SET heshima_score = heshima_score + 2
        WHERE id = (SELECT author_id FROM threads WHERE id = NEW.entity_id);
        INSERT INTO heshima_log (user_id, points, reason, entity_type, entity_id)
        SELECT author_id, 2, 'thread_upvote', 'thread', NEW.entity_id
        FROM threads WHERE id = NEW.entity_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_vote_insert ON votes;
CREATE TRIGGER on_vote_insert
    AFTER INSERT ON votes
    FOR EACH ROW EXECUTE FUNCTION heshima_on_thread_upvote();

-- Auto-increment heshima when reply is accepted
CREATE OR REPLACE FUNCTION heshima_on_reply_accepted()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_accepted = TRUE AND OLD.is_accepted = FALSE THEN
        UPDATE profiles SET heshima_score = heshima_score + 25
        WHERE id = NEW.author_id;
        INSERT INTO heshima_log (user_id, points, reason, entity_type, entity_id)
        VALUES (NEW.author_id, 25, 'reply_accepted', 'reply', NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_reply_update ON replies;
CREATE TRIGGER on_reply_update
    AFTER UPDATE ON replies
    FOR EACH ROW EXECUTE FUNCTION heshima_on_reply_accepted();

-- Auto-increment heshima when reply receives upvote
CREATE OR REPLACE FUNCTION heshima_on_reply_upvote()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.vote_type = 'up' AND NEW.entity_type = 'reply' THEN
        UPDATE profiles SET heshima_score = heshima_score + 1
        WHERE id = (SELECT author_id FROM replies WHERE id = NEW.entity_id);
        INSERT INTO heshima_log (user_id, points, reason, entity_type, entity_id)
        SELECT author_id, 1, 'reply_upvote', 'reply', NEW.entity_id
        FROM replies WHERE id = NEW.entity_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_vote_insert_reply ON votes;
CREATE TRIGGER on_vote_insert_reply
    AFTER INSERT ON votes
    FOR EACH ROW EXECUTE FUNCTION heshima_on_reply_upvote();

-- Auto-increment heshima on quiz correct answer
CREATE OR REPLACE FUNCTION heshima_on_quiz_correct()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_correct = TRUE THEN
        UPDATE profiles SET heshima_score = heshima_score + NEW.score
        WHERE id = NEW.user_id;
        INSERT INTO heshima_log (user_id, points, reason, entity_type, entity_id)
        VALUES (NEW.user_id, NEW.score, 'quiz_correct', 'quiz', NEW.quiz_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_quiz_result_insert ON quiz_results;
CREATE TRIGGER on_quiz_result_insert
    AFTER INSERT ON quiz_results
    FOR EACH ROW EXECUTE FUNCTION heshima_on_quiz_correct();

-- Auto-update reply count on threads
CREATE OR REPLACE FUNCTION update_thread_reply_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE threads SET reply_count = reply_count + 1, last_reply_at = NOW() WHERE id = NEW.thread_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE threads SET reply_count = GREATEST(reply_count - 1, 0) WHERE id = OLD.thread_id;
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_reply_change ON replies;
CREATE TRIGGER on_reply_change
    AFTER INSERT OR DELETE ON replies
    FOR EACH ROW EXECUTE FUNCTION update_thread_reply_count();

-- Auto-update follower counts
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
        UPDATE profiles SET follower_count = follower_count + 1 WHERE id = NEW.following_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE profiles SET following_count = GREATEST(following_count - 1, 0) WHERE id = OLD.follower_id;
        UPDATE profiles SET follower_count = GREATEST(follower_count - 1, 0) WHERE id = OLD.following_id;
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_follow_change ON follows;
CREATE TRIGGER on_follow_change
    AFTER INSERT OR DELETE ON follows
    FOR EACH ROW EXECUTE FUNCTION update_follow_counts();

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS threads_updated_at ON threads;
CREATE TRIGGER threads_updated_at BEFORE UPDATE ON threads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS replies_updated_at ON replies;
CREATE TRIGGER replies_updated_at BEFORE UPDATE ON replies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ═══════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE heshima_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_rooms ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- SPACES
CREATE POLICY "Spaces are viewable by everyone" ON spaces FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create spaces" ON spaces FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Space creators can update" ON spaces FOR UPDATE USING (auth.uid() = created_by);

-- USER_SPACES
CREATE POLICY "Users can view own memberships" ON user_spaces FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can join spaces" ON user_spaces FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave spaces" ON user_spaces FOR DELETE USING (auth.uid() = user_id);

-- THREADS
CREATE POLICY "Threads are viewable by everyone" ON threads FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create threads" ON threads FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update own threads" ON threads FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete own threads" ON threads FOR DELETE USING (auth.uid() = author_id);

-- REPLIES
CREATE POLICY "Replies are viewable by everyone" ON replies FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create replies" ON replies FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update own replies" ON replies FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete own replies" ON replies FOR DELETE USING (auth.uid() = author_id);

-- VOTES
CREATE POLICY "Votes viewable by everyone" ON votes FOR SELECT USING (true);
CREATE POLICY "Users can vote" ON votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can change vote" ON votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can remove vote" ON votes FOR DELETE USING (auth.uid() = user_id);

-- NOTIFICATIONS
CREATE POLICY "Users see own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can mark own as read" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- FOLLOWS
CREATE POLICY "Follows viewable by everyone" ON follows FOR SELECT USING (true);
CREATE POLICY "Users can follow" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON follows FOR DELETE USING (auth.uid() = follower_id);

-- HESHIMA LOG
CREATE POLICY "Users see own heshima log" ON heshima_log FOR SELECT USING (auth.uid() = user_id);

-- BOOKMARKS
CREATE POLICY "Users see own bookmarks" ON bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can bookmark" ON bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unbookmark" ON bookmarks FOR DELETE USING (auth.uid() = user_id);

-- REPORTS
CREATE POLICY "Users can submit reports" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users see own reports" ON reports FOR SELECT USING (auth.uid() = reporter_id);

-- QUIZ RESULTS
CREATE POLICY "Users see own results" ON quiz_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can submit results" ON quiz_results FOR INSERT WITH CHECK (auth.uid() = user_id);

-- LIVE ROOMS
CREATE POLICY "Active rooms viewable by everyone" ON live_rooms FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create rooms" ON live_rooms FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Hosts can update own rooms" ON live_rooms FOR UPDATE USING (auth.uid() = host_id);


-- ═══════════════════════════════════════
-- ENABLE REALTIME
-- ═══════════════════════════════════════
ALTER PUBLICATION supabase_realtime ADD TABLE threads;
ALTER PUBLICATION supabase_realtime ADD TABLE replies;
ALTER PUBLICATION supabase_realtime ADD TABLE votes;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE live_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE user_spaces;
