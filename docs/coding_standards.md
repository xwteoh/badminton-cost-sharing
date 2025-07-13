# Coding Standards - Badminton Cost Sharing App

**Version**: 1.0  
**Last Updated**: 2025-07-13  
**Language**: TypeScript  
**Framework**: Next.js 15 + React 19 + Supabase

---

## 📋 Table of Contents

1. [General Principles](#general-principles)
2. [Mobile-First Development](#mobile-first-development)
3. [Financial Application Standards](#financial-application-standards)
4. [Next.js 15 + React 19 Standards](#nextjs-15--react-19-standards)
5. [TypeScript Standards](#typescript-standards)
6. [Supabase Integration Patterns](#supabase-integration-patterns)
7. [Component Standards](#component-standards)
8. [Testing Standards](#testing-standards)
9. [Performance Guidelines](#performance-guidelines)
10. [Security Best Practices](#security-best-practices)
11. [Git Conventions](#git-conventions)
12. [Code Review Checklist](#code-review-checklist)

---

## 🎯 General Principles

### Core Values
1. **Speed**: Session recording <2min, payment entry <1min
2. **Mobile-First**: Touch-friendly, responsive design
3. **Financial Accuracy**: Precise decimal calculations, audit trails
4. **Security**: Protect financial data and user privacy
5. **Simplicity**: Intuitive UX for non-technical users
6. **Reliability**: Robust error handling and data validation

### Development Philosophy
- **Mobile-First**: Design and develop for mobile, enhance for desktop
- **Supabase-First**: Leverage database-driven architecture with RLS
- **Type Safety**: Strict TypeScript for financial calculations
- **Progressive Enhancement**: Core functionality works offline
- **Clean Code**: Self-documenting, maintainable patterns
- **Security by Design**: Security considerations in every feature

---

## 📱 Mobile-First Development

### Touch Interface Standards
```typescript
// Minimum touch target sizes
const TOUCH_TARGETS = {
  minimum: '44px',    // iOS/Android minimum
  preferred: '48px',  // More comfortable
  small: '40px',      // Only for secondary actions
} as const;

// Button component with proper touch targets
interface ButtonProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'danger';
  children: React.ReactNode;
  onClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({ size = 'medium', variant = 'primary', children, onClick }) => {
  const sizeClasses = {
    small: 'min-h-[40px] px-3 text-sm',
    medium: 'min-h-[48px] px-4 text-base',
    large: 'min-h-[56px] px-6 text-lg',
  };
  
  return (
    <button
      className={`${sizeClasses[size]} rounded-lg font-medium transition-colors ${
        variant === 'primary' ? 'bg-blue-600 text-white hover:bg-blue-700' :
        variant === 'secondary' ? 'bg-gray-200 text-gray-900 hover:bg-gray-300' :
        'bg-red-600 text-white hover:bg-red-700'
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

### Responsive Design Patterns
```typescript
// Mobile-first responsive breakpoints
const BREAKPOINTS = {
  sm: '640px',   // Small tablets
  md: '768px',   // Tablets
  lg: '1024px',  // Small desktops
  xl: '1280px',  // Large desktops
} as const;

// Example mobile-first component
const SessionCard: React.FC<{ session: Session }> = ({ session }) => {
  return (
    <div className="
      w-full p-4 bg-white rounded-lg shadow-sm border
      sm:max-w-sm sm:mx-auto
      md:max-w-md
      lg:max-w-lg
    ">
      {/* Mobile: Stack vertically */}
      <div className="space-y-3 md:space-y-0 md:flex md:items-center md:justify-between">
        <div className="space-y-1">
          <h3 className="font-semibold text-lg">{session.location}</h3>
          <p className="text-gray-600 text-sm">
            {formatDate(session.date)} at {session.start_time}
          </p>
        </div>
        
        {/* Desktop: Side by side */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button size="medium" variant="primary">
            Record Session
          </Button>
        </div>
      </div>
    </div>
  );
};
```

---

## 💰 Financial Application Standards

### Decimal Precision
```typescript
// Use Decimal.js for precise financial calculations
import Decimal from 'decimal.js';

// Configure Decimal for currency (2 decimal places)
Decimal.set({ precision: 10, rounding: Decimal.ROUND_HALF_UP });

interface Money {
  amount: Decimal;
  currency: 'SGD'; // Restrict to supported currencies
}

// Financial calculation utilities
class MoneyCalculator {
  static add(a: Money, b: Money): Money {
    if (a.currency !== b.currency) {
      throw new Error('Cannot add different currencies');
    }
    return {
      amount: a.amount.plus(b.amount),
      currency: a.currency,
    };
  }
  
  static multiply(money: Money, factor: number): Money {
    return {
      amount: money.amount.times(factor),
      currency: money.currency,
    };
  }
  
  static divide(money: Money, divisor: number): Money {
    if (divisor === 0) {
      throw new Error('Cannot divide by zero');
    }
    return {
      amount: money.amount.dividedBy(divisor),
      currency: money.currency,
    };
  }
  
  static format(money: Money): string {
    return `$${money.amount.toFixed(2)}`;
  }
}

// Session cost calculation
const calculateSessionCost = (
  hours: number,
  shuttlecocks: number,
  courtRate: Money,
  shuttlecockRate: Money,
  attendeeCount: number
): Money => {
  const courtCost = MoneyCalculator.multiply(courtRate, hours);
  const shuttlecockCost = MoneyCalculator.multiply(shuttlecockRate, shuttlecocks);
  const totalCost = MoneyCalculator.add(courtCost, shuttlecockCost);
  const costPerPlayer = MoneyCalculator.divide(totalCost, attendeeCount);
  
  return costPerPlayer;
};
```

### Input Validation
```typescript
// Strict validation for financial inputs
const validatePaymentAmount = (amount: string): { isValid: boolean; error?: string } => {
  // Remove any non-numeric characters except decimal point
  const cleanAmount = amount.replace(/[^\d.]/g, '');
  
  // Check for valid decimal format
  const decimalRegex = /^\d+(\.\d{1,2})?$/;
  if (!decimalRegex.test(cleanAmount)) {
    return { isValid: false, error: 'Invalid amount format' };
  }
  
  const numericAmount = parseFloat(cleanAmount);
  
  // Business rules validation
  if (numericAmount <= 0) {
    return { isValid: false, error: 'Amount must be greater than zero' };
  }
  
  if (numericAmount > 1000) {
    return { isValid: false, error: 'Amount cannot exceed $1000' };
  }
  
  return { isValid: true };
};

// Input component with validation
const MoneyInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  label: string;
}> = ({ value, onChange, label }) => {
  const [error, setError] = useState<string>();
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    const validation = validatePaymentAmount(newValue);
    setError(validation.error);
  };
  
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-gray-500">$</span>
        </div>
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={handleChange}
          className={`block w-full pl-8 pr-3 py-2 border rounded-md ${
            error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
          }`}
          placeholder="0.00"
        />
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};
```

---

## ⚛️ Next.js 15 + React 19 Standards

### App Router File Structure
```typescript
// src/app/layout.tsx - Root layout
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Badminton Cost Tracker',
  description: 'Track badminton session costs and player payments',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          {children}
        </div>
      </body>
    </html>
  )
}

// src/app/dashboard/page.tsx - Dashboard page
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { DashboardClient } from './dashboard-client'

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/login')
  }
  
  // Fetch user profile with role
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()
  
  if (!profile) {
    redirect('/onboarding')
  }
  
  return <DashboardClient user={profile} />
}

// src/app/dashboard/dashboard-client.tsx - Client component
'use client'

import { useState, useEffect } from 'react'
import { createClientSupabaseClient } from '@/lib/supabase/client'
import type { User } from '@/types/database'

interface Props {
  user: User
}

export function DashboardClient({ user }: Props) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientSupabaseClient()
  
  useEffect(() => {
    const fetchSessions = async () => {
      const { data } = await supabase
        .from('sessions')
        .select('*')
        .order('date', { ascending: false })
        .limit(10)
      
      setSessions(data || [])
      setIsLoading(false)
    }
    
    fetchSessions()
  }, [supabase])
  
  if (isLoading) {
    return <div>Loading...</div>
  }
  
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">
        {user.role === 'organizer' ? 'Organizer Dashboard' : 'My Dashboard'}
      </h1>
      {/* Dashboard content */}
    </div>
  )
}
```

### Server vs Client Components
```typescript
// ✅ Good: Use server components for data fetching
// src/app/sessions/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { SessionList } from './session-list'

export default async function SessionsPage() {
  const supabase = createServerSupabaseClient()
  
  const { data: sessions } = await supabase
    .from('sessions')
    .select('*')
    .order('date', { ascending: false })
  
  return <SessionList initialSessions={sessions || []} />
}

// ✅ Good: Use client components for interactivity
// src/app/sessions/session-list.tsx
'use client'

import { useState } from 'react'
import { Session } from '@/types/database'

interface Props {
  initialSessions: Session[]
}

export function SessionList({ initialSessions }: Props) {
  const [sessions, setSessions] = useState(initialSessions)
  const [filter, setFilter] = useState<'all' | 'planned' | 'completed'>('all')
  
  const filteredSessions = sessions.filter(session => 
    filter === 'all' || session.status === filter
  )
  
  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button 
          onClick={() => setFilter('all')}
          className={filter === 'all' ? 'btn-primary' : 'btn-secondary'}
        >
          All
        </button>
        <button 
          onClick={() => setFilter('planned')}
          className={filter === 'planned' ? 'btn-primary' : 'btn-secondary'}
        >
          Planned
        </button>
        <button 
          onClick={() => setFilter('completed')}
          className={filter === 'completed' ? 'btn-primary' : 'btn-secondary'}
        >
          Completed
        </button>
      </div>
      
      <div className="space-y-4">
        {filteredSessions.map(session => (
          <SessionCard key={session.id} session={session} />
        ))}
      </div>
    </div>
  )
}
```

### React 19 Features
```typescript
// Use React 19 useOptimistic for immediate UI updates
'use client'

import { useOptimistic, useTransition } from 'react'
import { createClientSupabaseClient } from '@/lib/supabase/client'

interface Payment {
  id: string
  amount: number
  player_name: string
  status: 'pending' | 'confirmed'
}

export function PaymentList({ initialPayments }: { initialPayments: Payment[] }) {
  const [isPending, startTransition] = useTransition()
  const [optimisticPayments, addOptimisticPayment] = useOptimistic(
    initialPayments,
    (state, newPayment: Payment) => [...state, newPayment]
  )
  
  const supabase = createClientSupabaseClient()
  
  const handleAddPayment = async (payment: Omit<Payment, 'id' | 'status'>) => {
    const optimisticPayment: Payment = {
      ...payment,
      id: crypto.randomUUID(),
      status: 'pending'
    }
    
    startTransition(async () => {
      addOptimisticPayment(optimisticPayment)
      
      // Actual database update
      await supabase
        .from('payments')
        .insert([{
          amount: payment.amount,
          player_name: payment.player_name
        }])
    })
  }
  
  return (
    <div>
      {optimisticPayments.map(payment => (
        <div 
          key={payment.id} 
          className={`p-4 border rounded ${
            payment.status === 'pending' ? 'opacity-50' : ''
          }`}
        >
          {payment.player_name}: ${payment.amount}
          {payment.status === 'pending' && <span className="ml-2">⏳</span>}
        </div>
      ))}
    </div>
  )
}

// Use new use() hook for data fetching in components
import { use } from 'react'

function UserProfile({ userPromise }: { userPromise: Promise<User> }) {
  const user = use(userPromise) // React 19 feature
  
  return (
    <div className="profile-card">
      <h2>{user.name}</h2>
      <p>Balance: ${user.balance}</p>
    </div>
  )
}
```

---

## 🔧 TypeScript Standards

### Strict Configuration
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true,
    "allowUnusedLabels": false,
    "allowUnreachableCode": false
  }
}
```

### Type Definitions
```typescript
// src/types/database.ts - Generated from Supabase
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          phone_number: string
          role: 'organizer' | 'player'
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          phone_number: string
          role: 'organizer' | 'player'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone_number?: string
          role?: 'organizer' | 'player'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      // ... other tables
    }
  }
}

// src/types/app.ts - Application-specific types
export type User = Database['public']['Tables']['users']['Row']
export type Session = Database['public']['Tables']['sessions']['Row']
export type Payment = Database['public']['Tables']['payments']['Row']

// Domain-specific types
export interface SessionCost {
  courtCost: Money
  shuttlecockCost: Money
  totalCost: Money
  costPerPlayer: Money
  attendeeCount: number
}

export interface PlayerBalance {
  playerId: string
  playerName: string
  currentBalance: Money
  totalDebt: Money
  totalPaid: Money
  lastActivity: string
}

// Form types
export interface SessionFormData {
  date: string
  start_time: string
  location: string
  hours_played?: number
  shuttlecocks_used?: number
  attendees: Array<{
    player_id?: string
    temporary_player_name?: string
    temporary_player_phone?: string
    is_temporary: boolean
  }>
}

// API response types
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  hasMore: boolean
}
```

### Utility Types
```typescript
// src/types/utils.ts
export type NonEmptyArray<T> = [T, ...T[]]

export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>

export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>

// Financial calculation result
export type CalculationResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string }

// Form validation result
export type ValidationResult = 
  | { isValid: true }
  | { isValid: false; errors: Record<string, string> }

// Usage examples
type SessionWithAttendees = RequiredKeys<Session, 'hours_played' | 'shuttlecocks_used'>
type SessionFormPartial = PartialExcept<SessionFormData, 'date' | 'location'>
```

---

## 🔌 Supabase Integration Patterns

### Client Setup
```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClientSupabaseClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export function createServerSupabaseClient() {
  const cookieStore = cookies()
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}
```

### Database Functions
```typescript
// src/lib/supabase/functions.ts
import type { Database } from '@/types/database'

export interface DatabaseFunctions {
  get_player_balance: {
    Args: { player_id: string }
    Returns: number
  }
  complete_session: {
    Args: {
      session_id: string
      hours_played: number
      shuttlecocks_used: number
      attendee_ids: string[]
    }
    Returns: {
      success: boolean
      total_cost: number
      cost_per_player: number
    }
  }
}

// Usage with proper typing
const getPlayerBalance = async (playerId: string) => {
  const supabase = createClientSupabaseClient()
  
  const { data, error } = await supabase
    .rpc('get_player_balance', { player_id: playerId })
  
  if (error) {
    throw new Error(`Failed to get player balance: ${error.message}`)
  }
  
  return data
}
```

### Real-time Subscriptions
```typescript
// src/hooks/useRealtimeBalance.ts
import { useEffect, useState } from 'react'
import { createClientSupabaseClient } from '@/lib/supabase/client'
import type { PlayerBalance } from '@/types/app'

export function useRealtimeBalance(playerId: string) {
  const [balance, setBalance] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientSupabaseClient()
  
  useEffect(() => {
    const fetchInitialBalance = async () => {
      const data = await getPlayerBalance(playerId)
      setBalance(data)
      setIsLoading(false)
    }
    
    fetchInitialBalance()
    
    // Subscribe to payment changes
    const paymentsChannel = supabase
      .channel(`player-${playerId}-payments`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
          filter: `player_id=eq.${playerId}`,
        },
        () => {
          // Refetch balance when payments change
          fetchInitialBalance()
        }
      )
      .subscribe()
    
    // Subscribe to session changes (affects debt)
    const sessionsChannel = supabase
      .channel(`player-${playerId}-sessions`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_players',
          filter: `player_id=eq.${playerId}`,
        },
        () => {
          // Refetch balance when session participation changes
          fetchInitialBalance()
        }
      )
      .subscribe()
    
    return () => {
      paymentsChannel.unsubscribe()
      sessionsChannel.unsubscribe()
    }
  }, [playerId, supabase])
  
  return { balance, isLoading }
}
```

---

## 🧪 Testing Standards
const example = {
  property: 'value',
  method: () => {
    return 'result';
  },
};

// Maximum line length: 80-100 characters
const longString = 'This is a very long string that should be ' +
  'broken into multiple lines for better readability';

// Blank lines for logical separation
class Example {
  constructor() {
    this.property = 'value';
  }

  methodOne() {
    // Implementation
  }

  methodTwo() {
    // Implementation
  }
}
```

### Naming Conventions
| Type | Convention | Example |
|------|------------|---------|
| Variables | camelCase | `userName`, `isActive` |
| Constants | UPPER_SNAKE_CASE | `API_KEY`, `MAX_RETRIES` |
| Functions | camelCase | `getUserData()`, `calculateTotal()` |
| Classes | PascalCase | `UserService`, `DataModel` |
| Interfaces | PascalCase | `IUserData`, `ApiResponse` |
| Types | PascalCase | `UserRole`, `Status` |
| Enums | PascalCase | `Color`, `Direction` |
| Files | PascalCase/camelCase | `UserProfile.tsx`, `utils.ts` |
| CSS Classes | kebab-case | `user-profile`, `nav-bar` |

### File Organization
```typescript
// 1. Imports (grouped and ordered)
import React, { useState, useEffect } from 'react'; // External
import { useAuth } from '@/hooks';                   // Internal absolute
import { formatDate } from './utils';                // Internal relative
import type { User } from '@/types';                 // Type imports

// 2. Type definitions
interface Props {
  user: User;
  onUpdate: (user: User) => void;
}

// 3. Constants
const MAX_NAME_LENGTH = 50;

// 4. Component/Function
export const UserProfile: React.FC<Props> = ({ user, onUpdate }) => {
  // Implementation
};

// 5. Exports
export default UserProfile;
```

---

## 📘 TypeScript/JavaScript Standards

### Type Safety
```typescript
// Always use explicit types
const processUser = (user: User): ProcessedUser => {
  return {
    ...user,
    fullName: `${user.firstName} ${user.lastName}`,
  };
};

// Avoid 'any' type
// ❌ Bad
const handleData = (data: any) => { };

// ✅ Good
const handleData = (data: unknown) => {
  if (isValidData(data)) {
    // Process data
  }
};

// Use type guards
const isUser = (obj: unknown): obj is User => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj
  );
};
```

### Async/Await
```typescript
// Prefer async/await over promises
// ❌ Bad
function fetchUser(id: string) {
  return api.get(`/users/${id}`)
    .then(response => response.data)
    .catch(error => console.error(error));
}

// ✅ Good
async function fetchUser(id: string): Promise<User> {
  try {
    const response = await api.get(`/users/${id}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw error;
  }
}
```

### Error Handling
```typescript
// Define custom error types
class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Comprehensive error handling
const processData = async (data: unknown): Promise<Result> => {
  try {
    // Validate input
    if (!isValidData(data)) {
      throw new ValidationError('Invalid data format', 'data');
    }

    // Process data
    const result = await transform(data);
    return result;
  } catch (error) {
    // Log error with context
    logger.error('Data processing failed', {
      error,
      data,
      timestamp: new Date().toISOString(),
    });

    // Re-throw or handle appropriately
    throw error;
  }
};
```

---

## 🧩 Component Standards

### React Component Structure
```typescript
// Functional component with TypeScript
interface UserCardProps {
  user: User;
  onSelect?: (user: User) => void;
  className?: string;
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  onSelect,
  className,
}) => {
  // Hooks (in order of usage)
  const [isExpanded, setIsExpanded] = useState(false);
  const { theme } = useTheme();
  const navigation = useNavigation();

  // Memoized values
  const fullName = useMemo(
    () => `${user.firstName} ${user.lastName}`,
    [user.firstName, user.lastName]
  );

  // Callbacks
  const handleClick = useCallback(() => {
    onSelect?.(user);
    setIsExpanded(!isExpanded);
  }, [user, onSelect, isExpanded]);

  // Effects
  useEffect(() => {
    // Effect logic
  }, [/* dependencies */]);

  // Render helpers
  const renderDetails = () => {
    if (!isExpanded) return null;
    return <UserDetails user={user} />;
  };

  // Main render
  return (
    <div className={className} onClick={handleClick}>
      <h3>{fullName}</h3>
      {renderDetails()}
    </div>
  );
};
```

### Component Best Practices
```typescript
// Props interface with JSDoc
interface ButtonProps {
  /** Button variant style */
  variant?: 'primary' | 'secondary' | 'danger';
  /** Button size */
  size?: 'small' | 'medium' | 'large';
  /** Disabled state */
  disabled?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Child elements */
  children: React.ReactNode;
}

// Default props
const defaultProps: Partial<ButtonProps> = {
  variant: 'primary',
  size: 'medium',
  disabled: false,
};

// Component with defaults
export const Button: React.FC<ButtonProps> = (props) => {
  const { variant, size, disabled, onClick, children } = {
    ...defaultProps,
    ...props,
  };

  return (
    <button
      className={`btn btn-${variant} btn-${size}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

---

## 🧪 Testing Standards

### Test Structure
```typescript
// Follow AAA pattern: Arrange, Act, Assert
describe('UserService', () => {
  describe('getUserById', () => {
    it('should return user when ID exists', async () => {
      // Arrange
      const userId = '123';
      const expectedUser = { id: userId, name: 'John Doe' };
      mockApi.get.mockResolvedValue({ data: expectedUser });

      // Act
      const result = await userService.getUserById(userId);

      // Assert
      expect(result).toEqual(expectedUser);
      expect(mockApi.get).toHaveBeenCalledWith(`/users/${userId}`);
    });

    it('should throw error when user not found', async () => {
      // Arrange
      const userId = 'nonexistent';
      mockApi.get.mockRejectedValue(new Error('User not found'));

      // Act & Assert
      await expect(userService.getUserById(userId))
        .rejects.toThrow('User not found');
    });
  });
});
```

### Testing Guidelines
1. **Test behavior, not implementation**
2. **Write descriptive test names**
3. **Keep tests independent**
4. **Use meaningful assertions**
5. **Mock external dependencies**
6. **Aim for 80%+ code coverage**

---

## 📝 Documentation Standards

### Code Comments
```typescript
/**
 * Calculates the total price including tax and discount.
 * 
 * @param price - Base price in cents
 * @param taxRate - Tax rate as decimal (e.g., 0.08 for 8%)
 * @param discount - Discount amount in cents
 * @returns Total price in cents
 * 
 * @example
 * calculateTotal(1000, 0.08, 100) // Returns 972 (10.00 * 1.08 - 1.00)
 */
export const calculateTotal = (
  price: number,
  taxRate: number,
  discount: number = 0
): number => {
  const subtotal = price - discount;
  return Math.round(subtotal * (1 + taxRate));
};

// Use inline comments sparingly for complex logic
const result = data
  .filter(item => item.active) // Only active items
  .sort((a, b) => b.priority - a.priority) // Sort by priority desc
  .slice(0, 10); // Take top 10
```

### README Standards
Every module should have a README with:
- Purpose and overview
- Installation instructions
- Usage examples
- API documentation
- Contributing guidelines

---

## 🔄 Git Conventions

### Branch Naming
```
feature/user-authentication
bugfix/login-error-handling
hotfix/critical-security-patch
chore/update-dependencies
docs/api-documentation
```

### Commit Messages
```
# Format: <type>(<scope>): <subject>

feat(auth): add social login support
fix(ui): resolve button alignment issue
docs(api): update endpoint documentation
style(global): format code with prettier
refactor(user): simplify data processing
test(auth): add integration tests
chore(deps): update React to v18
```

### Commit Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation only
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

---

## ⚡ Performance Guidelines

### Optimization Rules
```typescript
// Memoize expensive computations
const ExpensiveComponent: React.FC<Props> = ({ data }) => {
  const processedData = useMemo(
    () => expensiveProcessing(data),
    [data]
  );

  return <div>{processedData}</div>;
};

// Optimize re-renders
const OptimizedChild = React.memo(({ value, onChange }) => {
  return <input value={value} onChange={onChange} />;
});

// Lazy load components
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));

// Debounce user input
const SearchInput: React.FC = () => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery) {
      searchAPI(debouncedQuery);
    }
  }, [debouncedQuery]);

  return <input onChange={(e) => setQuery(e.target.value)} />;
};
```

---

## 🔒 Security Best Practices

### Security Guidelines
```typescript
// Sanitize user input
const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input);
};

