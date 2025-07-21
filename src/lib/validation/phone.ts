import { SINGAPORE_PHONE_REGEX } from './schemas'

/**
 * Format a phone number input to Singapore format
 * @param input - Raw phone number input
 * @returns Formatted phone number with +65 prefix
 */
export function formatSingaporePhone(input: string): string {
  // Remove all non-digits
  const digits = input.replace(/\D/g, '')
  
  // Handle different input patterns
  if (digits.length === 0) return ''
  
  // If starts with 65, assume it's Singapore number without +
  if (digits.startsWith('65') && digits.length >= 3) {
    const remaining = digits.slice(2)
    if (remaining.length <= 8) {
      return `+65 ${remaining.slice(0, 4)} ${remaining.slice(4)}`
    }
  }
  
  // If starts with 8 or 9 (Singapore mobile prefixes) and is exactly 8 digits
  if ((digits.startsWith('8') || digits.startsWith('9') || digits.startsWith('6')) && digits.length === 8) {
    return `+65 ${digits.slice(0, 4)} ${digits.slice(4)}`
  }
  
  // If full number with country code
  if (digits.startsWith('65') && digits.length === 10) {
    const remaining = digits.slice(2)
    return `+65 ${remaining.slice(0, 4)} ${remaining.slice(4)}`
  }
  
  // Default: add +65 prefix if not present
  if (!input.startsWith('+65')) {
    if (digits.length === 8) {
      return `+65 ${digits.slice(0, 4)} ${digits.slice(4)}`
    }
    return `+65 ${digits}`
  }
  
  return input
}

/**
 * Validate Singapore phone number format
 * @param phone - Phone number to validate
 * @returns true if valid Singapore format
 */
export function validateSingaporePhone(phone: string): boolean {
  // Remove spaces for validation
  const cleanPhone = phone.replace(/\s/g, '')
  return SINGAPORE_PHONE_REGEX.test(cleanPhone)
}

/**
 * Extract display format for phone number (remove +65 for local display)
 * @param phone - Full phone number with +65
 * @returns Local format without +65
 */
export function getLocalPhoneDisplay(phone: string): string {
  if (phone.startsWith('+65')) {
    return phone.slice(3)
  }
  return phone
}

/**
 * Format phone number for display with spacing
 * @param phone - Phone number to format
 * @returns Formatted phone number with spacing
 */
export function formatPhoneDisplay(phone: string): string {
  if (!validateSingaporePhone(phone)) {
    return phone
  }
  
  // +65 8123 4567 format
  const digits = phone.slice(3)
  return `+65 ${digits.slice(0, 4)} ${digits.slice(4)}`
}

/**
 * Parse phone input and return standardized format
 * @param input - Raw phone input
 * @returns Object with formatted phone and validation status
 */
export function parsePhoneInput(input: string): {
  formatted: string
  isValid: boolean
  error?: string
} {
  if (!input) {
    return {
      formatted: '',
      isValid: false
    }
  }
  
  // Clean format for validation (no spaces)
  const digits = input.replace(/\D/g, '')
  let cleanFormatted = ''
  
  if (digits.length === 8 && (digits.startsWith('8') || digits.startsWith('9') || digits.startsWith('6'))) {
    cleanFormatted = `+65${digits}`
  } else if (digits.startsWith('65') && digits.length === 10) {
    cleanFormatted = `+${digits}`
  } else if (digits.length > 0) {
    cleanFormatted = `+65${digits}`
  }
  
  const isValid = validateSingaporePhone(cleanFormatted)
  
  if (!isValid && cleanFormatted.length > 0) {
    return {
      formatted: cleanFormatted,
      isValid: false,
      error: 'Please enter a valid Singapore phone number'
    }
  }
  
  return {
    formatted: cleanFormatted,
    isValid
  }
}