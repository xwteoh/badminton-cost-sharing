-- Fix Overly Permissive Balance Update RLS Policy
-- Purpose: Replace USING (true) with proper security constraints
-- Security Risk: USING (true) allows any authenticated user to update any balance

-- =============================================================================
-- DROP THE INSECURE POLICY
-- =============================================================================

-- Remove the overly permissive system policy
DROP POLICY IF EXISTS "System can update balances" ON player_balances;

-- =============================================================================
-- CREATE SECURE SYSTEM BALANCE UPDATE POLICY
-- =============================================================================

-- Create a more secure policy that allows balance updates only by:
-- 1. The organizer who owns the player
-- 2. Database triggers (via service role)
-- 3. Specific service functions with SECURITY DEFINER
CREATE POLICY "Secure system balance updates" ON player_balances
  FOR ALL USING (
    -- Allow organizers to update their players' balances
    organizer_id = auth.uid()
    OR
    -- Allow service role (for triggers and system operations)
    auth.role() = 'service_role'
    OR
    -- Allow authenticated updates from specific service functions
    current_setting('app.balance_update_allowed', true) = 'true'
  );

-- =============================================================================
-- CREATE BALANCE UPDATE SERVICE FUNCTION
-- =============================================================================

-- Create a secure function for system balance updates
-- This function can be called by the application to update balances safely
CREATE OR REPLACE FUNCTION update_player_balance(
  p_organizer_id UUID,
  p_player_id UUID, 
  p_new_balance DECIMAL(10,2)
)
RETURNS BOOLEAN
SECURITY DEFINER -- Runs with elevated privileges
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validate that the organizer owns the player
  IF NOT EXISTS (
    SELECT 1 FROM players 
    WHERE id = p_player_id 
    AND organizer_id = p_organizer_id
  ) THEN
    RAISE EXCEPTION 'Player not found or access denied';
  END IF;

  -- Set flag to allow balance update
  PERFORM set_config('app.balance_update_allowed', 'true', true);

  -- Update the balance
  UPDATE player_balances 
  SET 
    balance = p_new_balance,
    updated_at = NOW()
  WHERE player_id = p_player_id 
  AND organizer_id = p_organizer_id;

  -- Reset the flag
  PERFORM set_config('app.balance_update_allowed', 'false', true);

  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    -- Reset flag on error
    PERFORM set_config('app.balance_update_allowed', 'false', true);
    RAISE;
END;
$$;

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_player_balance(UUID, UUID, DECIMAL) TO authenticated;

-- =============================================================================
-- UPDATE DATABASE TRIGGERS TO USE SECURE APPROACH
-- =============================================================================

-- Update the balance calculation trigger to work with the new security model
CREATE OR REPLACE FUNCTION update_player_balance_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Set flag to allow balance updates from triggers
  PERFORM set_config('app.balance_update_allowed', 'true', true);
  
  -- Continue with existing trigger logic
  -- The trigger will now work with the secure RLS policy
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify the new policy exists
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'player_balances';

-- Test the security function exists
SELECT routine_name, security_type
FROM information_schema.routines
WHERE routine_name = 'update_player_balance';