-- Debug queries to check what's actually in the players table
-- Run these in Supabase SQL Editor to see all players

-- 1. Count all players (bypassing RLS)
SELECT 'Total players in database:' as info, COUNT(*) as count 
FROM players;

-- 2. Count players by organizer
SELECT 'Players per organizer:' as info, organizer_id, COUNT(*) as count 
FROM players 
GROUP BY organizer_id;

-- 3. Show all players with details (bypassing RLS if admin)
SELECT 
  id,
  organizer_id,
  name,
  phone_number,
  is_active,
  is_temporary,
  created_at,
  updated_at
FROM players 
ORDER BY created_at DESC
LIMIT 50;

-- 4. Check current authenticated user
SELECT 'Current auth user:' as info, auth.uid() as user_id;

-- 5. Count players for current authenticated user
SELECT 'Players for current user:' as info, COUNT(*) as count 
FROM players 
WHERE organizer_id = auth.uid();

-- 6. Check if there are any RLS policies on players table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'players';

-- 7. Check what organizer IDs exist in the database
SELECT DISTINCT organizer_id, COUNT(*) as player_count
FROM players 
GROUP BY organizer_id
ORDER BY player_count DESC;