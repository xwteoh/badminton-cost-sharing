# Supabase Row Level Security (RLS) Setup

## Database Schema with RLS

### 1. **users** table
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

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Organizers can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'organizer'
    )
  );

CREATE POLICY "Players can view their own profile" ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Organizers can insert/update users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'organizer'
    )
  );
```

### 2. **settings** table
```sql
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  court_rate_per_hour DECIMAL(10,2) NOT NULL DEFAULT 25.00,
  shuttlecock_rate_per_piece DECIMAL(10,2) NOT NULL DEFAULT 3.00,
  organizer_paynow_details TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES users(id)
);

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Everyone can view settings" ON settings
  FOR SELECT USING (true);

CREATE POLICY "Only organizers can update settings" ON settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'organizer'
    )
  );
```

### 3. **sessions** table
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  location VARCHAR(200) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('planned', 'completed', 'cancelled')),
  
  -- For completed sessions
  hours_played DECIMAL(4,2),
  shuttlecocks_used INTEGER,
  court_rate_used DECIMAL(10,2),
  shuttlecock_rate_used DECIMAL(10,2),
  court_cost DECIMAL(10,2),
  shuttlecock_cost DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  
  -- For cancelled sessions
  cancellation_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id) NOT NULL
);

-- Enable RLS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Everyone can view sessions" ON sessions
  FOR SELECT USING (true);

CREATE POLICY "Only organizers can manage sessions" ON sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'organizer'
    )
  );
```

### 4. **session_players** table
```sql
CREATE TABLE session_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  player_id UUID REFERENCES users(id),
  cost_share DECIMAL(10,2),
  is_temporary_player BOOLEAN DEFAULT false,
  temporary_player_name VARCHAR(100),
  temporary_player_phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(session_id, player_id),
  CHECK (
    (is_temporary_player = false AND player_id IS NOT NULL AND temporary_player_name IS NULL AND temporary_player_phone IS NULL) OR
    (is_temporary_player = true AND temporary_player_name IS NOT NULL AND player_id IS NULL)
  )
);

-- Enable RLS
ALTER TABLE session_players ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Organizers can view all session players" ON session_players
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'organizer'
    )
  );

CREATE POLICY "Players can view their own session participation" ON session_players
  FOR SELECT USING (
    player_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'organizer'
    )
  );

CREATE POLICY "Only organizers can manage session players" ON session_players
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'organizer'
    )
  );
```

### 5. **payments** table
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

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Organizers can view all payments" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'organizer'
    )
  );

CREATE POLICY "Players can view their own payments" ON payments
  FOR SELECT USING (
    player_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'organizer'
    )
  );

CREATE POLICY "Only organizers can record payments" ON payments
  FOR INSERT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'organizer'
    )
  );
```

### 6. **payment_adjustments** table
```sql
CREATE TABLE payment_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_payment_id UUID REFERENCES payments(id),
  adjustment_amount DECIMAL(10,2) NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id) NOT NULL
);

-- Enable RLS
ALTER TABLE payment_adjustments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Organizers can view all adjustments" ON payment_adjustments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'organizer'
    )
  );

CREATE POLICY "Players can view adjustments to their payments" ON payment_adjustments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM payments p 
      WHERE p.id = original_payment_id AND p.player_id = auth.uid()
    ) OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'organizer'
    )
  );

CREATE POLICY "Only organizers can create adjustments" ON payment_adjustments
  FOR INSERT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'organizer'
    )
  );
```

---

## Frontend Usage Examples

### 1. **Authentication Setup**
```javascript
// supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseKey)
```

### 2. **Phone + OTP Authentication**
```javascript
// Send OTP
const sendOTP = async (phoneNumber) => {
  const { error } = await supabase.auth.signInWithOtp({
    phone: phoneNumber,
  })
  if (error) console.error('Error:', error.message)
}

// Verify OTP
const verifyOTP = async (phoneNumber, token) => {
  const { data, error } = await supabase.auth.verifyOtp({
    phone: phoneNumber,
    token: token,
    type: 'sms'
  })
  if (error) console.error('Error:', error.message)
  return data
}
```

### 3. **Organizer Operations**
```javascript
// Create new player
const createPlayer = async (name, phoneNumber) => {
  const { data, error } = await supabase
    .from('users')
    .insert({
      name: name,
      phone_number: phoneNumber,
      role: 'player'
    })
    .select()
  
  return { data, error }
}

// Get all players with balances
const getPlayersWithBalances = async () => {
  // This requires a database view or function for complex balance calculation
  const { data, error } = await supabase
    .rpc('get_players_with_balances') // Custom function
  
  return { data, error }
}

