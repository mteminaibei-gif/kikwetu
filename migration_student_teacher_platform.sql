-- Migration: Student-Teacher Platform (professionals, sessions, chat, ratings, tips)
-- Run this in your Supabase SQL Editor

-- 1. PROFESSIONAL REQUESTS (users apply to become verified teachers)
CREATE TABLE IF NOT EXISTS professional_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  bio TEXT NOT NULL,
  qualifications TEXT NOT NULL,
  qualifications_doc_url TEXT,
  expertise TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE professional_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read approved requests"
  ON professional_requests FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Users can read own requests"
  ON professional_requests FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Users can insert own requests"
  ON professional_requests FOR INSERT
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Admins can read all requests"
  ON professional_requests FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update requests"
  ON professional_requests FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 2. PROFESSIONALS (verified teachers)
CREATE TABLE IF NOT EXISTS professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  title TEXT NOT NULL,
  bio TEXT NOT NULL,
  qualifications TEXT NOT NULL,
  qualifications_doc_url TEXT,
  expertise TEXT[] DEFAULT '{}',
  hourly_rate NUMERIC,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  avg_rating NUMERIC DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  total_tips NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read approved professionals"
  ON professionals FOR SELECT
  USING (verification_status = 'approved');

CREATE POLICY "Professionals can read own profile"
  ON professionals FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Admins can read all"
  ON professionals FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can insert/update"
  ON professionals FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update professionals"
  ON professionals FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 3. TEACHING SESSIONS (student books a session with a professional)
CREATE TABLE IF NOT EXISTS teaching_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  professional_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  topic TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ
);

ALTER TABLE teaching_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can read sessions"
  ON teaching_sessions FOR SELECT
  USING (student_id = auth.uid() OR professional_id = auth.uid());

CREATE POLICY "Students can insert sessions"
  ON teaching_sessions FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Participants can update sessions"
  ON teaching_sessions FOR UPDATE
  USING (student_id = auth.uid() OR professional_id = auth.uid());

CREATE POLICY "Admins can read all sessions"
  ON teaching_sessions FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 4. CHAT MESSAGES (within a session)
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES teaching_sessions(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Session participants can read messages"
  ON chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teaching_sessions
      WHERE id = chat_messages.session_id
      AND (student_id = auth.uid() OR professional_id = auth.uid())
    )
  );

CREATE POLICY "Session participants can insert messages"
  ON chat_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM teaching_sessions
      WHERE id = chat_messages.session_id
      AND (student_id = auth.uid() OR professional_id = auth.uid())
    )
  );

CREATE POLICY "Admins can read all messages"
  ON chat_messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Enable realtime for chat messages
ALTER publication supabase_realtime ADD TABLE chat_messages;

-- 5. SERVICE RATINGS (student rates a session)
CREATE TABLE IF NOT EXISTS service_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES teaching_sessions(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  professional_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id, student_id)
);

ALTER TABLE service_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read ratings"
  ON service_ratings FOR SELECT
  USING (true);

CREATE POLICY "Students can insert own ratings"
  ON service_ratings FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- 6. TIPS (student tips professional via M-Pesa)
CREATE TABLE IF NOT EXISTS tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES teaching_sessions(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  professional_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  mpesa_ref TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE tips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can read own tips"
  ON tips FOR SELECT
  USING (student_id = auth.uid() OR professional_id = auth.uid());

CREATE POLICY "Students can insert tips"
  ON tips FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Admins can read all tips"
  ON tips FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update tips"
  ON tips FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 7. RPC: Update professional average rating
CREATE OR REPLACE FUNCTION update_professional_rating(p_professional_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  avg_rating NUMERIC;
BEGIN
  SELECT ROUND(AVG(score)::numeric, 2) INTO avg_rating
  FROM service_ratings
  WHERE professional_id = p_professional_id;

  UPDATE professionals
  SET avg_rating = COALESCE(avg_rating, 0)
  WHERE profile_id = p_professional_id;

  RETURN COALESCE(avg_rating, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Enable realtime for teaching_sessions (for chat status updates)
ALTER publication supabase_realtime ADD TABLE teaching_sessions;
