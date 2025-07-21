import { MigrationData, MigrationSession, migrateBadmintonData } from './dataMigration'

// Example migration data structure
export const exampleMigrationData: MigrationData = {
  // Standalone players (optional)
  players: [
    {
      name: 'Sarah Johnson',
      phone_number: '+6591234574',
      is_active: true,
      is_temporary: false,
      joined_at: '2025-06-01',
      skill_level: 'intermediate',
      notes: 'Regular player, prefers evening sessions'
    },
    {
      name: 'Michael Chen',
      phone_number: '+6591234575',
      is_active: true,
      is_temporary: false,
      joined_at: '2025-06-15',
      skill_level: 'advanced',
      emergency_contact: '+6587654321',
      membership_type: 'premium'
    },
    {
      name: 'Guest Player Alex',
      phone_number: ' ', // Single space for NOT NULL constraint
      is_active: true,
      is_temporary: true, // Temporary/drop-in player
      joined_at: '2025-07-01',
      notes: 'Drop-in player from overseas, played a few sessions'
    },
    {
      name: 'Lisa Wong',
      phone_number: '+6591234576',
      is_active: false,
      is_temporary: false,
      joined_at: '2025-05-01',
      skill_level: 'beginner',
      notes: 'On break, may return later'
    }
  ],
  
  // Sessions with participants and payments
  sessions: [
  {
    // Session 1
    date: '2025-07-15',
    location_name: 'Badminton Hall A',
    court_rate: 25.00,
    shuttle_rate: 8.00,
    total_hours: 2,
    total_shuttles: 3,
    total_cost: 74.00,
    player_count: 4,
    cost_per_player: 18.50,
    session_name: 'Weekly Badminton Session',
    notes: 'Regular Monday evening session',
    is_recurring: true,
    start_time: '19:00:00',
    end_time: '21:00:00',
    
    participants: [
      {
        player_name: 'John Doe',
        phone_number: '+6591234567',
        amount_owed: 18.50,
        is_active: true
      },
      {
        player_name: 'Jane Smith',
        phone_number: '+6591234568',
        amount_owed: 18.50,
        is_active: true
      },
      {
        player_name: 'Bob Wilson',
        phone_number: '+6591234569',
        amount_owed: 18.50,
        is_active: true
      },
      {
        player_name: 'Alice Brown',
        phone_number: '+6591234570',
        amount_owed: 18.50,
        is_active: true
      }
    ],
    
    payments: [
      {
        player_name: 'John Doe',
        phone_number: '+6591234567',
        amount: 18.50,
        payment_date: '2025-07-15',
        payment_method: 'paynow',
        reference_number: 'PN20250715001',
        notes: 'PayNow transfer'
      },
      {
        player_name: 'Jane Smith',
        phone_number: '+6591234568',
        amount: 18.50,
        payment_date: '2025-07-16',
        payment_method: 'cash',
        notes: 'Cash payment next day'
      }
    ]
  },
  
  {
    // Session 2
    date: '2025-07-18',
    location_name: 'Sports Complex Court 2',
    court_rate: 30.00,
    shuttle_rate: 10.00,
    total_hours: 1.5,
    total_shuttles: 2,
    total_cost: 65.00,
    player_count: 5,
    cost_per_player: 13.00,
    session_name: 'Friday Evening Session',
    start_time: '20:00:00',
    end_time: '21:30:00',
    
    participants: [
      {
        player_name: 'John Doe',
        phone_number: '+6591234567',
        amount_owed: 13.00
      },
      {
        player_name: 'Alice Brown',
        phone_number: '+6591234570',
        amount_owed: 13.00
      },
      {
        player_name: 'Charlie Davis',
        phone_number: '+6591234571',
        amount_owed: 13.00
      },
      {
        player_name: 'Diana Lee',
        phone_number: '+6591234572',
        amount_owed: 13.00
      },
      {
        player_name: 'Eve Martinez',
        phone_number: '+6591234573',
        amount_owed: 13.00
      }
    ],
    
    payments: [
      {
        player_name: 'Alice Brown',
        phone_number: '+6591234570',
        amount: 26.00, // Paying for this session + previous debt
        payment_date: '2025-07-18',
        payment_method: 'bank_transfer',
        reference_number: 'BT20250718001',
        notes: 'Bank transfer - paid for 2 sessions'
      },
      {
        player_name: 'John Doe',
        phone_number: '+6591234567',
        amount: -5.00, // Refund or credit adjustment
        payment_date: '2025-07-19',
        payment_method: 'credit_transfer',
        notes: 'Refund for overpayment'
      }
    ]
  }
  ]
}

/**
 * Run the example migration
 */
