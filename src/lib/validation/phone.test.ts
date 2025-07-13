import {
  formatSingaporePhone,
  validateSingaporePhone,
  getLocalPhoneDisplay,
  formatPhoneDisplay,
  parsePhoneInput,
} from './phone'

describe('Phone Validation Utilities', () => {
  describe('formatSingaporePhone', () => {
    it('formats Singapore mobile numbers correctly', () => {
      expect(formatSingaporePhone('81234567')).toBe('+6581234567')
      expect(formatSingaporePhone('91234567')).toBe('+6591234567')
      expect(formatSingaporePhone('61234567')).toBe('+6561234567')
    })

    it('handles numbers with country code', () => {
      expect(formatSingaporePhone('6581234567')).toBe('+6581234567')
      expect(formatSingaporePhone('+6581234567')).toBe('+6581234567')
    })

    it('handles empty and invalid inputs', () => {
      expect(formatSingaporePhone('')).toBe('')
      expect(formatSingaporePhone('abc')).toBe('+65')
    })

    it('preserves existing +65 prefix', () => {
      expect(formatSingaporePhone('+6581234567')).toBe('+6581234567')
    })
  })

  describe('validateSingaporePhone', () => {
    it('validates correct Singapore mobile numbers', () => {
      expect(validateSingaporePhone('+6581234567')).toBe(true)
      expect(validateSingaporePhone('+6591234567')).toBe(true)
      expect(validateSingaporePhone('+6561234567')).toBe(true)
    })

    it('rejects invalid formats', () => {
      expect(validateSingaporePhone('81234567')).toBe(false) // Missing +65
      expect(validateSingaporePhone('+657123456')).toBe(false) // Wrong prefix
      expect(validateSingaporePhone('+65812345678')).toBe(false) // Too long
      expect(validateSingaporePhone('+658123456')).toBe(false) // Too short
      expect(validateSingaporePhone('')).toBe(false) // Empty
      expect(validateSingaporePhone('+1234567890')).toBe(false) // Wrong country
    })
  })

  describe('getLocalPhoneDisplay', () => {
    it('removes +65 prefix for local display', () => {
      expect(getLocalPhoneDisplay('+6581234567')).toBe('81234567')
      expect(getLocalPhoneDisplay('+6591234567')).toBe('91234567')
    })

    it('returns original if no +65 prefix', () => {
      expect(getLocalPhoneDisplay('81234567')).toBe('81234567')
      expect(getLocalPhoneDisplay('123456789')).toBe('123456789')
    })
  })

  describe('formatPhoneDisplay', () => {
    it('formats valid phone numbers with spacing', () => {
      expect(formatPhoneDisplay('+6581234567')).toBe('+65 8123 4567')
      expect(formatPhoneDisplay('+6591234567')).toBe('+65 9123 4567')
    })

    it('returns original for invalid numbers', () => {
      expect(formatPhoneDisplay('invalid')).toBe('invalid')
      expect(formatPhoneDisplay('81234567')).toBe('81234567')
    })
  })

  describe('parsePhoneInput', () => {
    it('parses and validates complete phone numbers', () => {
      const result1 = parsePhoneInput('81234567')
      expect(result1.formatted).toBe('+6581234567')
      expect(result1.isValid).toBe(true)
      expect(result1.error).toBeUndefined()

      const result2 = parsePhoneInput('+6591234567')
      expect(result2.formatted).toBe('+6591234567')
      expect(result2.isValid).toBe(true)
    })

    it('handles incomplete inputs gracefully', () => {
      const result1 = parsePhoneInput('812')
      expect(result1.formatted).toBe('+65812')
      expect(result1.isValid).toBe(false)
      expect(result1.error).toBe('Please enter a valid Singapore phone number')

      const result2 = parsePhoneInput('')
      expect(result2.formatted).toBe('')
      expect(result2.isValid).toBe(false)
      expect(result2.error).toBeUndefined()
    })

    it('validates various input formats', () => {
      // Complete and valid
      expect(parsePhoneInput('6581234567').isValid).toBe(true)
      expect(parsePhoneInput('+6581234567').isValid).toBe(true)
      
      // Invalid formats
      expect(parsePhoneInput('1234567890').isValid).toBe(false)
      expect(parsePhoneInput('+1234567890').isValid).toBe(false)
    })
  })

  describe('Edge cases and user experience', () => {
    it('handles user typing scenarios', () => {
      // User types digit by digit
      expect(parsePhoneInput('8').formatted).toBe('+658')
      expect(parsePhoneInput('81').formatted).toBe('+6581')
      expect(parsePhoneInput('812').formatted).toBe('+65812')
      expect(parsePhoneInput('8123').formatted).toBe('+658123')
      expect(parsePhoneInput('81234').formatted).toBe('+6581234')
      expect(parsePhoneInput('812345').formatted).toBe('+65812345')
      expect(parsePhoneInput('8123456').formatted).toBe('+658123456')
      expect(parsePhoneInput('81234567').formatted).toBe('+6581234567')
    })

    it('handles copy-paste scenarios', () => {
      // User pastes full number
      expect(parsePhoneInput('6581234567').isValid).toBe(true)
      expect(parsePhoneInput('+6581234567').isValid).toBe(true)
      
      // User pastes with spaces or formatting
      expect(parsePhoneInput('8123 4567').formatted).toBe('+6581234567')
      expect(parsePhoneInput('+65 8123 4567').formatted).toBe('+6581234567')
    })

    it('enforces Singapore mobile prefixes', () => {
      // Valid mobile prefixes (8, 9, 6)
      expect(parsePhoneInput('81234567').isValid).toBe(true)
      expect(parsePhoneInput('91234567').isValid).toBe(true)
      expect(parsePhoneInput('61234567').isValid).toBe(true)
      
      // Invalid prefixes for mobile
      expect(parsePhoneInput('71234567').isValid).toBe(false)
      expect(parsePhoneInput('51234567').isValid).toBe(false)
    })
  })
})