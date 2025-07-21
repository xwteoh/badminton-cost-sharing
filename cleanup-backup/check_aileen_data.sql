-- Check what data exists for Aileen in the database

-- 1. Check Aileen's player record
SELECT 'Aileen Player Record' as check_type, * 
FROM players 
WHERE name = 'Aileen' OR phone_number LIKE '%85332270%';

-- 2. Check if Aileen has participated in any sessions
SELECT 'Aileen Session Participation' as check_type, sp.*, s.session_date, s.total_cost, s.cost_per_player
FROM session_participants sp
JOIN sessions s ON sp.session_id = s.id
JOIN players p ON sp.player_id = p.id
WHERE p.name = 'Aileen' OR p.phone_number LIKE '%85332270%';

-- 3. Check if Aileen has made any payments
SELECT 'Aileen Payments' as check_type, pay.*, p.name
FROM payments pay
JOIN players p ON pay.player_id = p.id
WHERE p.name = 'Aileen' OR p.phone_number LIKE '%85332270%';

-- 4. Check if there's a balance record for Aileen
SELECT 'Aileen Balance Record' as check_type, pb.*, p.name
FROM player_balances pb
JOIN players p ON pb.player_id = p.id
WHERE p.name = 'Aileen' OR p.phone_number LIKE '%85332270%';

-- 5. Check the structure of player_balances table
SELECT 'Player Balances Table Info' as check_type, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'player_balances' AND table_schema = 'public';