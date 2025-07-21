-- Enable RLS on users table and allow users to read their own record
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read own record" ON users;

-- Create policy for users table
CREATE POLICY "Users can read own record" ON users
FOR SELECT USING (
  -- Users can read their own record
  id = auth.uid()
  OR
  -- Organizers can read all user records
  EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'organizer')
);

-- Also allow authenticated users to read users table for phone matching
-- This is needed for the database functions that do phone number matching
GRANT SELECT ON users TO authenticated;