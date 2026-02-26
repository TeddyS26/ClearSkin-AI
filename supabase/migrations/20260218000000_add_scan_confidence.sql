-- Add scan confidence score and quality columns to scan_sessions
ALTER TABLE scan_sessions ADD COLUMN IF NOT EXISTS scan_confidence INT;
ALTER TABLE scan_sessions ADD COLUMN IF NOT EXISTS scan_quality TEXT;
