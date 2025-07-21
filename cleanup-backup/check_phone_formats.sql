-- Check exact phone number formats in both tables
SELECT 'users table' as source, phone_number, char_length(phone_number) as length
FROM users 
WHERE phone_number LIKE '%85332270%';

SELECT 'players table' as source, name, phone_number, char_length(phone_number) as length  
FROM players 
WHERE phone_number LIKE '%85332270%';

-- Simple approach: Update players table to match users table format (without +65)
-- First backup the current format
ALTER TABLE players ADD COLUMN phone_number_backup text;
UPDATE players SET phone_number_backup = phone_number WHERE phone_number IS NOT NULL;

-- Update players phone numbers to match users format (remove +65 prefix)
UPDATE players 
SET phone_number = regexp_replace(phone_number, '^\+65', '', 'g')
WHERE phone_number LIKE '+65%';

-- Verify the update
SELECT 'after update' as status, name, phone_number, phone_number_backup
FROM players 
WHERE phone_number_backup LIKE '%85332270%';