// Complete a session with temporary players
const completeSession = async (sessionId, sessionData) => {
  const { data, error } = await supabase
    .rpc('complete_session', {
      session_id: sessionId,
      hours_played: sessionData.hours,
      shuttlecocks_used: sessionData.shuttlecocks,
      regular_attendee_ids: sessionData.regularAttendees, // UUID array
      temp_players: sessionData.tempPlayers // [{"name": "Guest John", "phone": "+6512345678"}]
    })
  
  return { data, error }
}
```

### 4. **Player Operations**
```javascript
// Get player's upcoming sessions
const getUpcomingSessions = async () => {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('status', 'planned')
    .gte('date', new Date().toISOString().split('T')[0])
    .order('date', { ascending: true })
  
  return { data, error }
}

// Get player's balance
const getMyBalance = async () => {
  const { data, error } = await supabase
    .rpc('get_player_balance', {
      player_id: (await supabase.auth.getUser()).data.user.id
    })
  
  return { data, error }
}

// Get player's session history
const getMySessionHistory = async () => {
  const { data, error } = await supabase
    .from('session_players')
    .select(`
      cost_share,
      created_at,
      sessions (
        date,
        location,
        total_cost,
        status
      )
    `)
    .eq('player_id', (await supabase.auth.getUser()).data.user.id)
    .order('created_at', { ascending: false })
  
  return { data, error }
}
```

---

## Database Functions Needed

Some complex operations need PostgreSQL functions:

### 1. **Calculate Player Balance**
```sql
CREATE OR REPLACE FUNCTION get_player_balance(player_id UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  total_debt DECIMAL(10,2) := 0;
  total_paid DECIMAL(10,2) := 0;
BEGIN
  -- Calculate total debt from sessions
  SELECT COALESCE(SUM(sp.cost_share), 0) INTO total_debt
  FROM session_players sp
  JOIN sessions s ON sp.session_id = s.id
  WHERE sp.player_id = $1 
    AND s.status = 'completed' 
    AND sp.is_temporary_player = false;
  
  -- Calculate total payments (including adjustments)
  SELECT COALESCE(SUM(p.amount), 0) + COALESCE(SUM(pa.adjustment_amount), 0) INTO total_paid
  FROM payments p
  LEFT JOIN payment_adjustments pa ON p.id = pa.original_payment_id
  WHERE p.player_id = $1;
  
  RETURN total_debt - total_paid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2. **Complete Session Function**
```sql
CREATE OR REPLACE FUNCTION complete_session(
  session_id UUID,
  hours_played DECIMAL(4,2),
  shuttlecocks_used INTEGER,
  attendee_ids UUID[]
)
RETURNS JSON AS $$
DECLARE
  court_rate DECIMAL(10,2);
  shuttle_rate DECIMAL(10,2);
  court_cost DECIMAL(10,2);
  shuttle_cost DECIMAL(10,2);
  total_cost DECIMAL(10,2);
  cost_per_player DECIMAL(10,2);
  attendee_id UUID;
BEGIN
  -- Get current rates
  SELECT court_rate_per_hour, shuttlecock_rate_per_piece 
  INTO court_rate, shuttle_rate
  FROM settings LIMIT 1;
  
  -- Calculate costs
  court_cost := hours_played * court_rate;
  shuttle_cost := shuttlecocks_used * shuttle_rate;
  total_cost := court_cost + shuttle_cost;
  cost_per_player := total_cost / array_length(attendee_ids, 1);
  
  -- Update session
  UPDATE sessions SET
    status = 'completed',
    hours_played = $2,
    shuttlecocks_used = $3,
    court_rate_used = court_rate,
    shuttlecock_rate_used = shuttle_rate,
    court_cost = court_cost,
    shuttlecock_cost = shuttle_cost,
    total_cost = total_cost,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = $1;
  
  -- Add attendees
  FOREACH attendee_id IN ARRAY attendee_ids
  LOOP
    INSERT INTO session_players (session_id, player_id, cost_share, is_temporary_player)
    VALUES ($1, attendee_id, cost_per_player, false);
  END LOOP;
  
  RETURN json_build_object(
    'success', true,
    'total_cost', total_cost,
    'cost_per_player', cost_per_player
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Benefits of This Approach

✅ **No API endpoints needed** - Direct database access  
✅ **Real-time updates** - Supabase subscriptions work automatically  
✅ **Secure** - RLS ensures users only see their data  
✅ **Faster development** - Less code to write and maintain  
✅ **Built-in auth** - Phone + OTP handled by Supabase  

This setup gives you all the functionality you need without writing custom API endpoints!