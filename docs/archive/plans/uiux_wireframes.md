# Badminton App - UI/UX Wireframes

## Design Principles

### Mobile-First Approach
- **Primary use case**: Organizer updating sessions on phone during/after games
- **Quick actions**: Large, touch-friendly buttons for common tasks
- **Minimal scrolling**: Key information visible without scrolling
- **Offline-friendly**: Core functions work with poor connectivity

### User Experience Goals
- **Organizer**: Complete session recording in under 2 minutes
- **Players**: Check balance and upcoming sessions in under 30 seconds
- **Visual clarity**: Clear debt/credit status at a glance
- **Error prevention**: Confirmation dialogs for destructive actions

---

## 1. Authentication Flow

### Login Screen
```
┌─────────────────────────────┐
│  🏸 Badminton Cost Tracker  │
│                             │
│  ┌─────────────────────────┐ │
│  │ Phone Number            │ │
│  │ +65 91234567           │ │
│  └─────────────────────────┘ │
│                             │
│  [ Send OTP Code ]          │
│                             │
│  Simple • Secure • Fast     │
└─────────────────────────────┘
```

### OTP Verification
```
┌─────────────────────────────┐
│  Enter verification code    │
│  sent to +65 91234567      │
│                             │
│  ┌─┬─┬─┬─┬─┬─┐              │
│  │1│2│3│4│5│6│              │
│  └─┴─┴─┴─┴─┴─┘              │
│                             │
│  [ Verify & Login ]         │
│                             │
│  Didn't receive? Resend     │
└─────────────────────────────┘
```

---

## 2. Organizer Dashboard

### Main Dashboard
```
┌─────────────────────────────┐
│ ☰ John's Badminton Group   │
│                         ⚙️ │
├─────────────────────────────┤
│                             │
│ 💰 Quick Overview           │
│ ┌─────────────┬─────────────┐ │
│ │ Outstanding │   Credit    │ │
│ │   $127.50   │   $15.00   │ │
│ │  4 players  │  2 players  │ │
│ └─────────────┴─────────────┘ │
│                             │
│ 🎯 Quick Actions            │
│ ┌─────────────────────────────┐ │
│ │  📝 Record Session         │ │
│ │  💳 Record Payment         │ │
│ │  📅 Create Session         │ │
│ │  👥 Manage Players         │ │
│ └─────────────────────────────┘ │
│                             │
│ 📊 Recent Activity          │
│ • John paid $50 (2h ago)    │
│ • Session completed (4h ago) │
│ • Jane joined group (1d ago) │
│                             │
│ [View All] [Players] [Sessions] │
└─────────────────────────────┘
```

### Players Overview
```
┌─────────────────────────────┐
│ ← Players (12 active)    + │
├─────────────────────────────┤
│                             │
│ 🔴 Need Payment (4)         │
│ ┌─────────────────────────────┐ │
│ │ John Doe        -$25.50 ⚠️ │ │
│ │ Last: Session Jul 13       │ │
│ ├─────────────────────────────┤ │
│ │ Jane Smith      -$18.75    │ │
│ │ Last: Payment Jul 10       │ │
│ └─────────────────────────────┘ │
│                             │
│ 🟠 Temporary Players (2)    │
│ ┌─────────────────────────────┐ │
│ │ Guest John      -$14.90    │ │
│ │ Session: Jul 20            │ │
│ │ Phone: +65 98765432        │ │
│ ├─────────────────────────────┤ │
│ │ Visitor Mike    -$12.50    │ │
│ │ Session: Jul 15            │ │
│ │ [ Convert to Regular ]     │ │
│ └─────────────────────────────┘ │
│                             │
│ 🟢 Paid Up (6)              │
│ ┌─────────────────────────────┐ │
│ │ Mike Chen       +$12.00 ✅ │ │
│ │ Sarah Lee        $0.00  ✅ │ │
│ └─────────────────────────────┘ │
│                             │
│ 🟡 Inactive (2)             │
│ └ [Show/Hide]               │
│                             │
│ [ + Add New Player ]        │
└─────────────────────────────┘
```

---

## 3. Session Management

### Record Session (Primary Use Case)
```
┌─────────────────────────────┐
│ ← Record Session            │
├─────────────────────────────┤
│                             │
│ 📅 Session Details          │
│ Date: Today (Jul 20)        │
│ Location: Sports Hub Court 1│
│                             │
│ ⏰ Usage                    │
│ ┌─────────────┬─────────────┐ │
│ │ Hours       │ Shuttlecocks│ │
│ │ [  2.5  ]   │ [   4   ]  │ │
│ └─────────────┴─────────────┘ │
│                             │
│ 👥 Who Attended? (Select all)│
│ ┌─────────────────────────────┐ │
│ │ ✅ John Doe    ✅ Jane Smith │ │
│ │ ✅ Mike Chen   ❌ Sarah Lee  │ │
│ │ ✅ Alex Wong   ❌ Lisa Tan   │ │
│ └─────────────────────────────┘ │
│                             │
│ + Add Temporary Player      │
│ ┌─────────────────────────────┐ │
│ │ 👤 Guest John (temp)       │ │
│ │ Owes: $14.90               │ │
│ └─────────────────────────────┘ │
│                             │
│ ┌─────────────────────────────┐ │
│ │ Total: $74.50              │ │
│ │ Per Player: $14.90 (5 ppl) │ │
│ │ All players owe: $14.90    │ │
│ │ [ Complete Session ]       │ │
│ └─────────────────────────────┘ │
└─────────────────────────────┘
```

