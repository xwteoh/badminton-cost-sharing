-- Fix the infinite recursion issue in RLS policies

-- 1. Fix users table policy (remove circular reference)
DROP POLICY IF EXISTS "Users can read own record" ON users;
CREATE POLICY "Users can read own record" ON users
FOR SELECT USING (
  -- Users can only read their own record
  id = auth.uid()
);

-- 2. Simplify other policies to avoid complex joins that might cause recursion
-- Players table policy - simplified
DROP POLICY IF EXISTS "Players can view own record, organizers view all" ON players;
CREATE POLICY "Players can view own record, organizers view all" ON players
FOR SELECT USING (
  -- Allow if current user's phone matches this player's phone (digits only)
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND regexp_replace(COALESCE(u.phone_number, ''), '[^0-9]', '', 'g') = regexp_replace(COALESCE(players.phone_number, ''), '[^0-9]', '', 'g')
  )
  OR
  -- Allow if user is an organizer (direct role check)
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role = 'organizer'
  )
);

-- 3. For other tables, create simpler policies that don't risk recursion
-- Sessions table policy - simplified  
DROP POLICY IF EXISTS "Sessions access policy" ON sessions;
CREATE POLICY "Sessions access policy" ON sessions
FOR SELECT USING (
  -- Organizers can see all sessions
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role = 'organizer'
  )
  OR
  -- Players can see sessions they participated in (simplified check)
  id IN (
    SELECT DISTINCT sp.session_id 
    FROM session_participants sp
    JOIN players p ON sp.player_id = p.id
    JOIN users u ON regexp_replace(COALESCE(u.phone_number, ''), '[^0-9]', '', 'g') = regexp_replace(COALESCE(p.phone_number, ''), '[^0-9]', '', 'g')
    WHERE u.id = auth.uid()
  )
);

-- 4. Session participants - simplified
DROP POLICY IF EXISTS "Session participants access policy" ON session_participants;
CREATE POLICY "Session participants access policy" ON session_participants
FOR SELECT USING (
  -- Organizers can see all
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role = 'organizer'
  )
  OR
  -- Players can see their own records
  player_id IN (
    SELECT p.id 
    FROM players p
    JOIN users u ON regexp_replace(COALESCE(u.phone_number, ''), '[^0-9]', '', 'g') = regexp_replace(COALESCE(p.phone_number, ''), '[^0-9]', '', 'g')
    WHERE u.id = auth.uid()
  )
);

-- 5. Payments - simplified
DROP POLICY IF EXISTS "Payments access policy" ON payments;
CREATE POLICY "Payments access policy" ON payments
FOR SELECT USING (
  -- Organizers can see all
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role = 'organizer'
  )
  OR
  -- Players can see their own payments
  player_id IN (
    SELECT p.id 
    FROM players p
    JOIN users u ON regexp_replace(COALESCE(u.phone_number, ''), '[^0-9]', '', 'g') = regexp_replace(COALESCE(p.phone_number, ''), '[^0-9]', '', 'g')
    WHERE u.id = auth.uid()
  )
);

-- Test the fix
SELECT 'RLS policies updated successfully' as status;