-- Alternative approach: Create a view that allows anonymous access for phone checking
CREATE OR REPLACE VIEW public_phone_check AS
SELECT DISTINCT phone_number, 'player' as type
FROM players 
WHERE is_active = true AND phone_number IS NOT NULL
UNION
SELECT DISTINCT phone_number, 'user' as type  
FROM users
WHERE is_active = true AND phone_number IS NOT NULL;

-- Allow anonymous users to read from this view for login validation
GRANT SELECT ON public_phone_check TO anon;
GRANT SELECT ON public_phone_check TO authenticated;