# Badminton Cost Sharing App - API Endpoints

## Authentication Endpoints

### POST /api/auth/send-otp
Send OTP to phone number for login
```json
Request: {
  "phone_number": "+6591234567"
}
Response: {
  "success": true,
  "message": "OTP sent successfully"
}
```

### POST /api/auth/verify-otp
Verify OTP and login user
```json
Request: {
  "phone_number": "+6591234567",
  "otp": "123456"
}
Response: {
  "success": true,
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "phone_number": "+6591234567",
    "role": "player",
    "is_active": true
  },
  "token": "jwt_token"
}
```

---

## User Management Endpoints (Organizer Only)

### GET /api/users
Get all players with their current balances
```json
Response: {
  "users": [
    {
      "id": "uuid",
      "name": "John Doe",
      "phone_number": "+6591234567",
      "is_active": true,
      "current_balance": -15.50, // negative = owes money
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### POST /api/users
Create new player profile
```json
Request: {
  "name": "Jane Smith",
  "phone_number": "+6591234568"
}
Response: {
  "success": true,
  "user": {
    "id": "uuid",
    "name": "Jane Smith",
    "phone_number": "+6591234568",
    "role": "player",
    "is_active": true
  }
}
```

### PUT /api/users/:id
Update player profile or activate/deactivate
```json
Request: {
  "name": "Jane Smith Updated",
  "is_active": false
}
Response: {
  "success": true,
  "user": { /* updated user object */ }
}
```

---

## Settings Endpoints (Organizer Only)

### GET /api/settings
Get current rates and organizer details
```json
Response: {
  "court_rate_per_hour": 25.00,
  "shuttlecock_rate_per_piece": 3.00,
  "organizer_paynow_details": "PayNow to +6591234567 (John Organizer)"
}
```

### PUT /api/settings
Update rates and organizer details
```json
Request: {
  "court_rate_per_hour": 30.00,
  "shuttlecock_rate_per_piece": 3.50,
  "organizer_paynow_details": "PayNow to +6591234567 (John Organizer)"
}
Response: {
  "success": true,
  "settings": { /* updated settings */ }
}
```

---

## Session Management Endpoints

### GET /api/sessions
Get sessions with filters
```json
Query params: ?status=planned&limit=10&offset=0
Response: {
  "sessions": [
    {
      "id": "uuid",
      "date": "2024-07-20",
      "start_time": "19:00",
      "location": "Sports Hub Court 1",
      "status": "planned",
      "created_at": "2024-07-15T10:30:00Z"
    }
  ],
  "total": 25,
  "has_more": true
}
```

### POST /api/sessions
Create new planned session
```json
Request: {
  "date": "2024-07-20",
  "start_time": "19:00",
  "location": "Sports Hub Court 1"
}
Response: {
  "success": true,
  "session": { /* created session object */ }
}
```

### PUT /api/sessions/:id
Update session or convert planned to completed
```json
Request: {
  "status": "completed",
  "hours_played": 2.5,
  "shuttlecocks_used": 4,
  "attendees": [
    { "player_id": "uuid1", "is_temporary": false },
    { "player_id": "uuid2", "is_temporary": false },
    { "temporary_player_name": "Guest John", "exact_payment": 12.50, "is_temporary": true }
  ]
}
Response: {
  "success": true,
  "session": {
    "id": "uuid",
    "status": "completed",
    "hours_played": 2.5,
    "shuttlecocks_used": 4,
    "court_cost": 62.50,
    "shuttlecock_cost": 12.00,
    "total_cost": 74.50,
    "cost_per_player": 37.25,
    "attendees": [ /* attendee details with cost_share */ ]
  }
}
```

### PUT /api/sessions/:id/cancel
Cancel a session
```json
Request: {
  "cancellation_notes": "Heavy rain, court flooded"
}
Response: {
  "success": true,
  "session": { /* updated session with cancelled status */ }
}
```

### GET /api/sessions/:id
Get detailed session information
```json
Response: {
  "session": {
    "id": "uuid",
    "date": "2024-07-20",
    "start_time": "19:00",
    "location": "Sports Hub Court 1",
    "status": "completed",
    "hours_played": 2.5,
    "shuttlecocks_used": 4,
    "court_rate_used": 25.00,
    "shuttlecock_rate_used": 3.00,
    "court_cost": 62.50,
    "shuttlecock_cost": 12.00,
    "total_cost": 74.50,
    "attendees": [
      {
        "player_id": "uuid1",
        "player_name": "John Doe",
        "cost_share": 37.25,
        "is_temporary": false
      },
      {
        "temporary_player_name": "Guest John",
        "exact_payment": 12.50,
        "is_temporary": true
      }
    ]
  }
}
```

---

## Payment Endpoints (Organizer Only)

### POST /api/payments
Record a new payment
```json
Request: {
  "player_id": "uuid",
  "amount": 50.00,
  "payment_method": "paynow",
  "payment_date": "2024-07-15",
  "notes": "PayNow received via WhatsApp"
}
Response: {
  "success": true,
  "payment": { /* payment object */ },
  "updated_balance": -5.50 // player's new balance
}
```

### POST /api/payments/:id/adjust
Make payment adjustment/correction
```json
Request: {
  "adjustment_amount": -10.00, // negative for correction
  "reason": "Duplicate payment entry corrected"
}
Response: {
  "success": true,
  "adjustment": { /* adjustment object */ },
  "updated_balance": 4.50
}
```

### GET /api/payments
Get payment history with filters
```json
Query params: ?player_id=uuid&limit=20&offset=0
Response: {
  "payments": [
    {
      "id": "uuid",
      "player_id": "uuid",
      "player_name": "John Doe",
      "amount": 50.00,
      "payment_method": "paynow",
      "payment_date": "2024-07-15",
      "notes": "PayNow received",
      "adjustments": [
        {
          "adjustment_amount": -10.00,
          "reason": "Duplicate corrected",
          "created_at": "2024-07-16T09:00:00Z"
        }
      ]
    }
  ]
}
```

---

## Player Dashboard Endpoints

### GET /api/player/dashboard
Get player's personal dashboard data
```json
Response: {
  "player": {
    "id": "uuid",
    "name": "John Doe",
    "current_balance": -15.50
  },
  "upcoming_sessions": [
    {
      "id": "uuid",
      "date": "2024-07-20",
      "start_time": "19:00",
      "location": "Sports Hub Court 1"
    }
  ],
  "recent_sessions": [
    {
      "id": "uuid",
      "date": "2024-07-13",
      "location": "Sports Hub Court 1",
      "my_cost": 18.75,
      "total_participants": 4
    }
  ],
  "payment_instructions": "PayNow to +6591234567 (John Organizer)"
}
```

### GET /api/player/sessions
Get player's session attendance history
```json
Query params: ?limit=20&offset=0
Response: {
  "sessions": [
    {
      "id": "uuid",
      "date": "2024-07-13",
      "location": "Sports Hub Court 1",
      "my_cost_share": 18.75,
      "total_cost": 75.00,
      "participants": 4,
      "hours_played": 2.5,
      "shuttlecocks_used": 4
    }
  ]
}
```

### GET /api/player/transactions
Get player's payment and deduction history
```json
Response: {
  "transactions": [
    {
      "type": "payment",
      "date": "2024-07-15",
      "amount": 50.00,
      "payment_method": "paynow",
      "notes": "Top-up payment",
      "adjustments": []
    },
    {
      "type": "session_cost",
      "date": "2024-07-13",
      "amount": -18.75,
      "session_id": "uuid",
      "session_location": "Sports Hub Court 1"
    }
  ]
}
```

---

## Analytics Endpoints (Organizer Only)

### GET /api/analytics/summary
Get overall summary statistics
```json
Response: {
  "total_active_players": 12,
  "total_outstanding_debt": 145.50,
  "total_credit": 25.00,
  "sessions_this_month": 4,
  "revenue_this_month": 298.75,
  "players_with_debt": [
    {
      "player_name": "John Doe",
      "balance": -25.50
    }
  ]
}
```

---

## Error Responses

All endpoints return consistent error format:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Phone number is required",
    "details": {}
  }
}
```

## Authentication

- All endpoints except auth require valid JWT token in Authorization header
- Player endpoints only return data for the authenticated player
- Organizer endpoints require organizer role verification

## Rate Limiting

- Auth endpoints: 5 requests per minute per IP
- Other endpoints: 100 requests per minute per user