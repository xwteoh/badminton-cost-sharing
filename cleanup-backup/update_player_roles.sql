-- Update existing users who are actually players to have the correct role
UPDATE users 
SET role = 'player'
WHERE phone_number IN (
  SELECT DISTINCT phone_number 
  FROM players 
  WHERE is_active = true 
    AND phone_number IS NOT NULL
)
AND role = 'organizer';

-- Check the results
SELECT u.id, u.phone_number, u.role, p.name as player_name
FROM users u
LEFT JOIN players p ON u.phone_number = p.phone_number AND p.is_active = true
ORDER BY u.phone_number;