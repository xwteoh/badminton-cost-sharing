'use client'

import { useState, useEffect } from 'react'

import { cn } from '@/lib/utils/cn'

export interface SessionSchedulerProps {
  /** Selected date in YYYY-MM-DD format */
  selectedDate?: string
  /** Selected start time in HH:MM format */
  selectedStartTime?: string
  /** Selected end time in HH:MM format */
  selectedEndTime?: string
  /** Callback when date changes */
  onDateChange?: (date: string) => void
  /** Callback when start time changes */
  onStartTimeChange?: (time: string) => void
  /** Callback when end time changes */
  onEndTimeChange?: (time: string) => void
  /** Custom className */
  className?: string
  /** Disable past dates */
  disablePastDates?: boolean
  /** Maximum days in future (default: 14 for 2 weeks) */
  maxFutureDays?: number
  /** Error message to display */
  error?: string
}

export function SessionScheduler({
  selectedDate,
  selectedStartTime,
  selectedEndTime,
  onDateChange,
  onStartTimeChange,
  onEndTimeChange,
  className,
  disablePastDates = true,
  maxFutureDays = 14,
  error
}: SessionSchedulerProps) {
  const [internalDate, setInternalDate] = useState(selectedDate || '')
  const [internalStartTime, setInternalStartTime] = useState(selectedStartTime || '')
  const [internalEndTime, setInternalEndTime] = useState(selectedEndTime || '')

  // Update internal state when props change
  useEffect(() => {
    if (selectedDate !== undefined) setInternalDate(selectedDate)
  }, [selectedDate])

  useEffect(() => {
    if (selectedStartTime !== undefined) setInternalStartTime(selectedStartTime)
  }, [selectedStartTime])

  useEffect(() => {
    if (selectedEndTime !== undefined) setInternalEndTime(selectedEndTime)
  }, [selectedEndTime])

  // Calculate date constraints
  const today = new Date()
  const minDate = disablePastDates ? today.toISOString().split('T')[0] : ''
  const maxDate = new Date(today.getTime() + maxFutureDays * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0]

  // Common time options for badminton sessions
  const timeOptions = [
    '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
    '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
    '22:00', '22:30', '23:00'
  ]

  const handleDateChange = (date: string) => {
    setInternalDate(date)
    onDateChange?.(date)
  }

  const handleStartTimeChange = (time: string) => {
    setInternalStartTime(time)
    onStartTimeChange?.(time)
    
    // Auto-adjust end time if start time is after end time
    if (internalEndTime && time >= internalEndTime) {
      const startIndex = timeOptions.indexOf(time)
      const suggestedEndTime = timeOptions[startIndex + 2] || timeOptions[startIndex + 1] // Default to 1-2 hours later
      if (suggestedEndTime) {
        setInternalEndTime(suggestedEndTime)
        onEndTimeChange?.(suggestedEndTime)
      }
    }
  }

  const handleEndTimeChange = (time: string) => {
    setInternalEndTime(time)
    onEndTimeChange?.(time)
  }

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return ''
    
    try {
      // Parse date string safely without timezone issues
      const [year, month, day] = dateStr.split('-').map(Number)
      const date = new Date(year, month - 1, day) // month is 0-indexed
      
      return date.toLocaleDateString('en-SG', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch (error) {
      console.error('Error formatting date:', error)
      return dateStr // Fallback to original string
    }
  }

  const isValidTimeRange = internalStartTime && internalEndTime && internalStartTime < internalEndTime

  return (
    <div className={cn('space-y-6', className)}>
      {/* Date Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-900">
          Session Date *
        </label>
        <div className="space-y-2">
          <input
            type="date"
            value={internalDate}
            onChange={(e) => handleDateChange(e.target.value)}
            min={minDate}
            max={maxDate}
            className={cn(
              'w-full h-12 px-4 py-3 border rounded-md text-base text-gray-900 bg-gray-50/50',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white',
              'transition-all duration-200',
              error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-200'
            )}
          />
          {internalDate && (
            <p className="text-sm text-gray-600 flex items-center space-x-2">
              <span>📅</span>
              <span>{formatDateDisplay(internalDate)}</span>
            </p>
          )}
        </div>
      </div>

      {/* Time Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Start Time */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-900">
            Start Time *
          </label>
          <select
            value={internalStartTime}
            onChange={(e) => handleStartTimeChange(e.target.value)}
            className={cn(
              'w-full h-12 px-4 py-3 border rounded-md text-base text-gray-900 bg-gray-50/50',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white',
              'transition-all duration-200',
              error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-200'
            )}
          >
            <option value="">Select start time</option>
            {timeOptions.map(time => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>

        {/* End Time */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-900">
            End Time *
          </label>
          <select
            value={internalEndTime}
            onChange={(e) => handleEndTimeChange(e.target.value)}
            className={cn(
              'w-full h-12 px-4 py-3 border rounded-md text-base text-gray-900 bg-gray-50/50',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white',
              'transition-all duration-200',
              error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-200'
            )}
            disabled={!internalStartTime}
          >
            <option value="">Select end time</option>
            {timeOptions
              .filter(time => !internalStartTime || time > internalStartTime)
              .map(time => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Duration Display */}
      {isValidTimeRange && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center space-x-2 text-blue-800">
            <span>⏱️</span>
            <span className="font-medium">Session Duration:</span>
            <span>
              {(() => {
                const start = new Date(`2000-01-01T${internalStartTime}:00`)
                const end = new Date(`2000-01-01T${internalEndTime}:00`)
                const durationMs = end.getTime() - start.getTime()
                const hours = Math.floor(durationMs / (1000 * 60 * 60))
                const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))
                
                if (hours > 0 && minutes > 0) {
                  return `${hours}h ${minutes}m`
                } else if (hours > 0) {
                  return `${hours}h`
                } else {
                  return `${minutes}m`
                }
              })()}
            </span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600 flex items-center space-x-2">
          <span>⚠️</span>
          <span>{error}</span>
        </p>
      )}

      {/* Helper Text */}
      <div className="text-xs text-gray-700 space-y-1">
        <p>• Sessions can be scheduled up to {maxFutureDays} days in advance</p>
        <p>• Popular session times: 7:00-9:00 (morning), 19:00-21:00 (evening)</p>
      </div>
    </div>
  )
}

// Helper function to calculate session duration in hours
export function calculateSessionDuration(startTime: string, endTime: string): number {
  if (!startTime || !endTime || startTime === 'undefined' || endTime === 'undefined') return 0
  
  try {
    // Normalize time format - handle both HH:MM and HH:MM:SS formats
    const normalizeTime = (time: string): string => {
      if (!time) return ''
      // If time already has seconds, use as-is
      if (time.split(':').length === 3) {
        return time
      }
      // If time is HH:MM format, add seconds
      if (time.split(':').length === 2) {
        return `${time}:00`
      }
      return time
    }

    const normalizedStartTime = normalizeTime(startTime)
    const normalizedEndTime = normalizeTime(endTime)
    
    const start = new Date(`2000-01-01T${normalizedStartTime}`)
    const end = new Date(`2000-01-01T${normalizedEndTime}`)
    
    // Check if dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.warn('Invalid dates created from times:', { 
        startTime, 
        endTime, 
        normalizedStartTime, 
        normalizedEndTime,
        startDate: start.toString(),
        endDate: end.toString()
      })
      return 0
    }
    
    const durationMs = end.getTime() - start.getTime()
    const hours = durationMs / (1000 * 60 * 60) // Convert to hours
    
    console.log('🕐 Duration calculation:', {
      startTime,
      endTime,
      normalizedStartTime,
      normalizedEndTime,
      durationMs,
      hours
    })
    
    // Return 0 if duration is negative or unrealistic
    if (hours < 0 || hours > 24) {
      console.warn('Invalid duration calculated:', { hours, startTime, endTime })
      return 0
    }
    
    return hours
  } catch (error) {
    console.warn('Error in duration calculation:', { startTime, endTime, error })
    return 0
  }
}

// Helper function to validate session time
export function validateSessionTime(date: string, startTime: string, endTime: string): string | null {
  if (!date) return 'Session date is required'
  if (!startTime) return 'Start time is required'
  if (!endTime) return 'End time is required'
  
  if (startTime >= endTime) return 'End time must be after start time'
  
  // Parse date safely without timezone issues
  const [year, month, day] = date.split('-').map(Number)
  const selectedDate = new Date(year, month - 1, day)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  if (selectedDate < today) return 'Cannot schedule sessions in the past'
  
  const duration = calculateSessionDuration(startTime, endTime)
  if (duration < 0.5) return 'Session must be at least 30 minutes'
  if (duration > 8) return 'Session cannot exceed 8 hours'
  
  return null
}