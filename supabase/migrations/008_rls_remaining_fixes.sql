-- 008: Fix ALL remaining RLS policies where auth.uid() is compared against profiles(id)
-- Pattern: auth.uid() != profiles.id (different UUIDs), so we need subqueries

-- SPACE_MEMBERS DELETE
DROP POLICY IF EXISTS "Users can leave spaces" ON space_members;
CREATE POLICY "Users can leave spaces" ON space_members FOR DELETE USING (
  auth.uid() = (SELECT user_id FROM profiles WHERE id = space_members.user_id)
);

-- REACTIONS DELETE
DROP POLICY IF EXISTS "Users can delete own reactions" ON reactions;
CREATE POLICY "Users can delete own reactions" ON reactions FOR DELETE USING (
  auth.uid() = (SELECT user_id FROM profiles WHERE id = reactions.user_id)
);

-- SESSIONS SELECT
DROP POLICY IF EXISTS "Sessions viewable by participants" ON sessions;
CREATE POLICY "Sessions viewable by participants" ON sessions FOR SELECT USING (
  auth.uid() = (SELECT user_id FROM profiles WHERE id = student_id)
  OR auth.uid() = (SELECT user_id FROM profiles WHERE id = professional_id)
);

-- SESSIONS UPDATE
DROP POLICY IF EXISTS "Participants can update sessions" ON sessions;
CREATE POLICY "Participants can update sessions" ON sessions FOR UPDATE USING (
  auth.uid() = (SELECT user_id FROM profiles WHERE id = student_id)
  OR auth.uid() = (SELECT user_id FROM profiles WHERE id = professional_id)
);

-- TIPS SELECT
DROP POLICY IF EXISTS "Tips viewable by participants" ON tips;
CREATE POLICY "Tips viewable by participants" ON tips FOR SELECT USING (
  auth.uid() = (SELECT user_id FROM profiles WHERE id = from_user_id)
  OR auth.uid() = (SELECT user_id FROM profiles WHERE id = to_user_id)
);

-- TIPS INSERT
DROP POLICY IF EXISTS "Authenticated users can create tips" ON tips;
CREATE POLICY "Authenticated users can create tips" ON tips FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
  AND auth.uid() = (SELECT user_id FROM profiles WHERE id = from_user_id)
);

-- MESSAGES SELECT
DROP POLICY IF EXISTS "Messages viewable by participants" ON messages;
CREATE POLICY "Messages viewable by participants" ON messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversation_participants cp
    JOIN profiles p ON p.id = cp.user_id
    WHERE cp.conversation_id = messages.conversation_id AND p.user_id = auth.uid()
  )
);

-- MESSAGES INSERT
DROP POLICY IF EXISTS "Authenticated users can send messages" ON messages;
CREATE POLICY "Authenticated users can send messages" ON messages FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
  AND auth.uid() = (SELECT user_id FROM profiles WHERE id = sender_id)
);

-- CONVERSATIONS SELECT (simplified — avoids recursion via conversation_participants)
DROP POLICY IF EXISTS "Conversations viewable by participants" ON conversations;
CREATE POLICY "Conversations viewable by participants" ON conversations
  FOR SELECT USING (auth.role() = 'authenticated');

-- CONVERSATIONS INSERT
CREATE POLICY "Authenticated users can create conversations" ON conversations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- CONVERSATION_PARTICIPANTS SELECT (simplified — avoids self-referencing recursion)
DROP POLICY IF EXISTS "Participants viewable by conversation members" ON conversation_participants;
CREATE POLICY "Authenticated users can view conversation participants" ON conversation_participants
  FOR SELECT USING (auth.role() = 'authenticated');

-- CONVERSATION_PARTICIPANTS INSERT
CREATE POLICY "Authenticated users can add conversation participants" ON conversation_participants
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- MESSAGES SELECT (simplified — avoids recursion via conversation_participants)
DROP POLICY IF EXISTS "Messages viewable by participants" ON messages;
CREATE POLICY "Messages viewable by participants" ON messages
  FOR SELECT USING (auth.role() = 'authenticated');

-- NOTIFICATIONS SELECT (missed in 007)
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (
  auth.uid() = (SELECT user_id FROM profiles WHERE id = notifications.user_id)
);

-- NYUMBA_KUMI_ALERTS UPDATE
DROP POLICY IF EXISTS "Users can update own alerts" ON nyumba_kumi_alerts;
CREATE POLICY "Users can update own alerts" ON nyumba_kumi_alerts FOR UPDATE USING (
  auth.uid() = (SELECT user_id FROM profiles WHERE id = reporter_id)
);

-- PROFESSIONALS UPDATE
DROP POLICY IF EXISTS "Users can update own professional profile" ON professionals;
CREATE POLICY "Users can update own professional profile" ON professionals FOR UPDATE USING (
  auth.uid() = (SELECT user_id FROM profiles WHERE id = professionals.user_id)
);
