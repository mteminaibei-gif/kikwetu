-- ============================================================
-- 005: Extend profiles + cleanup + admin seed
-- ============================================================

-- Add missing columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mpesa_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_prefs JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS privacy_prefs JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS expertise_areas TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS teaching_levels TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hourly_rate INTEGER;

-- Update role CHECK constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('visitor', 'member', 'professional', 'moderator', 'admin'));

-- Admin-only RLS policies
DROP POLICY IF EXISTS "Admins can update professionals" ON professionals;
CREATE POLICY "Admins can update professionals"
  ON professionals FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "Admins can delete professionals" ON professionals;
CREATE POLICY "Admins can delete professionals"
  ON professionals FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "Admins can read audit_logs" ON audit_logs;
CREATE POLICY "Admins can read audit_logs"
  ON audit_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'));

-- ============================================================
-- STEP 1: Delete all non-admin child data + profiles
-- Run this FIRST. Then delete auth users via Dashboard.
-- ============================================================
DO $$
BEGIN
  -- Delete child table data for non-admin users
  DELETE FROM votes WHERE user_id IN (SELECT id FROM profiles WHERE role != 'admin');
  DELETE FROM replies WHERE author_id IN (SELECT id FROM profiles WHERE role != 'admin');
  DELETE FROM threads WHERE author_id IN (SELECT id FROM profiles WHERE role != 'admin');
  DELETE FROM follows WHERE follower_id IN (SELECT id FROM profiles WHERE role != 'admin')
                       OR following_id IN (SELECT id FROM profiles WHERE role != 'admin');
  DELETE FROM saved_items WHERE user_id IN (SELECT id FROM profiles WHERE role != 'admin');
  DELETE FROM messages WHERE sender_id IN (SELECT id FROM profiles WHERE role != 'admin');
  DELETE FROM space_members WHERE user_id IN (SELECT id FROM profiles WHERE role != 'admin');
  DELETE FROM notifications WHERE user_id IN (SELECT id FROM profiles WHERE role != 'admin');
  DELETE FROM tips WHERE from_user_id IN (SELECT id FROM profiles WHERE role != 'admin')
                     OR to_user_id IN (SELECT id FROM profiles WHERE role != 'admin');
  DELETE FROM reports WHERE reporter_id IN (SELECT id FROM profiles WHERE role != 'admin');
  DELETE FROM quiz_results WHERE user_id IN (SELECT id FROM profiles WHERE role != 'admin');
  DELETE FROM marketplace_listings WHERE seller_id IN (SELECT id FROM profiles WHERE role != 'admin');
  DELETE FROM nyumba_kumi_alerts WHERE reporter_id IN (SELECT id FROM profiles WHERE role != 'admin');
  DELETE FROM sessions WHERE student_id IN (SELECT id FROM profiles WHERE role != 'admin')
                         OR professional_id IN (SELECT id FROM profiles WHERE role != 'admin');
  DELETE FROM professionals WHERE user_id IN (SELECT id FROM profiles WHERE role != 'admin');
  DELETE FROM reactions WHERE user_id IN (SELECT id FROM profiles WHERE role != 'admin');

  -- Delete non-admin profiles
  DELETE FROM profiles WHERE role != 'admin';

  RAISE NOTICE 'All non-admin data cleaned up.';
END $$;

-- ============================================================
-- STEP 2: Seed admin profile
-- Run AFTER creating the auth user in Supabase Dashboard:
--   Email: waynenyamu@gmail.com
--   Password: Mtemi@254#
--   Then copy the user UUID and paste below
-- ============================================================
-- Uncomment and replace ADMIN_AUTH_UUID after creating the auth user:

/*
INSERT INTO profiles (user_id, username, full_name, role, language, heshima, is_verified)
VALUES (
  'ADMIN_AUTH_UUID'::UUID,
  'Admin',
  'Wayne Nyamu',
  'admin',
  'en',
  1000,
  true
)
ON CONFLICT (user_id) DO UPDATE SET
  role = 'admin',
  username = 'Admin',
  full_name = 'Wayne Nyamu',
  is_verified = true,
  heshima = 1000;
*/
