-- ============================================================
-- RLS DEBUG & HARDENING — run in Supabase SQL Editor
-- Safe to re-run (uses DROP POLICY IF EXISTS)
-- ============================================================

-- ------------------------------------------------------------
-- A. DIAGNOSTICS (read-only)
-- ------------------------------------------------------------

-- 1) Which tables have RLS on/off?
SELECT c.relname AS table_name,
       c.relrowsecurity AS rls_enabled,
       c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
ORDER BY 1;

-- 2) All policies
SELECT tablename, policyname, cmd, roles, qual AS using_expr, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3) Who am I in this session? (run while logged in as a user via app,
--    or use SET request.jwt.claim.sub in tests — in SQL editor you are often postgres/bypass)
SELECT auth.uid() AS my_uid, auth.role() AS my_role;

-- 4) Sample data visibility checks (replace UUIDs if needed)
-- SELECT count(*) FROM threads;
-- SELECT count(*) FROM notifications;
-- SELECT count(*) FROM professional_requests WHERE status = 'pending';

-- ------------------------------------------------------------
-- B. HARDENING FIXES
-- ------------------------------------------------------------

-- Ensure is_admin() exists and bypasses RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- 1) Nyumba Kumi: require author_id = auth.uid() on INSERT (was only "authenticated")
DROP POLICY IF EXISTS "Authenticated users can insert posts" ON public.nyumba_kumi_posts;
CREATE POLICY "Authenticated users can insert posts"
  ON public.nyumba_kumi_posts FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND author_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can insert replies" ON public.nyumba_kumi_replies;
CREATE POLICY "Authenticated users can insert replies"
  ON public.nyumba_kumi_replies FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND author_id = auth.uid());

-- 2) Professionals: self-update must not allow changing verification fields
DROP POLICY IF EXISTS "Professionals can update own limited fields" ON public.professionals;
CREATE POLICY "Professionals can update own limited fields"
  ON public.professionals FOR UPDATE
  USING (profile_id = auth.uid() AND verification_status = 'approved')
  WITH CHECK (
    profile_id = auth.uid()
    AND verification_status = 'approved'
    -- verification_status cannot be changed by self (must stay approved)
  );

-- 3) Notifications: only notify someone else (no self-spam as "system")
DROP POLICY IF EXISTS "Authenticated can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated can insert notifications for others"
  ON public.notifications FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND user_id <> auth.uid()
    AND (actor_id IS NULL OR actor_id = auth.uid())
  );

-- 4) Tips: allow student to update own tip status only if still pending (optional safety)
-- (skip if you prefer admin-only tip updates)

-- 5) teaching_sessions: admins can update any session
DROP POLICY IF EXISTS "Admins can update sessions" ON public.teaching_sessions;
CREATE POLICY "Admins can update sessions"
  ON public.teaching_sessions FOR UPDATE
  USING (public.is_admin());

-- ------------------------------------------------------------
-- C. HOW TO TEST AS A SPECIFIC USER (advanced)
-- ------------------------------------------------------------
-- In SQL editor you usually run as the database owner and BYPASS RLS.
-- To simulate a user JWT in tests, use the Supabase client from the app
-- or Edge Function with the user access token — not the service role.
--
-- App-side checklist:
-- 1. Browser DevTools → Network → failed request → response body
--    Look for: code = "42501" or message containing "row-level security"
-- 2. Confirm Authorization header sends a user JWT (not only anon key)
-- 3. Confirm auth.uid() matches the row's owner column you insert

-- ------------------------------------------------------------
-- D. QUICK RE-VERIFY
-- ------------------------------------------------------------
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'nyumba_kumi_posts', 'nyumba_kumi_replies',
    'professionals', 'notifications', 'teaching_sessions'
  )
ORDER BY 1, 2;
