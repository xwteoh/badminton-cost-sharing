# Screen Specifications - Badminton Cost Sharing App

**Version**: 1.0  
**Last Updated**: 2025-07-13  
**Platform**: Mobile-First Web Application (PWA)  
**Design System**: See `design_system.md` for component specifications

---

## 📋 Table of Contents

1. [Document Overview](#document-overview)
2. [Navigation Flow](#navigation-flow)
3. [Screen Specifications](#screen-specifications)
   - [Authentication Screens](#authentication-screens)
   - [Organizer Screens](#organizer-screens)
   - [Player Screens](#player-screens)
   - [Session Management](#session-management)
   - [Payment Management](#payment-management)
   - [Settings & Support](#settings--support)
4. [Common Patterns](#common-patterns)
5. [Accessibility Requirements](#accessibility-requirements)

---

## 📖 Document Overview

This document provides detailed specifications for all screens in the Badminton Cost Sharing App. Each screen specification includes:
- Purpose and user goals
- Layout and component structure
- User interactions and navigation
- Data requirements
- Error states and edge cases
- Mobile-specific considerations

### How to Use This Document
1. Each screen has a unique identifier (e.g., AUTH-001, ORG-001, PLR-001)
2. Screens are grouped by user role and feature area
3. Common patterns are documented separately to avoid repetition
4. Refer to `design_system.md` for component specifications

---

## 🗺️ Navigation Flow

### Main Navigation Structure
```
[ROOT] - Landing/Auth
  ├── [AUTH_FLOW]
  │   ├── Login (Phone + OTP)
  │   └── OTP Verification
  └── [MAIN_APP]
      ├── [ORGANIZER_PORTAL]
      │   ├── Dashboard
      │   ├── Sessions
      │   │   ├── Record Session
      │   │   ├── Upcoming Sessions
      │   │   └── Session History
      │   ├── Payments
      │   │   ├── Record Payment
      │   │   └── Payment History
      │   ├── Players
      │   │   ├── Player Overview
      │   │   └── Add Player
      │   ├── Analytics
      │   └── Settings
      └── [PLAYER_PORTAL]
          ├── Dashboard
          ├── Transaction History
          ├── Upcoming Sessions
          └── Profile Settings
```

### User Journey Maps
1. **New Organizer Journey**
   - Phone Login → OTP Verification → Dashboard → Add Players → Create Session → Record Session

2. **Returning Organizer Journey**
   - Phone Login → Dashboard → Record Session (primary task)

3. **Player Journey**
   - Phone Login → Dashboard → View Balance → Check Upcoming Sessions

---

## 📱 Screen Specifications

### Authentication Screens

#### AUTH-001: Login Screen

**Purpose**: Secure phone-based authentication for Singapore users

**User Goals**:
- Quick login with Singapore phone number
- Secure access to financial data
- Remember device for faster future logins

**Entry Points**:
- App launch (first time or logged out)
- Session timeout redirect

#### Layout Structure
```
┌─────────────────────────────┐
│  🏸 Badminton Cost Tracker  │
│                             │
│  Simple • Secure • Fast     │
│                             │
│  ┌─────────────────────────┐ │
│  │ Phone Number            │ │
│  │ +65 91234567           │ │
│  └─────────────────────────┘ │
│                             │
│  [ Send OTP Code ]          │
│                             │
│  Secure login via SMS      │
└─────────────────────────────┘
```

#### Components
1. **App Logo & Brand**
   - Type: Logo + tagline
   - Props: size="large", centered
   - Behavior: Static branding

2. **Phone Input**
   - Type: PhoneInputSG component
   - Props: country="SG", autoFormat=true
   - Behavior: Auto-format Singapore numbers

3. **Send OTP Button**
   - Type: Primary Button
   - Props: fullWidth=true, size="large"
   - Behavior: Validates phone → triggers OTP

#### User Interactions
| Action | Trigger | Result |
|--------|---------|--------|
| Enter Phone | Text input | Auto-format to +65 XXXX XXXX |
| Send OTP | Button tap | Navigate to OTP verification |
| Invalid Format | Form submit | Show inline error message |

#### Data Requirements
- **Input**: Singapore phone number (+65 XXXX XXXX)
- **Output**: OTP request to Supabase Auth
- **Validation**: Singapore phone regex, rate limiting

#### States
- **Loading**: Show spinner on OTP button during send
- **Error**: Inline error for invalid phone/rate limit
- **Success**: Navigate to OTP verification screen

#### Navigation
- **Next**: OTP Verification screen (AUTH-002)
- **Deep Link**: Redirect to intended destination after auth

#### Accessibility
- **ARIA Labels**: "Phone number input", "Send verification code"
- **Screen Reader**: "Enter your Singapore phone number"
- **Keyboard**: Tab order: input → button

#### Edge Cases
- **Rate Limiting**: "Too many attempts. Try again in 5 minutes."
- **Network Error**: "Connection failed. Please check your network."
- **Invalid Number**: "Please enter a valid Singapore phone number"

---

#### AUTH-002: OTP Verification

**Purpose**: Verify phone ownership via SMS code

**User Goals**:
- Enter 6-digit OTP quickly
- Resend OTP if not received
- Complete authentication securely

**Entry Points**:
- From Login screen after phone submission

#### Layout Structure
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
│  (Available in 30s)         │
└─────────────────────────────┘
```

#### Components
1. **OTP Input Grid**
   - Type: OTPInput component
   - Props: length=6, autoFocus=true
   - Behavior: Auto-advance between digits

2. **Verify Button**
   - Type: Primary Button
   - Props: fullWidth=true, disabled until 6 digits
   - Behavior: Submit OTP for verification

3. **Resend Link**
   - Type: Text Button
   - Props: disabled with countdown timer
   - Behavior: Resend OTP after cooldown

#### User Interactions
| Action | Trigger | Result |
|--------|---------|--------|
| Type Digit | Number input | Auto-advance to next field |
| Verify | Button tap | Authenticate and redirect |
| Resend | Link tap | Send new OTP code |
| Invalid OTP | Submit | Show error, shake animation |

#### Data Requirements
- **Input**: 6-digit OTP code
- **Output**: Authentication session
- **Validation**: Numeric only, 6 digits required

#### States
- **Loading**: Show spinner during verification
- **Error**: Invalid code shake animation + error text
- **Success**: Navigate to appropriate dashboard

#### Navigation
- **Success**: Dashboard (role-specific redirect)
- **Back**: Return to login screen
- **Timeout**: Return to login after OTP expires

#### Accessibility
- **ARIA Labels**: "Digit 1 of 6", "Verification code input"
- **Screen Reader**: Announce each digit entry
- **Keyboard**: Numeric keypad on mobile

#### Edge Cases
- **Expired OTP**: "Code expired. Please request a new one."
- **Too Many Attempts**: "Too many failed attempts. Please try again later."
- **Network Issues**: "Verification failed. Please try again."

---

### Organizer Screens

#### ORG-001: Organizer Dashboard

**Purpose**: Central hub for badminton group management with quick access to common tasks

**User Goals**:
- View group financial overview at a glance
- Access primary functions (record session, record payment)
- Monitor recent activity and player balances

**Entry Points**:
- Login redirect for organizer role
- Navigation from any screen via home icon

#### Layout Structure
```
┌─────────────────────────────┐
│ ☰ John's Badminton Group   │
│                         ⚙️ │
├─────────────────────────────┤
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
│ [Sessions] [Players] [Payments] │
└─────────────────────────────┘
```

#### Components
1. **Header with Navigation**
   - Type: DashboardHeader
   - Props: title="Group Name", menuIcon, settingsIcon
   - Behavior: Hamburger menu, settings navigation

2. **Financial Overview Cards**
   - Type: FinancialSummaryCard
   - Props: outstandingAmount, creditAmount, playerCounts
   - Behavior: Tap to navigate to detailed view

3. **Quick Action Grid**
   - Type: ActionButtonGrid
   - Props: primaryActions array
   - Behavior: Large touch targets for common tasks

4. **Recent Activity Feed**
   - Type: ActivityFeed
   - Props: activities, limit=5
   - Behavior: Real-time updates, expandable

5. **Bottom Navigation**
   - Type: TabNavigation
   - Props: tabs=["Sessions", "Players", "Payments"]
   - Behavior: Persistent navigation

#### User Interactions
| Action | Trigger | Result |
|--------|---------|--------|
| Record Session | Primary button tap | Navigate to ORG-005 |
| Record Payment | Primary button tap | Navigate to PAY-001 |
| View Players | Tab/overview tap | Navigate to ORG-002 |
| Settings | Gear icon tap | Navigate to SET-001 |

#### Data Requirements
- **Input**: Current user session, group data
- **Output**: Dashboard state, navigation events
- **Real-time**: Balance updates, recent activities

#### States
- **Loading**: Skeleton cards while fetching data
- **Empty**: Welcome state for new organizers
- **Error**: Network error with retry option

#### Navigation
- **Primary**: Record Session (most common task)
- **Secondary**: Player management, payment recording
- **Settings**: Account and group configuration

#### Accessibility
- **Landmarks**: Clear navigation structure
- **Touch Targets**: All buttons ≥48px height
- **Screen Reader**: Financial amounts with currency

#### Edge Cases
- **No Players**: Guide to add first players
- **No Sessions**: Onboarding to create first session
- **Network Offline**: Show cached data with sync indicator

---

#### ORG-002: Player Overview

**Purpose**: Comprehensive view of all players with balance status and management actions

**User Goals**:
- Quickly identify players who owe money
- Manage player status (active/inactive)
- Add new players or temporary players

**Entry Points**:
- Dashboard players tab
- Navigation from sessions or payments

#### Layout Structure
```
┌─────────────────────────────┐
│ ← Players (12 active)    + │
├─────────────────────────────┤
│ 🔴 Need Payment (4)         │
│ ┌─────────────────────────────┐ │
│ │ John Doe        -$25.50 ⚠️ │ │
│ │ Last: Session Jul 13       │ │
│ ├─────────────────────────────┤ │
│ │ Jane Smith      -$18.75    │ │
│ │ Last: Payment Jul 10       │ │
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

#### Components
1. **Player List Header**
   - Type: ListHeader
   - Props: title, count, addButton
   - Behavior: Add player action

2. **Balance Status Groups**
   - Type: PlayerBalanceGroup
   - Props: status, players, collapsible
   - Behavior: Group by debt/credit/zero status

3. **Player Balance Cards**
   - Type: PlayerBalanceCard
   - Props: player, balance, lastActivity
   - Behavior: Tap for detailed view, status indicators

4. **Add Player FAB**
   - Type: FloatingActionButton
   - Props: icon="plus", primary
   - Behavior: Open add player modal

#### User Interactions
| Action | Trigger | Result |
|--------|---------|--------|
| View Player Details | Card tap | Navigate to player detail screen |
| Add Player | FAB or header button | Open add player modal |
| Toggle Inactive | Section tap | Show/hide inactive players |
| Record Payment | Player card action | Quick payment modal |

#### Data Requirements
- **Input**: All players with current balances
- **Output**: Player list with real-time balance updates
- **Calculations**: Live balance computations

#### States
- **Loading**: Skeleton player cards
- **Empty**: Empty state with add player prompt
- **Error**: Failed to load players message

#### Navigation
- **Detail**: Individual player screens
- **Add**: Add player modal/screen
- **Back**: Return to dashboard

#### Accessibility
- **Status Indicators**: Color + icon + text for status
- **Balance Announcements**: Screen reader currency formatting
- **Group Headers**: Proper heading hierarchy

#### Edge Cases
- **No Players**: Onboarding flow to add first players
- **All Zero Balances**: Celebratory state message
- **Temporary Players**: Distinct visual treatment

---

### Session Management

#### ORG-005: Record Session (Primary Use Case)

**Purpose**: Core feature for recording completed badminton sessions with cost calculation

**User Goals**:
- Record session details in under 2 minutes
- Select attendees and add temporary players
- Calculate and assign costs automatically

**Entry Points**:
- Dashboard primary action button
- Sessions list "Record" button
- Convert upcoming session to completed

#### Layout Structure
```
┌─────────────────────────────┐
│ ← Record Session            │
├─────────────────────────────┤
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
│                             │
│ ┌─────────────────────────────┐ │
│ │ Total: $74.50              │ │
│ │ Per Player: $14.90 (5 ppl) │ │
│ │ [ Complete Session ]       │ │
│ └─────────────────────────────┘ │
└─────────────────────────────┘
```

#### Components
1. **Session Details Section**
   - Type: SessionDetailsForm
   - Props: date, location, editable
   - Behavior: Auto-fill today's date, location picker

2. **Usage Input Grid**
   - Type: UsageInputGrid
   - Props: hours, shuttlecocks, validation
   - Behavior: Numeric input with decimal support

3. **Player Selection Grid**
   - Type: PlayerSelectionGrid
   - Props: players, multiSelect, selected
   - Behavior: Touch-friendly checkboxes

4. **Cost Breakdown Card**
   - Type: SessionCostBreakdown
   - Props: total, perPlayer, attendeeCount
   - Behavior: Live calculation updates

5. **Complete Session Button**
   - Type: Primary Button
   - Props: fullWidth, size="large", disabled logic
   - Behavior: Submit session with confirmation

#### User Interactions
| Action | Trigger | Result |
|--------|---------|--------|
| Select Players | Checkbox toggle | Update cost calculation |
| Add Temp Player | Plus button | Open temporary player modal |
| Adjust Hours | Number input | Recalculate total cost |
| Complete Session | Primary button | Save session, update balances |

#### Data Requirements
- **Input**: Session details, attendees, usage data
- **Output**: Completed session record, updated balances
- **Calculations**: Real-time cost computation with Decimal.js

#### States
- **Loading**: Show spinner during save operation
- **Validation**: Highlight required fields, show errors
- **Success**: Confirmation screen with summary

#### Navigation
- **Success**: Return to dashboard with success toast
- **Cancel**: Confirm discard changes dialog
- **Back**: Save draft or confirm discard

#### Accessibility
- **Form Labels**: All inputs properly labeled
- **Calculation Updates**: Announce total changes
- **Error States**: Clear error descriptions

#### Edge Cases
- **No Players Selected**: Require at least one attendee
- **Invalid Usage**: Validate hours (0.5-8) and shuttlecocks (0-20)
- **Network Failure**: Save draft locally, sync when online
- **Duplicate Session**: Warn if similar session exists

---

### Payment Management

#### PAY-001: Record Payment

**Purpose**: Record payments received from players with automatic balance updates

**User Goals**:
- Record payment in under 1 minute
- Select correct player and amount
- Update balance automatically

**Entry Points**:
- Dashboard quick action
- Player card payment button
- Payment history add button

#### Layout Structure
```
┌─────────────────────────────┐
│ ← Record Payment            │
├─────────────────────────────┤
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

#### Components
1. **Player Selector**
   - Type: PlayerDropdown
   - Props: players, currentBalance, searchable
   - Behavior: Show current balance, filter by name

2. **Payment Details Form**
   - Type: PaymentDetailsForm
   - Props: amount, method, date, notes
   - Behavior: Money input with validation

3. **Payment Method Selector**
   - Type: MethodSelector
   - Props: methods=["PayNow", "Cash", "Bank Transfer"]
   - Behavior: Quick selection with icons

4. **Balance Preview Card**
   - Type: BalancePreviewCard
   - Props: currentBalance, paymentAmount, newBalance
   - Behavior: Live calculation display

#### User Interactions
| Action | Trigger | Result |
|--------|---------|--------|
| Select Player | Dropdown selection | Load current balance |
| Enter Amount | Money input | Update balance preview |
| Record Payment | Primary button | Save payment, update balance |
| Quick Amount | Player balance tap | Auto-fill full balance owed |

#### Data Requirements
- **Input**: Player, amount, method, date, notes
- **Output**: Payment record, updated player balance
- **Validation**: Amount > 0, valid money format

#### States
- **Loading**: Show spinner during save
- **Success**: Show new balance with confirmation
- **Error**: Display validation errors inline

#### Navigation
- **Success**: Return to dashboard or player list
- **Cancel**: Confirm discard if changes made

#### Accessibility
- **Money Input**: Currency formatting for screen readers
- **Balance Changes**: Announce balance updates
- **Form Validation**: Clear error messages

#### Edge Cases
- **Overpayment**: Allow but show warning about credit balance
- **Zero Amount**: Prevent submission
- **Duplicate Entry**: Warn if similar payment recorded recently

---

### Player Screens

#### PLR-001: Player Dashboard

**Purpose**: Player's personal view of balance, upcoming sessions, and payment information

**User Goals**:
- Check current balance quickly
- View upcoming badminton sessions
- Access payment instructions

**Entry Points**:
- Login redirect for player role
- Navigation from any screen

#### Layout Structure
```
┌─────────────────────────────┐
│ Hi John! 🏸              ⚙️ │
├─────────────────────────────┤
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
│ [History] [Sessions] [Profile] │
└─────────────────────────────┘
```

#### Components
1. **Personal Greeting Header**
   - Type: PlayerHeader
   - Props: playerName, settingsIcon
   - Behavior: Personalized welcome

2. **Balance Status Card**
   - Type: PlayerBalanceCard
   - Props: balance, lastSession, lastPayment, status
   - Behavior: Color-coded balance status

3. **Payment Instructions Card**
   - Type: PaymentInstructionsCard
   - Props: payNowDetails, copyAction
   - Behavior: Copy payment details to clipboard

4. **Upcoming Sessions List**
   - Type: UpcomingSessionsList
   - Props: sessions, limit=3
   - Behavior: Show next few sessions

#### User Interactions
| Action | Trigger | Result |
|--------|---------|--------|
| Copy PayNow | Copy button | Copy to clipboard + toast |
| View History | Tab navigation | Navigate to transaction history |
| View Session Details | Session card tap | Session detail view |

#### Data Requirements
- **Input**: Player data, balance, upcoming sessions
- **Output**: Display player status and payment info
- **Real-time**: Balance updates from organizer actions

#### States
- **Loading**: Skeleton balance and session cards
- **Paid Up**: Positive balance celebration
- **Owing**: Clear debt amount and payment instructions

#### Navigation
- **History**: Transaction history screen
- **Profile**: Player settings screen
- **Sessions**: Upcoming sessions list

#### Accessibility
- **Balance Status**: Color + text + icon for status
- **Payment Info**: Clear instructions for payment
- **Currency**: Proper formatting for screen readers

#### Edge Cases
- **Credit Balance**: Show "You have credit" message
- **No Upcoming Sessions**: Empty state with message
- **Payment Instructions Missing**: Contact organizer message

---

### Settings & Support

#### SET-001: Organizer Settings

**Purpose**: Configuration screen for group settings, rates, and account management

**User Goals**:
- Update default court and shuttlecock rates
- Manage payment instructions
- Account security and data export

**Entry Points**:
- Dashboard settings icon
- Navigation menu

#### Layout Structure
```
┌─────────────────────────────┐
│ ← Settings                  │
├─────────────────────────────┤
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
│ [ Export Data ]             │
│ [ Sign Out ]                │
└─────────────────────────────┘
```

#### Components
1. **Default Rates Section**
   - Type: RatesConfigSection
   - Props: courtRate, shuttlecockRate, editable
   - Behavior: Money input with validation

2. **Payment Instructions Section**
   - Type: PaymentConfigSection
   - Props: payNowDetails, editable
   - Behavior: Update payment instructions

3. **Account Information Section**
   - Type: AccountInfoSection
   - Props: name, phone, role, readonly
   - Behavior: Display account details

4. **Security Actions Section**
   - Type: SecurityActionsSection
   - Props: exportAction, signOutAction
   - Behavior: Data export and logout

#### User Interactions
| Action | Trigger | Result |
|--------|---------|--------|
| Update Rates | Money input change | Save new default rates |
| Export Data | Export button | Generate and download data |
| Sign Out | Sign out button | Confirm logout dialog |

#### Data Requirements
- **Input**: Current settings, user profile
- **Output**: Updated configuration settings
- **Validation**: Positive rates, valid payment details

#### States
- **Loading**: Show spinner during save operations
- **Success**: Settings saved confirmation
- **Error**: Display save error messages

#### Navigation
- **Back**: Return to dashboard
- **Sign Out**: Return to login screen

#### Accessibility
- **Form Labels**: All settings properly labeled
- **Confirmation Dialogs**: Clear action descriptions
- **Data Export**: Progress indication

#### Edge Cases
- **Invalid Rates**: Prevent zero or negative rates
- **Export Failure**: Show error with retry option
- **Network Issues**: Cache settings locally

---

## 🔄 Common Patterns

### Form Patterns
- **Input Validation**: Real-time validation with inline errors
- **Error Display**: Red border + error text below field
- **Submit States**: Loading spinner + disabled state during submit
- **Money Input**: Always use MoneyInput component with $ prefix
- **Required Fields**: Red asterisk + "required" in aria-label

### List Patterns
- **Empty States**: Friendly illustrations with action buttons
- **Loading**: Skeleton cards matching final content structure
- **Pagination**: Infinite scroll for mobile, "Load More" button fallback
- **Search/Filter**: Persistent search bar with real-time filtering
- **Pull to Refresh**: Mobile-native refresh gesture

### Navigation Patterns
- **Tab Navigation**: Bottom tabs on mobile, sidebar on desktop
- **Stack Navigation**: iOS-style back button behavior
- **Modal Presentation**: Full-screen modals for complex forms
- **Deep Linking**: All screens support direct URL access

### Feedback Patterns
- **Success Messages**: Green toast notifications, auto-dismiss
- **Error Messages**: Red toast notifications, manual dismiss
- **Loading States**: Skeleton screens + progress indicators
- **Progress Indicators**: Step indicators for multi-step flows

### Financial Display Patterns
- **Money Format**: Always $XX.XX with SGD currency
- **Balance Status**: Color coding (red=debt, green=credit, gray=zero)
- **Calculation Display**: Live updates during input changes
- **Payment Confirmations**: Show old balance → new balance

---

## ♿ Accessibility Requirements

### General Requirements
- **Screen Readers**: All content accessible via VoiceOver/TalkBack
- **Keyboard Navigation**: Full keyboard support on desktop
- **Color Contrast**: WCAG AA compliance (4.5:1 normal, 3:1 large text)
- **Touch Targets**: Minimum 44x44px for all interactive elements
- **Font Scaling**: Support up to 200% zoom without horizontal scroll

### Financial Data Accessibility
- **Currency**: Always announce amounts with "dollars" and "cents"
- **Balance Changes**: Announce balance updates to screen readers
- **Status Indicators**: Use color + icon + text for debt/credit status
- **Form Validation**: Clear error descriptions with field association

### Mobile-Specific Requirements
- **Focus Management**: Proper focus order in forms and modals
- **Gesture Support**: Alternative interactions for complex gestures
- **Voice Control**: Descriptive labels for voice navigation
- **Orientation**: Support both portrait and landscape modes

### Singapore Accessibility Considerations
- **Language**: English primary, basic Chinese character support
- **Cultural**: Multi-ethnic representation in illustrations
- **Payment Methods**: Clear PayNow instructions for local users
- **Phone Numbers**: Proper formatting for Singapore numbers

---

This comprehensive screen specification provides detailed guidance for implementing all screens in your badminton cost-sharing app, ensuring consistency, usability, and accessibility across the entire user experience.