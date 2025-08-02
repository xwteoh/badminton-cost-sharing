-- Migration: Add rate storage columns to sessions table
-- Purpose: Store original rates for accurate data retrieval in Edit Session
-- Date: 2025-08-02

-- Add new columns for rate storage
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS court_rate_per_hour DECIMAL(10,2) CHECK (court_rate_per_hour >= 0),
ADD COLUMN IF NOT EXISTS shuttlecock_rate_each DECIMAL(10,2) CHECK (shuttlecock_rate_each >= 0),
ADD COLUMN IF NOT EXISTS shuttlecocks_used INTEGER CHECK (shuttlecocks_used >= 0),
ADD COLUMN IF NOT EXISTS hours_played DECIMAL(4,2) CHECK (hours_played >= 0);

-- Add comments for documentation
COMMENT ON COLUMN sessions.court_rate_per_hour IS 'Original court rate per hour used in session calculation';
COMMENT ON COLUMN sessions.shuttlecock_rate_each IS 'Original shuttlecock rate per unit used in session calculation';
COMMENT ON COLUMN sessions.shuttlecocks_used IS 'Number of shuttlecocks used in the session';
COMMENT ON COLUMN sessions.hours_played IS 'Duration of the session in hours (may differ from calculated time)';

-- Note: These columns are nullable for backward compatibility with existing sessions
-- New sessions will populate these fields for accurate Edit Session functionality