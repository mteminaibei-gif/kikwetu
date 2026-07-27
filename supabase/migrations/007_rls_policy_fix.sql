-- Fix RLS policies: all tables reference profiles(id) but RLS checked auth.uid() directly
-- The fix: use subquery to look up the auth user via profiles table

-- VOTES
DROP POLICY IF EXISTS "Users can delete own votes" ON votes;
CREATE POLICY "Users can delete own votes" ON votes FOR DELETE USING (
  auth.uid() = (SELECT user_id FROM profiles WHERE id = votes.user_id)
);

DROP POLICY IF EXISTS "Users can update own votes" ON votes;
CREATE POLICY "Users can update own votes" ON votes FOR UPDATE USING (
  auth.uid() = (SELECT user_id FROM profiles WHERE id = votes.user_id)
);

-- SAVED ITEMS
DROP POLICY IF EXISTS "Users can delete own saved items" ON saved_items;
CREATE POLICY "Users can delete own saved items" ON saved_items FOR DELETE USING (
  auth.uid() = (SELECT user_id FROM profiles WHERE id = saved_items.user_id)
);

DROP POLICY IF EXISTS "Users can view own saved items" ON saved_items;
CREATE POLICY "Users can view own saved items" ON saved_items FOR SELECT USING (
  auth.uid() = (SELECT user_id FROM profiles WHERE id = saved_items.user_id)
);

-- FOLLOWS
DROP POLICY IF EXISTS "Users can unfollow" ON follows;
CREATE POLICY "Users can unfollow" ON follows FOR DELETE USING (
  auth.uid() = (SELECT user_id FROM profiles WHERE id = follows.follower_id)
);

-- REPLIES
DROP POLICY IF EXISTS "Users can delete own replies" ON replies;
CREATE POLICY "Users can delete own replies" ON replies FOR DELETE USING (
  auth.uid() = (SELECT user_id FROM profiles WHERE id = replies.author_id)
);

DROP POLICY IF EXISTS "Users can update own replies" ON replies;
CREATE POLICY "Users can update own replies" ON replies FOR UPDATE USING (
  auth.uid() = (SELECT user_id FROM profiles WHERE id = replies.author_id)
);

-- THREADS
DROP POLICY IF EXISTS "Users can update own threads" ON threads;
CREATE POLICY "Users can update own threads" ON threads FOR UPDATE USING (
  auth.uid() = (SELECT user_id FROM profiles WHERE id = threads.author_id)
);

DROP POLICY IF EXISTS "Users can delete own threads" ON threads;
CREATE POLICY "Users can delete own threads" ON threads FOR DELETE USING (
  auth.uid() = (SELECT user_id FROM profiles WHERE id = threads.author_id)
);

-- MARKETPLACE LISTINGS
DROP POLICY IF EXISTS "Sellers can update own listings" ON marketplace_listings;
CREATE POLICY "Sellers can update own listings" ON marketplace_listings FOR UPDATE USING (
  auth.uid() = (SELECT user_id FROM profiles WHERE id = marketplace_listings.seller_id)
);

DROP POLICY IF EXISTS "Sellers can delete own listings" ON marketplace_listings;
CREATE POLICY "Sellers can delete own listings" ON marketplace_listings FOR DELETE USING (
  auth.uid() = (SELECT user_id FROM profiles WHERE id = marketplace_listings.seller_id)
);

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Users can mark own notifications read" ON notifications;
CREATE POLICY "Users can mark own notifications read" ON notifications FOR UPDATE USING (
  auth.uid() = (SELECT user_id FROM profiles WHERE id = notifications.user_id)
);

DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications" ON notifications FOR DELETE USING (
  auth.uid() = (SELECT user_id FROM profiles WHERE id = notifications.user_id)
);