### Add Temporary Player
```
┌─────────────────────────────┐
│ ← Add Temporary Player      │
├─────────────────────────────┤
│                             │
│ 👤 Player Details           │
│ ┌─────────────────────────────┐ │
│ │ Name: Guest John           │ │
│ │ Phone: +65 98765432 (opt)  │ │
│ └─────────────────────────────┘ │
│                             │
│ 💰 Cost Share               │
│ ┌─────────────────────────────┐ │
│ │ Share: $14.90 (same as     │ │
│ │ regular players)           │ │
│ │ ⚠️ Will owe this amount    │ │
│ └─────────────────────────────┘ │
│                             │
│ ℹ️ Temporary players get same  │
│ cost share but aren't added   │
│ to permanent group roster     │
│                             │
│ [ Add Player ] [ Cancel ]   │
│                             │
│ Convert to regular player?  │
│ [ Make Regular Player ]     │
└─────────────────────────────┘
```

### Upcoming Sessions
```
┌─────────────────────────────┐
│ ← Upcoming Sessions      + │
├─────────────────────────────┤
│                             │
│ 📅 This Week                │
│ ┌─────────────────────────────┐ │
│ │ 🏸 Tomorrow, Jul 21, 7PM   │ │
│ │ Sports Hub Court 1         │ │
│ │ [ Convert to Completed ]   │ │
│ ├─────────────────────────────┤ │
│ │ 🏸 Thursday, Jul 24, 7PM   │ │
│ │ Community Center Court A   │ │
│ │ [ Edit ] [ Cancel ]        │ │
│ └─────────────────────────────┘ │
│                             │
│ 📅 Next Week                │
│ ┌─────────────────────────────┐ │
│ │ 🏸 Monday, Jul 28, 7PM     │ │
│ │ Sports Hub Court 1         │ │
│ │ [ Edit ] [ Cancel ]        │ │
│ └─────────────────────────────┘ │
│                             │
│ [ + Create New Session ]    │
└─────────────────────────────┘
```

---

## 4. Payment Management

### Record Payment
```
┌─────────────────────────────┐
│ ← Record Payment            │
├─────────────────────────────┤
│                             │
│ 👤 Player                   │
│ ┌─────────────────────────────┐ │
│ │ John Doe (owes $25.50)     │ │
│ │ ▼ Select Player           │ │
│ └─────────────────────────────┘ │
│                             │
│ 💰 Payment Details          │
│ ┌─────────────┬─────────────┐ │
│ │ Amount      │ Method      │ │
│ │ $ 50.00     │ PayNow ▼   │ │
│ └─────────────┴─────────────┘ │
│                             │
│ 📅 Date: Today (Jul 20)     │
│                             │
│ 📝 Notes (optional)         │
│ ┌─────────────────────────────┐ │
│ │ PayNow received via        │ │
│ │ WhatsApp                   │ │
│ └─────────────────────────────┘ │
│                             │
│ ┌─────────────────────────────┐ │
│ │ New Balance: +$24.50       │ │
│ │ [ Record Payment ]         │ │
│ └─────────────────────────────┘ │
└─────────────────────────────┘
```

### Payment History
```
┌─────────────────────────────┐
│ ← Payment History        🔍 │
├─────────────────────────────┤
│                             │
│ 📊 This Month               │
│ Total Received: $486.50     │
│ 8 transactions              │
│                             │
│ 📝 Recent Payments          │
│ ┌─────────────────────────────┐ │
│ │ 💳 John Doe - $50.00       │ │
│ │ PayNow • 2 hours ago       │ │
│ │ Balance: +$24.50           │ │
│ ├─────────────────────────────┤ │
│ │ 💳 Jane Smith - $75.00     │ │
│ │ Cash • Yesterday           │ │
│ │ Balance: +$12.25 [Adj -$5] │ │
│ ├─────────────────────────────┤ │
│ │ 💳 Mike Chen - $100.00     │ │
│ │ PayNow • 3 days ago        │ │
│ │ Balance: +$45.75           │ │
│ └─────────────────────────────┘ │
│                             │
│ [Load More] [Export]        │
└─────────────────────────────┘
```

---

## 5. Player Dashboard

