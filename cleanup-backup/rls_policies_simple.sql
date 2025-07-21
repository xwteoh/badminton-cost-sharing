-- Simple Row Level Security (RLS) Policies
-- Purpose: Secure data access based on user roles and ownership

-- =============================================================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_balances ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- BASIC POLICIES (Start Simple)
-- =============================================================================

-- Users can view their own record
CREATE POLICY "Users can view own record" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own record
CREATE POLICY "Users can update own record" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Allow user creation during signup
CREATE POLICY "Allow user creation during signup" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- =============================================================================
-- PLAYERS TABLE POLICIES
-- =============================================================================

-- Organizers can manage their players
CREATE POLICY "Organizers manage their players" ON players
  FOR ALL USING (organizer_id = auth.uid());

-- =============================================================================
-- SESSIONS TABLE POLICIES
-- =============================================================================

-- Organizers can manage their sessions
CREATE POLICY "Organizers manage their sessions" ON sessions
  FOR ALL USING (organizer_id = auth.uid());

-- =============================================================================
-- SESSION PARTICIPANTS TABLE POLICIES
-- =============================================================================

-- Organizers can manage participants for their sessions
CREATE POLICY "Organizers manage session participants" ON session_participants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sessions 
      WHERE sessions.id = session_participants.session_id 
      AND sessions.organizer_id = auth.uid()
    )
  );

-- =============================================================================
-- PAYMENTS TABLE POLICIES
-- =============================================================================

-- Organizers can manage payments in their system
CREATE POLICY "Organizers manage payments" ON payments
  FOR ALL USING (organizer_id = auth.uid());

-- =============================================================================
-- PLAYER BALANCES TABLE POLICIES
-- =============================================================================

-- Organizers can view balances for their players
CREATE POLICY "Organizers view player balances" ON player_balances
  FOR ALL USING (organizer_id = auth.uid());

-- =============================================================================
-- ENABLE REALTIME (Optional - can be done later)
-- =============================================================================

-- Enable realtime for organizers on their data
ALTER publication supabase_realtime ADD TABLE users;
ALTER publication supabase_realtime ADD TABLE players;
ALTER publication supabase_realtime ADD TABLE sessions;
ALTER publication supabase_realtime ADD TABLE session_participants;
ALTER publication supabase_realtime ADD TABLE payments;
ALTER publication supabase_realtime ADD TABLE player_balances;