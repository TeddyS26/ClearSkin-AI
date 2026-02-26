-- Add custom time columns for routine reminders
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS routine_am_hour INTEGER DEFAULT 8,
  ADD COLUMN IF NOT EXISTS routine_am_minute INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS routine_pm_hour INTEGER DEFAULT 21,
  ADD COLUMN IF NOT EXISTS routine_pm_minute INTEGER DEFAULT 0;
