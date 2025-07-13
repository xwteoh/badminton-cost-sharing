# Folder Structure - Badminton Cost Sharing App

**Version**: 1.0  
**Last Updated**: 2025-07-13  
**Framework**: Next.js 15 + React 19 + TypeScript  
**Architecture Pattern**: Feature-First with Mobile-First Design

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Root Directory](#root-directory)
3. [Source Code Structure](#source-code-structure)
4. [Documentation](#documentation)
5. [Configuration Files](#configuration-files)
6. [Naming Conventions](#naming-conventions)
7. [Best Practices](#best-practices)

---

## 🏗️ Overview

This document outlines the project's folder structure and organization principles. Following this structure ensures consistency, maintainability, and ease of navigation for all developers.

### Key Principles
1. **Separation of Concerns**: Group related files together
2. **Scalability**: Structure supports project growth
3. **Discoverability**: Easy to find files and understand purpose
4. **Consistency**: Predictable patterns throughout

---

## 📁 Root Directory

```
badminton-app/
├── src/                          # Source code
│   └── app/                      # Next.js 15 App Router
├── docs/                         # Project documentation
│   ├── plans/                    # Detailed project plans
│   ├── project_context.md        # Master requirements
│   ├── coding_standards.md       # Development standards
│   ├── security_standards.md     # Security guidelines
│   ├── testing_standards.md      # Testing guidelines
│   ├── component_guidelines.md   # UI component standards
│   ├── supabase_security_guide.md # Database security
│   ├── screen_specifications.md  # UI specifications
│   ├── design_system.md          # Design system
│   ├── folder_structure.md       # This file
│   ├── implementation_status.md  # Feature tracking
│   └── docs_change_log.md        # Documentation changes
├── public/                       # Static assets
│   ├── *.svg                     # SVG icons
│   └── favicon.ico               # Favicon
├── tests/                        # Test files
│   ├── e2e/                      # End-to-end tests (Playwright)
│   ├── integration/              # Integration tests
│   └── __mocks__/                # Test mocks
├── node_modules/                 # Dependencies (git ignored)
├── .next/                        # Build output (git ignored)
├── coverage/                     # Test coverage (git ignored)
├── .env.local                    # Environment variables (git ignored)
├── .env.example                  # Environment variables template
├── .gitignore                    # Git ignore rules
├── eslint.config.mjs             # ESLint configuration
├── .prettierrc                   # Prettier configuration
├── .prettierignore               # Prettier ignore
├── package.json                  # Project dependencies
├── package-lock.json             # Dependency lock file
├── tsconfig.json                 # TypeScript configuration
├── next.config.ts                # Next.js configuration
├── postcss.config.mjs            # PostCSS configuration
├── playwright.config.ts          # Playwright configuration
├── jest.config.js                # Jest configuration
├── README.md                     # Project documentation
├── CLAUDE.md                     # Claude Code guidance
├── SESSION_STATE.md              # Session tracking
└── CLAUDECODE_FRAMEWORK_README.md # Framework documentation
```

---

## 🗂️ Source Code Structure

### Next.js App Router Structure
```
src/
├── app/                           # Next.js 15 App Router
│   ├── (auth)/                   # Auth route group
│   │   ├── login/
│   │   │   ├── page.tsx         # Login page
│   │   │   └── loading.tsx      # Loading UI
│   │   └── layout.tsx           # Auth layout
│   ├── (dashboard)/              # Dashboard route group
│   │   ├── dashboard/
│   │   │   ├── page.tsx         # Dashboard page
│   │   │   └── loading.tsx      # Loading UI
│   │   ├── sessions/
│   │   │   ├── page.tsx         # Sessions list
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx     # Session details
│   │   │   │   └── edit/
│   │   │   │       └── page.tsx # Edit session
│   │   │   ├── new/
│   │   │   │   └── page.tsx     # Create session
│   │   │   └── record/
│   │   │       └── page.tsx     # Record session
│   │   ├── payments/
│   │   │   ├── page.tsx         # Payments list
│   │   │   └── new/
│   │   │       └── page.tsx     # Record payment
│   │   ├── players/
│   │   │   ├── page.tsx         # Players list
│   │   │   └── [id]/
│   │   │       └── page.tsx     # Player details
│   │   ├── analytics/           # Organizer only
│   │   │   └── page.tsx         # Analytics page
│   │   ├── settings/
│   │   │   └── page.tsx         # Settings page
│   │   └── layout.tsx           # Dashboard layout
│   ├── api/                     # API routes
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   │   └── route.ts     # Login API
│   │   │   └── logout/
│   │   │       └── route.ts     # Logout API
│   │   ├── sessions/
│   │   │   ├── route.ts         # Sessions CRUD
│   │   │   └── [id]/
│   │   │       └── route.ts     # Session operations
│   │   ├── payments/
│   │   │   └── route.ts         # Payments API
│   │   ├── players/
│   │   │   └── route.ts         # Players API
│   │   └── balance/
│   │       └── route.ts         # Balance calculations
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Landing page
│   ├── loading.tsx              # Global loading UI
│   ├── error.tsx                # Global error UI
│   ├── not-found.tsx            # 404 page
│   └── favicon.ico              # Favicon
├── components/                   # React components
│   ├── ui/                      # Base UI components
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.test.tsx
│   │   │   ├── Button.stories.tsx
│   │   │   └── index.ts
│   │   ├── MoneyInput/             # Financial input component
│   │   │   ├── MoneyInput.tsx
│   │   │   ├── MoneyInput.test.tsx
│   │   │   └── index.ts
│   │   └── MoneyDisplay/           # Financial display component
│   ├── business/               # Domain-specific components
│   │   ├── Session/
│   │   │   ├── SessionCard.tsx     # Session display card
│   │   │   ├── SessionForm.tsx     # Session creation/edit form
│   │   │   ├── SessionList.tsx     # Sessions list view
│   │   │   ├── SessionCostBreakdown.tsx # Cost breakdown display
│   │   │   └── index.ts
│   │   ├── Payment/
│   │   │   ├── PaymentCard.tsx     # Payment display card
│   │   │   ├── PaymentForm.tsx     # Payment recording form
│   │   │   └── index.ts
│   │   └── Player/
│   │       ├── PlayerCard.tsx      # Player info card
│   │       ├── PlayerBalance.tsx   # Balance display
│   │       └── index.ts
│   ├── layout/                 # Layout components
│   │   ├── DashboardLayout.tsx     # Main dashboard layout
│   │   ├── MobileNavigation.tsx    # Mobile navigation
│   │   └── PageLayout.tsx          # Generic page layout
│   └── providers/              # Context providers
│       ├── AuthProvider.tsx        # Authentication context
│       └── SupabaseProvider.tsx    # Supabase client context
├── lib/                         # Utility libraries
│   ├── supabase/               # Supabase configuration
│   │   ├── client.ts           # Client-side Supabase
│   │   ├── server.ts           # Server-side Supabase
│   │   ├── types.ts            # Supabase types
│   │   └── middleware.ts       # Auth middleware
│   ├── calculations/           # Financial calculations
│   │   ├── money.ts            # Money operations
│   │   ├── session-costs.ts    # Session cost logic
│   │   ├── balance.ts          # Balance calculations
│   │   └── __tests__/          # Calculation tests
│   ├── validation/             # Input validation
│   │   ├── schemas.ts          # Zod schemas
│   │   ├── phone.ts            # Phone validation
│   │   ├── money.ts            # Money validation
│   │   └── __tests__/          # Validation tests
│   ├── auth/                   # Authentication logic
│   │   ├── config.ts           # Auth configuration
│   │   ├── session.ts          # Session management
│   │   ├── otp.ts              # OTP handling
│   │   └── __tests__/          # Auth tests
│   ├── utils/                  # Utility functions
│   │   ├── constants.ts        # App constants
│   │   ├── formatters.ts       # Data formatters
│   │   ├── dates.ts            # Date utilities
│   │   ├── currency.ts         # Currency utilities
│   │   └── __tests__/          # Utility tests
│   └── hooks/                  # Custom React hooks
│       ├── useAuth.ts          # Authentication hook
│       ├── useBalance.ts       # Balance hook
│       ├── useSessions.ts      # Sessions hook
│       ├── usePayments.ts      # Payments hook
│       ├── useRealtimeBalance.ts # Real-time balance
│       └── __tests__/          # Hook tests
├── types/                      # TypeScript definitions
│   ├── database.ts             # Database types
│   ├── auth.ts                 # Auth types
│   ├── business.ts             # Business logic types
│   ├── ui.ts                   # UI component types
│   └── index.ts                # Type exports
└── middleware.ts               # Next.js middleware
```

### Component Structure
```
components/
├── ui/                     # Base UI components
│   ├── Button/
│   │   ├── Button.tsx           # Component implementation
│   │   ├── Button.test.tsx      # Component tests
│   │   ├── Button.stories.tsx   # Storybook stories
│   │   └── index.ts            # Component export
│   ├── MoneyInput/             # Financial input component
│   │   ├── MoneyInput.tsx
│   │   ├── MoneyInput.test.tsx
│   │   └── index.ts
│   └── MoneyDisplay/           # Financial display component
├── business/               # Domain-specific components
│   ├── Session/
│   │   ├── SessionCard.tsx     # Session display card
│   │   ├── SessionForm.tsx     # Session creation/edit form
│   │   ├── SessionList.tsx     # Sessions list view
│   │   ├── SessionCostBreakdown.tsx # Cost breakdown display
│   │   └── index.ts
│   ├── Payment/
│   │   ├── PaymentCard.tsx     # Payment display card
│   │   ├── PaymentForm.tsx     # Payment recording form
│   │   └── index.ts
│   └── Player/
│       ├── PlayerCard.tsx      # Player info card
│       ├── PlayerBalance.tsx   # Balance display
│       └── index.ts
├── layout/                 # Layout components
│   ├── DashboardLayout.tsx     # Main dashboard layout
│   ├── MobileNavigation.tsx    # Mobile navigation
│   └── PageLayout.tsx          # Generic page layout
└── providers/              # Context providers
    ├── AuthProvider.tsx        # Authentication context
    └── SupabaseProvider.tsx    # Supabase client context
```

### Next.js Page Structure
```
app/
├── (auth)/                     # Authentication pages
│   ├── login/
│   │   ├── page.tsx           # Phone + OTP login
│   │   └── loading.tsx        # Loading state
│   └── layout.tsx             # Auth layout
├── (dashboard)/               # Main application pages
│   ├── dashboard/
│   │   ├── page.tsx           # Main dashboard
│   │   └── loading.tsx        # Loading state
│   ├── sessions/
│   │   ├── page.tsx           # Sessions list
│   │   ├── new/page.tsx       # Create session
│   │   ├── record/page.tsx    # Record session usage
│   │   └── [id]/
│   │       ├── page.tsx       # Session details
│   │       └── edit/page.tsx  # Edit session
│   ├── payments/
│   │   ├── page.tsx           # Payments list
│   │   └── new/page.tsx       # Record payment
│   ├── players/
│   │   ├── page.tsx           # Players list (organizer)
│   │   └── [id]/page.tsx      # Player details
│   ├── analytics/
│   │   └── page.tsx           # Analytics (organizer only)
│   ├── settings/
│   │   └── page.tsx           # App settings
│   └── layout.tsx             # Dashboard layout
└── api/                       # API routes
    ├── auth/
    ├── sessions/
    ├── payments/
    └── balance/
```

### Library Structure
```
lib/
├── supabase/                  # Supabase integration
│   ├── client.ts             # Client-side Supabase
│   ├── server.ts             # Server-side Supabase
│   ├── types.ts              # Generated Supabase types
│   └── middleware.ts         # Auth middleware
├── calculations/             # Financial calculations
│   ├── money.ts              # Money operations (Decimal.js)
│   ├── session-costs.ts      # Session cost calculations
│   ├── balance.ts            # Balance calculations
│   └── __tests__/            # 100% test coverage required
├── validation/               # Input validation
│   ├── schemas.ts            # Zod validation schemas
│   ├── phone.ts              # Singapore phone validation
│   ├── money.ts              # Money format validation
│   └── __tests__/            # Validation tests
├── auth/                     # Authentication logic
│   ├── config.ts             # Auth configuration
│   ├── session.ts            # Session management
│   ├── otp.ts                # OTP generation/validation
│   └── __tests__/            # Security tests
├── utils/                    # Utility functions
│   ├── constants.ts          # App constants
│   ├── formatters.ts         # Data formatters
│   ├── dates.ts              # Date utilities
│   └── currency.ts           # Currency formatting
└── hooks/                    # Custom React hooks
    ├── useAuth.ts            # Authentication hook
    ├── useBalance.ts         # Balance calculations
    ├── useSessions.ts        # Session management
    ├── usePayments.ts        # Payment operations
    └── useRealtimeBalance.ts # Real-time balance updates
```

---

## 📚 Documentation

```
docs/
├── project_context.md            # Master requirements document
├── implementation_status.md      # Feature tracking
├── screen_specifications.md      # UI specifications
├── design_system.md             # Design system guide
├── folder_structure.md          # This file
├── coding_standards.md          # Development standards
├── security_standards.md        # Security guidelines
├── testing_standards.md         # Testing requirements
├── component_guidelines.md      # UI component standards
├── supabase_security_guide.md   # Database security
├── lessons_learned.md           # Development insights
├── docs_change_log.md           # Documentation updates
└── plans/                       # Detailed project plans
    ├── badminton_requirements.md    # Business requirements
    ├── database_schema.md           # Database design
    ├── api_endpoints.md             # API specifications
    ├── supabase_rls_setup.md        # Security setup
    └── uiux_wireframes.md           # UI wireframes
```

---

## ⚙️ Configuration Files

### Root Configuration
```
config/
├── jest/                  # Jest configuration
│   ├── setup.js
│   └── transforms.js
├── docker/                # Docker configs
│   ├── Dockerfile
│   └── docker-compose.yml
└── nginx/                 # Nginx configs
    └── default.conf
```

### Environment Files
```
.env.example              # Template for environment variables
.env.local               # Local development environment
.env.development         # Development environment
.env.staging            # Staging environment
.env.production         # Production environment
.env.test              # Test environment
```

---

## 📝 Naming Conventions

### Files and Folders
| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `Button.tsx`, `SessionCard.tsx` |
| Pages | PascalCase + page.tsx | `page.tsx`, `loading.tsx` |
| API Routes | camelCase + route.ts | `route.ts` (in API folders) |
| Hooks | camelCase + "use" prefix | `useAuth.ts`, `useBalance.ts` |
| Utils | camelCase | `formatMoney.ts`, `validatePhone.ts` |
| Types | PascalCase | `Session.ts`, `Payment.ts` |
| Tests | Same as source + ".test" | `Button.test.tsx`, `money.test.ts` |
| Libraries | camelCase | `supabase.ts`, `calculations.ts` |

### Badminton App Code Conventions
```typescript
// Database Types - PascalCase
interface User {
  id: string;
  name: string;
  phone_number: string;
  role: 'organizer' | 'player';
}

interface Session {
  id: string;
  date: string;
  location: string;
  status: 'planned' | 'completed' | 'cancelled';
  total_cost?: number;
}

// Money Types - Use Decimal.js
interface Money {
  amount: Decimal;
  currency: 'SGD';
}

// Business Constants - UPPER_SNAKE_CASE
const TOUCH_TARGET_MIN_SIZE = '44px';
const SINGAPORE_PHONE_REGEX = /^\+65[689]\d{7}$/;
const MAX_PAYMENT_AMOUNT = 1000;

// Functions - camelCase with descriptive names
const calculateSessionCost = (hours: number, shuttlecocks: number) => { };
const formatSingaporeMoney = (amount: Decimal) => { };
const validatePhoneNumber = (phone: string) => { };
```

---

## 💡 Badminton App Best Practices

### Do's
1. **Mobile-first design**: Start with mobile, scale up
2. **Financial precision**: Use Decimal.js for all money calculations
3. **Security first**: Validate all inputs, especially financial data
4. **Feature-based organization**: Group by business domain
5. **Test financial logic**: 100% coverage for calculations
6. **Type safety**: Use strict TypeScript settings
7. **Accessibility**: WCAG 2.1 AA compliance
8. **Performance**: Optimize for mobile networks

### Don'ts
1. **No floating point arithmetic**: Always use Decimal.js for money
2. **No hardcoded strings**: Use constants for business rules
3. **No skipped validation**: All user inputs must be validated
4. **No missing error handling**: Handle all error states
5. **No accessibility shortcuts**: Include proper ARIA labels
6. **No direct Supabase access**: Use typed client helpers
7. **No untested financial code**: Critical business logic requires tests
8. **No exposed secrets**: Environment variables for sensitive data

### Badminton App Import Organization
```typescript
// 1. React and Next.js
import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// 2. Third-party libraries
import Decimal from 'decimal.js';
import { z } from 'zod';

// 3. Internal imports - absolute paths
import { Button, MoneyInput } from '@/components/ui';
import { SessionCard } from '@/components/business/Session';
import { useAuth, useBalance } from '@/lib/hooks';
import { calculateSessionCost } from '@/lib/calculations';
import { createClientSupabaseClient } from '@/lib/supabase/client';

// 4. Relative imports
import { LocalComponent } from './LocalComponent';

// 5. Type imports - separate from value imports
import type { Session, Payment, User } from '@/types';
import type { Database } from '@/lib/supabase/types';
```

### Badminton App File Size Guidelines
- UI Components: < 150 lines (mobile-first focus)
- Business Components: < 250 lines
- Page Components: < 200 lines
- API Routes: < 100 lines (single responsibility)
- Utility Functions: < 100 lines per function
- Financial Calculations: < 150 lines (with 100% test coverage)
- Tests: Mirror source file structure, comprehensive coverage

---

## 🏸 Project-Specific Guidelines

### Badminton App Structure Highlights

#### Financial Calculation Priority
- All money-related code in `lib/calculations/` with mandatory tests
- Use `Decimal.js` exclusively for financial arithmetic
- Input validation in `lib/validation/` for all financial inputs

#### Mobile-First Development
- Components start mobile (320px), scale to desktop
- Touch targets minimum 44px for iOS/Android compliance
- Progressive enhancement for larger screens

#### Supabase Integration Pattern
- Client-side operations in `lib/supabase/client.ts`
- Server-side operations in `lib/supabase/server.ts`
- Database types auto-generated in `lib/supabase/types.ts`
- Row Level Security policies documented in security guide

#### Authentication Flow
- Phone + OTP authentication via Supabase Auth
- Session management in `lib/auth/session.ts`
- Rate limiting and security in `lib/auth/otp.ts`

#### Testing Strategy
- Financial calculations: 100% test coverage required
- Component testing with React Testing Library
- E2E testing with Playwright for critical user journeys
- Integration testing for Supabase functions

### Maintenance Schedule
- **Weekly**: Update implementation status as features develop
- **Monthly**: Review folder structure for new requirements
- **Quarterly**: Validate against actual codebase structure
- **Release**: Ensure documentation matches deployed code