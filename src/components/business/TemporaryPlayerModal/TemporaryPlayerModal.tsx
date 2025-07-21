'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { PhoneInputSG } from '@/components/ui/PhoneInputSG'
import { cn } from '@/lib/utils/cn'

export interface TemporaryPlayerData {
  id: string // temporary ID for UI
  name: string
  phone: string
}

export interface TemporaryPlayerModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (player: TemporaryPlayerData) => void
  existingPlayers?: TemporaryPlayerData[]
}

export function TemporaryPlayerModal({
  isOpen,
  onClose,
  onAdd,
  existingPlayers = []
}: TemporaryPlayerModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Name must be less than 50 characters'
    }

    // Validate phone (optional but if provided, must be valid)
    if (formData.phone && formData.phone.length > 0) {
      const phoneRegex = /^[+]?[\d\s\-\(\)]{8,15}$/
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = 'Please enter a valid phone number'
      }
    }

    // Check for duplicate names
    const duplicateName = existingPlayers.find(
      p => p.name.toLowerCase().trim() === formData.name.toLowerCase().trim()
    )
    if (duplicateName) {
      newErrors.name = 'A drop-in player with this name already exists'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      // Create temporary player data
      const temporaryPlayer: TemporaryPlayerData = {
        id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: formData.name.trim(),
        phone: formData.phone.trim()
      }

      onAdd(temporaryPlayer)
      
      // Reset form
      setFormData({ name: '', phone: '' })
      setErrors({})
      onClose()
    } catch (error) {
      console.error('Error adding temporary player:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({ name: '', phone: '' })
    setErrors({})
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Add Drop-in Player</h3>
            <p className="text-sm text-gray-600 mt-1">
              Add a temporary player for this session only
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
              placeholder="Enter player name"
              className={cn(
                'w-full h-12 px-4 py-3 border rounded-xl text-base text-gray-900 bg-gray-50/50',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white',
                'transition-all duration-200',
                errors.name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-200'
              )}
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Phone Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number (Optional)
            </label>
            <PhoneInputSG
              value={formData.phone}
              onChange={(value) => setFormData(prev => ({ ...prev, phone: value }))}
              placeholder="Enter phone number"
              error={errors.phone}
              className="w-full"
            />
          </div>

          {/* Info Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm text-blue-800 font-medium">Drop-in Player Info</p>
                <p className="text-xs text-blue-700 mt-1">
                  This player will share the session cost equally but won't be added to your regular player roster. You can convert them to a regular player later if needed.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700"
            >
              {isSubmitting ? (
                <span className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Adding...</span>
                </span>
              ) : (
                <span className="flex items-center space-x-2">
                  <span>👤</span>
                  <span>Add Player</span>
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}