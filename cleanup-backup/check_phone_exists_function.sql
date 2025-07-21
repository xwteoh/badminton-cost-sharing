-- Create function to check if phone number exists for login
-- This bypasses RLS policies for login validation
CREATE OR REPLACE FUNCTION check_phone_exists_for_login(phone_number text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to bypass RLS
AS $$
BEGIN
  -- Check if phone number exists in active players
  RETURN EXISTS (
    SELECT 1 
    FROM players 
    WHERE phone_number = $1 
      AND is_active = true
  );
END;
$$;

-- Grant execute permission to anon users (for login)
GRANT EXECUTE ON FUNCTION check_phone_exists_for_login(text) TO anon;
GRANT EXECUTE ON FUNCTION check_phone_exists_for_login(text) TO authenticated;