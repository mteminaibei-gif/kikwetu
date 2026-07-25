-- Migration: Core table RLS policies
-- Run this in your Supabase SQL Editor AFTER the other migrations.
-- Covers profiles, threads, replies, votes, notifications, spaces, reports.
-- Also hardens nyumba_kumi and professionals policies.

-- ============================================================
-- HELPER: is_admin()
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- 1. PROFILES
-- ============================================================
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND (role = (SELECT role FROM public.profiles WHERE id = auth.uid()) OR public.is_admin())
  );

CREATE POLICY "Admins can manage all profiles"
  ON public.profiles FOR ALL
  USING (public.is_admin());

-- ============================================================
-- 2. THREADS
-- ============================================================
ALTER TABLE IF EXISTS public.threads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Threads are viewable by everyone" ON public.threads;
DROP POLICY IF EXISTS "Authenticated users can create threads" ON public.threads;
DROP POLICY IF EXISTS "Authors can update own threads" ON public.threads;
DROP POLICY IF EXISTS "Authors can delete own threads" ON public.threads;
DROP POLICY IF EXISTS "Admins can manage all threads" ON public.threads;

CREATE POLICY "Threads are viewable by everyone"
  ON public.threads FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create threads"
  ON public.threads FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND author_id = auth.uid());

CREATE POLICY "Authors can update own threads"
  ON public.threads FOR UPDATE
  USING (author_id = auth.uid() OR public.is_admin());

CREATE POLICY "Authors can delete own threads"
  ON public.threads FOR DELETE
  USING (author_id = auth.uid() OR public.is_admin());

-- ============================================================
-- 3. REPLIES
-- ============================================================
ALTER TABLE IF EXISTS public.replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Replies are viewable by everyone" ON public.replies;
DROP POLICY IF EXISTS "Authenticated users can create replies" ON public.replies;
DROP POLICY IF EXISTS "Authors can update own replies" ON public.replies;
DROP POLICY IF EXISTS "Authors can delete own replies" ON public.replies;
DROP POLICY IF EXISTS "Admins can manage all replies" ON public.replies;

CREATE POLICY "Replies are viewable by everyone"
  ON public.replies FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create replies"
  ON public.replies FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND author_id = auth.uid());

CREATE POLICY "Authors can update own replies"
  ON public.replies FOR UPDATE
  USING (author_id = auth.uid() OR public.is_admin());

CREATE POLICY "Authors can delete own replies"
  ON public.replies FOR DELETE
  USING (author_id = auth.uid() OR public.is_admin());

-- ============================================================
-- 4. VOTES
-- ============================================================
ALTER TABLE IF EXISTS public.votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Votes are viewable by everyone" ON public.votes;
DROP POLICY IF EXISTS "Users can insert own votes" ON public.votes;
DROP POLICY IF EXISTS "Users can update own votes" ON public.votes;
DROP POLICY IF EXISTS "Users can delete own votes" ON public.votes;

CREATE POLICY "Votes are viewable by everyone"
  ON public.votes FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own votes"
  ON public.votes FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own votes"
  ON public.votes FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own votes"
  ON public.votes FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- 5. NOTIFICATIONS
-- ============================================================
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;

CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (user_id = auth.uid() OR public.is_admin());

-- ============================================================
-- 6. SPACES
-- ============================================================
ALTER TABLE IF EXISTS public.spaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Spaces are viewable by everyone" ON public.spaces;
DROP POLICY IF EXISTS "Admins can manage spaces" ON public.spaces;

CREATE POLICY "Spaces are viewable by everyone"
  ON public.spaces FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage spaces"
  ON public.spaces FOR ALL
  USING (public.is_admin());

-- ============================================================
-- 7. REPORTS
-- ============================================================
ALTER TABLE IF EXISTS public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
DROP POLICY IF EXISTS "Users can read own reports" ON public.reports;
DROP POLICY IF EXISTS "Admins can manage reports" ON public.reports;

CREATE POLICY "Users can create reports"
  ON public.reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Users can read own reports"
  ON public.reports FOR SELECT
  USING (reporter_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins can manage reports"
  ON public.reports FOR ALL
  USING (public.is_admin());

-- ============================================================
-- 8. HARDEN: nyumba_kumi DELETE
-- ============================================================
DROP POLICY IF EXISTS "Authors can delete own posts" ON public.nyumba_kumi_posts;
DROP POLICY IF EXISTS "Admins can delete any post" ON public.nyumba_kumi_posts;
DROP POLICY IF EXISTS "Authors can delete own replies" ON public.nyumba_kumi_replies;
DROP POLICY IF EXISTS "Admins can delete any reply" ON public.nyumba_kumi_replies;

CREATE POLICY "Authors can delete own posts"
  ON public.nyumba_kumi_posts FOR DELETE
  USING (author_id = auth.uid() OR public.is_admin());

CREATE POLICY "Authors can delete own replies"
  ON public.nyumba_kumi_replies FOR DELETE
  USING (author_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Authors can update own replies" ON public.nyumba_kumi_replies;
CREATE POLICY "Authors can update own replies"
  ON public.nyumba_kumi_replies FOR UPDATE
  USING (author_id = auth.uid() OR public.is_admin());

-- ============================================================
-- 9. HARDEN: professionals self-update
-- ============================================================
DROP POLICY IF EXISTS "Professionals can update own limited fields" ON public.professionals;

CREATE POLICY "Professionals can update own limited fields"
  ON public.professionals FOR UPDATE
  USING (profile_id = auth.uid() AND verification_status = 'approved')
  WITH CHECK (profile_id = auth.uid());

-- After running, verify:
--   SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public' ORDER BY 1, 2;
