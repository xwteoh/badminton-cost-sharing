-- Disable RLS temporarily and create minimal policies to avoid recursion

-- 1. Disable RLS on all tables first
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE players DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can read own record" ON users;
DROP POLICY IF EXISTS "Players can view own record, organizers view all" ON players;
DROP POLICY IF EXISTS "Sessions access policy" ON sessions;
DROP POLICY IF EXISTS "Session participants access policy" ON session_participants;
DROP POLICY IF EXISTS "Payments access policy" ON payments;

-- 2. Create very simple policies without complex joins

-- Users table - simple policy
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select_policy" ON users
FOR SELECT USING (true); -- Allow all for now to avoid recursion

-- Players table - simple policy  
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "players_select_policy" ON players
FOR SELECT USING (true); -- Allow all for now

-- Sessions table - simple policy
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;  
CREATE POLICY "sessions_select_policy" ON sessions
FOR SELECT USING (true); -- Allow all for now

-- Session participants - simple policy
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "session_participants_select_policy" ON session_participants  
FOR SELECT USING (true); -- Allow all for now

-- Payments - simple policy
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments_select_policy" ON payments
FOR SELECT USING (true); -- Allow all for now

SELECT 'Minimal RLS policies created - all tables accessible' as status;