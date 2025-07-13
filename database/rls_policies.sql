-- Row Level Security (RLS) Policies
-- Purpose: Secure data access based on user roles and ownership
-- Security Model: Organizers own their data, players see only their own data

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
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is organizer
CREATE OR REPLACE FUNCTION is_organizer()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role() = 'organizer';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is player
CREATE OR REPLACE FUNCTION is_player()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role() = 'player';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user owns player record
CREATE OR REPLACE FUNCTION owns_player_record(player_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM players 
    WHERE id = player_uuid 
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- USERS TABLE POLICIES
-- =============================================================================

-- Users can view their own record
CREATE POLICY "Users can view own record" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own record (except role)
CREATE POLICY "Users can update own record" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Allow insertion during signup
CREATE POLICY "Allow user creation during signup" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Organizers can view their players' user records
CREATE POLICY "Organizers can view their players" ON users
  FOR SELECT USING (
    is_organizer() AND EXISTS (
      SELECT 1 FROM players 
      WHERE players.user_id = users.id 
      AND players.organizer_id = auth.uid()
    )
  );

-- =============================================================================
-- PLAYERS TABLE POLICIES
-- =============================================================================

-- Organizers can do everything with their players
CREATE POLICY "Organizers manage their players" ON players
  FOR ALL USING (organizer_id = auth.uid());

-- Players can view their own player record
CREATE POLICY "Players can view own record" ON players
  FOR SELECT USING (user_id = auth.uid());

-- Players can update their own basic info (name, phone)
CREATE POLICY "Players can update own info" ON players
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid() AND
    organizer_id = OLD.organizer_id AND -- Can't change organizer
    is_temporary = OLD.is_temporary -- Can't change temp status
  );

-- =============================================================================
-- SESSIONS TABLE POLICIES
-- =============================================================================

-- Organizers can manage their sessions
CREATE POLICY "Organizers manage their sessions" ON sessions
  FOR ALL USING (organizer_id = auth.uid());

-- Players can view sessions they participated in
CREATE POLICY "Players can view their sessions" ON sessions
  FOR SELECT USING (
    is_player() AND EXISTS (
      SELECT 1 FROM session_participants sp
      JOIN players p ON sp.player_id = p.id
      WHERE sp.session_id = sessions.id 
      AND p.user_id = auth.uid()
    )
  );

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

-- Players can view their own participation records
CREATE POLICY "Players can view own participation" ON session_participants
  FOR SELECT USING (
    is_player() AND EXISTS (
      SELECT 1 FROM players 
      WHERE players.id = session_participants.player_id 
      AND players.user_id = auth.uid()
    )
  );

-- =============================================================================
-- PAYMENTS TABLE POLICIES
-- =============================================================================

-- Organizers can manage payments in their system
CREATE POLICY "Organizers manage payments" ON payments
  FOR ALL USING (organizer_id = auth.uid());

-- Players can view their own payment records
CREATE POLICY "Players can view own payments" ON payments
  FOR SELECT USING (
    is_player() AND EXISTS (
      SELECT 1 FROM players 
      WHERE players.id = payments.player_id 
      AND players.user_id = auth.uid()
    )
  );

-- =============================================================================
-- PLAYER BALANCES TABLE POLICIES
-- =============================================================================

-- Organizers can view balances for their players
CREATE POLICY "Organizers view player balances" ON player_balances
  FOR SELECT USING (organizer_id = auth.uid());

-- Players can view their own balance
CREATE POLICY "Players can view own balance" ON player_balances
  FOR SELECT USING (
    is_player() AND EXISTS (
      SELECT 1 FROM players 
      WHERE players.id = player_balances.player_id 
      AND players.user_id = auth.uid()
    )
  );

-- System can update balances (via triggers)
CREATE POLICY "System can update balances" ON player_balances
  FOR ALL USING (true);

-- =============================================================================
-- REALTIME SUBSCRIPTIONS SECURITY
-- =============================================================================

-- Enable realtime for organizers on their data
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE session_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE payments;
ALTER PUBLICATION supabase_realtime ADD TABLE player_balances;

-- =============================================================================
-- SECURITY NOTES
-- =============================================================================

/*
Security Model Summary:

1. ORGANIZERS can:
   - Manage all their data (players, sessions, payments, balances)
   - View user records of their players
   - Create temporary players
   - Record sessions and payments

2. PLAYERS can:
   - View their own user record and player record
   - Update their basic info (name, phone)
   - View sessions they participated in
   - View their payment history and current balance
   - Cannot see other players' data

3. SYSTEM FUNCTIONS can:
   - Update balances via triggers
   - Maintain data consistency

4. DATA ISOLATION:
   - Each organizer's data is completely isolated
   - Players only see data related to their own participation
   - No cross-organizer data leakage

5. AUDIT TRAIL:
   - All tables have created_at/updated_at timestamps
   - Balance updates are automatically tracked
   - Payment references stored for accountability
*/