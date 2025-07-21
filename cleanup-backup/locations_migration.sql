-- Locations Table Migration
-- Add maintainable locations system to badminton app database
-- Execute this script in your Supabase SQL Editor

-- =============================================================================
-- LOCATIONS TABLE
-- =============================================================================

-- Create locations table for organizer-specific location management
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Constraints
  CONSTRAINT locations_name_not_empty CHECK (char_length(trim(name)) > 0),
  CONSTRAINT locations_organizer_name_unique UNIQUE (organizer_id, name)
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Index for organizer lookups (most common query)
CREATE INDEX idx_locations_organizer ON locations(organizer_id);

-- Index for active locations only
CREATE INDEX idx_locations_active ON locations(organizer_id, is_active);

-- Index for name searches
CREATE INDEX idx_locations_name ON locations(organizer_id, name);

-- =============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================================================

-- Add updated_at trigger for locations table
CREATE TRIGGER update_locations_updated_at 
  BEFORE UPDATE ON locations 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable RLS on locations table
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Organizers can manage their own locations
CREATE POLICY "Organizers manage their locations" ON locations
  FOR ALL USING (organizer_id = auth.uid());

-- =============================================================================
-- SEED DATA (DEFAULT SINGAPORE BADMINTON LOCATIONS)
-- =============================================================================

-- Insert default locations for existing organizers
-- Note: This will run for each existing organizer in the system
DO $$
DECLARE
  organizer_record RECORD;
BEGIN
  -- Loop through all existing organizers
  FOR organizer_record IN 
    SELECT id FROM users WHERE role = 'organizer'
  LOOP
    -- Insert default Singapore badminton locations for each organizer
    INSERT INTO locations (organizer_id, name, address, notes) VALUES
    (organizer_record.id, 'Sports Hub Badminton Hall', '1 Stadium Drive, Singapore 397629', 'Premier badminton facility with multiple courts'),
    (organizer_record.id, 'SAFRA Jurong', '900 Jurong West Street 91, Singapore 649570', 'Community center with affordable court rates'),
    (organizer_record.id, 'ActiveSG Bedok', '15 Bedok North Street 1, Singapore 469659', 'Public sports facility with online booking'),
    (organizer_record.id, 'Kallang Squash & Tennis Centre', '52 Stadium Road, Singapore 397724', 'Multi-sport facility near Sports Hub'),
    (organizer_record.id, 'Singapore Sports School', '1 Champions Way, Singapore 737913', 'Elite sports training facility'),
    (organizer_record.id, 'Toa Payoh Sports Hall', '301 Toa Payoh Lorong 6, Singapore 319392', 'Centrally located community sports hall'),
    (organizer_record.id, 'Jurong East Sports Complex', '21 Jurong East Street 31, Singapore 609517', 'Large sports complex in western Singapore'),
    (organizer_record.id, 'Bishan Sports Hall', '2 Bishan Street 14, Singapore 579783', 'Popular venue in central Singapore')
    ON CONFLICT (organizer_id, name) DO NOTHING; -- Skip if location already exists
  END LOOP;
END $$;

-- =============================================================================
-- REALTIME SUBSCRIPTIONS (OPTIONAL)
-- =============================================================================

-- Enable realtime for locations table
ALTER publication supabase_realtime ADD TABLE locations;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Check if locations table was created successfully
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE tablename = 'locations';

-- Count locations by organizer
SELECT 
  u.phone_number,
  u.name as organizer_name,
  COUNT(l.id) as location_count
FROM users u
LEFT JOIN locations l ON u.id = l.organizer_id
WHERE u.role = 'organizer'
GROUP BY u.id, u.phone_number, u.name
ORDER BY location_count DESC;

-- Sample locations query (replace with your user ID)
-- SELECT * FROM locations WHERE organizer_id = 'your-user-id-here' ORDER BY name;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
-- ✅ Locations table created with RLS policies
-- ✅ Default Singapore badminton locations seeded
-- ✅ Indexes created for performance
-- ✅ Triggers configured for automatic timestamps
-- ✅ Ready for use in badminton cost sharing app