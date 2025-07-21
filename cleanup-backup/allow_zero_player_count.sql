-- Allow zero player count for sessions
-- This enables creating sessions without pre-selecting players

-- Step 1: Drop the existing constraint
ALTER TABLE sessions DROP CONSTRAINT sessions_player_count_check;

-- Step 2: Add new constraint that allows 0 or positive values
ALTER TABLE sessions ADD CONSTRAINT sessions_player_count_check CHECK (player_count >= 0);

-- Step 3: Update existing sessions with hardcoded 4 players to 0 (optional)
-- This will reset sessions that were created with the default value
-- UPDATE sessions SET player_count = 0 WHERE player_count = 4 AND status = 'planned';