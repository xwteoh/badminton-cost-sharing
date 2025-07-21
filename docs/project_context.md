# Badminton Cost Sharing App - Project Context

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [App Architecture](#app-architecture)
3. [Target Users](#target-users)
4. [Enterprise Features Scope](#enterprise-features-scope)
5. [Technical Stack](#technical-stack)
6. [Business Rules & Implementation](#business-rules--implementation)
7. [User Experience Philosophy](#user-experience-philosophy)
8. [Operational Limits & Constraints](#operational-limits--constraints)
9. [Technical Implementation](#technical-implementation)
10. [Development Guidelines](#development-guidelines)
11. [Future Enhancements](#future-enhancements)

---

## 🔄 **Document Status & Change Tracking**

**Document Type**: Master Requirements & Implementation Guide  
**Last Updated**: 2025-07-21  
**Change Detection**: Active (Claude monitors implementation vs documentation)  
**Priority Level**: 🔴 Critical - Immediate updates required for implementation changes  

### Change Monitoring
This document serves as the **single source of truth** for all project requirements. Claude actively monitors for:
- Business rule modifications
- Technical stack changes  
- Feature scope adjustments
- Architecture decisions
- Implementation pattern changes

All changes are logged in `docs/docs_change_log.md` with immediate notification for critical updates.

---

## 📊 **Quick Reference Summary**

### 🎯 **Core Business Model**
- **Cost Sharing**: Variable session costs split equally among all attendees
- **Running Tab System**: Players can play with debt, settle payments when convenient
- **Session Management**: Sessions planned 2 weeks ahead with post-session cost recording
- **Payment Tracking**: PayNow transfers confirmed via WhatsApp with manual recording

### 💳 **Payment System Essentials**
- **Flexible Debt**: No pre-payment required, players maintain running balance
- **Variable Costs**: Court hourly rate + shuttlecocks used, calculated per session
- **Temporary Players**: Drop-ins share equal costs without permanent membership
- **Payment Methods**: PayNow primary, cash/bank transfer supported

### 🚀 **MVP Priorities**
1. **Session Cost Tracking**: Record attendance and split costs automatically
2. **Player Debt Management**: Running balance tracking with payment recording
3. **Organizer Dashboard**: Complete session and payment management tools

---

## 1. Project Overview

### Vision
Replace cumbersome Access DB + Excel workflow with mobile-accessible cost sharing app for badminton groups.

### Mission
Provide organizers with efficient session cost tracking and debt management while giving players transparent access to their balance and payment obligations.

### Core Value Proposition
- **Mobile Accessibility**: Update sessions and payments from anywhere, anytime
- **Automated Calculations**: Split costs accurately without manual math
- **Running Tab Convenience**: Play now, pay later flexibility for all players

### Success Metrics
- **Session Recording Speed**: <2 minutes to complete session entry
- **Payment Processing**: <1 minute to record received payments
- **Player Engagement**: >80% players check balance monthly

---

## 2. App Architecture

### System Architecture
```
Frontend (Next.js 15)
├── Authentication (Phone + OTP)
├── Session Recording Interface
├── Payment Tracking
├── Player Balance Dashboard
└── Organizer Management Panel

Backend (Supabase)
├── PostgreSQL Database with RLS
├── Phone/OTP Authentication
├── Real-time Balance Updates
└── Database Functions for Calculations
```

### Data Flow
1. **Authentication**: Phone + OTP for all users (organizer/player roles)
2. **Session Workflow**: Plan session → record attendance → calculate costs → update balances
3. **Payment Workflow**: Receive PayNow → record payment → update player balance
4. **Real-time Updates**: Balance changes sync across all connected clients

### Security Considerations
- **Authentication**: Supabase Auth with phone/OTP verification
- **Data Protection**: Row Level Security (RLS) for role-based access control
- **Privacy**: Players only see their own data, organizers see all data

---

## 3. Target Users

### Primary Users
- **Organizers**: Group leaders who manage sessions and collect payments
  - Needs: Quick session recording, payment tracking, debt overview
  - Pain Points: Manual calculations, Excel management, PC dependency
  - Goals: Streamline cost tracking, reduce admin overhead

- **Players**: Regular group members who attend sessions
  - Needs: Balance visibility, payment instructions, session history
  - Pain Points: Unclear debt status, payment tracking confusion
  - Goals: Know what they owe, easy payment process

### User Personas
1. **John - Group Organizer**
   - Demographics: 35-50, organizes 2-3 sessions/week for 12-person group
   - Behavior: Records sessions immediately after play, processes payments weekly
   - Motivations: Accurate cost tracking, fair payment collection

2. **Sarah - Regular Player**
   - Demographics: 25-45, plays 1-2 times/week
   - Behavior: Checks balance monthly, pays in batches when convenient
   - Motivations: Transparent cost tracking, flexible payment timing

---

## 4. Enterprise Features Scope

### Core Features (Must Have) - ✅ **COMPLETE**
| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| Phone + OTP Authentication | Supabase Auth with phone normalization | P0 | ✅ Complete (Live) |
| Session Cost Tracking | Record attendance and calculate costs | P0 | ✅ Complete (Live) |
| Player Debt Management | Running balance with payment recording | P0 | ✅ Complete (Live) |
| Organizer Dashboard | Complete session and payment management | P0 | ✅ Complete (Live) |
| Player Self-Service | Balance and history viewing | P0 | ✅ Complete (Live) |
| Variable Session Costs | Court rate + shuttlecock calculation | P0 | ✅ Complete (Live) |
| Temporary Player Support | Drop-in players with equal cost sharing | P0 | ✅ Complete (Live) |
| Session Planning | 2-week advance session creation | P0 | ✅ Complete (Live) |
| Player Management | Add/edit/manage all group players | P0 | ✅ Complete (Live) |
| Role-Based Access Control | Player vs organizer access restrictions | P0 | ✅ Complete (Live) |
| Database Integration | Full Supabase integration with service layer | P0 | ✅ Complete (Live) |

### Security & Access Features - ✅ **COMPLETE**
| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| Phone Number Normalization | Singapore number format handling | P0 | ✅ Complete (Live) |
| Role-Based Authentication | Auto-assignment with manual override | P0 | ✅ Complete (Live) |
| Page Access Control | RoleGuard component protection | P0 | ✅ Complete (Live) |
| Database Security Functions | RLS bypass for phone matching | P0 | ✅ Complete (Live) |
| Public Phone Check System | Authentication validation via database view | P0 | ✅ Complete (Live) |

### Enterprise Data Management - ✅ **COMPLETE**
| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| Data Export System | Complete organizer data backup to JSON | P0 | ✅ Complete (Live) |
| Data Import System | Data restoration with validation | P0 | ✅ Complete (Live) |
| Settings Management | Admin tools integration | P0 | ✅ Complete (Live) |

### Premium User Experience - ✅ **COMPLETE**
| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| Premium UI/UX Design | Glassmorphism effects across all screens | P0 | ✅ Complete (Live) |
| Session Conversion Workflow | Auto-select players from planned sessions | P0 | ✅ Complete (Live) |
| Financial Precision | 1 decimal place rounding accuracy | P0 | ✅ Complete (Live) |
| Enhanced Date Formats | Year inclusion for session clarity | P0 | ✅ Complete (Live) |
| Data Integrity Fixes | Session count consistency | P0 | ✅ Complete (Live) |

### Future Enhancements (Nice to Have)
| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| Payment Notifications | Automated debt reminders | P1 | Future |
| Advanced Analytics | Cost trends and player statistics | P1 | Future |
| Multi-group Support | Multiple badminton groups per organizer | P1 | Future |

### Out of Scope (Current Version)
- RSVP functionality for planned sessions
- Automated payment processing integration
- Player self-registration capabilities

---

## 5. Technical Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **UI Library**: Tailwind CSS v4
- **State Management**: React Context + useState/useReducer
- **Icons**: Lucide React

### Backend
- **Platform**: Supabase
- **Database**: PostgreSQL with RLS
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **Real-time**: Supabase Realtime

### Development Tools
- **Version Control**: Git
- **Package Manager**: npm
- **Build Tool**: Next.js built-in
- **Linting**: ESLint with Next.js config
- **Deployment**: Vercel (recommended for Next.js)

### Third-party Services
- **Payment Processing**: TBD (Stripe recommended)
- **Email Service**: Supabase built-in
- **Monitoring**: TBD (Vercel Analytics recommended)

---

## 6. Business Rules & Implementation

### Core Business Rules

#### Rule 1: Session Cost Calculation
- **Description**: Session costs = (hours × court rate) + (shuttlecocks × shuttle rate), split equally among all attendees
- **Implementation**: PostgreSQL functions calculate costs and update player balances
- **Validation**: Minimum 1 player attendance, positive hours/shuttlecock values
- **Error Handling**: Recalculation on session edits, historical rate preservation

#### Rule 2: Running Tab System
- **Description**: Players can have negative balances (debt) without payment restrictions
- **Implementation**: Balance tracking through session costs minus payments
- **Validation**: No debt limits, overpayments become credit
- **Error Handling**: Payment corrections via adjustment records

#### Rule 3: Role-Based Access Control
- **Description**: Organizers manage all data, players only see their own information
- **Implementation**: Supabase RLS policies + RoleGuard component protection
- **Validation**: Phone number authentication, default 'player' role assignment
- **Error Handling**: Clear permission denied messages with automatic redirects
- **Access Control**: RoleGuard component prevents unauthorized page access

#### Rule 4: Temporary Player Handling
- **Description**: Drop-in players share equal costs but don't become permanent members
- **Implementation**: Session_players table with temporary player flags
- **Validation**: Can convert temporary to regular players
- **Error Handling**: Prevent duplicate regular/temporary player entries

### System Constraints
1. **Session Planning**: 2-week advance limit for session creation
2. **Payment Methods**: PayNow primary, cash/bank transfer supported
3. **Data Retention**: Preserve debt history for deactivated players

### Compliance Requirements
- **Data Privacy**: Minimal data collection (name + phone only)
- **Financial Records**: Audit trail for all payments and adjustments

---

## 7. User Experience Philosophy

### Design Principles
1. **Mobile-First**: Organizer records sessions on phone during/after games
2. **Speed**: Session recording in <2 minutes, payment entry in <1 minute
3. **Visual Clarity**: Immediate debt/credit status with color coding
4. **Error Prevention**: Confirmation dialogs for destructive actions

### Accessibility
- **Standards**: WCAG 2.1 AA compliance
- **Features**: Large touch targets (44px minimum), clear visual hierarchy
- **Testing**: Manual testing on various devices and screen sizes

### Performance Goals
- **Session Recording**: <2 minutes from start to completion
- **Payment Processing**: <1 minute to record received payment
- **Balance Calculation**: Real-time updates without page refresh
- **Offline Support**: View balance and history when connectivity is poor

---

## 8. Operational Limits & Constraints

### Technical Constraints
- **Database**: Supabase free tier limits (500MB, 2GB bandwidth/month)
- **Authentication**: Phone OTP rate limits (5 requests/minute per IP)
- **Real-time**: 200 concurrent connections on free tier

### Business Constraints
- **Single Group**: MVP supports one badminton group per deployment
- **Manual Payments**: PayNow transfers confirmed via WhatsApp group
- **Organizer Dependency**: All cost and payment recording requires organizer

### Scalability Considerations
- **Current Capacity**: 50 active players per group, 100 sessions per month
- **Growth Plan**: Multi-group support requires database schema updates
- **Bottlenecks**: Manual payment confirmation, single organizer workflow

---

## 9. Technical Implementation

### Data Models

#### User
```typescript
interface User {
  id: string;
  name: string;
  phone_number: string;
  role: 'organizer' | 'player';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

#### Session
```typescript
interface Session {
  id: string;
  date: string;
  start_time: string;
  location: string;
  status: 'planned' | 'completed' | 'cancelled';
  hours_played?: number;
  shuttlecocks_used?: number;
  court_rate_used?: number;
  shuttlecock_rate_used?: number;
  total_cost?: number;
  created_by: string;
}
```

#### Session Player
```typescript
interface SessionPlayer {
  id: string;
  session_id: string;
  player_id?: string; // null for temporary players
  cost_share: number;
  is_temporary_player: boolean;
  temporary_player_name?: string;
  temporary_player_phone?: string;
}
```

#### Payment
```typescript
interface Payment {
  id: string;
  player_id: string;
  amount: number;
  payment_method: 'paynow' | 'cash' | 'bank_transfer';
  payment_date: string;
  notes?: string;
  recorded_by: string;
}
```

### Database Functions (No Custom API)
- **get_player_balance()**: Calculate current debt/credit for player
- **complete_session()**: Convert planned session to completed with costs
- **get_players_with_balances()**: Dashboard overview for organizer
- **get_player_by_user_phone()**: Match authenticated users to player records with phone normalization

### State Management
```typescript
interface AppState {
  user: User | null;
  currentBalance: number;
  upcomingSessions: Session[];
  recentSessions: Session[];
  isLoading: boolean;
}
```

---

## 10. Development Guidelines

### Code Organization
- **Components**: Feature-based folders in `src/components/`
- **Pages**: Next.js App Router in `src/app/`
- **Services**: API interactions in `src/lib/`
- **Types**: Shared TypeScript definitions in `src/types/`

### Testing Strategy
- **Unit Tests**: 80% coverage target with Jest
- **Integration Tests**: API route testing with Supertest
- **E2E Tests**: Critical user flows with Playwright
- **Performance Tests**: Lighthouse CI for performance monitoring

### Documentation Requirements
- **Code Comments**: Required for complex business logic
- **API Documentation**: OpenAPI specs for all endpoints
- **Component Documentation**: Storybook for UI components
- **README Files**: Setup and deployment instructions

### Git Workflow
- **Branch Strategy**: Feature branches with main/develop
- **Commit Convention**: Conventional Commits
- **PR Process**: Required reviews and automated checks
- **Code Review**: Focus on security, performance, and maintainability

---

## 11. Future Enhancements

### Phase 2 Features
1. **Multi-Group Support**: Multiple badminton groups per organizer
2. **Payment Notifications**: Automated debt reminders via SMS/email
3. **Advanced Analytics**: Cost trends, attendance patterns, player statistics
4. **RSVP System**: Session planning with attendance confirmations

### Technical Improvements
- **Payment Integration**: Direct PayNow API integration for automated confirmation
- **Mobile Apps**: Native iOS/Android applications
- **Offline Support**: Local storage for poor connectivity scenarios
- **Backup/Export**: Data export for external analysis

### Scaling Considerations
- **Multi-Tenancy**: Support multiple groups with isolated data
- **Admin Dashboard**: Super-admin interface for multiple group management
- **API Rate Limiting**: Enhanced protection for larger user bases

---

## 📚 Documentation References

### Core Documentation
- **Implementation Status**: `docs/implementation_status.md` - Feature completion tracking (MVP Complete)
- **Screen Specifications**: `docs/screen_specifications.md` - Detailed UI/UX specs with role-based access
- **Design System**: `docs/design_system.md` - Component library and tokens including RoleGuard
- **Lessons Learned**: `docs/lessons_learned.md` - Development insights including authentication fixes

### Development Documentation
- **Folder Structure**: `docs/folder_structure.md` - Project organization
- **Coding Standards**: `docs/coding_standards.md` - Code style and conventions
- **Security Guide**: `docs/security_standards.md` - OWASP compliance and RLS implementation
- **Change Log**: `docs/docs_change_log.md` - Documentation update history

### Session Management
- **Current State**: `SESSION_STATE.md` - Active session tracking
- **Claude Guidance**: `CLAUDE.md` - AI assistant instructions

### Technical Architecture
- **Database Schema**: `docs/plans/database_schema.md` - Complete database design
- **Security Implementation**: `docs/plans/supabase_rls_setup.md` - RLS policies and access control
- **Authentication Flow**: Role-based authentication with phone normalization