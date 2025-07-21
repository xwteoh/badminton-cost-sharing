-- First, let's see the actual phone number formats in both tables
SELECT 'users' as table_name, phone_number, length(phone_number) as phone_length 
FROM users 
WHERE phone_number IS NOT NULL
UNION ALL
SELECT 'players' as table_name, phone_number, length(phone_number) as phone_length 
FROM players 
WHERE phone_number IS NOT NULL;

-- Create improved function that handles phone format differences
CREATE OR REPLACE FUNCTION get_player_by_user_phone()
RETURNS TABLE(
  player_id uuid,
  player_name text,
  organizer_id uuid,
  phone_number text
)
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to bypass RLS
AS $$
DECLARE
  user_phone text;
  normalized_user_phone text;
BEGIN
  -- Get the current user's phone number
  SELECT u.phone_number INTO user_phone 
  FROM users u 
  WHERE u.id = auth.uid();
  
  -- Normalize the phone number (ensure +65 prefix)
  IF user_phone IS NOT NULL THEN
    -- Remove any existing +65 prefix and spaces, then add +65
    normalized_user_phone := '+65' || regexp_replace(user_phone, '^\+?65\s*', '', 'g');
  END IF;
  
  -- Try to find player record using multiple phone formats
  RETURN QUERY
  SELECT 
    p.id as player_id,
    p.name as player_name,
    p.organizer_id,
    p.phone_number
  FROM players p
  WHERE p.is_active = true
    AND (
      p.phone_number = user_phone OR  -- Exact match
      p.phone_number = normalized_user_phone OR  -- With +65 prefix
      p.phone_number = regexp_replace(user_phone, '^\+?65\s*', '', 'g') OR -- Without prefix
      regexp_replace(p.phone_number, '^\+?65\s*', '', 'g') = regexp_replace(user_phone, '^\+?65\s*', '', 'g') -- Both normalized
    )
  LIMIT 1;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_player_by_user_phone() TO authenticated;

-- Test the function with current user's phone formats
SELECT 
  'Test Results' as info,
  user_phone,
  normalized_phone,
  player_found
FROM (
  SELECT 
    '6585332270' as user_phone,
    '+65' || regexp_replace('6585332270', '^\+?65\s*', '', 'g') as normalized_phone,
    EXISTS(
      SELECT 1 FROM players p 
      WHERE p.phone_number = '+656585332270' OR p.phone_number = '6585332270'
    ) as player_found
) test;