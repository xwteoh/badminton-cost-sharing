-- Badminton Cost Sharing Database Schema
-- Version: 1.0
-- Purpose: Core tables for sessions, players, payments, and balance tracking
-- Financial Precision: Using DECIMAL(10,2) for all monetary values (SGD)

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- CORE TABLES
-- =============================================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL UNIQUE,
  name TEXT,
  role TEXT NOT NULL CHECK (role IN ('organizer', 'player')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Players table (for both regular and temporary players)
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL for temporary players
  name TEXT NOT NULL,
  phone_number TEXT, -- Optional for temporary players
  is_temporary BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Constraints
  CONSTRAINT players_temp_or_user CHECK (
    (is_temporary = true AND user_id IS NULL) OR 
    (is_temporary = false AND user_id IS NOT NULL)
  )
);

-- Sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  session_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location TEXT,
  court_cost DECIMAL(10,2) NOT NULL CHECK (court_cost >= 0),
  shuttlecock_cost DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (shuttlecock_cost >= 0),
  other_costs DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (other_costs >= 0),
  total_cost DECIMAL(10,2) GENERATED ALWAYS AS (court_cost + shuttlecock_cost + other_costs) STORED,
  player_count INTEGER NOT NULL CHECK (player_count >= 0),
  cost_per_player DECIMAL(10,2) GENERATED ALWAYS AS (
    CASE 
      WHEN player_count > 0 THEN (court_cost + shuttlecock_cost + other_costs) / player_count 
      ELSE 0 
    END
  ) STORED,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('planned', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Session participants (many-to-many relationship)
CREATE TABLE session_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  amount_owed DECIMAL(10,2) NOT NULL CHECK (amount_owed >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Constraints
  UNIQUE(session_id, player_id)
);

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'paynow', 'bank_transfer', 'other')),
  payment_date DATE NOT NULL,
  reference_number TEXT, -- For PayNow/bank transfers
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Balance tracking (materialized view for performance)
CREATE TABLE player_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  total_owed DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
  current_balance DECIMAL(10,2) GENERATED ALWAYS AS (total_owed - total_paid) STORED,
  last_session_date DATE,
  last_payment_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Constraints
  UNIQUE(organizer_id, player_id)
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Users indexes
CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_role ON users(role);

-- Players indexes
CREATE INDEX idx_players_organizer ON players(organizer_id);
CREATE INDEX idx_players_user ON players(user_id);
CREATE INDEX idx_players_active ON players(is_active);
CREATE INDEX idx_players_temporary ON players(is_temporary);

-- Sessions indexes
CREATE INDEX idx_sessions_organizer ON sessions(organizer_id);
CREATE INDEX idx_sessions_date ON sessions(session_date);
CREATE INDEX idx_sessions_status ON sessions(status);

-- Session participants indexes
CREATE INDEX idx_participants_session ON session_participants(session_id);
CREATE INDEX idx_participants_player ON session_participants(player_id);

-- Payments indexes
CREATE INDEX idx_payments_organizer ON payments(organizer_id);
CREATE INDEX idx_payments_player ON payments(player_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_payments_method ON payments(payment_method);

-- Balance indexes
CREATE INDEX idx_balances_organizer ON player_balances(organizer_id);
CREATE INDEX idx_balances_player ON player_balances(player_id);
CREATE INDEX idx_balances_current ON player_balances(current_balance);

-- =============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update player balances
CREATE OR REPLACE FUNCTION update_player_balance(p_organizer_id UUID, p_player_id UUID)
RETURNS VOID AS $$
DECLARE
  v_total_owed DECIMAL(10,2);
  v_total_paid DECIMAL(10,2);
  v_last_session_date DATE;
  v_last_payment_date DATE;
BEGIN
  -- Calculate total owed from session participants
  SELECT COALESCE(SUM(sp.amount_owed), 0)
  INTO v_total_owed
  FROM session_participants sp
  JOIN sessions s ON sp.session_id = s.id
  WHERE s.organizer_id = p_organizer_id AND sp.player_id = p_player_id;
  
  -- Calculate total paid
  SELECT COALESCE(SUM(amount), 0)
  INTO v_total_paid
  FROM payments
  WHERE organizer_id = p_organizer_id AND player_id = p_player_id;
  
  -- Get last session date
  SELECT MAX(s.session_date)
  INTO v_last_session_date
  FROM session_participants sp
  JOIN sessions s ON sp.session_id = s.id
  WHERE s.organizer_id = p_organizer_id AND sp.player_id = p_player_id;
  
  -- Get last payment date
  SELECT MAX(payment_date)
  INTO v_last_payment_date
  FROM payments
  WHERE organizer_id = p_organizer_id AND player_id = p_player_id;
  
  -- Upsert balance record
  INSERT INTO player_balances (organizer_id, player_id, total_owed, total_paid, last_session_date, last_payment_date)
  VALUES (p_organizer_id, p_player_id, v_total_owed, v_total_paid, v_last_session_date, v_last_payment_date)
  ON CONFLICT (organizer_id, player_id)
  DO UPDATE SET
    total_owed = v_total_owed,
    total_paid = v_total_paid,
    last_session_date = v_last_session_date,
    last_payment_date = v_last_payment_date,
    updated_at = timezone('utc'::text, now());
END;
$$ LANGUAGE plpgsql;

-- Trigger to update balances when session participants change
CREATE OR REPLACE FUNCTION trigger_update_balance_on_session()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' then
    PERFORM update_player_balance(
      (SELECT organizer_id FROM sessions WHERE id = OLD.session_id),
      OLD.player_id
    );
    RETURN OLD;
  ELSE
    PERFORM update_player_balance(
      (SELECT organizer_id FROM sessions WHERE id = NEW.session_id),
      NEW.player_id
    );
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER session_participants_balance_trigger
  AFTER INSERT OR UPDATE OR DELETE ON session_participants
  FOR EACH ROW EXECUTE FUNCTION trigger_update_balance_on_session();

-- Trigger to update balances when payments change
CREATE OR REPLACE FUNCTION trigger_update_balance_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' then
    PERFORM update_player_balance(OLD.organizer_id, OLD.player_id);
    RETURN OLD;
  ELSE
    PERFORM update_player_balance(NEW.organizer_id, NEW.player_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payments_balance_trigger
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW EXECUTE FUNCTION trigger_update_balance_on_payment();

-- =============================================================================
-- SAMPLE DATA FOR TESTING
-- =============================================================================

-- Note: This will be populated via the application
-- Sample organizer and players will be created through the UI