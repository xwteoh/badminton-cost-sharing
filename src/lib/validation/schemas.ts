import { z } from 'zod'

// Singapore phone number validation
export const SINGAPORE_PHONE_REGEX = /^\+65[689]\d{7}$/

export const phoneNumberSchema = z
  .string()
  .min(1, 'Phone number is required')
  .refine(
    (phone) => SINGAPORE_PHONE_REGEX.test(phone),
    'Please enter a valid Singapore phone number (+65 8XXXXXXX or +65 9XXXXXXX)'
  )

// OTP validation
export const otpSchema = z
  .string()
  .min(6, 'OTP must be 6 digits')
  .max(6, 'OTP must be 6 digits')
  .regex(/^\d{6}$/, 'OTP must contain only numbers')

// Login form schema
export const loginFormSchema = z.object({
  phone: phoneNumberSchema,
})

// OTP verification form schema
export const otpVerificationSchema = z.object({
  phone: phoneNumberSchema,
  otp: otpSchema,
})

// Money validation (using string to avoid floating point issues)
export const moneyAmountSchema = z
  .string()
  .min(1, 'Amount is required')
  .refine(
    (value) => {
      const num = parseFloat(value)
      return !isNaN(num) && num > 0 && num <= 1000
    },
    'Amount must be between $0.01 and $1000.00'
  )
  .refine(
    (value) => /^\d+(\.\d{1,2})?$/.test(value),
    'Amount must have at most 2 decimal places'
  )

// User name validation
export const userNameSchema = z
  .string()
  .min(1, 'Name is required')
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must be less than 50 characters')
  .regex(/^[a-zA-Z\s]+$/, 'Name must contain only letters and spaces')

// Session location validation
export const locationSchema = z
  .string()
  .min(1, 'Location is required')
  .min(3, 'Location must be at least 3 characters')
  .max(100, 'Location must be less than 100 characters')

// Export type definitions
export type LoginFormData = z.infer<typeof loginFormSchema>
export type OtpVerificationData = z.infer<typeof otpVerificationSchema>