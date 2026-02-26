-- Add WITH CHECK clause to UPDATE policy for notification_preferences
-- Prevents a user from reassigning their row to another user_id on update
DROP POLICY IF EXISTS "Users can update own notification preferences" ON notification_preferences;

CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
