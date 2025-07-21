-- Migration: Allow NULL amount_owed for expected participants
-- Purpose: Enable storing expected participants for planned sessions

-- Remove the NOT NULL constraint and check constraint on amount_owed
ALTER TABLE session_participants 
ALTER COLUMN amount_owed DROP NOT NULL;

-- Update the check constraint to allow NULL values
ALTER TABLE session_participants 
DROP CONSTRAINT IF EXISTS session_participants_amount_owed_check;

ALTER TABLE session_participants 
ADD CONSTRAINT session_participants_amount_owed_check 
CHECK (amount_owed IS NULL OR amount_owed >= 0);

-- Add a comment to explain the NULL usage
COMMENT ON COLUMN session_participants.amount_owed IS 
'NULL for expected participants in planned sessions, actual amount for completed sessions';