-- Set all existing users to 'player' role by default
-- Only manually change specific users to 'organizer' when needed
UPDATE users 
SET role = 'player' 
WHERE role = 'organizer';

-- Verify the changes
SELECT id, phone_number, role, name, created_at
FROM users 
ORDER BY created_at DESC;