export async function runExampleMigration(organizerId: string) {
  console.log('🚀 Running example migration...')
  
  const result = await migrateBadmintonData(organizerId, exampleMigrationData)
  
  if (result.success) {
    console.log('✅ Migration successful!', result.stats)
  } else {
    console.error('❌ Migration failed:', result.errors)
  }
  
  return result
}

/**
 * Helper function to convert CSV/Excel data to migration format
 */
export function convertCsvToMigrationData(csvData: any[]): MigrationData {
  // This is a template function - you'll need to adapt it based on your actual CSV structure
  // Example assuming CSV has columns: date, location, court_rate, shuttle_rate, hours, shuttles, player_name, phone, amount_owed
  
  const sessionsMap = new Map<string, MigrationSession>()
  
  csvData.forEach(row => {
    const sessionKey = `${row.date}-${row.location}`
    
    if (!sessionsMap.has(sessionKey)) {
      // Create new session
      sessionsMap.set(sessionKey, {
        date: row.date,
        location_name: row.location,
        court_rate: parseFloat(row.court_rate) || 0,
        shuttle_rate: parseFloat(row.shuttle_rate) || 0,
        total_hours: parseFloat(row.hours) || 0,
        total_shuttles: parseInt(row.shuttles) || 0,
        total_cost: parseFloat(row.total_cost) || 0,
        player_count: 0, // Will be calculated
        cost_per_player: parseFloat(row.cost_per_player) || 0,
        participants: [],
        payments: []
      })
    }
    
    const session = sessionsMap.get(sessionKey)!
    
    // Add participant
    session.participants.push({
      player_name: row.player_name,
      phone_number: row.phone,
      amount_owed: parseFloat(row.amount_owed) || 0
    })
    
    // Update player count
    session.player_count = session.participants.length
    
    // Add payment if payment data exists
    if (row.payment_amount && parseFloat(row.payment_amount) > 0) {
      session.payments = session.payments || []
      session.payments.push({
        player_name: row.player_name,
        phone_number: row.phone,
        amount: parseFloat(row.payment_amount),
        payment_date: row.payment_date || row.date,
        payment_method: row.payment_method || 'other',
        reference_number: row.payment_reference,
        notes: row.payment_notes
      })
    }
  })
  
  return {
    sessions: Array.from(sessionsMap.values())
  }
}

/**
 * Template for manual data entry
 */
export const migrationTemplate: MigrationData = {
  // Optional: Standalone players
  players: [
    {
      name: 'Player Name',
      phone_number: '+6512345678', // Singapore format (optional for temporary players)
      is_active: true,
      is_temporary: false, // false = regular player, true = drop-in/guest player
      joined_at: '2025-07-20', // YYYY-MM-DD (optional)
      skill_level: 'intermediate', // beginner | intermediate | advanced | expert
      notes: 'Any player notes (Optional)',
      email: 'player@example.com', // Optional
      emergency_contact: '+6587654321', // Optional
      membership_type: 'regular', // Optional
      preferred_court_type: 'synthetic' // Optional
    },
    {
      name: 'Drop-in Player',
      phone_number: ' ', // Single space for NOT NULL constraint
      is_active: true,
      is_temporary: true, // Temporary/guest player
      notes: 'Guest player for one-time session'
    }
    // Add more players...
  ],
  
  // Optional: Sessions with participants and payments
  sessions: [{
    // Session details
  date: '2025-07-20', // YYYY-MM-DD
  location_name: 'Your Badminton Location',
  court_rate: 25.00,
  shuttle_rate: 8.00,
  total_hours: 2,
  total_shuttles: 3,
  total_cost: 74.00,
  player_count: 4,
  cost_per_player: 18.50,
  start_time: '19:00:00', // HH:MM:SS format (Optional)
  end_time: '21:00:00', // HH:MM:SS format (Optional)
  session_name: 'Session Name (Optional)',
  notes: 'Any notes about the session (Optional)',
  is_recurring: false,
  
  participants: [
    {
      player_name: 'Player Name',
      phone_number: '+6512345678', // Singapore format
      amount_owed: 18.50,
      is_active: true,
      notes: 'Any participant notes (Optional)'
    }
    // Add more participants...
  ],
  
  payments: [
    {
      player_name: 'Player Name',
      phone_number: '+6512345678',
      amount: 18.50,
      payment_date: '2025-07-20', // YYYY-MM-DD
      payment_method: 'paynow', // 'paynow' | 'cash' | 'bank_transfer' | 'other' | 'credit_transfer' (use credit_transfer for negative amounts)
      reference_number: 'Optional reference',
      notes: 'Optional payment notes'
    },
    {
      player_name: 'Player Name',
      phone_number: '+6512345678',
      amount: -10.00, // Negative amount for refunds/credits
      payment_date: '2025-07-21', // YYYY-MM-DD
      payment_method: 'credit_transfer', // Required for negative amounts
      notes: 'Refund or credit adjustment'
    }
    // Add more payments...
  ]
  }]
}