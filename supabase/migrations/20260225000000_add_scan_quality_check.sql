-- Add CHECK constraint to scan_quality column for data integrity
ALTER TABLE scan_sessions
  ADD CONSTRAINT scan_quality_valid
  CHECK (scan_quality IN ('good', 'fair', 'poor'));
