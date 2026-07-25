-- RLS & Security Policy Hardening for Core Tables

-- 1. PROFILES
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'profiles') THEN
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
    CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
    CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

    DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
    CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

-- 2. THREADS
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'threads') THEN
    ALTER TABLE threads ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Threads are viewable by everyone" ON threads;
    CREATE POLICY "Threads are viewable by everyone" ON threads FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Authenticated users can create threads" ON threads;
    CREATE POLICY "Authenticated users can create threads" ON threads FOR INSERT WITH CHECK (auth.role() = 'authenticated');

    DROP POLICY IF EXISTS "Users can update own threads" ON threads;
    CREATE POLICY "Users can update own threads" ON threads FOR UPDATE USING (auth.uid() = author_id);

    DROP POLICY IF EXISTS "Users or admins can delete threads" ON threads;
    CREATE POLICY "Users or admins can delete threads" ON threads FOR DELETE USING (
      auth.uid() = author_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
  END IF;
END $$;

-- 3. REPLIES
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'replies') THEN
    ALTER TABLE replies ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Replies are viewable by everyone" ON replies;
    CREATE POLICY "Replies are viewable by everyone" ON replies FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Authenticated users can create replies" ON replies;
    CREATE POLICY "Authenticated users can create replies" ON replies FOR INSERT WITH CHECK (auth.role() = 'authenticated');

    DROP POLICY IF EXISTS "Users can update own replies" ON replies;
    CREATE POLICY "Users can update own replies" ON replies FOR UPDATE USING (auth.uid() = author_id);

    DROP POLICY IF EXISTS "Users or admins can delete replies" ON replies;
    CREATE POLICY "Users or admins can delete replies" ON replies FOR DELETE USING (
      auth.uid() = author_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
  END IF;
END $$;

-- 4. SPACES
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'spaces') THEN
    ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Spaces are viewable by everyone" ON spaces;
    CREATE POLICY "Spaces are viewable by everyone" ON spaces FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Admins can insert spaces" ON spaces;
    CREATE POLICY "Admins can insert spaces" ON spaces FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

    DROP POLICY IF EXISTS "Admins can update spaces" ON spaces;
    CREATE POLICY "Admins can update spaces" ON spaces FOR UPDATE USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
  END IF;
END $$;

-- 5. NOTIFICATIONS
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'notifications') THEN
    ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
    CREATE POLICY "Users can read own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON notifications;
    CREATE POLICY "Authenticated users can insert notifications" ON notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');

    DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
    CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
    CREATE POLICY "Users can delete own notifications" ON notifications FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- 6. REPORTS
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'reports') THEN
    ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Admins can read reports" ON reports;
    CREATE POLICY "Admins can read reports" ON reports FOR SELECT USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

    DROP POLICY IF EXISTS "Authenticated users can insert reports" ON reports;
    CREATE POLICY "Authenticated users can insert reports" ON reports FOR INSERT WITH CHECK (auth.role() = 'authenticated');

    DROP POLICY IF EXISTS "Admins can update reports" ON reports;
    CREATE POLICY "Admins can update reports" ON reports FOR UPDATE USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
  END IF;
END $$;

-- 7. FOLLOWS
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'follows') THEN
    ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Follows are viewable by everyone" ON follows;
    CREATE POLICY "Follows are viewable by everyone" ON follows FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Users can insert own follows" ON follows;
    CREATE POLICY "Users can insert own follows" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);

    DROP POLICY IF EXISTS "Users can delete own follows" ON follows;
    CREATE POLICY "Users can delete own follows" ON follows FOR DELETE USING (auth.uid() = follower_id);
  END IF;
END $$;

-- 8. STUDENT QUESTIONS & ANSWERS
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'student_questions') THEN
    ALTER TABLE student_questions ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Student questions are viewable by everyone" ON student_questions;
    CREATE POLICY "Student questions are viewable by everyone" ON student_questions FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Authenticated users can create student questions" ON student_questions;
    CREATE POLICY "Authenticated users can create student questions" ON student_questions FOR INSERT WITH CHECK (auth.role() = 'authenticated');

    DROP POLICY IF EXISTS "Authors can update student questions" ON student_questions;
    CREATE POLICY "Authors can update student questions" ON student_questions FOR UPDATE USING (auth.uid() = author_id);
  END IF;

  IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'student_answers') THEN
    ALTER TABLE student_answers ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Student answers are viewable by everyone" ON student_answers;
    CREATE POLICY "Student answers are viewable by everyone" ON student_answers FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Authenticated users can create student answers" ON student_answers;
    CREATE POLICY "Authenticated users can create student answers" ON student_answers FOR INSERT WITH CHECK (auth.role() = 'authenticated');

    DROP POLICY IF EXISTS "Authors can update student answers" ON student_answers;
    CREATE POLICY "Authors can update student answers" ON student_answers FOR UPDATE USING (auth.uid() = author_id);
  END IF;
END $$;
