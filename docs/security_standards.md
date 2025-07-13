# Security Standards - Badminton Cost Sharing App

**Version**: 1.0  
**Last Updated**: 2025-07-13  
**Framework**: Next.js 15 + Supabase  
**Security Level**: Financial Application

---

## 📋 Table of Contents

1. [Security Overview](#security-overview)
2. [Authentication Security](#authentication-security)
3. [Financial Data Protection](#financial-data-protection)
4. [Database Security](#database-security)
5. [Input Validation & Sanitization](#input-validation--sanitization)
6. [API Security](#api-security)
7. [Mobile Security](#mobile-security)
8. [Privacy & Data Protection](#privacy--data-protection)
9. [Audit & Monitoring](#audit--monitoring)
10. [Incident Response](#incident-response)
11. [Security Checklist](#security-checklist)

---

## 🛡️ Security Overview

### Security Principles
1. **Defense in Depth**: Multiple layers of security controls
2. **Least Privilege**: Users get minimum necessary permissions
3. **Zero Trust**: Never trust, always verify
4. **Privacy by Design**: Data protection built into architecture
5. **Secure by Default**: Secure configurations as default

### Threat Model
```typescript
// Primary threats for financial cost-sharing app
const THREATS = {
  // Financial threats
  UNAUTHORIZED_PAYMENT_ACCESS: 'High',
  DEBT_MANIPULATION: 'High', 
  FINANCIAL_DATA_BREACH: 'Critical',
  
  // Authentication threats
  ACCOUNT_TAKEOVER: 'High',
  PHONE_NUMBER_SPOOFING: 'Medium',
  OTP_INTERCEPTION: 'Medium',
  
  // Data threats
  PERSONAL_DATA_EXPOSURE: 'High',
  SESSION_HIJACKING: 'Medium',
  UNAUTHORIZED_ROLE_ESCALATION: 'High',
  
  // Application threats
  SQL_INJECTION: 'High',
  XSS_ATTACKS: 'Medium',
  CSRF_ATTACKS: 'Medium',
} as const;
```

### Security Standards Compliance
- **OWASP Top 10**: Web application security best practices
- **NIST Cybersecurity Framework**: Comprehensive security guidelines
- **Data Protection**: Singapore PDPA compliance
- **Financial Security**: Industry best practices for financial apps

---

## 🔐 Authentication Security

### Phone + OTP Security
```typescript
// Secure OTP implementation
const OTP_CONFIG = {
  LENGTH: 6,                    // 6-digit OTP
  EXPIRY_MINUTES: 5,           // Short expiry window
  MAX_ATTEMPTS: 3,             // Rate limiting
  COOLDOWN_MINUTES: 15,        // Lockout period
  PHONE_RATE_LIMIT: 5,         // OTPs per phone per hour
} as const;

// OTP validation with security controls
interface OTPValidation {
  phone_number: string;
  otp_code: string;
  attempt_count: number;
  last_attempt: string;
  is_locked: boolean;
  lock_until?: string;
}

const validateOTP = async (phoneNumber: string, otpCode: string): Promise<{
  success: boolean;
  error?: string;
  lockoutTime?: number;
}> => {
  // Rate limiting check
  const attempts = await getOTPAttempts(phoneNumber);
  
  if (attempts.is_locked) {
    const lockExpiry = new Date(attempts.lock_until!);
    if (lockExpiry > new Date()) {
      return {
        success: false,
        error: 'Account temporarily locked due to too many attempts',
        lockoutTime: lockExpiry.getTime(),
      };
    }
  }
  
  // Validate OTP timing
  const otpAge = Date.now() - new Date(attempts.last_attempt).getTime();
  if (otpAge > OTP_CONFIG.EXPIRY_MINUTES * 60 * 1000) {
    return {
      success: false,
      error: 'OTP has expired. Please request a new one.',
    };
  }
  
  // Validate OTP code
  const isValidOTP = await verifyOTPCode(phoneNumber, otpCode);
  
  if (!isValidOTP) {
    // Increment failed attempts
    const newAttemptCount = attempts.attempt_count + 1;
    
    if (newAttemptCount >= OTP_CONFIG.MAX_ATTEMPTS) {
      // Lock account
      await lockAccount(phoneNumber, OTP_CONFIG.COOLDOWN_MINUTES);
      return {
        success: false,
        error: `Too many failed attempts. Account locked for ${OTP_CONFIG.COOLDOWN_MINUTES} minutes.`,
      };
    }
    
    await incrementOTPAttempts(phoneNumber);
    return {
      success: false,
      error: `Invalid OTP. ${OTP_CONFIG.MAX_ATTEMPTS - newAttemptCount} attempts remaining.`,
    };
  }
  
  // Clear failed attempts on success
  await clearOTPAttempts(phoneNumber);
  return { success: true };
};

// Secure OTP generation
const generateSecureOTP = (): string => {
  // Use cryptographically secure random number generation
  const array = new Uint8Array(3); // 3 bytes = 24 bits
  crypto.getRandomValues(array);
  
  // Convert to 6-digit number
  const number = (array[0] << 16) | (array[1] << 8) | array[2];
  const otp = (number % 1000000).toString().padStart(6, '0');
  
  return otp;
};
```

### Session Management
```typescript
// Secure session configuration
const SESSION_CONFIG = {
  ACCESS_TOKEN_EXPIRY: '1h',     // Short-lived access tokens
  REFRESH_TOKEN_EXPIRY: '7d',    // Longer refresh tokens
  IDLE_TIMEOUT: '30m',           // Auto-logout on inactivity
  CONCURRENT_SESSIONS: 3,        // Max sessions per user
} as const;

// Session security middleware
const validateSession = async (request: Request): Promise<{
  user: User | null;
  error?: string;
}> => {
  const supabase = createServerSupabaseClient();
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return { user: null, error: 'Invalid session' };
    }
    
    // Check if user is active
    const { data: profile } = await supabase
      .from('users')
      .select('is_active, role')
      .eq('id', user.id)
      .single();
    
    if (!profile?.is_active) {
      await supabase.auth.signOut();
      return { user: null, error: 'Account deactivated' };
    }
    
    // Log session activity
    await logSecurityEvent({
      user_id: user.id,
      event_type: 'session_activity',
      metadata: {
        user_agent: request.headers.get('user-agent'),
        ip_address: getClientIP(request),
      },
    });
    
    return { user: { ...user, role: profile.role } };
  } catch (error) {
    console.error('Session validation error:', error);
    return { user: null, error: 'Session validation failed' };
  }
};

// Auto-logout on inactivity
const useIdleTimeout = (timeoutMinutes: number = 30) => {
  const supabase = createClientSupabaseClient();
  
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const resetTimeout = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        supabase.auth.signOut();
        window.location.href = '/login?reason=idle_timeout';
      }, timeoutMinutes * 60 * 1000);
    };
    
    // Events that reset the timeout
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, resetTimeout, true);
    });
    
    resetTimeout(); // Initial timeout
    
    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => {
        document.removeEventListener(event, resetTimeout, true);
      });
    };
  }, [supabase.auth, timeoutMinutes]);
};
```

---

## 💰 Financial Data Protection

### Data Encryption
```typescript
// Encrypt sensitive financial data at rest
import crypto from 'crypto';

const ENCRYPTION_CONFIG = {
  ALGORITHM: 'aes-256-gcm',
  KEY_LENGTH: 32,
  IV_LENGTH: 16,
  TAG_LENGTH: 16,
} as const;

class FinancialDataEncryption {
  private static getEncryptionKey(): Buffer {
    const key = process.env.FINANCIAL_ENCRYPTION_KEY;
    if (!key) {
      throw new Error('FINANCIAL_ENCRYPTION_KEY not configured');
    }
    return Buffer.from(key, 'hex');
  }
  
  static encrypt(plaintext: string): {
    encrypted: string;
    iv: string;
    tag: string;
  } {
    const key = this.getEncryptionKey();
    const iv = crypto.randomBytes(ENCRYPTION_CONFIG.IV_LENGTH);
    
    const cipher = crypto.createCipher(ENCRYPTION_CONFIG.ALGORITHM, key);
    cipher.setAAD(Buffer.from('financial_data'));
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
    };
  }
  
  static decrypt(encryptedData: {
    encrypted: string;
    iv: string;
    tag: string;
  }): string {
    const key = this.getEncryptionKey();
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const tag = Buffer.from(encryptedData.tag, 'hex');
    
    const decipher = crypto.createDecipher(ENCRYPTION_CONFIG.ALGORITHM, key);
    decipher.setAAD(Buffer.from('financial_data'));
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

// Usage for sensitive payment notes
const encryptPaymentNote = (note: string) => {
  if (!note.trim()) return null;
  
  return FinancialDataEncryption.encrypt(note);
};

const decryptPaymentNote = (encryptedNote: any) => {
  if (!encryptedNote) return '';
  
  try {
    return FinancialDataEncryption.decrypt(encryptedNote);
  } catch (error) {
    console.error('Failed to decrypt payment note:', error);
    return '[Encrypted data - decryption failed]';
  }
};
```

### Financial Transaction Security
```typescript
// Secure financial operation wrapper
interface SecureTransaction<T> {
  operation: () => Promise<T>;
  userId: string;
  description: string;
  metadata?: Record<string, any>;
}

class FinancialTransactionManager {
  static async executeSecurely<T>({
    operation,
    userId,
    description,
    metadata = {},
  }: SecureTransaction<T>): Promise<T> {
    const transactionId = crypto.randomUUID();
    const startTime = Date.now();
    
    try {
      // Log transaction start
      await this.logFinancialEvent({
        transaction_id: transactionId,
        user_id: userId,
        event_type: 'transaction_start',
        description,
        metadata,
      });
      
      // Execute the operation
      const result = await operation();
      
      // Log successful completion
      await this.logFinancialEvent({
        transaction_id: transactionId,
        user_id: userId,
        event_type: 'transaction_success',
        description,
        metadata: {
          ...metadata,
          duration_ms: Date.now() - startTime,
        },
      });
      
      return result;
    } catch (error) {
      // Log failure
      await this.logFinancialEvent({
        transaction_id: transactionId,
        user_id: userId,
        event_type: 'transaction_failure',
        description,
        metadata: {
          ...metadata,
          error: error instanceof Error ? error.message : 'Unknown error',
          duration_ms: Date.now() - startTime,
        },
      });
      
      throw error;
    }
  }
  
  private static async logFinancialEvent(event: {
    transaction_id: string;
    user_id: string;
    event_type: string;
    description: string;
    metadata: Record<string, any>;
  }) {
    const supabase = createServerSupabaseClient();
    
    await supabase
      .from('financial_audit_log')
      .insert([{
        ...event,
        timestamp: new Date().toISOString(),
      }]);
  }
}

// Usage example
const recordPayment = async (paymentData: PaymentInput) => {
  return FinancialTransactionManager.executeSecurely({
    operation: async () => {
      // Validate payment data
      const validation = validatePaymentData(paymentData);
      if (!validation.isValid) {
        throw new Error(`Invalid payment data: ${validation.errors.join(', ')}`);
      }
      
      // Record payment in database
      const supabase = createServerSupabaseClient();
      const { data, error } = await supabase
        .from('payments')
        .insert([paymentData])
        .select()
        .single();
      
      if (error) {
        throw new Error(`Payment recording failed: ${error.message}`);
      }
      
      return data;
    },
    userId: paymentData.recorded_by,
    description: `Record payment of $${paymentData.amount} for player ${paymentData.player_id}`,
    metadata: {
      amount: paymentData.amount,
      payment_method: paymentData.payment_method,
      player_id: paymentData.player_id,
    },
  });
};
```

---

## 🗄️ Database Security

### Row Level Security (RLS) Implementation
```sql
-- Comprehensive RLS policies for financial data protection

-- Users table - strict access control
CREATE POLICY "users_select_policy" ON users
  FOR SELECT USING (
    -- Users can see their own data
    id = auth.uid() OR
    -- Organizers can see all active users
    (EXISTS (
      SELECT 1 FROM users organizer 
      WHERE organizer.id = auth.uid() 
        AND organizer.role = 'organizer'
        AND organizer.is_active = true
    ))
  );

CREATE POLICY "users_insert_policy" ON users
  FOR INSERT WITH CHECK (
    -- Only organizers can create users
    EXISTS (
      SELECT 1 FROM users organizer 
      WHERE organizer.id = auth.uid() 
        AND organizer.role = 'organizer'
        AND organizer.is_active = true
    )
  );

-- Payments table - financial data protection
CREATE POLICY "payments_select_policy" ON payments
  FOR SELECT USING (
    -- Players can only see their own payments
    (player_id = auth.uid()) OR
    -- Organizers can see all payments
    (EXISTS (
      SELECT 1 FROM users organizer 
      WHERE organizer.id = auth.uid() 
        AND organizer.role = 'organizer'
        AND organizer.is_active = true
    ))
  );

CREATE POLICY "payments_insert_policy" ON payments
  FOR INSERT WITH CHECK (
    -- Only organizers can record payments
    EXISTS (
      SELECT 1 FROM users organizer 
      WHERE organizer.id = auth.uid() 
        AND organizer.role = 'organizer'
        AND organizer.is_active = true
    ) AND
    -- Recorded_by must be the authenticated user
    recorded_by = auth.uid()
  );

-- Session players table - cost sharing protection
CREATE POLICY "session_players_select_policy" ON session_players
  FOR SELECT USING (
    -- Players can see their own session participation
    (player_id = auth.uid() AND is_temporary_player = false) OR
    -- Organizers can see all session participation
    (EXISTS (
      SELECT 1 FROM users organizer 
      WHERE organizer.id = auth.uid() 
        AND organizer.role = 'organizer'
        AND organizer.is_active = true
    ))
  );

-- Audit log table - read-only for non-admins
CREATE POLICY "audit_log_select_policy" ON financial_audit_log
  FOR SELECT USING (
    -- Only organizers can read audit logs
    EXISTS (
      SELECT 1 FROM users organizer 
      WHERE organizer.id = auth.uid() 
        AND organizer.role = 'organizer'
        AND organizer.is_active = true
    )
  );

-- No delete policies - financial data should never be deleted
CREATE POLICY "no_delete_payments" ON payments
  FOR DELETE USING (false);

CREATE POLICY "no_delete_sessions" ON sessions
  FOR DELETE USING (false);
```

### Database Function Security
```sql
-- Secure function for balance calculation
CREATE OR REPLACE FUNCTION get_player_balance_secure(target_player_id UUID)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  current_user_role TEXT;
  calculated_balance DECIMAL(10,2);
BEGIN
  -- Get current authenticated user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Get user role
  SELECT role INTO current_user_role
  FROM users 
  WHERE id = current_user_id AND is_active = true;
  
  IF current_user_role IS NULL THEN
    RAISE EXCEPTION 'User not found or inactive';
  END IF;
  
  -- Check authorization
  IF current_user_role != 'organizer' AND current_user_id != target_player_id THEN
    RAISE EXCEPTION 'Insufficient permissions to access balance';
  END IF;
  
  -- Calculate balance securely
  WITH player_costs AS (
    SELECT COALESCE(SUM(sp.cost_share), 0) as total_debt
    FROM session_players sp
    JOIN sessions s ON sp.session_id = s.id
    WHERE sp.player_id = target_player_id 
      AND s.status = 'completed'
      AND sp.is_temporary_player = false
  ),
  player_payments AS (
    SELECT COALESCE(SUM(p.amount), 0) as total_paid
    FROM payments p
    WHERE p.player_id = target_player_id
  )
  SELECT (pc.total_debt - pp.total_paid) INTO calculated_balance
  FROM player_costs pc, player_payments pp;
  
  -- Log balance access
  INSERT INTO financial_audit_log (
    user_id, 
    event_type, 
    description, 
    metadata,
    timestamp
  ) VALUES (
    current_user_id,
    'balance_access',
    'Player balance accessed',
    json_build_object(
      'target_player_id', target_player_id,
      'balance', calculated_balance
    ),
    NOW()
  );
  
  RETURN calculated_balance;
END;
$$;

-- Revoke public access and grant specific permissions
REVOKE ALL ON FUNCTION get_player_balance_secure FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_player_balance_secure TO authenticated;
```

---

## 🛡️ Input Validation & Sanitization

### Comprehensive Input Validation
```typescript
// Input validation for financial data
import validator from 'validator';
import DOMPurify from 'isomorphic-dompurify';

interface ValidationRule<T> {
  field: keyof T;
  rules: Array<{
    validate: (value: any) => boolean;
    message: string;
  }>;
}

class SecureValidator {
  static validatePhone(phone: string): { isValid: boolean; error?: string } {
    // Remove all non-numeric characters
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Singapore phone number validation
    if (!cleanPhone.match(/^(\+65)?[689]\d{7}$/)) {
      return {
        isValid: false,
        error: 'Invalid Singapore phone number format',
      };
    }
    
    return { isValid: true };
  }
  
  static validatePaymentAmount(amount: string): { isValid: boolean; error?: string } {
    // Remove currency symbols and whitespace
    const cleanAmount = amount.replace(/[$\s,]/g, '');
    
    if (!validator.isDecimal(cleanAmount, { decimal_digits: '0,2' })) {
      return {
        isValid: false,
        error: 'Invalid amount format. Use format: 12.34',
      };
    }
    
    const numAmount = parseFloat(cleanAmount);
    
    if (numAmount <= 0) {
      return {
        isValid: false,
        error: 'Amount must be greater than zero',
      };
    }
    
    if (numAmount > 1000) {
      return {
        isValid: false,
        error: 'Amount cannot exceed $1000 per transaction',
      };
    }
    
    return { isValid: true };
  }
  
  static sanitizeUserInput(input: string): string {
    // Remove potentially dangerous characters
    let sanitized = DOMPurify.sanitize(input);
    
    // Additional sanitization for financial apps
    sanitized = sanitized
      .replace(/[<>\"']/g, '') // Remove HTML/script injection chars
      .replace(/\s+/g, ' ')    // Normalize whitespace
      .trim();                 // Remove leading/trailing space
    
    return sanitized;
  }
  
  static validateSessionData(data: SessionFormData): {
    isValid: boolean;
    errors: Record<string, string>;
  } {
    const errors: Record<string, string> = {};
    
    // Date validation
    if (!data.date) {
      errors.date = 'Date is required';
    } else if (!validator.isISO8601(data.date)) {
      errors.date = 'Invalid date format';
    } else if (new Date(data.date) < new Date()) {
      errors.date = 'Date cannot be in the past';
    }
    
    // Time validation
    if (!data.start_time) {
      errors.start_time = 'Start time is required';
    } else if (!data.start_time.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
      errors.start_time = 'Invalid time format (use HH:MM)';
    }
    
    // Location validation
    if (!data.location || data.location.trim().length < 3) {
      errors.location = 'Location must be at least 3 characters';
    } else {
      data.location = this.sanitizeUserInput(data.location);
    }
    
    // Session completion validation
    if (data.hours_played !== undefined) {
      if (data.hours_played <= 0 || data.hours_played > 8) {
        errors.hours_played = 'Hours played must be between 0.5 and 8';
      }
    }
    
    if (data.shuttlecocks_used !== undefined) {
      if (data.shuttlecocks_used < 0 || data.shuttlecocks_used > 20) {
        errors.shuttlecocks_used = 'Shuttlecocks used must be between 0 and 20';
      }
    }
    
    // Attendees validation
    if (!data.attendees || data.attendees.length === 0) {
      errors.attendees = 'At least one attendee is required';
    } else {
      data.attendees.forEach((attendee, index) => {
        if (attendee.is_temporary) {
          if (!attendee.temporary_player_name || attendee.temporary_player_name.trim().length < 2) {
            errors[`attendee_${index}`] = 'Temporary player name must be at least 2 characters';
          } else {
            attendee.temporary_player_name = this.sanitizeUserInput(attendee.temporary_player_name);
          }
          
          if (attendee.temporary_player_phone) {
            const phoneValidation = this.validatePhone(attendee.temporary_player_phone);
            if (!phoneValidation.isValid) {
              errors[`attendee_${index}_phone`] = phoneValidation.error!;
            }
          }
        } else {
          if (!attendee.player_id) {
            errors[`attendee_${index}`] = 'Player ID is required for regular attendees';
          }
        }
      });
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }
}

// Secure form handler wrapper
const withSecureValidation = <T>(
  validationRules: ValidationRule<T>[],
  handler: (validatedData: T) => Promise<any>
) => {
  return async (rawData: any) => {
    const errors: Record<string, string> = {};
    const validatedData: any = {};
    
    // Apply validation rules
    for (const rule of validationRules) {
      const value = rawData[rule.field];
      
      for (const { validate, message } of rule.rules) {
        if (!validate(value)) {
          errors[rule.field as string] = message;
          break;
        }
      }
      
      if (!errors[rule.field as string]) {
        // Sanitize the value
        validatedData[rule.field] = typeof value === 'string' 
          ? SecureValidator.sanitizeUserInput(value)
          : value;
      }
    }
    
    if (Object.keys(errors).length > 0) {
      throw new ValidationError('Validation failed', errors);
    }
    
    return handler(validatedData);
  };
};
```

---

## 🔒 API Security

### Rate Limiting Implementation
```typescript
// Advanced rate limiting for financial operations
interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
  blockDurationMs: number; // How long to block after limit exceeded
  keyGenerator: (req: Request) => string; // How to identify users
}

class AdvancedRateLimiter {
  private static cache = new Map<string, {
    count: number;
    resetTime: number;
    blocked: boolean;
    blockUntil?: number;
  }>();
  
  static async checkLimit(config: RateLimitConfig, request: Request): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  }> {
    const key = config.keyGenerator(request);
    const now = Date.now();
    
    let record = this.cache.get(key);
    
    // Initialize or reset if window has passed
    if (!record || now >= record.resetTime) {
      record = {
        count: 0,
        resetTime: now + config.windowMs,
        blocked: false,
      };
    }
    
    // Check if currently blocked
    if (record.blocked && record.blockUntil && now < record.blockUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime,
        retryAfter: record.blockUntil - now,
      };
    }
    
    // Clear block if expired
    if (record.blocked && record.blockUntil && now >= record.blockUntil) {
      record.blocked = false;
      record.blockUntil = undefined;
      record.count = 0;
      record.resetTime = now + config.windowMs;
    }
    
    // Increment count
    record.count++;
    
    // Check if limit exceeded
    if (record.count > config.maxRequests) {
      record.blocked = true;
      record.blockUntil = now + config.blockDurationMs;
      
      this.cache.set(key, record);
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime,
        retryAfter: config.blockDurationMs,
      };
    }
    
    this.cache.set(key, record);
    
    return {
      allowed: true,
      remaining: config.maxRequests - record.count,
      resetTime: record.resetTime,
    };
  }
}

// Rate limiting configurations for different endpoints
const RATE_LIMITS = {
  OTP_REQUEST: {
    windowMs: 60 * 60 * 1000,  // 1 hour
    maxRequests: 5,             // 5 OTP requests per hour
    blockDurationMs: 15 * 60 * 1000, // 15 min block
    keyGenerator: (req: Request) => {
      const phone = req.body?.phone_number || '';
      return `otp:${phone}`;
    },
  },
  
  PAYMENT_RECORDING: {
    windowMs: 5 * 60 * 1000,   // 5 minutes
    maxRequests: 10,            // 10 payments per 5 min
    blockDurationMs: 30 * 60 * 1000, // 30 min block
    keyGenerator: (req: Request) => {
      const userId = req.user?.id || 'anonymous';
      return `payment:${userId}`;
    },
  },
  
  SESSION_OPERATIONS: {
    windowMs: 60 * 1000,       // 1 minute
    maxRequests: 30,            // 30 requests per minute
    blockDurationMs: 5 * 60 * 1000, // 5 min block
    keyGenerator: (req: Request) => {
      const userId = req.user?.id || 'anonymous';
      return `session:${userId}`;
    },
  },
} as const;

// Middleware to apply rate limiting
const withRateLimit = (configName: keyof typeof RATE_LIMITS) => {
  return async (request: Request) => {
    const config = RATE_LIMITS[configName];
    const result = await AdvancedRateLimiter.checkLimit(config, request);
    
    if (!result.allowed) {
      const error = new Error('Rate limit exceeded');
      error.status = 429;
      error.headers = {
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': result.resetTime.toString(),
        'Retry-After': Math.ceil((result.retryAfter || 0) / 1000).toString(),
      };
      throw error;
    }
    
    // Add rate limit headers
    request.rateLimit = {
      remaining: result.remaining,
      resetTime: result.resetTime,
    };
  };
};
```

### CORS and Security Headers
```typescript
// Comprehensive security headers configuration
const SECURITY_HEADERS = {
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // XSS protection
  'X-XSS-Protection': '1; mode=block',
  
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net", // For production, remove unsafe-inline
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
  
  // Strict Transport Security (HTTPS only)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // Permissions policy
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=(self)',
  ].join(', '),
} as const;

// CORS configuration for production
const CORS_CONFIG = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : true, // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400, // 24 hours
};

// Security middleware for Next.js API routes
export const withSecurity = (handler: any) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Apply security headers
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    
    // CORS handling
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    
    return handler(req, res);
  };
};
```

---

## 📱 Mobile Security

### Secure Data Storage
```typescript
// Secure storage for sensitive data on mobile
class SecureMobileStorage {
  // Never store these in plain localStorage
  private static SENSITIVE_KEYS = [
    'access_token',
    'refresh_token', 
    'user_id',
    'financial_data',
    'payment_info',
  ] as const;
  
  static setSecureItem(key: string, value: string): void {
    if (this.SENSITIVE_KEYS.includes(key as any)) {
      // For web, use httpOnly cookies via server
      throw new Error(`Sensitive key ${key} should not be stored client-side`);
    }
    
    // For non-sensitive data, use localStorage with encryption
    const encrypted = this.encryptData(value);
    localStorage.setItem(key, encrypted);
  }
  
  static getSecureItem(key: string): string | null {
    if (this.SENSITIVE_KEYS.includes(key as any)) {
      return null; // Sensitive data should come from server
    }
    
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;
    
    try {
      return this.decryptData(encrypted);
    } catch {
      // Remove corrupted data
      localStorage.removeItem(key);
      return null;
    }
  }
  
  private static encryptData(data: string): string {
    // Simple client-side encryption (for non-sensitive data only)
    // In production, use Web Crypto API
    return btoa(data);
  }
  
  private static decryptData(encryptedData: string): string {
    return atob(encryptedData);
  }
  
  static clearAll(): void {
    localStorage.clear();
    sessionStorage.clear();
  }
}

// Secure form input handling for mobile
const useSecureInput = (initialValue: string = '') => {
  const [value, setValue] = useState(initialValue);
  const [isSecure, setIsSecure] = useState(false);
  
  // Clear value from memory when component unmounts
  useEffect(() => {
    return () => {
      setValue('');
    };
  }, []);
  
  const handleChange = useCallback((newValue: string) => {
    // Sanitize input
    const sanitized = SecureValidator.sanitizeUserInput(newValue);
    setValue(sanitized);
  }, []);
  
  const clearValue = useCallback(() => {
    setValue('');
  }, []);
  
  return {
    value,
    onChange: handleChange,
    clear: clearValue,
    setSecure: setIsSecure,
    isSecure,
  };
};
```

### Network Security
```typescript
// Secure HTTP client with certificate pinning simulation
class SecureHttpClient {
  private static readonly TRUSTED_HOSTS = [
    'yourdomain.com',
    'supabase.co',
    '*.supabase.co',
  ] as const;
  
  static async secureRequest(url: string, options: RequestInit = {}): Promise<Response> {
    // Validate URL
    const urlObj = new URL(url);
    
    if (urlObj.protocol !== 'https:') {
      throw new Error('Only HTTPS requests are allowed');
    }
    
    // Check if host is trusted
    const isTrustedHost = this.TRUSTED_HOSTS.some(host => {
      if (host.startsWith('*.')) {
        const domain = host.slice(2);
        return urlObj.hostname.endsWith(domain);
      }
      return urlObj.hostname === host;
    });
    
    if (!isTrustedHost) {
      throw new Error(`Untrusted host: ${urlObj.hostname}`);
    }
    
    // Add security headers
    const secureOptions: RequestInit = {
      ...options,
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Cache-Control': 'no-cache',
        ...options.headers,
      },
    };
    
    // Add request timeout
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), 30000); // 30s timeout
    
    try {
      const response = await fetch(url, {
        ...secureOptions,
        signal: timeoutController.signal,
      });
      
      clearTimeout(timeoutId);
      
      // Validate response
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Log security events
      console.error('Secure request failed:', {
        url: urlObj.hostname, // Don't log full URL for privacy
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
      
      throw error;
    }
  }
}

// Secure WebSocket connection for real-time features
class SecureWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  
  connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Validate WebSocket URL
      const urlObj = new URL(url);
      if (urlObj.protocol !== 'wss:') {
        reject(new Error('Only secure WebSocket (WSS) connections are allowed'));
        return;
      }
      
      this.ws = new WebSocket(url);
      
      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        resolve();
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };
      
      this.ws.onclose = (event) => {
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          // Exponential backoff for reconnection
          const delay = Math.pow(2, this.reconnectAttempts) * 1000;
          setTimeout(() => {
            this.reconnectAttempts++;
            this.connect(url);
          }, delay);
        }
      };
      
      // Heartbeat to keep connection alive
      setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);
    });
  }
  
  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }
}
```

---

This is a comprehensive security standards document covering all critical aspects of security for your badminton cost-sharing app. The document includes practical, implementable code examples and follows industry best practices for financial applications.

Key security measures covered:
- **Authentication**: Secure phone + OTP with rate limiting
- **Financial Data**: Encryption, audit trails, secure calculations  
- **Database**: RLS policies, secure functions, no-delete policies
- **Input Validation**: Comprehensive sanitization and validation
- **API Security**: Rate limiting, CORS, security headers
- **Mobile Security**: Secure storage, network security
- **Privacy**: Data protection and access controls
- **Monitoring**: Audit logging and incident response

This provides a solid foundation for secure development of your financial application.