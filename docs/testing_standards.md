# Testing Standards - Badminton Cost Sharing App

**Version**: 1.0  
**Last Updated**: 2025-07-13  
**Framework**: Jest, React Testing Library, Playwright  
**Coverage Target**: 80%+ for financial calculations, 70%+ overall

---

## 📋 Table of Contents

1. [Testing Strategy](#testing-strategy)
2. [Financial Calculation Testing](#financial-calculation-testing)
3. [Component Testing](#component-testing)
4. [Integration Testing](#integration-testing)
5. [Security Testing](#security-testing)
6. [End-to-End Testing](#end-to-end-testing)
7. [Performance Testing](#performance-testing)
8. [Testing Tools & Setup](#testing-tools--setup)
9. [Test Organization](#test-organization)
10. [Coverage Requirements](#coverage-requirements)

---

## 🎯 Testing Strategy

### Testing Pyramid
```
    E2E Tests (10%)
   ┌─────────────────┐
   │ User Journeys   │
   │ Critical Flows  │
   └─────────────────┘
  
  Integration Tests (20%)
 ┌──────────────────────┐
 │ API + Database       │
 │ Component + Hooks    │
 │ Supabase Functions   │
 └──────────────────────┘

Unit Tests (70%)
┌────────────────────────────┐
│ Financial Calculations     │
│ Utility Functions         │
│ Component Logic           │
│ Validation Functions      │
└────────────────────────────┘
```

### Testing Priorities by Risk
1. **Critical (100% coverage)**: Financial calculations, payment processing
2. **High (90% coverage)**: Authentication, data validation, security functions
3. **Medium (80% coverage)**: UI components, user interactions
4. **Low (60% coverage)**: Static content, styling helpers

### Test Categories
- **Unit Tests**: Individual functions and components
- **Integration Tests**: Database operations, API interactions
- **Contract Tests**: Supabase function interfaces
- **E2E Tests**: Critical user journeys
- **Security Tests**: Authentication and authorization
- **Performance Tests**: Load testing for calculations

---

## 💰 Financial Calculation Testing

### Money Calculation Tests
```typescript
// src/lib/calculations/__tests__/money.test.ts
import Decimal from 'decimal.js';
import { MoneyCalculator, Money } from '../money';

describe('MoneyCalculator', () => {
  const SGD_10 = { amount: new Decimal('10.00'), currency: 'SGD' as const };
  const SGD_5 = { amount: new Decimal('5.00'), currency: 'SGD' as const };
  
  describe('add', () => {
    it('should add two money amounts correctly', () => {
      const result = MoneyCalculator.add(SGD_10, SGD_5);
      
      expect(result.amount.toString()).toBe('15.00');
      expect(result.currency).toBe('SGD');
    });
    
    it('should handle decimal precision correctly', () => {
      const money1 = { amount: new Decimal('10.99'), currency: 'SGD' as const };
      const money2 = { amount: new Decimal('5.01'), currency: 'SGD' as const };
      
      const result = MoneyCalculator.add(money1, money2);
      
      expect(result.amount.toString()).toBe('16.00');
    });
    
    it('should throw error for different currencies', () => {
      const usd = { amount: new Decimal('10.00'), currency: 'USD' as const };
      
      expect(() => MoneyCalculator.add(SGD_10, usd))
        .toThrow('Cannot add different currencies');
    });
  });
  
  describe('divide', () => {
    it('should divide money by number correctly', () => {
      const result = MoneyCalculator.divide(SGD_10, 4);
      
      expect(result.amount.toString()).toBe('2.50');
    });
    
    it('should handle division with remainder correctly', () => {
      const money = { amount: new Decimal('10.00'), currency: 'SGD' as const };
      const result = MoneyCalculator.divide(money, 3);
      
      // Should round to 2 decimal places
      expect(result.amount.toString()).toBe('3.33');
    });
    
    it('should throw error when dividing by zero', () => {
      expect(() => MoneyCalculator.divide(SGD_10, 0))
        .toThrow('Cannot divide by zero');
    });
  });
});

// Session cost calculation tests
describe('calculateSessionCost', () => {
  const courtRate = { amount: new Decimal('25.00'), currency: 'SGD' as const };
  const shuttlecockRate = { amount: new Decimal('3.00'), currency: 'SGD' as const };
  
  it('should calculate session cost correctly', () => {
    const result = calculateSessionCost(
      2.5, // hours
      4,   // shuttlecocks
      courtRate,
      shuttlecockRate,
      5    // attendees
    );
    
    // (2.5 * 25) + (4 * 3) = 62.5 + 12 = 74.5
    // 74.5 / 5 = 14.9
    expect(result.amount.toString()).toBe('14.90');
  });
  
  it('should handle edge cases', () => {
    // Test with minimum values
    const result = calculateSessionCost(0.5, 0, courtRate, shuttlecockRate, 1);
    expect(result.amount.toString()).toBe('12.50'); // 0.5 * 25 / 1
    
    // Test with maximum realistic values
    const maxResult = calculateSessionCost(8, 20, courtRate, shuttlecockRate, 1);
    expect(result.amount.toString()).toBe('260.00'); // (8 * 25 + 20 * 3) / 1
  });
  
  it('should validate input parameters', () => {
    expect(() => calculateSessionCost(-1, 4, courtRate, shuttlecockRate, 5))
      .toThrow('Hours must be positive');
      
    expect(() => calculateSessionCost(2, -1, courtRate, shuttlecockRate, 5))
      .toThrow('Shuttlecocks must be non-negative');
      
    expect(() => calculateSessionCost(2, 4, courtRate, shuttlecockRate, 0))
      .toThrow('Attendee count must be positive');
  });
});
```

### Property-Based Testing for Financial Operations
```typescript
// src/lib/calculations/__tests__/money-properties.test.ts
import fc from 'fast-check';
import { MoneyCalculator } from '../money';

describe('Money Property Tests', () => {
  it('addition should be commutative', () => {
    fc.assert(fc.property(
      fc.float({ min: 0, max: 1000, noNaN: true }),
      fc.float({ min: 0, max: 1000, noNaN: true }),
      (a, b) => {
        const moneyA = { amount: new Decimal(a.toFixed(2)), currency: 'SGD' as const };
        const moneyB = { amount: new Decimal(b.toFixed(2)), currency: 'SGD' as const };
        
        const result1 = MoneyCalculator.add(moneyA, moneyB);
        const result2 = MoneyCalculator.add(moneyB, moneyA);
        
        return result1.amount.equals(result2.amount);
      }
    ));
  });
  
  it('division and multiplication should be inverse operations', () => {
    fc.assert(fc.property(
      fc.float({ min: 1, max: 1000, noNaN: true }),
      fc.integer({ min: 2, max: 10 }),
      (amount, divisor) => {
        const money = { amount: new Decimal(amount.toFixed(2)), currency: 'SGD' as const };
        
        const divided = MoneyCalculator.divide(money, divisor);
        const multiplied = MoneyCalculator.multiply(divided, divisor);
        
        // Should be equal within rounding tolerance
        const difference = multiplied.amount.minus(money.amount).abs();
        return difference.lessThanOrEqualTo(new Decimal('0.01'));
      }
    ));
  });
});
```

---

## 🧩 Component Testing

### React Component Testing with Financial Data
```typescript
// src/components/__tests__/MoneyInput.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MoneyInput } from '../MoneyInput';

describe('MoneyInput', () => {
  const mockOnChange = jest.fn();
  
  beforeEach(() => {
    mockOnChange.mockClear();
  });
  
  it('should render with label', () => {
    render(
      <MoneyInput
        value=""
        onChange={mockOnChange}
        label="Payment Amount"
      />
    );
    
    expect(screen.getByLabelText('Payment Amount')).toBeInTheDocument();
    expect(screen.getByText('$')).toBeInTheDocument(); // Currency symbol
  });
  
  it('should validate monetary input format', async () => {
    const user = userEvent.setup();
    
    render(
      <MoneyInput
        value=""
        onChange={mockOnChange}
        label="Amount"
      />
    );
    
    const input = screen.getByLabelText('Amount');
    
    // Valid inputs
    await user.type(input, '12.34');
    expect(mockOnChange).toHaveBeenLastCalledWith('12.34');
    expect(screen.queryByText(/invalid amount/i)).not.toBeInTheDocument();
    
    // Invalid inputs
    await user.clear(input);
    await user.type(input, '12.345'); // Too many decimal places
    
    await waitFor(() => {
      expect(screen.getByText(/invalid amount format/i)).toBeInTheDocument();
    });
  });
  
  it('should enforce business rules', async () => {
    const user = userEvent.setup();
    
    render(<MoneyInput value="" onChange={mockOnChange} label="Amount" />);
    
    const input = screen.getByLabelText('Amount');
    
    // Test maximum amount
    await user.type(input, '1001');
    await waitFor(() => {
      expect(screen.getByText(/cannot exceed \$1000/i)).toBeInTheDocument();
    });
    
    // Test negative amount
    await user.clear(input);
    await user.type(input, '-5');
    await waitFor(() => {
      expect(screen.getByText(/must be greater than zero/i)).toBeInTheDocument();
    });
  });
  
  it('should handle paste operations securely', async () => {
    const user = userEvent.setup();
    
    render(<MoneyInput value="" onChange={mockOnChange} label="Amount" />);
    
    const input = screen.getByLabelText('Amount');
    
    // Paste malicious content
    await user.click(input);
    await user.paste('<script>alert("xss")</script>');
    
    // Should sanitize the input
    expect(mockOnChange).toHaveBeenCalledWith('');
    expect(input).toHaveValue('');
  });
});

// Session Card Component Tests
describe('SessionCard', () => {
  const mockSession = {
    id: '1',
    date: '2024-07-20',
    start_time: '19:00',
    location: 'Sports Hub Court 1',
    status: 'completed' as const,
    total_cost: 74.50,
    hours_played: 2.5,
    shuttlecocks_used: 4,
  };
  
  it('should display session information correctly', () => {
    render(<SessionCard session={mockSession} />);
    
    expect(screen.getByText('Sports Hub Court 1')).toBeInTheDocument();
    expect(screen.getByText(/Jul 20.*7:00 PM/)).toBeInTheDocument();
    expect(screen.getByText('$74.50')).toBeInTheDocument();
  });
  
  it('should handle different session statuses', () => {
    const plannedSession = { ...mockSession, status: 'planned' as const, total_cost: undefined };
    
    render(<SessionCard session={plannedSession} />);
    
    expect(screen.getByText('Planned')).toBeInTheDocument();
    expect(screen.queryByText('$')).not.toBeInTheDocument(); // No cost for planned
  });
  
  it('should be accessible', () => {
    render(<SessionCard session={mockSession} />);
    
    // Should have proper ARIA labels
    const card = screen.getByRole('article');
    expect(card).toHaveAttribute('aria-label', expect.stringContaining('Session'));
    
    // Should have proper heading hierarchy
    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
  });
});
```

### Hook Testing
```typescript
// src/hooks/__tests__/useRealtimeBalance.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useRealtimeBalance } from '../useRealtimeBalance';
import { createClientSupabaseClient } from '@/lib/supabase/client';

// Mock Supabase client
jest.mock('@/lib/supabase/client');
const mockSupabase = createClientSupabaseClient as jest.MockedFunction<typeof createClientSupabaseClient>;

describe('useRealtimeBalance', () => {
  const mockChannel = {
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
  };
  
  const mockSupabaseClient = {
    rpc: jest.fn(),
    channel: jest.fn().mockReturnValue(mockChannel),
  };
  
  beforeEach(() => {
    mockSupabase.mockReturnValue(mockSupabaseClient as any);
    jest.clearAllMocks();
  });
  
  it('should fetch initial balance', async () => {
    mockSupabaseClient.rpc.mockResolvedValue({ data: -25.50, error: null });
    
    const { result } = renderHook(() => useRealtimeBalance('user-1'));
    
    expect(result.current.isLoading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.balance).toBe(-25.50);
    expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('get_player_balance', {
      player_id: 'user-1',
    });
  });
  
  it('should set up real-time subscriptions', () => {
    renderHook(() => useRealtimeBalance('user-1'));
    
    expect(mockSupabaseClient.channel).toHaveBeenCalledWith('player-user-1-payments');
    expect(mockSupabaseClient.channel).toHaveBeenCalledWith('player-user-1-sessions');
    expect(mockChannel.on).toHaveBeenCalledTimes(2);
    expect(mockChannel.subscribe).toHaveBeenCalledTimes(2);
  });
  
  it('should clean up subscriptions on unmount', () => {
    const { unmount } = renderHook(() => useRealtimeBalance('user-1'));
    
    unmount();
    
    expect(mockChannel.unsubscribe).toHaveBeenCalledTimes(2);
  });
});
```

---

## 🔗 Integration Testing

### Supabase Integration Tests
```typescript
// src/lib/supabase/__tests__/functions.integration.test.ts
import { createServerSupabaseClient } from '../server';
import { setupTestDatabase, cleanupTestDatabase } from '../../test-utils/database';

describe('Supabase Functions Integration', () => {
  let supabase: ReturnType<typeof createServerSupabaseClient>;
  
  beforeAll(async () => {
    await setupTestDatabase();
    supabase = createServerSupabaseClient();
  });
  
  afterAll(async () => {
    await cleanupTestDatabase();
  });
  
  describe('get_player_balance', () => {
    it('should calculate player balance correctly', async () => {
      // Setup test data
      const { data: user } = await supabase
        .from('users')
        .insert({
          name: 'Test Player',
          phone_number: '+6512345678',
          role: 'player',
        })
        .select()
        .single();
      
      // Add some session costs
      const { data: session } = await supabase
        .from('sessions')
        .insert({
          date: '2024-07-20',
          start_time: '19:00',
          location: 'Test Court',
          status: 'completed',
          total_cost: 60.00,
        })
        .select()
        .single();
      
      await supabase
        .from('session_players')
        .insert({
          session_id: session.id,
          player_id: user.id,
          cost_share: 15.00,
        });
      
      // Add a payment
      await supabase
        .from('payments')
        .insert({
          player_id: user.id,
          amount: 10.00,
          payment_method: 'paynow',
          payment_date: '2024-07-21',
        });
      
      // Test the function
      const { data: balance, error } = await supabase
        .rpc('get_player_balance', { player_id: user.id });
      
      expect(error).toBeNull();
      expect(balance).toBe(5.00); // 15.00 debt - 10.00 payment
    });
  });
  
  describe('complete_session', () => {
    it('should complete session and calculate costs', async () => {
      // Setup test data
      const { data: session } = await supabase
        .from('sessions')
        .insert({
          date: '2024-07-20',
          start_time: '19:00',
          location: 'Test Court',
          status: 'planned',
        })
        .select()
        .single();
      
      const { data: users } = await supabase
        .from('users')
        .insert([
          { name: 'Player 1', phone_number: '+6512345671', role: 'player' },
          { name: 'Player 2', phone_number: '+6512345672', role: 'player' },
        ])
        .select();
      
      // Complete the session
      const { data: result, error } = await supabase
        .rpc('complete_session', {
          session_id: session.id,
          hours_played: 2.0,
          shuttlecocks_used: 3,
          attendee_ids: users.map(u => u.id),
        });
      
      expect(error).toBeNull();
      expect(result.success).toBe(true);
      expect(result.total_cost).toBe(59.00); // (2 * 25) + (3 * 3)
      expect(result.cost_per_player).toBe(29.50); // 59 / 2
      
      // Verify session was updated
      const { data: updatedSession } = await supabase
        .from('sessions')
        .select()
        .eq('id', session.id)
        .single();
      
      expect(updatedSession.status).toBe('completed');
      expect(updatedSession.total_cost).toBe(59.00);
      
      // Verify session players were created
      const { data: sessionPlayers } = await supabase
        .from('session_players')
        .select()
        .eq('session_id', session.id);
      
      expect(sessionPlayers).toHaveLength(2);
      expect(sessionPlayers[0].cost_share).toBe(29.50);
    });
  });
});
```

---

## 🔒 Security Testing

### Authentication Testing
```typescript
// src/lib/auth/__tests__/security.test.ts
import { validateOTP, generateSecureOTP } from '../otp';
import { rateLimit } from '../rate-limiting';

describe('OTP Security', () => {
  describe('generateSecureOTP', () => {
    it('should generate cryptographically secure OTPs', () => {
      const otps = Array.from({ length: 1000 }, () => generateSecureOTP());
      
      // All OTPs should be 6 digits
      expect(otps.every(otp => /^\d{6}$/.test(otp))).toBe(true);
      
      // Should have good distribution (no obvious patterns)
      const uniqueOTPs = new Set(otps);
      expect(uniqueOTPs.size).toBeGreaterThan(900); // Allow some collisions
      
      // Should not have obvious patterns
      const sequentialCount = otps.filter(otp => 
        otp === '123456' || otp === '000000' || otp === '111111'
      ).length;
      expect(sequentialCount).toBeLessThan(5); // Very low probability
    });
  });
  
  describe('validateOTP', () => {
    it('should enforce rate limiting', async () => {
      const phoneNumber = '+6512345678';
      
      // First few attempts should work
      for (let i = 0; i < 3; i++) {
        const result = await validateOTP(phoneNumber, '123456');
        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid OTP');
      }
      
      // Next attempt should trigger lockout
      const lockedResult = await validateOTP(phoneNumber, '123456');
      expect(lockedResult.success).toBe(false);
      expect(lockedResult.error).toContain('locked');
      expect(lockedResult.lockoutTime).toBeGreaterThan(Date.now());
    });
    
    it('should validate OTP timing', async () => {
      const phoneNumber = '+6512345678';
      
      // Mock expired OTP
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-07-20T10:00:00Z'));
      
      // Simulate OTP generated 10 minutes ago
      const expiredTime = new Date('2024-07-20T09:50:00Z');
      
      const result = await validateOTP(phoneNumber, '123456');
      expect(result.success).toBe(false);
      expect(result.error).toContain('expired');
      
      jest.useRealTimers();
    });
  });
});

// Input validation security tests
describe('Input Validation Security', () => {
  describe('sanitizeUserInput', () => {
    it('should prevent XSS attacks', () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(1)">',
        '"><script>alert("xss")</script>',
      ];
      
      maliciousInputs.forEach(input => {
        const sanitized = sanitizeUserInput(input);
        expect(sanitized).not.toContain('<script');
        expect(sanitized).not.toContain('javascript:');
        expect(sanitized).not.toContain('onerror=');
      });
    });
    
    it('should preserve safe content', () => {
      const safeInputs = [
        'John Doe',
        'Sports Hub Court 1',
        'Payment for session on 2024-07-20',
        'Amount: $25.50',
      ];
      
      safeInputs.forEach(input => {
        const sanitized = sanitizeUserInput(input);
        expect(sanitized).toBe(input);
      });
    });
  });
  
  describe('validatePaymentAmount', () => {
    it('should prevent monetary injection attacks', () => {
      const maliciousAmounts = [
        '25.00; DROP TABLE payments;',
        '25.00\' OR 1=1',
        '${process.env.SECRET}',
        'eval("malicious code")',
      ];
      
      maliciousAmounts.forEach(amount => {
        const result = validatePaymentAmount(amount);
        expect(result.isValid).toBe(false);
      });
    });
  });
});
```

---

## 🌐 End-to-End Testing

### Critical User Journey Tests
```typescript
// tests/e2e/organizer-journey.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Organizer Critical Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Setup test user and login
    await page.goto('/login');
    await page.fill('[data-testid="phone-input"]', '+6512345678');
    await page.click('[data-testid="send-otp"]');
    
    // Mock OTP verification for testing
    await page.fill('[data-testid="otp-input"]', '123456');
    await page.click('[data-testid="verify-otp"]');
    
    await expect(page).toHaveURL('/dashboard');
  });
  
  test('should complete full session recording flow', async ({ page }) => {
    // Navigate to record session
    await page.click('[data-testid="record-session-btn"]');
    await expect(page).toHaveURL('/sessions/record');
    
    // Fill session details
    await page.fill('[data-testid="session-date"]', '2024-07-25');
    await page.fill('[data-testid="session-time"]', '19:00');
    await page.fill('[data-testid="session-location"]', 'Sports Hub Court 1');
    
    // Add session usage
    await page.fill('[data-testid="hours-played"]', '2.5');
    await page.fill('[data-testid="shuttlecocks-used"]', '4');
    
    // Select attendees
    await page.check('[data-testid="attendee-john"]');
    await page.check('[data-testid="attendee-jane"]');
    
    // Add temporary player
    await page.click('[data-testid="add-temp-player"]');
    await page.fill('[data-testid="temp-player-name"]', 'Guest Mike');
    await page.fill('[data-testid="temp-player-phone"]', '+6587654321');
    
    // Submit session
    await page.click('[data-testid="complete-session"]');
    
    // Verify session was created
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Session recorded successfully');
    
    // Verify cost calculation
    await expect(page.locator('[data-testid="total-cost"]')).toContainText('$74.50');
    await expect(page.locator('[data-testid="cost-per-player"]')).toContainText('$24.83');
    
    // Navigate back to dashboard
    await page.click('[data-testid="back-to-dashboard"]');
    
    // Verify session appears in recent activity
    await expect(page.locator('[data-testid="recent-sessions"]')).toContainText('Sports Hub Court 1');
  });
  
  test('should record payment successfully', async ({ page }) => {
    // Navigate to record payment
    await page.click('[data-testid="record-payment-btn"]');
    
    // Select player
    await page.selectOption('[data-testid="player-select"]', 'john-doe-id');
    
    // Fill payment details
    await page.fill('[data-testid="payment-amount"]', '50.00');
    await page.selectOption('[data-testid="payment-method"]', 'paynow');
    await page.fill('[data-testid="payment-notes"]', 'PayNow received via WhatsApp');
    
    // Submit payment
    await page.click('[data-testid="record-payment"]');
    
    // Verify success
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Payment recorded');
    
    // Verify balance update
    await expect(page.locator('[data-testid="player-balance"]')).toContainText('+$25.17');
  });
  
  test('should handle errors gracefully', async ({ page }) => {
    // Test network error handling
    await page.route('**/api/sessions', route => route.abort());
    
    await page.click('[data-testid="record-session-btn"]');
    await page.fill('[data-testid="session-date"]', '2024-07-25');
    await page.click('[data-testid="complete-session"]');
    
    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Network error');
    
    // Should allow retry
    await expect(page.locator('[data-testid="retry-btn"]')).toBeVisible();
  });
});

test.describe('Player Journey', () => {
  test('should view balance and session history', async ({ page }) => {
    // Login as player
    await page.goto('/login');
    await page.fill('[data-testid="phone-input"]', '+6587654321');
    await page.click('[data-testid="send-otp"]');
    await page.fill('[data-testid="otp-input"]', '123456');
    await page.click('[data-testid="verify-otp"]');
    
    // Should see player dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-role"]')).toContainText('Player');
    
    // Should see current balance
    await expect(page.locator('[data-testid="current-balance"]')).toBeVisible();
    
    // Should see upcoming sessions
    await expect(page.locator('[data-testid="upcoming-sessions"]')).toBeVisible();
    
    // Navigate to transaction history
    await page.click('[data-testid="view-history"]');
    await expect(page).toHaveURL('/history');
    
    // Should see transactions
    await expect(page.locator('[data-testid="transaction-list"]')).toBeVisible();
    
    // Should see payment instructions
    await expect(page.locator('[data-testid="payment-instructions"]')).toContainText('PayNow');
  });
});
```

### Performance Testing
```typescript
// tests/performance/load.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('should handle multiple concurrent users', async ({ page, context }) => {
    // Simulate 10 concurrent users
    const promises = Array.from({ length: 10 }, async (_, i) => {
      const newPage = await context.newPage();
      
      const startTime = Date.now();
      
      await newPage.goto('/dashboard');
      await newPage.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 3 seconds under load
      expect(loadTime).toBeLessThan(3000);
      
      await newPage.close();
    });
    
    await Promise.all(promises);
  });
  
  test('should handle large session calculations efficiently', async ({ page }) => {
    await page.goto('/sessions/record');
    
    // Add many attendees
    for (let i = 0; i < 20; i++) {
      await page.click('[data-testid="add-attendee"]');
      await page.fill(`[data-testid="attendee-${i}-name"]`, `Player ${i}`);
    }
    
    await page.fill('[data-testid="hours-played"]', '8');
    await page.fill('[data-testid="shuttlecocks-used"]', '20');
    
    const startTime = Date.now();
    
    await page.click('[data-testid="calculate-costs"]');
    await expect(page.locator('[data-testid="total-cost"]')).toBeVisible();
    
    const calculationTime = Date.now() - startTime;
    
    // Should calculate within 1 second
    expect(calculationTime).toBeLessThan(1000);
  });
});
```

---

## 🛠️ Testing Tools & Setup

### Jest Configuration
```javascript
// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    './src/lib/calculations/': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    './src/lib/validation/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  testMatch: [
    '**/__tests__/**/*.{js,jsx,ts,tsx}',
    '**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/tests/e2e/',
  ],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  transformIgnorePatterns: [
    '/node_modules/',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
};

module.exports = createJestConfig(customJestConfig);
```

### Playwright Configuration
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Test Database Setup
```typescript
// src/test-utils/database.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.TEST_SUPABASE_URL!;
const supabaseKey = process.env.TEST_SUPABASE_ANON_KEY!;

export const testSupabase = createClient(supabaseUrl, supabaseKey);

export const setupTestDatabase = async () => {
  // Clean all tables
  await testSupabase.from('session_players').delete().neq('id', '');
  await testSupabase.from('payments').delete().neq('id', '');
  await testSupabase.from('sessions').delete().neq('id', '');
  await testSupabase.from('users').delete().neq('id', '');
  
  // Insert test settings
  await testSupabase.from('settings').upsert({
    court_rate_per_hour: 25.00,
    shuttlecock_rate_per_piece: 3.00,
    organizer_paynow_details: 'PayNow to +6512345678 (Test Organizer)',
  });
};

export const cleanupTestDatabase = async () => {
  await setupTestDatabase(); // Same as setup - clean everything
};

export const createTestUser = async (overrides = {}) => {
  const defaultUser = {
    name: 'Test User',
    phone_number: '+6512345678',
    role: 'player',
    is_active: true,
  };
  
  const { data, error } = await testSupabase
    .from('users')
    .insert({ ...defaultUser, ...overrides })
    .select()
    .single();
  
  if (error) throw error;
  return data;
};
```

---

## 📊 Coverage Requirements

### Minimum Coverage Targets
- **Financial Calculations**: 100% (Critical for money handling)
- **Authentication & Security**: 95% (High security importance)
- **Input Validation**: 90% (Prevent malicious input)
- **Core Business Logic**: 85% (Essential functionality)
- **UI Components**: 70% (User interface)
- **Utility Functions**: 80% (Supporting code)

### Coverage Enforcement
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:coverage:report": "jest --coverage && open coverage/lcov-report/index.html",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:security": "jest --testPathPattern=security",
    "test:financial": "jest --testPathPattern=calculations",
    "test:ci": "npm run test:coverage && npm run test:e2e"
  }
}
```

This comprehensive testing standards document ensures your badminton cost-sharing app maintains high quality, security, and reliability standards throughout development.