// Never expose sensitive data
const UserProfile: React.FC<{ user: User }> = ({ user }) => {
  // ❌ Bad
  console.log('User data:', user); // May contain sensitive info

  // ✅ Good
  console.log('User ID:', user.id);
  
  return <div>{user.name}</div>;
};

// Validate all inputs
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Use environment variables for secrets
const apiKey = process.env.REACT_APP_API_KEY;
// Never commit .env files with real values
```

---

## ✅ Code Review Checklist

### Before Submitting PR
- [ ] Code follows style guide
- [ ] All tests pass
- [ ] No console.log statements
- [ ] No commented-out code
- [ ] Documentation updated
- [ ] No security vulnerabilities
- [ ] Performance considered
- [ ] Error handling implemented

### Review Focus Areas
1. **Logic Correctness**: Does it work as intended?
2. **Code Quality**: Is it clean and maintainable?
3. **Performance**: Are there any bottlenecks?
4. **Security**: Are there vulnerabilities?
5. **Testing**: Is it adequately tested?
6. **Documentation**: Is it well documented?

---

## Template Usage Instructions

### Initial Setup
1. Replace all `[PLACEHOLDERS]` with project-specific values
2. Adjust standards based on team preferences
3. Add framework-specific guidelines
4. Include examples from actual codebase
5. Delete this instruction section

### Customization
- Add language-specific sections (Python, Go, etc.)
- Include framework conventions (React, Vue, Angular)
- Add team-specific rules
- Include automated tooling setup (ESLint, Prettier)

### Maintenance
- Review and update quarterly
- Add new patterns as they emerge
- Remove outdated practices
- Ensure alignment with latest best practices
- Get team buy-in for changes