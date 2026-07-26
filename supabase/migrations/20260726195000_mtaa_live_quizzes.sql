-- Migration: Mtaa Exchange (marketplace), Live Rooms, Quizzes
-- Completes features referenced in README / types but previously missing tables

-- 1. MTAA LISTINGS (local marketplace)
CREATE TABLE IF NOT EXISTS mtaa_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other'
    CHECK (category IN ('produce', 'services', 'crafts', 'livestock', 'tools', 'other')),
  price NUMERIC NOT NULL CHECK (price >= 0),
  currency TEXT NOT NULL DEFAULT 'KES',
  county TEXT NOT NULL,
  location TEXT,
  image_urls TEXT[] DEFAULT '{}',
  contact_phone TEXT,
  contact_whatsapp TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'sold', 'expired', 'removed')),
  views_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_mtaa_listings_county ON mtaa_listings(county);
CREATE INDEX IF NOT EXISTS idx_mtaa_listings_category ON mtaa_listings(category);
CREATE INDEX IF NOT EXISTS idx_mtaa_listings_status ON mtaa_listings(status);
CREATE INDEX IF NOT EXISTS idx_mtaa_listings_seller ON mtaa_listings(seller_id);

ALTER TABLE mtaa_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active listings are viewable by everyone" ON mtaa_listings;
CREATE POLICY "Active listings are viewable by everyone" ON mtaa_listings
  FOR SELECT USING (status = 'active' OR seller_id = auth.uid());

DROP POLICY IF EXISTS "Users can create own listings" ON mtaa_listings;
CREATE POLICY "Users can create own listings" ON mtaa_listings
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Sellers can update own listings" ON mtaa_listings;
CREATE POLICY "Sellers can update own listings" ON mtaa_listings
  FOR UPDATE USING (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Sellers or admins can delete listings" ON mtaa_listings;
CREATE POLICY "Sellers or admins can delete listings" ON mtaa_listings
  FOR DELETE USING (
    auth.uid() = seller_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 2. LIVE ROOMS
CREATE TABLE IF NOT EXISTS live_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  host_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  topic TEXT,
  county TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  participant_count INTEGER NOT NULL DEFAULT 0,
  max_participants INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_live_rooms_active ON live_rooms(is_active);

ALTER TABLE live_rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Live rooms are viewable by everyone" ON live_rooms;
CREATE POLICY "Live rooms are viewable by everyone" ON live_rooms
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create live rooms" ON live_rooms;
CREATE POLICY "Authenticated users can create live rooms" ON live_rooms
  FOR INSERT WITH CHECK (auth.uid() = host_id);

DROP POLICY IF EXISTS "Hosts can update own rooms" ON live_rooms;
CREATE POLICY "Hosts can update own rooms" ON live_rooms
  FOR UPDATE USING (auth.uid() = host_id);

DROP POLICY IF EXISTS "Hosts or admins can delete rooms" ON live_rooms;
CREATE POLICY "Hosts or admins can delete rooms" ON live_rooms
  FOR DELETE USING (
    auth.uid() = host_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE live_rooms;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. QUIZZES
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID REFERENCES spaces(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  options JSONB NOT NULL DEFAULT '[]',
  correct_answer INTEGER NOT NULL DEFAULT 0,
  difficulty TEXT NOT NULL DEFAULT 'medium'
    CHECK (difficulty IN ('easy', 'medium', 'hard')),
  points INTEGER NOT NULL DEFAULT 10,
  category TEXT,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Quizzes are viewable by everyone" ON quizzes;
CREATE POLICY "Quizzes are viewable by everyone" ON quizzes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage quizzes" ON quizzes;
CREATE POLICY "Admins can manage quizzes" ON quizzes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

-- 4. QUIZ RESULTS
CREATE TABLE IF NOT EXISTS quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  answers INTEGER[] DEFAULT '{}',
  completed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, quiz_id)
);

ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own quiz results" ON quiz_results;
CREATE POLICY "Users can read own quiz results" ON quiz_results
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own quiz results" ON quiz_results;
CREATE POLICY "Users can insert own quiz results" ON quiz_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Seed a few starter quizzes (optional demo data)
INSERT INTO quizzes (title, description, options, correct_answer, difficulty, points, category, language)
SELECT * FROM (VALUES
  (
    'What is the capital of Kenya?',
    'Geography basics for East Africa',
    '[{"id":0,"text":"Mombasa"},{"id":1,"text":"Nairobi"},{"id":2,"text":"Kisumu"},{"id":3,"text":"Nakuru"}]'::jsonb,
    1,
    'easy',
    10,
    'Geography',
    'en'
  ),
  (
    'Kilimo bora huanza na nini?',
    'Maswali ya kilimo (Swahili)',
    '[{"id":0,"text":"Mbolea pekee"},{"id":1,"text":"Udongo na maji"},{"id":2,"text":"Soko pekee"},{"id":3,"text":"Trekta"}]'::jsonb,
    1,
    'medium',
    15,
    'Kilimo',
    'sw'
  ),
  (
    'Nyumba Kumi is primarily about…',
    'Community safety knowledge',
    '[{"id":0,"text":"Tax collection"},{"id":1,"text":"Neighborhood safety & solidarity"},{"id":2,"text":"School fees"},{"id":3,"text":"Road construction"}]'::jsonb,
    1,
    'easy',
    10,
    'Community',
    'en'
  )
) AS v(title, description, options, correct_answer, difficulty, points, category, language)
WHERE NOT EXISTS (SELECT 1 FROM quizzes LIMIT 1);
