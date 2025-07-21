-- =============================================================================
-- ORGANIZER SETTINGS TABLE
-- Purpose: Store default rates and preferences for each organizer
-- =============================================================================

CREATE TABLE organizer_settings (
    organizer_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Default court rates (per hour)
    indoor_peak_rate DECIMAL(10,2) DEFAULT 50.00 NOT NULL,
    indoor_offpeak_rate DECIMAL(10,2) DEFAULT 35.00 NOT NULL,
    outdoor_rate DECIMAL(10,2) DEFAULT 15.00 NOT NULL,
    community_rate DECIMAL(10,2) DEFAULT 25.00 NOT NULL,
    
    -- Default shuttlecock rates (per shuttlecock)
    shuttlecock_peak_rate DECIMAL(10,2) DEFAULT 2.50 NOT NULL,
    shuttlecock_offpeak_rate DECIMAL(10,2) DEFAULT 2.00 NOT NULL,
    shuttlecock_outdoor_rate DECIMAL(10,2) DEFAULT 1.50 NOT NULL,
    shuttlecock_community_rate DECIMAL(10,2) DEFAULT 1.80 NOT NULL,
    
    -- Peak hours definition
    peak_start_time TIME DEFAULT '18:00:00' NOT NULL, -- 6 PM
    peak_end_time TIME DEFAULT '22:00:00' NOT NULL,   -- 10 PM
    morning_peak_start_time TIME DEFAULT '07:00:00' NOT NULL, -- 7 AM
    morning_peak_end_time TIME DEFAULT '10:00:00' NOT NULL,   -- 10 AM
    
    -- Default preferences
    default_court_type VARCHAR(20) DEFAULT 'indoor_peak' NOT NULL 
        CHECK (default_court_type IN ('indoor_peak', 'indoor_offpeak', 'outdoor', 'community')),
    
    -- Auto-rate selection preferences
    auto_rate_selection BOOLEAN DEFAULT true NOT NULL,
    auto_shuttlecock_estimation BOOLEAN DEFAULT true NOT NULL,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX idx_organizer_settings_organizer ON organizer_settings(organizer_id);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS
ALTER TABLE organizer_settings ENABLE ROW LEVEL SECURITY;

-- Organizers can only manage their own settings
CREATE POLICY "Organizers can manage their own settings" ON organizer_settings
    FOR ALL
    TO authenticated
    USING (organizer_id = auth.uid());

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_organizer_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizer_settings_updated_at
    BEFORE UPDATE ON organizer_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_organizer_settings_updated_at();

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to get effective rate based on time and court type
CREATE OR REPLACE FUNCTION get_effective_court_rate(
    organizer_id UUID,
    session_time TIME,
    court_type VARCHAR(20) DEFAULT NULL
) RETURNS DECIMAL(10,2) AS $$
DECLARE
    settings RECORD;
    effective_rate DECIMAL(10,2);
    is_peak_time BOOLEAN;
BEGIN
    -- Get organizer settings
    SELECT * INTO settings FROM organizer_settings WHERE organizer_settings.organizer_id = $1;
    
    -- If no settings found, use defaults
    IF settings IS NULL THEN
        CASE court_type
            WHEN 'outdoor' THEN RETURN 15.00;
            WHEN 'community' THEN RETURN 25.00;
            ELSE 
                -- Check if peak time for indoor courts
                IF (session_time >= '07:00:00' AND session_time < '10:00:00') OR 
                   (session_time >= '18:00:00' AND session_time < '22:00:00') THEN
                    RETURN 50.00; -- indoor peak
                ELSE
                    RETURN 35.00; -- indoor off-peak
                END IF;
        END CASE;
    END IF;
    
    -- Determine if it's peak time
    is_peak_time := (session_time >= settings.morning_peak_start_time AND session_time < settings.morning_peak_end_time) OR
                    (session_time >= settings.peak_start_time AND session_time < settings.peak_end_time);
    
    -- Return appropriate rate
    CASE court_type
        WHEN 'outdoor' THEN 
            RETURN settings.outdoor_rate;
        WHEN 'community' THEN 
            RETURN settings.community_rate;
        ELSE
            -- Indoor courts (peak/off-peak)
            IF is_peak_time THEN
                RETURN settings.indoor_peak_rate;
            ELSE
                RETURN settings.indoor_offpeak_rate;
            END IF;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to get effective shuttlecock rate
CREATE OR REPLACE FUNCTION get_effective_shuttlecock_rate(
    organizer_id UUID,
    session_time TIME,
    court_type VARCHAR(20) DEFAULT NULL
) RETURNS DECIMAL(10,2) AS $$
DECLARE
    settings RECORD;
    is_peak_time BOOLEAN;
BEGIN
    -- Get organizer settings
    SELECT * INTO settings FROM organizer_settings WHERE organizer_settings.organizer_id = $1;
    
    -- If no settings found, use defaults
    IF settings IS NULL THEN
        CASE court_type
            WHEN 'outdoor' THEN RETURN 1.50;
            WHEN 'community' THEN RETURN 1.80;
            ELSE 
                -- Check if peak time for indoor courts
                IF (session_time >= '07:00:00' AND session_time < '10:00:00') OR 
                   (session_time >= '18:00:00' AND session_time < '22:00:00') THEN
                    RETURN 2.50; -- peak
                ELSE
                    RETURN 2.00; -- off-peak
                END IF;
        END CASE;
    END IF;
    
    -- Determine if it's peak time
    is_peak_time := (session_time >= settings.morning_peak_start_time AND session_time < settings.morning_peak_end_time) OR
                    (session_time >= settings.peak_start_time AND session_time < settings.peak_end_time);
    
    -- Return appropriate rate
    CASE court_type
        WHEN 'outdoor' THEN 
            RETURN settings.shuttlecock_outdoor_rate;
        WHEN 'community' THEN 
            RETURN settings.shuttlecock_community_rate;
        ELSE
            -- Indoor courts (peak/off-peak)
            IF is_peak_time THEN
                RETURN settings.shuttlecock_peak_rate;
            ELSE
                RETURN settings.shuttlecock_offpeak_rate;
            END IF;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE organizer_settings IS 'Store default rates and preferences for each organizer';
COMMENT ON COLUMN organizer_settings.auto_rate_selection IS 'Whether to automatically select rates based on time and court type';
COMMENT ON COLUMN organizer_settings.auto_shuttlecock_estimation IS 'Whether to automatically estimate shuttlecock usage based on hours played';
COMMENT ON FUNCTION get_effective_court_rate IS 'Calculate effective court rate based on time and court type';
COMMENT ON FUNCTION get_effective_shuttlecock_rate IS 'Calculate effective shuttlecock rate based on time and court type';