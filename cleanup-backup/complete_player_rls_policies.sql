-- Enable RLS and create policies for all player dashboard tables

-- 1. Players table (already done, but let's ensure it's correct)
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Players can view own record, organizers view all" ON players;
CREATE POLICY "Players can view own record, organizers view all" ON players
FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'organizer')
  OR 
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND regexp_replace(users.phone_number, '[^0-9]', '', 'g') = regexp_replace(players.phone_number, '[^0-9]', '', 'g'))
);

-- 2. Sessions table - players can view sessions they participated in
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Sessions access policy" ON sessions;
CREATE POLICY "Sessions access policy" ON sessions
FOR SELECT USING (
  -- Organizers can see all sessions
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'organizer')
  OR
  -- Players can see sessions they participated in
  EXISTS (
    SELECT 1 FROM session_participants sp
    JOIN players p ON sp.player_id = p.id
    JOIN users u ON regexp_replace(u.phone_number, '[^0-9]', '', 'g') = regexp_replace(p.phone_number, '[^0-9]', '', 'g')
    WHERE sp.session_id = sessions.id AND u.id = auth.uid()
  )
);

-- 3. Session participants table - players can view their own participation records
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Session participants access policy" ON session_participants;
CREATE POLICY "Session participants access policy" ON session_participants
FOR SELECT USING (
  -- Organizers can see all participation records
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'organizer')
  OR
  -- Players can see their own participation records
  EXISTS (
    SELECT 1 FROM players p
    JOIN users u ON regexp_replace(u.phone_number, '[^0-9]', '', 'g') = regexp_replace(p.phone_number, '[^0-9]', '', 'g')
    WHERE p.id = session_participants.player_id AND u.id = auth.uid()
  )
);

-- 4. Payments table - players can view their own payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Payments access policy" ON payments;
CREATE POLICY "Payments access policy" ON payments
FOR SELECT USING (
  -- Organizers can see all payments
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'organizer')
  OR
  -- Players can see their own payments
  EXISTS (
    SELECT 1 FROM players p
    JOIN users u ON regexp_replace(u.phone_number, '[^0-9]', '', 'g') = regexp_replace(p.phone_number, '[^0-9]', '', 'g')
    WHERE p.id = payments.player_id AND u.id = auth.uid()
  )
);

-- 5. Player balances view/table - players can view their own balance
-- Note: Assuming this is a view, we may need to create policies on underlying tables
-- If player_balances is a view, ensure it respects the above policies

-- Test the policies by checking what a specific user can see
-- Replace with actual user ID for testing
-- SELECT 'Test Results' as info;
-- SET ROLE TO authenticated;
-- SELECT current_user;