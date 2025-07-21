-- Create a function that can be called by authenticated users to find their player record
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
BEGIN
  -- Get the current user's phone number
  SELECT u.phone_number INTO user_phone 
  FROM users u 
  WHERE u.id = auth.uid();
  
  -- Return player record matching the phone number
  RETURN QUERY
  SELECT 
    p.id as player_id,
    p.name as player_name,
    p.organizer_id,
    p.phone_number
  FROM players p
  WHERE p.phone_number = user_phone
    AND p.is_active = true;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_player_by_user_phone() TO authenticated;