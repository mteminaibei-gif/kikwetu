-- ============================================================
-- 005: Extend profiles table + admin RLS + cleanup all non-admin accounts
-- ============================================================

-- Add missing columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mpesa_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_prefs JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS privacy_prefs JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS expertise_areas TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS teaching_levels TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hourly_rate INTEGER;

-- Update role CHECK constraint to include 'professional'
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('visitor', 'member', 'professional', 'moderator', 'admin'));

-- Admin-only RLS policies for professionals table
DROP POLICY IF EXISTS "Admins can update professionals" ON professionals;
CREATE POLICY "Admins can update professionals"
  ON professionals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete professionals" ON professionals;
CREATE POLICY "Admins can delete professionals"
  ON professionals FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin-only RLS for audit_logs
DROP POLICY IF EXISTS "Admins can read audit_logs" ON audit_logs;
CREATE POLICY "Admins can read audit_logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================
-- DELETE ALL ACCOUNTS EXCEPT ADMIN
-- Run this AFTER you know the admin user_id
-- Replace 'ADMIN_USER_ID_HERE' with your actual auth.users UUID
-- ============================================================
-- Uncomment the following block after replacing ADMIN_USER_ID_HERE:

/*
DO $$
DECLARE
  admin_uid UUID := 'ADMIN_USER_ID_HERE'::UUID;
BEGIN
  -- Delete from all child tables first
  DELETE FROM votes WHERE user_id IN (SELECT id FROM profiles WHERE user_id != admin_uid);
  DELETE FROM replies WHERE author_id IN (SELECT id FROM profiles WHERE user_id != admin_uid);
  DELETE FROM threads WHERE author_id IN (SELECT id FROM profiles WHERE user_id != admin_uid);
  DELETE FROM follows WHERE follower_id IN (SELECT id FROM profiles WHERE user_id != admin_uid)
                       OR following_id IN (SELECT id FROM profiles WHERE user_id != admin_uid);
  DELETE FROM saved_items WHERE user_id IN (SELECT id FROM profiles WHERE user_id != admin_uid);
  DELETE FROM messages WHERE sender_id IN (SELECT id FROM profiles WHERE user_id != admin_uid);
  DELETE FROM space_members WHERE user_id IN (SELECT id FROM profiles WHERE user_id != admin_uid);
  DELETE FROM notifications WHERE user_id IN (SELECT id FROM profiles WHERE user_id != admin_uid);
  DELETE FROM tips WHERE from_user_id IN (SELECT id FROM profiles WHERE user_id != admin_uid)
                     OR to_user_id IN (SELECT id FROM profiles WHERE user_id != admin_uid);
  DELETE FROM reports WHERE reporter_id IN (SELECT id FROM profiles WHERE user_id != admin_uid);
  DELETE FROM quiz_results WHERE user_id IN (SELECT id FROM profiles WHERE user_id != admin_uid);
  DELETE FROM marketplace_listings WHERE seller_id IN (SELECT id FROM profiles WHERE user_id != admin_uid);
  DELETE FROM nyumba_kumi_alerts WHERE reporter_id IN (SELECT id FROM profiles WHERE user_id != admin_uid);
  DELETE FROM sessions WHERE student_id IN (SELECT id FROM profiles WHERE user_id != admin_uid)
                         OR professional_id IN (SELECT id FROM profiles WHERE user_id != admin_uid);
  DELETE FROM professionals WHERE user_id IN (SELECT id FROM profiles WHERE user_id != admin_uid);

  -- Delete profiles (not admin)
  DELETE FROM profiles WHERE user_id != admin_uid;

  -- Delete auth users (not admin) - requires service_role key
  -- This must be done via Supabase Dashboard or service_role API
  RAISE NOTICE 'Profiles deleted. Auth users must be deleted via Supabase Dashboard.';
END $$;
*/
