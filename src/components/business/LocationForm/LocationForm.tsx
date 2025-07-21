'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'

export interface LocationFormData {
  name: string
  address?: string
  notes?: string
}

export interface LocationFormProps {
  initialData?: LocationFormData
  onSubmit: (data: LocationFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export function LocationForm({
  initialData,
  onSubmit,
  onCancel,
  loading = false
}: LocationFormProps) {
  const [formData, setFormData] = useState<LocationFormData>({
    name: initialData?.name || '',
    address: initialData?.address || '',
    notes: initialData?.notes || ''
  })
  
  const [errors, setErrors] = useState<Partial<Record<keyof LocationFormData, string>>>({})
  const [submitting, setSubmitting] = useState(false)

  const sanitizeInput = (input: string): string => {
    return input
      // Replace non-breaking spaces with regular spaces
      .replace(/\u00A0/g, ' ')
      // Remove zero-width characters
      .replace(/[\u200B\u200C\u200D\u200E\u200F\u202A-\u202E]/g, '')
      // Replace smart quotes with regular quotes
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'")
      // Replace em dashes and en dashes with regular hyphens
      .replace(/[—–]/g, '-')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      // Trim
      .trim()
  }

  const handleInputChange = (field: keyof LocationFormData, value: string) => {
    // Sanitize input to handle copy-paste from websites
    const sanitizedValue = sanitizeInput(value)
    setFormData(prev => ({ ...prev, [field]: sanitizedValue }))
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof LocationFormData, string>> = {}

    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = 'Location name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Location name must be at least 2 characters'
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Location name must be less than 100 characters'
    }

    // Optional address validation
    if (formData.address && formData.address.length > 500) {
      newErrors.address = 'Address must be less than 500 characters'
    }

    // Optional notes validation
    if (formData.notes && formData.notes.length > 1000) {
      newErrors.notes = 'Notes must be less than 1000 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    console.log('📝 LocationForm: Starting form submission')
    
    // Debug: Check for problematic characters
    const submissionData = {
      name: formData.name.trim(),
      address: formData.address?.trim() || undefined,
      notes: formData.notes?.trim() || undefined
    }
    
    console.log('📊 LocationForm: Submission data:', submissionData)
    console.log('📊 LocationForm: Name character codes:', submissionData.name.split('').map(char => ({ char, code: char.charCodeAt(0) })))
    
    try {
      setSubmitting(true)
      
      // Add timeout to prevent infinite loading
      const submitPromise = onSubmit(submissionData)
      
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out after 10 seconds')), 10000)
      )
      
      await Promise.race([submitPromise, timeoutPromise])
      console.log('✅ LocationForm: Form submitted successfully')
      
    } catch (err: any) {
      console.error('❌ LocationForm: Form submission error:', err)
      setErrors({ name: err.message || 'Failed to save location' })
    } finally {
      console.log('🔄 LocationForm: Resetting submitting state')
      setSubmitting(false)
    }
  }

  const isDisabled = loading || submitting

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Location Name */}
      <div className="relative overflow-hidden" style={{ 
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.2)',
        transform: 'translateZ(0)'
      }}>
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)',
          borderRadius: '16px'
        }}></div>
        <div className="absolute inset-0 backdrop-blur-md" style={{
          border: '1px solid rgba(34, 197, 94, 0.15)',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        }}></div>
        <div className="relative p-4 space-y-3">
          <label className="block text-sm font-medium mb-2" style={{
            background: 'linear-gradient(to right, #22c55e, #16a34a)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Location Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="e.g., Sports Hub Badminton Hall"
            disabled={isDisabled}
            className={cn(
              'w-full h-12 px-4 py-3 border rounded-xl text-base text-gray-900 bg-gray-50/50',
              'focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white',
              'transition-all duration-200',
              'disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed',
              errors.name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-200'
            )}
          />
          {errors.name && (
            <p className="text-sm text-red-600 mt-1">{errors.name}</p>
          )}
          <p className="text-xs" style={{ color: '#6b7280' }}>
            This name will appear in session forms when selecting locations.
          </p>
        </div>
      </div>

      {/* Address */}
      <div className="relative overflow-hidden" style={{ 
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.2)',
        transform: 'translateZ(0)'
      }}>
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
          borderRadius: '16px'
        }}></div>
        <div className="absolute inset-0 backdrop-blur-md" style={{
          border: '1px solid rgba(245, 158, 11, 0.15)',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        }}></div>
        <div className="relative p-4 space-y-3">
          <label className="block text-sm font-medium mb-2" style={{
            background: 'linear-gradient(to right, #f59e0b, #d97706)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Address (Optional)
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            placeholder="e.g., 1 Stadium Drive, Singapore 397629"
            disabled={isDisabled}
            className={cn(
              'w-full h-12 px-4 py-3 border rounded-xl text-base text-gray-900 bg-gray-50/50',
              'focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white',
              'transition-all duration-200',
              'disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed',
              errors.address ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-200'
            )}
          />
          {errors.address && (
            <p className="text-sm text-red-600 mt-1">{errors.address}</p>
          )}
          <p className="text-xs" style={{ color: '#6b7280' }}>
            Helpful for players to find the location.
          </p>
        </div>
      </div>

      {/* Notes */}
      <div className="relative overflow-hidden" style={{ 
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.2)',
        transform: 'translateZ(0)'
      }}>
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(124, 58, 237, 0.05) 100%)',
          borderRadius: '16px'
        }}></div>
        <div className="absolute inset-0 backdrop-blur-md" style={{
          border: '1px solid rgba(124, 58, 237, 0.15)',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        }}></div>
        <div className="relative p-4 space-y-3">
          <label className="block text-sm font-medium mb-2" style={{
            background: 'linear-gradient(to right, #7c3aed, #6d28d9)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Notes (Optional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="e.g., Enter via main entrance, parking available on Level B2"
            rows={4}
            disabled={isDisabled}
            className={cn(
              'w-full px-4 py-3 border rounded-xl text-base text-gray-900 bg-gray-50/50',
              'focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white',
              'transition-all duration-200 resize-none',
              'disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed',
              errors.notes ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-200'
            )}
          />
          {errors.notes && (
            <p className="text-sm text-red-600 mt-1">{errors.notes}</p>
          )}
          <p className="text-xs" style={{ color: '#6b7280' }}>
            Additional information like parking, entrance instructions, etc.
          </p>
        </div>
      </div>

      {/* Premium Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button
          type="submit"
          disabled={isDisabled}
          className="flex-1 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
          style={{
            background: 'linear-gradient(to right, #22c55e, #10b981)',
            color: 'white',
            border: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(to right, #16a34a, #059669)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(to right, #22c55e, #10b981)'
          }}
        >
          {submitting ? (
            <span className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Saving...</span>
            </span>
          ) : (
            <span className="flex items-center space-x-2">
              <span>💾</span>
              <span>{initialData ? 'Update Location' : 'Add Location'}</span>
            </span>
          )}
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isDisabled}
          className="flex-1 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 backdrop-blur-sm"
          style={{
            borderColor: 'rgba(34, 197, 94, 0.2)',
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            color: '#6b7280'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'
            e.currentTarget.style.color = '#374151'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.5)'
            e.currentTarget.style.color = '#6b7280'
          }}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}