### Player Home
```
┌─────────────────────────────┐
│ Hi John! 🏸              ⚙️ │
├─────────────────────────────┤
│                             │
│ 💰 Your Balance             │
│ ┌─────────────────────────────┐ │
│ │      You owe               │ │
│ │     $25.50                 │ │
│ │                           │ │
│ │ Last session: Jul 13       │ │
│ │ Last payment: Jul 1        │ │
│ └─────────────────────────────┘ │
│                             │
│ 💳 How to Pay               │
│ ┌─────────────────────────────┐ │
│ │ PayNow to: +65 91234567    │ │
│ │ (John Organizer)           │ │
│ │ [ Copy PayNow Details ]    │ │
│ └─────────────────────────────┘ │
│                             │
│ 📅 Upcoming Games           │
│ ┌─────────────────────────────┐ │
│ │ 🏸 Tomorrow, 7PM           │ │
│ │ Sports Hub Court 1         │ │
│ ├─────────────────────────────┤ │
│ │ 🏸 Thursday, 7PM           │ │
│ │ Community Center Court A   │ │
│ └─────────────────────────────┘ │
│                             │
│ [History] [Sessions] [Payments] │
└─────────────────────────────┘
```

### Player Transaction History
```
┌─────────────────────────────┐
│ ← Transaction History       │
├─────────────────────────────┤
│                             │
│ 📊 Summary                  │
│ Current Balance: -$25.50    │
│ Total Played: $143.25       │
│ Total Paid: $117.75         │
│                             │
│ 📝 Recent Activity          │
│ ┌─────────────────────────────┐ │
│ │ 🏸 Session - Jul 13        │ │
│ │ Sports Hub • -$18.75       │ │
│ │ 4 players, 2.5h, 3 shuttles│ │
│ ├─────────────────────────────┤ │
│ │ 💳 Payment - Jul 1         │ │
│ │ PayNow • +$50.00           │ │
│ ├─────────────────────────────┤ │
│ │ 🏸 Session - Jun 29        │ │
│ │ Community Center • -$15.50  │ │
│ │ 6 players, 2h, 2 shuttles  │ │
│ ├─────────────────────────────┤ │
│ │ 🔧 Adjustment - Jun 28     │ │
│ │ Correction • -$5.00        │ │
│ │ "Duplicate payment fixed"  │ │
│ └─────────────────────────────┘ │
│                             │
│ [Load More] [Filter]        │
└─────────────────────────────┘
```

---

## 6. Settings & Configuration

### Organizer Settings
```
┌─────────────────────────────┐
│ ← Settings                  │
├─────────────────────────────┤
│                             │
│ 💰 Default Rates            │
│ ┌─────────────────────────────┐ │
│ │ Court per hour             │ │
│ │ $ 25.00                    │ │
│ ├─────────────────────────────┤ │
│ │ Shuttlecock per piece      │ │
│ │ $ 3.00                     │ │
│ └─────────────────────────────┘ │
│                             │
│ 💳 Payment Instructions     │
│ ┌─────────────────────────────┐ │
│ │ PayNow to: +65 91234567    │ │
│ │ (John Organizer)           │ │
│ └─────────────────────────────┘ │
│                             │
│ 👤 Account                  │
│ ┌─────────────────────────────┐ │
│ │ Name: John Organizer       │ │
│ │ Phone: +65 91234567        │ │
│ │ Role: Organizer            │ │
│ └─────────────────────────────┘ │
│                             │
│ 🔐 Security                 │
│ [ Change Phone Number ]     │
│ [ Export Data ]             │
│ [ Sign Out ]                │
└─────────────────────────────┘
```

---

## 7. Responsive Design Notes

### Desktop Adaptations
- **Sidebar navigation** instead of bottom tabs
- **Multi-column layouts** for dashboard and player lists
- **Larger forms** with side-by-side fields
- **Data tables** for payment and session history

### Tablet Adaptations  
- **Grid layouts** for player cards and session tiles
- **Side panels** for details while maintaining list view
- **Landscape optimizations** for session recording

---

## 8. Key Interaction Patterns

### Success States
```
✅ Session recorded successfully!
✅ Payment added - John's balance: +$24.50
✅ Player Jane Smith added to group
```

### Loading States
```
🔄 Calculating costs...
🔄 Updating balances...
🔄 Sending OTP...
```

### Error States
```
⚠️ Please select at least one player
❌ Invalid phone number format
⚠️ Session date cannot be in the past
```

### Confirmation Dialogs
```
🗑️ Delete session "Jul 20 - Sports Hub"?
   This cannot be undone.
   [ Cancel ] [ Delete ]

💰 Record $50 payment from John Doe?
   New balance: +$24.50
   [ Cancel ] [ Confirm ]
```

---

## Design System

### Colors
- **Success/Credit**: Green (#10B981)
- **Warning/Debt**: Red (#EF4444) 
- **Neutral**: Gray (#6B7280)
- **Primary**: Blue (#3B82F6)
- **Background**: White/Light Gray

### Typography
- **Headers**: Bold, 18-24px
- **Body**: Regular, 16px
- **Captions**: Regular, 14px
- **Numbers**: Monospace for consistency

### Spacing
- **Touch targets**: Minimum 44px height
- **Margins**: 16px standard, 8px tight
- **Cards**: 12px padding, 8px border radius

This wireframe focuses on the most common user journeys while maintaining simplicity and speed of use!