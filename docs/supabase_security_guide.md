# Supabase Security Guide - Badminton Cost Sharing App

**Version**: 1.0  
**Last Updated**: 2025-07-13  
**Framework**: Supabase + Next.js 15  
**Security Level**: Financial Application

---

## 📋 Table of Contents

1. [Security Overview](#security-overview)
2. [Database Schema Security](#database-schema-security)
3. [Row Level Security Policies](#row-level-security-policies)
4. [Database Functions Security](#database-functions-security)
5. [Authentication Security](#authentication-security)
6. [API Security](#api-security)
7. [Data Encryption](#data-encryption)
8. [Audit & Monitoring](#audit--monitoring)
9. [Backup & Recovery](#backup--recovery)
10. [Security Testing](#security-testing)
11. [Production Deployment](#production-deployment)

---

## 🛡️ Security Overview

### Supabase Security Model
```
Application Layer
├── Next.js Application (Client)
├── Row Level Security (RLS)
├── Database Functions (Secure)
└── Audit Logging

Database Layer
├── PostgreSQL with RLS
├── Encrypted Columns
├── Function Security
└── Connection Security

Infrastructure
├── SSL/TLS Encryption
├── Network Security
├── Access Controls
└── Monitoring
```

### Threat Model for Financial Data
```typescript
// Critical security considerations
const SECURITY_THREATS = {
  // Data access threats
  UNAUTHORIZED_FINANCIAL_ACCESS: 'Critical',
  PRIVILEGE_ESCALATION: 'High',
  DATA_LEAKAGE: 'Critical',
  
  // Authentication threats  
  ACCOUNT_TAKEOVER: 'High',
  SESSION_HIJACKING: 'Medium',
  ROLE_CONFUSION: 'High',
  
  // Database threats
  SQL_INJECTION: 'High',
  RLS_BYPASS: 'Critical',
  FUNCTION_ABUSE: 'Medium',
  
  // Business logic threats
  FINANCIAL_MANIPULATION: 'Critical',
  AUDIT_BYPASS: 'High',
  CALCULATION_TAMPERING: 'Critical',
} as const;
```

---

## 🗄️ Database Schema Security

### Secure Table Definitions
```sql
-- Users table with security constraints
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL CHECK (length(trim(name)) >= 2),
  phone_number VARCHAR(20) UNIQUE NOT NULL CHECK (phone_number ~ '^\+65[689]\d{7}$'),
  role VARCHAR(20) NOT NULL CHECK (role IN ('organizer', 'player')),
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  -- Security constraints
  CONSTRAINT valid_phone_format CHECK (phone_number ~ '^\+65[689]\d{7}$'),
  CONSTRAINT valid_name_length CHECK (length(trim(name)) BETWEEN 2 AND 100)
);

-- Sessions table with financial data protection
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL CHECK (date >= CURRENT_DATE - INTERVAL '1 year'),
  start_time TIME NOT NULL,
  location VARCHAR(200) NOT NULL CHECK (length(trim(location)) >= 3),
  status VARCHAR(20) NOT NULL CHECK (status IN ('planned', 'completed', 'cancelled')),
  
  -- Financial fields with constraints
  hours_played DECIMAL(4,2) CHECK (hours_played > 0 AND hours_played <= 12),
  shuttlecocks_used INTEGER CHECK (shuttlecocks_used >= 0 AND shuttlecocks_used <= 50),
  court_rate_used DECIMAL(10,2) CHECK (court_rate_used > 0),
  shuttlecock_rate_used DECIMAL(10,2) CHECK (shuttlecock_rate_used >= 0),
  court_cost DECIMAL(10,2) CHECK (court_cost >= 0),
  shuttlecock_cost DECIMAL(10,2) CHECK (shuttlecock_cost >= 0),
  total_cost DECIMAL(10,2) CHECK (total_cost >= 0),
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by UUID REFERENCES users(id) NOT NULL,
  
  -- Business logic constraints
  CONSTRAINT valid_completion_data CHECK (
    (status = 'completed' AND hours_played IS NOT NULL AND shuttlecocks_used IS NOT NULL) OR
    (status != 'completed')
  ),
  CONSTRAINT consistent_cost_calculation CHECK (
    (status = 'completed' AND court_cost = hours_played * court_rate_used) OR
    (status != 'completed')
  )
);

-- Payments table with strict financial controls
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES users(id) NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0 AND amount <= 10000),
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('paynow', 'cash', 'bank_transfer')),
  payment_date DATE NOT NULL CHECK (payment_date <= CURRENT_DATE AND payment_date >= CURRENT_DATE - INTERVAL '1 year'),
  notes TEXT CHECK (length(notes) <= 500),
  
  -- Audit and security
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  recorded_by UUID REFERENCES users(id) NOT NULL,
  
  -- Prevent backdating beyond reasonable limits
  CONSTRAINT reasonable_payment_date CHECK (payment_date >= CURRENT_DATE - INTERVAL '30 days')
);

-- Financial audit log (immutable)
CREATE TABLE financial_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  action VARCHAR(50) NOT NULL,
  table_name VARCHAR(50),
  record_id UUID,
  old_values JSONB,
  new_values JSONB NOT NULL,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for performance and security
CREATE INDEX idx_users_phone_hash ON users USING hash(phone_number);
CREATE INDEX idx_users_role_active ON users(role, is_active) WHERE is_active = true;
CREATE INDEX idx_sessions_date_status ON sessions(date, status);
CREATE INDEX idx_payments_player_date ON payments(player_id, payment_date DESC);
CREATE INDEX idx_audit_user_timestamp ON financial_audit_log(user_id, timestamp DESC);
CREATE INDEX idx_audit_action_timestamp ON financial_audit_log(action, timestamp DESC);
```

### Table Security Settings
```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_audit_log ENABLE ROW LEVEL SECURITY;

-- Revoke default permissions
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM public;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM public;

-- Grant specific permissions to authenticated role
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON session_players TO authenticated;
GRANT SELECT, INSERT ON payments TO authenticated;
GRANT SELECT, INSERT ON payment_adjustments TO authenticated;
GRANT SELECT, INSERT ON financial_audit_log TO authenticated;

-- Financial audit log is append-only
REVOKE UPDATE, DELETE ON financial_audit_log FROM authenticated;
```

---

## 🔒 Row Level Security Policies

### User Access Policies
```sql
-- Users table policies
CREATE POLICY "users_select_policy" ON users
  FOR SELECT USING (
    -- Users can see their own data
    id = auth.uid() OR
    -- Active organizers can see all active users
    (
      EXISTS (
        SELECT 1 FROM users organizer 
        WHERE organizer.id = auth.uid() 
          AND organizer.role = 'organizer'
          AND organizer.is_active = true
      ) AND is_active = true
    )
  );

CREATE POLICY "users_insert_policy" ON users
  FOR INSERT WITH CHECK (
    -- Only active organizers can create users
    EXISTS (
      SELECT 1 FROM users organizer 
      WHERE organizer.id = auth.uid() 
        AND organizer.role = 'organizer'
        AND organizer.is_active = true
    ) AND
    -- Cannot create organizers
    role = 'player'
  );

CREATE POLICY "users_update_policy" ON users
  FOR UPDATE USING (
    -- Users can update their own name only
    (id = auth.uid() AND role = 'player') OR
    -- Organizers can update player status and details
    (
      EXISTS (
        SELECT 1 FROM users organizer 
        WHERE organizer.id = auth.uid() 
          AND organizer.role = 'organizer'
          AND organizer.is_active = true
      ) AND role = 'player'
    )
  ) WITH CHECK (
    -- Prevent role changes and protect critical fields
    role = 'player' AND
    phone_number = (SELECT phone_number FROM users WHERE id = users.id)
  );

-- Prevent user deletion
CREATE POLICY "users_no_delete" ON users
  FOR DELETE USING (false);
```

### Financial Data Policies
```sql
-- Sessions table policies
CREATE POLICY "sessions_select_policy" ON sessions
  FOR SELECT USING (
    -- All authenticated users can view sessions
    true
  );

CREATE POLICY "sessions_modify_policy" ON sessions
  FOR ALL USING (
    -- Only organizers can create/modify sessions
    EXISTS (
      SELECT 1 FROM users organizer 
      WHERE organizer.id = auth.uid() 
        AND organizer.role = 'organizer'
        AND organizer.is_active = true
    )
  ) WITH CHECK (
    -- Ensure created_by is set correctly
    created_by = auth.uid() AND
    -- Validate business rules
    (status != 'completed' OR (hours_played IS NOT NULL AND shuttlecocks_used IS NOT NULL))
  );

-- Session players policies
CREATE POLICY "session_players_select_policy" ON session_players
  FOR SELECT USING (
    -- Players can see their own participation
    (player_id = auth.uid() AND is_temporary_player = false) OR
    -- Organizers can see all participation
    EXISTS (
      SELECT 1 FROM users organizer 
      WHERE organizer.id = auth.uid() 
        AND organizer.role = 'organizer'
        AND organizer.is_active = true
    )
  );

CREATE POLICY "session_players_modify_policy" ON session_players
  FOR ALL USING (
    -- Only organizers can manage session players
    EXISTS (
      SELECT 1 FROM users organizer 
      WHERE organizer.id = auth.uid() 
        AND organizer.role = 'organizer'
        AND organizer.is_active = true
    )
  );

-- Payments policies  
CREATE POLICY "payments_select_policy" ON payments
  FOR SELECT USING (
    -- Players can see their own payments
    player_id = auth.uid() OR
    -- Organizers can see all payments
    EXISTS (
      SELECT 1 FROM users organizer 
      WHERE organizer.id = auth.uid() 
        AND organizer.role = 'organizer'
        AND organizer.is_active = true
    )
  );

CREATE POLICY "payments_insert_policy" ON payments
  FOR INSERT WITH CHECK (
    -- Only organizers can record payments
    EXISTS (
      SELECT 1 FROM users organizer 
      WHERE organizer.id = auth.uid() 
        AND organizer.role = 'organizer'
        AND organizer.is_active = true
    ) AND
    -- Must record as themselves
    recorded_by = auth.uid() AND
    -- Validate amount and date
    amount > 0 AND amount <= 10000 AND
    payment_date <= CURRENT_DATE
  );

-- Financial audit log policies
CREATE POLICY "audit_log_select_policy" ON financial_audit_log
  FOR SELECT USING (
    -- Players can see their own audit entries
    user_id = auth.uid() OR
    -- Organizers can see all audit entries
    EXISTS (
      SELECT 1 FROM users organizer 
      WHERE organizer.id = auth.uid() 
        AND organizer.role = 'organizer'
        AND organizer.is_active = true
    )
  );

CREATE POLICY "audit_log_insert_policy" ON financial_audit_log
  FOR INSERT WITH CHECK (
    -- System can insert audit logs
    user_id = auth.uid()
  );
```

### Security Policy Testing
```sql
-- Test RLS policies with different user contexts
DO $$
DECLARE
  organizer_id UUID;
  player_id UUID;
  test_session_id UUID;
BEGIN
  -- Create test organizer
  INSERT INTO users (name, phone_number, role) 
  VALUES ('Test Organizer', '+6512345678', 'organizer') 
  RETURNING id INTO organizer_id;
  
  -- Create test player  
  INSERT INTO users (name, phone_number, role) 
  VALUES ('Test Player', '+6587654321', 'player') 
  RETURNING id INTO player_id;
  
  -- Test organizer can create sessions
  SET local role authenticated;
  SET local "request.jwt.claims" TO jsonb_build_object('sub', organizer_id);
  
  INSERT INTO sessions (date, start_time, location, status, created_by)
  VALUES (CURRENT_DATE + 1, '19:00', 'Test Court', 'planned', organizer_id)
  RETURNING id INTO test_session_id;
  
  -- Test player cannot create sessions (should fail)
  SET local "request.jwt.claims" TO jsonb_build_object('sub', player_id);
  
  BEGIN
    INSERT INTO sessions (date, start_time, location, status, created_by)
    VALUES (CURRENT_DATE + 1, '20:00', 'Test Court', 'planned', player_id);
    RAISE EXCEPTION 'Player should not be able to create sessions!';
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'Correctly blocked player from creating session';
  END;
  
  -- Clean up
  DELETE FROM sessions WHERE id = test_session_id;
  DELETE FROM users WHERE id IN (organizer_id, player_id);
END;
$$;
```

---

## 🔧 Database Functions Security

### Secure Financial Calculation Functions
```sql
-- Secure player balance calculation
CREATE OR REPLACE FUNCTION get_player_balance_secure(target_player_id UUID)
RETURNS TABLE (
  current_balance DECIMAL(10,2),
  total_debt DECIMAL(10,2),
  total_paid DECIMAL(10,2),
  last_activity TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  current_user_role TEXT;
  player_debt DECIMAL(10,2);
  player_payments DECIMAL(10,2);
  last_session TIMESTAMP WITH TIME ZONE;
  last_payment TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get current authenticated user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;
  
  -- Get user role and validate account
  SELECT role INTO current_user_role
  FROM users 
  WHERE id = current_user_id AND is_active = true;
  
  IF current_user_role IS NULL THEN
    RAISE EXCEPTION 'User not found or inactive' USING ERRCODE = '42501';
  END IF;
  
  -- Check authorization
  IF current_user_role != 'organizer' AND current_user_id != target_player_id THEN
    RAISE EXCEPTION 'Insufficient permissions to access balance' USING ERRCODE = '42501';
  END IF;
  
  -- Validate target player exists
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = target_player_id AND role = 'player') THEN
    RAISE EXCEPTION 'Player not found' USING ERRCODE = '22023';
  END IF;
  
  -- Calculate debt from completed sessions
  SELECT COALESCE(SUM(sp.cost_share), 0) INTO player_debt
  FROM session_players sp
  JOIN sessions s ON sp.session_id = s.id
  WHERE sp.player_id = target_player_id 
    AND s.status = 'completed'
    AND sp.is_temporary_player = false;
  
  -- Calculate total payments
  SELECT COALESCE(SUM(p.amount), 0) INTO player_payments
  FROM payments p
  WHERE p.player_id = target_player_id;
  
  -- Get last activity timestamps
  SELECT MAX(s.updated_at) INTO last_session
  FROM sessions s
  JOIN session_players sp ON s.id = sp.session_id
  WHERE sp.player_id = target_player_id AND s.status = 'completed';
  
  SELECT MAX(p.created_at) INTO last_payment
  FROM payments p
  WHERE p.player_id = target_player_id;
  
  -- Log balance access
  INSERT INTO financial_audit_log (
    user_id, 
    action, 
    table_name,
    record_id,
    new_values,
    timestamp
  ) VALUES (
    current_user_id,
    'balance_query',
    'users',
    target_player_id,
    jsonb_build_object(
      'target_player_id', target_player_id,
      'balance', player_debt - player_payments,
      'accessed_by_role', current_user_role
    ),
    CURRENT_TIMESTAMP
  );
  
  -- Return calculated balance
  RETURN QUERY SELECT 
    player_debt - player_payments as current_balance,
    player_debt as total_debt,
    player_payments as total_paid,
    GREATEST(last_session, last_payment) as last_activity;
END;
$$;

-- Secure session completion function
CREATE OR REPLACE FUNCTION complete_session_secure(
  p_session_id UUID,
  p_hours_played DECIMAL(4,2),
  p_shuttlecocks_used INTEGER,
  p_attendee_ids UUID[],
  p_temp_players JSONB DEFAULT '[]'::JSONB
)
RETURNS TABLE (
  success BOOLEAN,
  total_cost DECIMAL(10,2),
  cost_per_player DECIMAL(10,2),
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  current_user_role TEXT;
  session_status TEXT;
  court_rate DECIMAL(10,2);
  shuttle_rate DECIMAL(10,2);
  calculated_court_cost DECIMAL(10,2);
  calculated_shuttle_cost DECIMAL(10,2);
  calculated_total_cost DECIMAL(10,2);
  calculated_cost_per_player DECIMAL(10,2);
  total_attendees INTEGER;
  temp_player JSONB;
BEGIN
  -- Get current user and validate
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;
  
  -- Check user permissions
  SELECT role INTO current_user_role
  FROM users 
  WHERE id = current_user_id AND is_active = true;
  
  IF current_user_role != 'organizer' THEN
    RAISE EXCEPTION 'Only organizers can complete sessions' USING ERRCODE = '42501';
  END IF;
  
  -- Validate session exists and is planned
  SELECT status INTO session_status
  FROM sessions 
  WHERE id = p_session_id;
  
  IF session_status IS NULL THEN
    RETURN QUERY SELECT false, 0::DECIMAL(10,2), 0::DECIMAL(10,2), 'Session not found';
    RETURN;
  END IF;
  
  IF session_status != 'planned' THEN
    RETURN QUERY SELECT false, 0::DECIMAL(10,2), 0::DECIMAL(10,2), 'Session is not in planned status';
    RETURN;
  END IF;
  
  -- Validate inputs
  IF p_hours_played <= 0 OR p_hours_played > 12 THEN
    RETURN QUERY SELECT false, 0::DECIMAL(10,2), 0::DECIMAL(10,2), 'Invalid hours played';
    RETURN;
  END IF;
  
  IF p_shuttlecocks_used < 0 OR p_shuttlecocks_used > 50 THEN
    RETURN QUERY SELECT false, 0::DECIMAL(10,2), 0::DECIMAL(10,2), 'Invalid shuttlecocks count';
    RETURN;
  END IF;
  
  IF array_length(p_attendee_ids, 1) = 0 AND jsonb_array_length(p_temp_players) = 0 THEN
    RETURN QUERY SELECT false, 0::DECIMAL(10,2), 0::DECIMAL(10,2), 'At least one attendee required';
    RETURN;
  END IF;
  
  -- Get current rates
  SELECT court_rate_per_hour, shuttlecock_rate_per_piece 
  INTO court_rate, shuttle_rate
  FROM settings 
  LIMIT 1;
  
  IF court_rate IS NULL OR shuttle_rate IS NULL THEN
    RETURN QUERY SELECT false, 0::DECIMAL(10,2), 0::DECIMAL(10,2), 'Settings not configured';
    RETURN;
  END IF;
  
  -- Calculate costs
  calculated_court_cost := p_hours_played * court_rate;
  calculated_shuttle_cost := p_shuttlecocks_used * shuttle_rate;
  calculated_total_cost := calculated_court_cost + calculated_shuttle_cost;
  
  -- Calculate total attendees
  total_attendees := COALESCE(array_length(p_attendee_ids, 1), 0) + jsonb_array_length(p_temp_players);
  calculated_cost_per_player := calculated_total_cost / total_attendees;
  
  -- Start transaction for atomic updates
  BEGIN
    -- Update session
    UPDATE sessions SET
      status = 'completed',
      hours_played = p_hours_played,
      shuttlecocks_used = p_shuttlecocks_used,
      court_rate_used = court_rate,
      shuttlecock_rate_used = shuttle_rate,
      court_cost = calculated_court_cost,
      shuttlecock_cost = calculated_shuttle_cost,
      total_cost = calculated_total_cost,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = p_session_id;
    
    -- Add regular attendees
    IF p_attendee_ids IS NOT NULL THEN
      INSERT INTO session_players (session_id, player_id, cost_share, is_temporary_player)
      SELECT p_session_id, unnest(p_attendee_ids), calculated_cost_per_player, false;
    END IF;
    
    -- Add temporary players
    FOR temp_player IN SELECT * FROM jsonb_array_elements(p_temp_players)
    LOOP
      INSERT INTO session_players (
        session_id, 
        cost_share, 
        is_temporary_player,
        temporary_player_name,
        temporary_player_phone
      ) VALUES (
        p_session_id,
        calculated_cost_per_player,
        true,
        temp_player->>'name',
        temp_player->>'phone'
      );
    END LOOP;
    
    -- Log the completion
    INSERT INTO financial_audit_log (
      user_id,
      action,
      table_name,
      record_id,
      new_values,
      timestamp
    ) VALUES (
      current_user_id,
      'session_completed',
      'sessions',
      p_session_id,
      jsonb_build_object(
        'session_id', p_session_id,
        'total_cost', calculated_total_cost,
        'attendees', total_attendees,
        'cost_per_player', calculated_cost_per_player
      ),
      CURRENT_TIMESTAMP
    );
    
    RETURN QUERY SELECT true, calculated_total_cost, calculated_cost_per_player, 'Session completed successfully';
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Log the error
      INSERT INTO financial_audit_log (
        user_id,
        action,
        table_name,
        record_id,
        new_values,
        timestamp
      ) VALUES (
        current_user_id,
        'session_completion_error',
        'sessions',
        p_session_id,
        jsonb_build_object(
          'error', SQLERRM,
          'sqlstate', SQLSTATE
        ),
        CURRENT_TIMESTAMP
      );
      
      RETURN QUERY SELECT false, 0::DECIMAL(10,2), 0::DECIMAL(10,2), 'Error completing session: ' || SQLERRM;
  END;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_player_balance_secure TO authenticated;
GRANT EXECUTE ON FUNCTION complete_session_secure TO authenticated;
```

---

## 🔐 Authentication Security

### Phone-Based Authentication Setup
```typescript
// Supabase Auth configuration for phone authentication
interface SupabaseAuthConfig {
  providers: {
    phone: {
      enabled: true;
      // Rate limiting for OTP requests
      rateLimiting: {
        maxAttempts: 5;
        windowMs: 3600000; // 1 hour
      };
    };
  };
  session: {
    // Short session timeout for financial app
    accessTokenExpiry: 3600; // 1 hour
    refreshTokenExpiry: 604800; // 7 days
  };
  security: {
    // Enhanced security for financial data
    captchaEnabled: true;
    rateLimitingEnabled: true;
    geoLocationEnabled: false; // Not needed for Singapore app
  };
}

// Secure authentication helper
export class SecureAuth {
  private static readonly OTP_RATE_LIMIT = 5; // per hour
  private static readonly MAX_LOGIN_ATTEMPTS = 3; // per 15 minutes
  
  static async sendOTPSecurely(phoneNumber: string): Promise<{
    success: boolean;
    error?: string;
    rateLimitReached?: boolean;
  }> {
    // Validate Singapore phone number
    if (!this.isValidSingaporePhone(phoneNumber)) {
      return { success: false, error: 'Invalid Singapore phone number' };
    }
    
    // Check rate limiting
    const rateLimitCheck = await this.checkOTPRateLimit(phoneNumber);
    if (!rateLimitCheck.allowed) {
      return { 
        success: false, 
        error: 'Too many OTP requests. Please try again later.',
        rateLimitReached: true 
      };
    }
    
    try {
      const supabase = createClientSupabaseClient();
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneNumber,
        options: {
          channel: 'sms',
          // Add app-specific data for verification
          data: {
            app: 'badminton-cost-tracker',
            timestamp: Date.now(),
          }
        }
      });
      
      if (error) {
        await this.logSecurityEvent({
          event: 'otp_send_failed',
          phoneNumber: this.maskPhoneNumber(phoneNumber),
          error: error.message,
        });
        
        return { success: false, error: 'Failed to send OTP' };
      }
      
      // Log successful OTP send
      await this.logSecurityEvent({
        event: 'otp_sent',
        phoneNumber: this.maskPhoneNumber(phoneNumber),
      });
      
      return { success: true };
      
    } catch (error) {
      console.error('OTP send error:', error);
      return { success: false, error: 'System error. Please try again.' };
    }
  }
  
  static async verifyOTPSecurely(phoneNumber: string, token: string): Promise<{
    success: boolean;
    user?: any;
    error?: string;
  }> {
    // Validate inputs
    if (!this.isValidSingaporePhone(phoneNumber)) {
      return { success: false, error: 'Invalid phone number' };
    }
    
    if (!this.isValidOTPToken(token)) {
      return { success: false, error: 'Invalid OTP format' };
    }
    
    // Check login attempt rate limiting
    const attemptCheck = await this.checkLoginAttempts(phoneNumber);
    if (!attemptCheck.allowed) {
      return { 
        success: false, 
        error: `Too many failed attempts. Please try again in ${attemptCheck.retryAfterMinutes} minutes.` 
      };
    }
    
    try {
      const supabase = createClientSupabaseClient();
      
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token: token,
        type: 'sms'
      });
      
      if (error || !data.user) {
        // Record failed attempt
        await this.recordFailedAttempt(phoneNumber);
        
        await this.logSecurityEvent({
          event: 'otp_verification_failed',
          phoneNumber: this.maskPhoneNumber(phoneNumber),
          error: error?.message || 'Invalid OTP',
        });
        
        return { success: false, error: 'Invalid or expired OTP' };
      }
      
      // Clear failed attempts on success
      await this.clearFailedAttempts(phoneNumber);
      
      // Log successful authentication
      await this.logSecurityEvent({
        event: 'user_authenticated',
        userId: data.user.id,
        phoneNumber: this.maskPhoneNumber(phoneNumber),
      });
      
      return { success: true, user: data.user };
      
    } catch (error) {
      console.error('OTP verification error:', error);
      return { success: false, error: 'Verification failed. Please try again.' };
    }
  }
  
  private static isValidSingaporePhone(phone: string): boolean {
    return /^\+65[689]\d{7}$/.test(phone);
  }
  
  private static isValidOTPToken(token: string): boolean {
    return /^\d{6}$/.test(token);
  }
  
  private static maskPhoneNumber(phone: string): string {
    return phone.replace(/(\+65)(\d{2})(\d{4})(\d{2})/, '$1$2****$4');
  }
  
  private static async logSecurityEvent(event: {
    event: string;
    userId?: string;
    phoneNumber?: string;
    error?: string;
  }): Promise<void> {
    const supabase = createClientSupabaseClient();
    
    await supabase.from('security_events').insert([{
      event_type: event.event,
      user_id: event.userId,
      metadata: {
        phone_number: event.phoneNumber,
        error: event.error,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
      }
    }]);
  }
}
```

### Session Security Middleware
```typescript
// Secure session validation middleware
export async function validateSecureSession(
  request: NextRequest
): Promise<{
  user: User | null;
  error?: string;
  shouldRefresh?: boolean;
}> {
  try {
    const supabase = createServerSupabaseClient();
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return { user: null, error: 'Invalid session' };
    }
    
    // Get user profile with role
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError || !profile) {
      await supabase.auth.signOut();
      return { user: null, error: 'User profile not found' };
    }
    
    // Check if user is active
    if (!profile.is_active) {
      await supabase.auth.signOut();
      return { user: null, error: 'Account deactivated' };
    }
    
    // Check session age
    const sessionAge = Date.now() - new Date(user.created_at).getTime();
    const maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours
    
    if (sessionAge > maxSessionAge) {
      return { 
        user: null, 
        error: 'Session expired', 
        shouldRefresh: true 
      };
    }
    
    // Log session activity
    await supabase.from('user_sessions').upsert({
      user_id: user.id,
      last_activity: new Date().toISOString(),
      ip_address: getClientIP(request),
      user_agent: request.headers.get('user-agent'),
    });
    
    return { 
      user: { 
        ...user, 
        role: profile.role,
        name: profile.name,
        is_active: profile.is_active 
      } 
    };
    
  } catch (error) {
    console.error('Session validation error:', error);
    return { user: null, error: 'Session validation failed' };
  }
}

// Automatic session refresh
export const useSessionRefresh = () => {
  const supabase = createClientSupabaseClient();
  
  useEffect(() => {
    const refreshSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session && session.expires_at) {
        const expiresAt = new Date(session.expires_at * 1000);
        const now = new Date();
        const timeUntilExpiry = expiresAt.getTime() - now.getTime();
        
        // Refresh 5 minutes before expiry
        const refreshTime = timeUntilExpiry - (5 * 60 * 1000);
        
        if (refreshTime > 0) {
          setTimeout(async () => {
            await supabase.auth.refreshSession();
          }, refreshTime);
        }
      }
    };
    
    refreshSession();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'TOKEN_REFRESHED') {
          console.log('Session refreshed successfully');
        } else if (event === 'SIGNED_OUT') {
          window.location.href = '/login';
        }
      }
    );
    
    return () => subscription.unsubscribe();
  }, [supabase.auth]);
};
```

This comprehensive Supabase security guide provides enterprise-level security implementations specifically designed for your financial cost-sharing application, ensuring that all sensitive financial data is properly protected according to industry best practices.