'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { MoneyInput } from '@/components/ui/MoneyInput'
import { PhoneInputSG } from '@/components/ui/PhoneInputSG'
import { cn } from '@/lib/utils/cn'

export interface PlayerRegistrationData {
  name: string
  phone: string
  initialBalance: string
  notes: string
}

export interface PlayerRegistrationFormProps {
  /** Form submission callback */
  onSubmit?: (data: PlayerRegistrationData) => void | Promise<void>
  /** Cancel callback */
  onCancel?: () => void
  /** Loading state */
  loading?: boolean
  /** Error message */
  error?: string
  /** Success message */
  success?: string
  /** Initial form data */
  initialData?: Partial<PlayerRegistrationData>
  /** Custom className */
  className?: string
}

export function PlayerRegistrationForm({
  onSubmit,
  onCancel,
  loading = false,
  error,
  success,
  initialData,
  className
}: PlayerRegistrationFormProps) {
  const [formData, setFormData] = useState<PlayerRegistrationData>({
    name: initialData?.name || '',
    phone: initialData?.phone || '',
    initialBalance: initialData?.initialBalance || '0.00',
    notes: initialData?.notes || ''
  })

  const [validationErrors, setValidationErrors] = useState<Partial<Record<keyof PlayerRegistrationData, string>>>({})

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof PlayerRegistrationData, string>> = {}

    // Validate name
    if (!formData.name.trim()) {
      errors.name = 'Player name is required'
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters'
    } else if (formData.name.trim().length > 50) {
      errors.name = 'Name must be less than 50 characters'
    }

    // Validate phone
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required'
    } else if (!/^\+65[689]\d{7}$/.test(formData.phone)) {
      errors.phone = 'Please enter a valid Singapore mobile number'
    }

    // Validate initial balance (optional but must be valid if provided)
    if (formData.initialBalance && formData.initialBalance !== '0.00') {
      try {
        const balance = parseFloat(formData.initialBalance)
        if (isNaN(balance)) {
          errors.initialBalance = 'Invalid balance amount'
        } else if (balance < -1000 || balance > 1000) {
          errors.initialBalance = 'Balance must be between -$1000 and $1000'
        }
      } catch {
        errors.initialBalance = 'Invalid balance format'
      }
    }

    // Validate notes length
    if (formData.notes && formData.notes.length > 200) {
      errors.notes = 'Notes must be less than 200 characters'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('📝 Form submission started:', formData)
    
    const isValid = validateForm()
    console.log('📝 Form validation result:', isValid, validationErrors)
    
    if (!isValid) {
      console.log('📝 Form validation failed, not submitting')
      return
    }
    
    try {
      console.log('📝 Calling onSubmit with:', formData)
      await onSubmit?.(formData)
    } catch (err) {
      console.error('Form submission error:', err)
    }
  }

  const handleFieldChange = <K extends keyof PlayerRegistrationData>(
    field: K,
    value: PlayerRegistrationData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const { [field]: _, ...rest } = prev
        return rest
      })
    }
  }

  return (
    <div className={cn('max-w-2xl mx-auto', className)}>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg">
            <span className="text-white text-2xl">👤</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Add New Player</h2>
          <p className="text-gray-600">Register a new player to your badminton group</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center space-x-2 text-green-800">
              <span>✅</span>
              <span className="font-medium">Player added successfully!</span>
            </div>
            <p className="text-green-700 mt-1 text-sm">{success}</p>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center space-x-2 text-red-800">
              <span>⚠️</span>
              <span className="font-medium">Error adding player</span>
            </div>
            <p className="text-red-700 mt-1 text-sm">{error}</p>
          </div>
        )}

        {/* Player Information */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <span>📝</span>
            <span>Player Information</span>
          </h3>
          
          <div className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="Enter player's full name"
                className={cn(
                  'w-full h-12 px-4 py-3 border rounded-xl text-base text-gray-900 bg-gray-50/50',
                  'focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white',
                  'transition-all duration-200',
                  validationErrors.name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-200'
                )}
              />
              {validationErrors.name && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.name}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Phone Number *
              </label>
              <PhoneInputSG
                value={formData.phone}
                onChange={(phone, isValid) => handleFieldChange('phone', phone)}
                error={validationErrors.phone}
                placeholder="9123 4567"
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Singapore mobile number for WhatsApp notifications and PayNow
              </p>
            </div>
          </div>
        </div>

        {/* Financial Settings (Optional) */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <span>💰</span>
            <span>Financial Settings</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Optional</span>
          </h3>
          
          <div className="space-y-6">
            {/* Initial Balance */}
            <MoneyInput
              label="Initial Balance"
              value={formData.initialBalance}
              onChange={(value) => handleFieldChange('initialBalance', value)}
              placeholder="0.00"
              error={validationErrors.initialBalance}
              helperText="Starting balance (negative = owes money, positive = has credit)"
              showCurrency={true}
            />

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
                placeholder="Any additional notes about this player..."
                rows={3}
                className={cn(
                  'w-full px-4 py-3 border rounded-xl text-base text-gray-900 bg-gray-50/50',
                  'focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white',
                  'transition-all duration-200 resize-none',
                  validationErrors.notes ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-200'
                )}
              />
              {validationErrors.notes && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.notes}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {formData.notes.length}/200 characters
              </p>
            </div>
          </div>
        </div>

        {/* Summary */}
        {formData.name && formData.phone && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center space-x-2">
              <span>📋</span>
              <span>Player Summary</span>
            </h3>
            <div className="space-y-2 text-green-800">
              <div className="flex items-center justify-between">
                <span>Name:</span>
                <span className="font-medium">{formData.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Phone:</span>
                <span className="font-medium">{formData.phone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Starting Balance:</span>
                <span className={cn(
                  'font-medium',
                  parseFloat(formData.initialBalance || '0') < 0 ? 'text-red-600' :
                  parseFloat(formData.initialBalance || '0') > 0 ? 'text-green-600' : 'text-gray-600'
                )}>
                  ${formData.initialBalance || '0.00'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Status:</span>
                <span className="px-2 py-1 bg-green-200 text-green-800 rounded-lg text-sm font-medium">Active</span>
              </div>
            </div>
            <p className="text-xs text-green-600 mt-3">
              💡 Player will receive WhatsApp notifications for sessions and payments
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 relative overflow-hidden font-bold text-base transition-all duration-500 hover:shadow-xl hover:-translate-y-1 transform"
            style={{
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #15803d 100%)',
              boxShadow: '0 8px 32px rgba(34, 197, 94, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(8px)',
              borderRadius: '16px',
              color: 'white',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
              minHeight: '48px',
              paddingLeft: '32px',
              paddingRight: '32px'
            }}
          >
            <span className="relative z-10 flex items-center space-x-2">
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Adding Player...</span>
                </>
              ) : (
                <>
                  <span className="text-xl">👤</span>
                  <span>Add Player</span>
                </>
              )}
            </span>
          </Button>
          
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 relative overflow-hidden font-bold text-base transition-all duration-500 hover:shadow-lg hover:-translate-y-0.5 transform"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                backdropFilter: 'blur(8px)',
                borderRadius: '16px',
                color: '#374151',
                textShadow: '0 1px 2px rgba(255, 255, 255, 0.5)',
                minHeight: '48px',
                paddingLeft: '32px',
                paddingRight: '32px'
              }}
            >
              <span className="relative z-10 flex items-center space-x-2">
                <span className="text-xl">✕</span>
                <span>Cancel</span>
              </span>
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}