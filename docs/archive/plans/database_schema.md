# Badminton Cost Sharing App - Database Schema

## Core Tables

### 1. **users**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('organizer', 'player')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 2. **settings**
```sql
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  court_rate_per_hour DECIMAL(10,2) NOT NULL DEFAULT 25.00,
  shuttlecock_rate_per_piece DECIMAL(10,2) NOT NULL DEFAULT 3.00,
  organizer_paynow_details TEXT, -- Payment instructions
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES users(id)
);
```

### 3. **sessions**
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  location VARCHAR(200) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('planned', 'completed', 'cancelled')),
  
  -- For completed sessions
  hours_played DECIMAL(4,2), -- e.g., 2.5 hours
  shuttlecocks_used INTEGER, -- e.g., 4 shuttlecocks
  court_rate_used DECIMAL(10,2), -- Rate at time of session
  shuttlecock_rate_used DECIMAL(10,2), -- Rate at time of session
  court_cost DECIMAL(10,2), -- hours_played * court_rate_used
  shuttlecock_cost DECIMAL(10,2), -- shuttlecocks_used * shuttlecock_rate_used
  total_cost DECIMAL(10,2), -- court_cost + shuttlecock_cost
  
  -- For cancelled sessions
  cancellation_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id) NOT NULL
);
```

### 4. **session_players**
```sql
CREATE TABLE session_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  player_id UUID REFERENCES users(id),
  
  -- For regular players
  cost_share DECIMAL(10,2), -- Calculated share of session cost
  
  -- For temporary players
  is_temporary_player BOOLEAN DEFAULT false,
  temporary_player_name VARCHAR(100), -- Only for temp players
  temporary_player_phone VARCHAR(20), -- Optional contact for temp players
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(session_id, player_id),
  CHECK (
    (is_temporary_player = false AND player_id IS NOT NULL AND temporary_player_name IS NULL AND temporary_player_phone IS NULL) OR
    (is_temporary_player = true AND temporary_player_name IS NOT NULL AND player_id IS NULL)
  )
);
```

### 5. **payments**
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES users(id) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('paynow', 'cash', 'bank_transfer')),
  payment_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  recorded_by UUID REFERENCES users(id) NOT NULL
);
```

## Key Relationships

```
users (1) ←→ (many) sessions [created_by]
users (1) ←→ (many) session_players [player_id]
users (1) ←→ (many) payments [player_id]

sessions (1) ←→ (many) session_players [session_id]

settings (1) → used for cost calculations in sessions
```

## Key Business Logic

### Session Cost Calculation & Updates
```sql
-- When completing/editing a session, costs are calculated and stored
UPDATE sessions 
SET 
  court_rate_used = (SELECT court_rate_per_hour FROM settings LIMIT 1),
  shuttlecock_rate_used = (SELECT shuttlecock_rate_per_piece FROM settings LIMIT 1),
  court_cost = hours_played * court_rate_used,
  shuttlecock_cost = shuttlecocks_used * shuttlecock_rate_used,
  total_cost = court_cost + shuttlecock_cost,
  updated_at = CURRENT_TIMESTAMP
WHERE id = ?;

-- Recalculate cost shares for all attendees
UPDATE session_players 
SET cost_share = (SELECT total_cost FROM sessions WHERE id = session_id) / 
                 (SELECT COUNT(*) FROM session_players WHERE session_id = ? AND is_temporary_player = false)
WHERE session_id = ? AND is_temporary_player = false;
```

### Payment Management
```sql
-- Support for payment corrections/adjustments
CREATE TABLE payment_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_payment_id UUID REFERENCES payments(id),
  adjustment_amount DECIMAL(10,2) NOT NULL, -- Can be negative for corrections
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id) NOT NULL
);
```

### Player Balance Calculation (Updated for Temporary Players)
```sql
-- Current balance for both regular and temporary players
WITH all_player_debts AS (
  -- Regular players debt
  SELECT 
    sp.player_id as id,
    u.name,
    'regular' as player_type,
    COALESCE(SUM(sp.cost_share), 0) as total_debt
  FROM session_players sp
  JOIN sessions s ON sp.session_id = s.id
  JOIN users u ON sp.player_id = u.id
  WHERE s.status = 'completed' 
    AND sp.is_temporary_player = false
  GROUP BY sp.player_id, u.name
  
  UNION ALL
  
  -- Temporary players debt  
  SELECT 
    gen_random_uuid() as id, -- Generate UUID for temp players
    sp.temporary_player_name as name,
    'temporary' as player_type,
    COALESCE(SUM(sp.cost_share), 0) as total_debt
  FROM session_players sp
  JOIN sessions s ON sp.session_id = s.id
  WHERE s.status = 'completed' 
    AND sp.is_temporary_player = true
  GROUP BY sp.temporary_player_name
),
all_payments AS (
  SELECT 
    player_id as id,
    COALESCE(SUM(p.amount), 0) + COALESCE(SUM(pa.adjustment_amount), 0) as total_paid
  FROM payments p
  LEFT JOIN payment_adjustments pa ON p.id = pa.original_payment_id
  GROUP BY p.player_id
)
SELECT 
  apd.id,
  apd.name,
  apd.player_type,
  COALESCE(apd.total_debt, 0) - COALESCE(ap.total_paid, 0) as current_balance
FROM all_player_debts apd
LEFT JOIN all_payments ap ON apd.id = ap.id;
```

## Indexes for Performance

```sql
-- Essential indexes
CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_role_active ON users(role, is_active);
CREATE INDEX idx_sessions_date_status ON sessions(date, status);
CREATE INDEX idx_session_players_session ON session_players(session_id);
CREATE INDEX idx_session_players_player ON session_players(player_id);
CREATE INDEX idx_payments_player_date ON payments(player_id, payment_date);
```

## Data Validation & Constraints

1. **Phone numbers**: Must be unique and valid format
2. **Session status**: Can only be 'planned', 'completed', or 'cancelled'
3. **Completed sessions**: Must have hours_played and shuttlecocks_used
4. **Temporary players**: Must have name and exact_payment, cannot have player_id
5. **Regular players**: Must have player_id, cannot have temp player fields
6. **Payments**: Must be positive amounts with valid payment methods

## Questions for Validation:

1. **Cost calculation**: Should we store the rates used for each session, or always use current rates?
2. **Temporary player conversion**: How do you want to handle converting temp players to regular players?
3. **Session editing**: Can you edit completed sessions, or only planned ones?
4. **Payment editing**: Can you edit/delete payment records?

Does this schema capture all your requirements correctly?