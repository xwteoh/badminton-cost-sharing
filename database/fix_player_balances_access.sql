-- Check and fix player_balances table access

-- Check if RLS is enabled on player_balances
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'player_balances';

-- Disable RLS on player_balances table for now
ALTER TABLE player_balances DISABLE ROW LEVEL SECURITY;

-- Grant access to authenticated users
GRANT SELECT ON player_balances TO authenticated;

-- Test query to see if we can access Aileen's balance
SELECT 'Aileen Balance Test' as test, pb.*, p.name
FROM player_balances pb
JOIN players p ON pb.player_id = p.id
WHERE p.phone_number LIKE '%85332270%' OR p.name = 'Aileen';

-- Also check what player ID the function is getting
SELECT 'Player ID Check' as test, * 
FROM get_player_by_user_phone();