-- Check current RLS policies on players table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'players';

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Users can only access their own data" ON players;
DROP POLICY IF EXISTS "Only organizers can access players" ON players;

-- Create proper RLS policy: Players can read their own record, organizers can read all
CREATE POLICY "Players can view own record, organizers view all" ON players
FOR SELECT USING (
  -- Allow if user is an organizer (can see all players)
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'organizer'
  )
  OR 
  -- Allow if user is a player viewing their own record (matching phone number)
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.phone_number = players.phone_number
  )
);

-- Enable RLS on players table if not already enabled
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'players';