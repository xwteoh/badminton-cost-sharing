-- Check if the view exists and what data it contains
SELECT * FROM public_phone_check;

-- Check the raw data in players table
SELECT phone_number, name, is_active FROM players WHERE is_active = true;

-- Check the raw data in users table  
SELECT phone_number, role, is_active FROM users WHERE is_active = true;

-- Drop and recreate the view with better logic
DROP VIEW IF EXISTS public_phone_check;

CREATE VIEW public_phone_check AS
SELECT DISTINCT 
  phone_number, 
  'player' as type,
  name as display_name
FROM players 
WHERE is_active = true 
  AND phone_number IS NOT NULL
UNION
SELECT DISTINCT 
  phone_number, 
  'user' as type,
  name as display_name
FROM users
WHERE is_active = true 
  AND phone_number IS NOT NULL;

-- Grant permissions to anonymous and authenticated users
GRANT SELECT ON public_phone_check TO anon;
GRANT SELECT ON public_phone_check TO authenticated;

-- Test the view with specific phone number
SELECT * FROM public_phone_check WHERE phone_number = '+6585332270';
SELECT * FROM public_phone_check WHERE phone_number LIKE '%85332270%';