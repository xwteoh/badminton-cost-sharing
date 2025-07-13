# Badminton Cost Sharing App - Requirements & User Stories

## Project Overview

**Problem**: Managing badminton session costs and player payments using Access DB + Excel is cumbersome and requires PC access.

**Solution**: Web-based cost sharing app accessible from any device for real-time session and payment tracking.

**Business Model**: Running tab system - players can play with debt, settle payments as convenient.

## Core Business Rules

- **Session Planning**: Sessions planned 2 weeks in advance
- **Cost Allocation**: Variable session costs calculated from hours played (court rate) + shuttlecocks used (per shuttle rate), split equally among all attendees (regular and temporary players)
- **Payment Method**: PayNow transfers with WhatsApp notifications
- **Debt Tracking**: Running balance of what each player owes/has credit
- **No Pre-payment Required**: Players can have negative balance, pay when convenient
- **Player Management**: Organizer controls active/inactive status, debt history preserved for deactivated players
- **Session Cancellations**: Organizer can mark sessions as cancelled with notes
- **Payment Confirmation**: Manual confirmation via existing WhatsApp group

## User Roles & Access

### Organizer (Full Management Access)
- Create/edit/delete sessions (planned and completed)
- Record payments and adjust balances
- View all players' debts/credits
- Convert planned sessions to completed
- Add/remove players
- Generate reports

### Players (Limited Read/View Access)
- View upcoming sessions (read-only)
- View their own debt/credit balance
- View their own transaction history
- View their own session attendance history

## Authentication
- **All Users**: Phone number + OTP (consistent for organizer and players)
- **Player Registration**: Organizer creates profiles (name + phone only)
- **Role Assignment**: Automatic based on phone number configuration

---

## User Stories

### Epic 1: Session Debt Tracking
**US1.1**: As an organizer, I want to record session attendance on my phone and automatically add each player's share of the cost to their running debt so that I can update balances immediately after playing.

**US1.2**: As an organizer, I want to add temporary players who share the same cost as regular players but aren't added to the permanent group roster so that drop-ins are tracked for payment without cluttering my regular player list.

**US1.3**: As an organizer, I want to easily convert temporary players to regular players so that if they join the group, I can start tracking their running tab.

**US1.4**: As an organizer, I want to edit completed sessions (attendance, hours, shuttlecocks) and have costs automatically recalculated for all players so that I can fix mistakes without manual recalculation.

### Epic 2: Payment Processing
**US2.1**: As an organizer, I want to quickly record PayNow payments with payment method when I receive WhatsApp notifications so that I can immediately reduce players' outstanding debt and track payment methods.

**US2.2**: As an organizer, I want to handle overpayments as credit toward future sessions so that players who pay extra don't need to pay exact amounts every time.

**US2.3**: As an organizer, I want to make payment corrections or adjustments (positive or negative) with reasons so that I can fix payment recording mistakes while maintaining audit trails.

### Epic 3: Debt Overview & Collection
**US3.1**: As an organizer, I want to see all players' current debt/credit status at a glance so that I know who owes money and how much.

**US3.2**: As a player, I want to view my current balance and recent session history so that I know exactly what I owe.

**US3.3**: As an organizer, I want to send payment notifications to players with outstanding debt so that I can collect efficiently without manual tracking.

### Epic 4: Variable Session Costs (MVP)
**US4.1**: As an organizer, I want to set default rates (court per hour, shuttlecock per piece) so that session costs are calculated automatically from usage data.

**US4.2**: As an organizer, I want to record session usage (hours played, shuttlecocks used) and have costs calculated automatically so that I don't need to do manual calculations.

**US4.3**: As an organizer, I want to adjust default rates when needed (different courts, price changes) so that calculations remain accurate.

**US4.4**: As a player, I want to see only my share of session costs (not the breakdown or total) so that I know what I owe without seeing full session expenses.

**US4.5**: As an organizer, I want to see full cost breakdown (court cost = hours × rate, shuttlecock cost = quantity × rate, total cost, cost per player) so that I can verify calculations and answer questions.

**US4.6**: As an organizer, I want session costs to preserve the rates used at completion time so that historical sessions remain accurate even when I update current rates.

### Epic 5: Session Planning (MVP)
**US5.1**: As an organizer, I want to create upcoming badminton sessions 2 weeks in advance with date, time, and location (no cost estimation) so that players can see what's planned without cost confusion.

**US5.2**: As a player, I want to see upcoming sessions when I login so that I can plan my schedule and know when games are happening.

**US5.3**: As an organizer, I want to convert a planned session to an actual session by recording who attended, hours played, and shuttlecocks used so that costs are automatically calculated and debt allocated.

**US5.4**: As an organizer, I want to mark sessions as cancelled with notes so that players understand why sessions didn't happen.

### Epic 6: Player Self-Service View
**US6.1**: As a player, I want to login and see my current debt/credit balance so that I know what I owe without asking the organizer.

**US6.2**: As a player, I want to see my session attendance history so that I can verify which sessions I joined and their costs.

**US6.3**: As a player, I want to see my payment and deduction transaction history (including any adjustments) so that I can track money in vs session costs and understand any corrections made.

**US6.4**: As a player, I want to see payment instructions (organizer's PayNow details) so that I know how to pay when needed.

**US6.5**: As a player, I want to see only my own financial information so that other players' data remains private.

### Epic 7: Organizer Management Dashboard
**US7.1**: As an organizer, I want a comprehensive dashboard to manage all sessions, players, and payments so that I have full control over the system.

**US7.2**: As an organizer, I want to view any player's complete history so that I can resolve disputes or answer questions.

### Epic 8: Authentication & User Management (MVP)
**US8.1**: As a user (organizer or player), I want to login using my phone number and receive an OTP so that authentication is simple and secure for everyone.

**US8.2**: As an organizer, I want to create player profiles with just name and phone number so that onboarding is quick and minimal.

**US8.3**: As an organizer, I want to activate/deactivate player accounts while preserving their debt history so that I can manage active players without losing financial records.

**US8.4**: As a system, I want to recognize organizer phone numbers and grant management access so that role assignment is automatic.

---

## MVP Scope

### Included in MVP:
- ✅ Session debt tracking and payment processing
- ✅ Variable session costs (court + shuttlecocks)
- ✅ Session planning (without RSVP)
- ✅ Player self-service view
- ✅ Organizer management dashboard
- ✅ Phone + OTP authentication
- ✅ Basic player management

### Deferred for Future Releases:
- ❌ RSVP functionality
- ❌ Automated notifications (email/SMS/push)
- ❌ Advanced cost breakdowns and analytics
- ❌ Advanced reporting and analytics
- ❌ Player self-registration

---

## Technical Considerations

### Recommended Tech Stack:
- **Frontend**: React with Next.js
- **Backend**: Node.js (Next.js API routes)
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth with OTP
- **Hosting**: Vercel (frontend) + Supabase (backend/database)

### Core Data Entities:
- **Users**: id, name, phone_number, role, created_at
- **Settings**: id, court_rate_per_hour, shuttlecock_rate_per_piece, updated_at
- **Sessions**: id, date, time, location, hours_played, shuttlecocks_used, court_cost (calculated), shuttlecock_cost (calculated), total_cost (calculated), status (planned/completed), created_at
- **Session_Players**: session_id, player_id, cost_share, is_temporary_player
- **Payments**: id, player_id, amount, payment_method, date, notes, created_at

### Key Features:
- Mobile-first responsive design
- Real-time balance updates
- Role-based access control
- Simple, intuitive interface for quick session recording