-- Simple function that tries multiple phone formats to find a match
CREATE OR REPLACE FUNCTION get_player_by_user_phone()
RETURNS TABLE(
  player_id uuid,
  player_name text,
  organizer_id uuid,
  phone_number text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_phone text;
  phone_digits text;
BEGIN
  -- Get the current user's phone number
  SELECT u.phone_number INTO user_phone 
  FROM users u 
  WHERE u.id = auth.uid();
  
  IF user_phone IS NULL THEN
    RETURN;
  END IF;
  
  -- Extract just the digits from user phone (remove +, spaces, etc)
  phone_digits := regexp_replace(user_phone, '[^0-9]', '', 'g');
  
  -- Find matching player by comparing just the digits
  RETURN QUERY
  SELECT 
    p.id as player_id,
    p.name as player_name,
    p.organizer_id,
    p.phone_number
  FROM players p
  WHERE p.is_active = true
    AND regexp_replace(COALESCE(p.phone_number, ''), '[^0-9]', '', 'g') = phone_digits
  LIMIT 1;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_player_by_user_phone() TO authenticated;

-- Test the function directly to see what it returns
SELECT * FROM get_player_by_user_phone();