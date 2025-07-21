-- Database function to safely reset all organizer data
-- This function handles foreign key constraints and triggers properly

CREATE OR REPLACE FUNCTION reset_organizer_data(organizer_uuid UUID)
RETURNS TABLE(
  table_name TEXT,
  records_deleted INTEGER,
  success BOOLEAN,
  error_message TEXT
) AS $$
DECLARE
  session_ids UUID[];
  player_ids UUID[];
  deleted_count INTEGER;
BEGIN
  -- Get all session IDs for this organizer
  SELECT ARRAY(SELECT id FROM sessions WHERE organizer_id = organizer_uuid) INTO session_ids;
  
  -- Get all player IDs for this organizer
  SELECT ARRAY(SELECT id FROM players WHERE organizer_id = organizer_uuid) INTO player_ids;
  
  -- 1. Delete player_balances by player_id (they may not have organizer_id column)
  BEGIN
    IF array_length(player_ids, 1) > 0 THEN
      DELETE FROM player_balances WHERE player_id = ANY(player_ids);
      GET DIAGNOSTICS deleted_count = ROW_COUNT;
      RETURN QUERY SELECT 'player_balances'::TEXT, deleted_count, true, NULL::TEXT;
    ELSE
      RETURN QUERY SELECT 'player_balances'::TEXT, 0, true, 'No players found'::TEXT;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'player_balances'::TEXT, 0, false, SQLERRM;
  END;
  
  -- 2. Delete session_participants by session_id
  BEGIN
    IF array_length(session_ids, 1) > 0 THEN
      DELETE FROM session_participants WHERE session_id = ANY(session_ids);
      GET DIAGNOSTICS deleted_count = ROW_COUNT;
      RETURN QUERY SELECT 'session_participants'::TEXT, deleted_count, true, NULL::TEXT;
    ELSE
      RETURN QUERY SELECT 'session_participants'::TEXT, 0, true, 'No sessions found'::TEXT;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'session_participants'::TEXT, 0, false, SQLERRM;
  END;
  
  -- 3. Delete payments
  BEGIN
    DELETE FROM payments WHERE organizer_id = organizer_uuid;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN QUERY SELECT 'payments'::TEXT, deleted_count, true, NULL::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'payments'::TEXT, 0, false, SQLERRM;
  END;
  
  -- 4. Delete sessions
  BEGIN
    DELETE FROM sessions WHERE organizer_id = organizer_uuid;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN QUERY SELECT 'sessions'::TEXT, deleted_count, true, NULL::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'sessions'::TEXT, 0, false, SQLERRM;
  END;
  
  -- 5. Delete players
  BEGIN
    DELETE FROM players WHERE organizer_id = organizer_uuid;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN QUERY SELECT 'players'::TEXT, deleted_count, true, NULL::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'players'::TEXT, 0, false, SQLERRM;
  END;
  
  -- 6. Delete locations
  BEGIN
    DELETE FROM locations WHERE organizer_id = organizer_uuid;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN QUERY SELECT 'locations'::TEXT, deleted_count, true, NULL::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'locations'::TEXT, 0, false, SQLERRM;
  END;
  
  -- 7. Delete organizer_settings
  BEGIN
    DELETE FROM organizer_settings WHERE organizer_id = organizer_uuid;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN QUERY SELECT 'organizer_settings'::TEXT, deleted_count, true, NULL::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'organizer_settings'::TEXT, 0, false, SQLERRM;
  END;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION reset_organizer_data(UUID) TO authenticated;

-- Add RLS policy to ensure users can only reset their own data
CREATE POLICY "Users can reset their own organizer data" ON sessions
  FOR DELETE USING (auth.uid() = organizer_id);

-- Create a safer version that validates the user and handles RLS
CREATE OR REPLACE FUNCTION safe_reset_organizer_data()
RETURNS TABLE(
  table_name TEXT,
  records_deleted INTEGER,
  success BOOLEAN,
  error_message TEXT
) AS $$
DECLARE
  current_user_id UUID;
  session_count INTEGER;
  player_count INTEGER;
BEGIN
  -- Get the current authenticated user ID
  current_user_id := auth.uid();
  
  -- Ensure user is authenticated
  IF current_user_id IS NULL THEN
    RETURN QUERY SELECT 'error'::TEXT, 0, false, 'User not authenticated'::TEXT;
    RETURN;
  END IF;
  
  -- Debug: Check what data exists for this user
  SELECT COUNT(*) INTO session_count FROM sessions WHERE organizer_id = current_user_id;
  SELECT COUNT(*) INTO player_count FROM players WHERE organizer_id = current_user_id;
  
  RETURN QUERY SELECT 'debug_info'::TEXT, session_count, true, ('User: ' || current_user_id::TEXT || ', Sessions: ' || session_count || ', Players: ' || player_count)::TEXT;
  
  -- Call the main reset function with the authenticated user's ID
  RETURN QUERY SELECT * FROM reset_organizer_data(current_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION safe_reset_organizer_data() TO authenticated;

-- Alternative version that bypasses RLS (use with caution)
CREATE OR REPLACE FUNCTION admin_reset_organizer_data(target_organizer_id UUID)
RETURNS TABLE(
  table_name TEXT,
  records_deleted INTEGER,
  success BOOLEAN,
  error_message TEXT
) AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- This function runs with SECURITY DEFINER to bypass RLS
  
  -- 1. Delete player_balances
  BEGIN
    DELETE FROM player_balances 
    WHERE player_id IN (SELECT id FROM players WHERE organizer_id = target_organizer_id);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN QUERY SELECT 'player_balances'::TEXT, deleted_count, true, NULL::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'player_balances'::TEXT, 0, false, SQLERRM;
  END;
  
  -- 2. Delete session_participants
  BEGIN
    DELETE FROM session_participants 
    WHERE session_id IN (SELECT id FROM sessions WHERE organizer_id = target_organizer_id);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN QUERY SELECT 'session_participants'::TEXT, deleted_count, true, NULL::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'session_participants'::TEXT, 0, false, SQLERRM;
  END;
  
  -- 3. Delete payments
  BEGIN
    DELETE FROM payments WHERE organizer_id = target_organizer_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN QUERY SELECT 'payments'::TEXT, deleted_count, true, NULL::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'payments'::TEXT, 0, false, SQLERRM;
  END;
  
  -- 4. Delete sessions
  BEGIN
    DELETE FROM sessions WHERE organizer_id = target_organizer_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN QUERY SELECT 'sessions'::TEXT, deleted_count, true, NULL::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'sessions'::TEXT, 0, false, SQLERRM;
  END;
  
  -- 5. Delete players
  BEGIN
    DELETE FROM players WHERE organizer_id = target_organizer_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN QUERY SELECT 'players'::TEXT, deleted_count, true, NULL::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'players'::TEXT, 0, false, SQLERRM;
  END;
  
  -- 6. Delete locations
  BEGIN
    DELETE FROM locations WHERE organizer_id = target_organizer_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN QUERY SELECT 'locations'::TEXT, deleted_count, true, NULL::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'locations'::TEXT, 0, false, SQLERRM;
  END;
  
  -- 7. Delete organizer_settings
  BEGIN
    DELETE FROM organizer_settings WHERE organizer_id = target_organizer_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN QUERY SELECT 'organizer_settings'::TEXT, deleted_count, true, NULL::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'organizer_settings'::TEXT, 0, false, SQLERRM;
  END;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION admin_reset_organizer_data(UUID) TO authenticated;