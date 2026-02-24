-- Add custom day/time columns for scan reminders
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS scan_reminder_day INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS scan_reminder_hour INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS scan_reminder_minute INTEGER DEFAULT 0;
