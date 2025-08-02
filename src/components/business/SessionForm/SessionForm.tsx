'use client'

import { useState, useEffect } from 'react'

import { PlayerSelectionGrid, type Player } from '@/components/business/PlayerSelectionGrid'
import { type TemporaryPlayerData } from '@/components/business/TemporaryPlayerModal'
import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/Button'
import { MoneyDisplay } from '@/components/ui/MoneyDisplay'
import { MoneyInput } from '@/components/ui/MoneyInput'
import { money } from '@/lib/calculations/money'
import { 
  calculateUsageCosts, 
  UsageRatePresets, 
  type UsageCostInput, 
  type UsageCostBreakdown 
} from '@/lib/calculations/usage-costs'
import { locationService, type Location } from '@/lib/services/locations'
import { settingsService, type SettingsFormData, type EffectiveRates } from '@/lib/services/settings'
import { cn } from '@/lib/utils/cn'

export interface SessionFormData {
  sessionDate: string
  startTime: string
  endTime: string
  location: string
  hoursPlayed: number
  courtRatePerHour: string
  shuttlecocksUsed: number
  shuttlecockRateEach: string
  otherCosts: string
  selectedPlayerIds: string[]
  temporaryPlayers: TemporaryPlayerData[]
  notes: string
}

export interface SessionFormProps {
  onSubmit: (data: SessionFormData & { costBreakdown: UsageCostBreakdown }) => void
  loading?: boolean
  organizerId: string
  initialData?: Partial<SessionFormData>
  players?: Player[]
}

export function SessionForm({ 
  onSubmit, 
  loading = false, 
  organizerId,
  initialData,
  players = []
}: SessionFormProps) {
  const { user } = useAuth()
  
  const [formData, setFormData] = useState<SessionFormData>({
    sessionDate: new Date().toISOString().split('T')[0], // Today
    startTime: '07:00', // Default 7 AM
    endTime: '09:00',   // Default 9 AM
    location: '',
    hoursPlayed: 2,     // Default 2 hours
    courtRatePerHour: '',
    shuttlecocksUsed: 6, // Default 6 shuttlecocks
    shuttlecockRateEach: '',
    otherCosts: '0',
    selectedPlayerIds: [],
    temporaryPlayers: [],
    notes: '',
    ...initialData
  })
  
  // Debug log to verify initial data is applied correctly
  console.log('🔧 SessionForm initialized with shuttlecocksUsed:', formData.shuttlecocksUsed, 'from initialData:', initialData?.shuttlecocksUsed)

  const [costBreakdown, setCostBreakdown] = useState<UsageCostBreakdown | null>(null)
  const [errors, setErrors] = useState<Partial<Record<keyof SessionFormData, string>>>({})
  const [locations, setLocations] = useState<Location[]>([])
  const [locationsLoading, setLocationsLoading] = useState(true)
  const [locationsError, setLocationsError] = useState<string | null>(null)
  
  // Settings state
  const [settings, setSettings] = useState<SettingsFormData | null>(null)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [autoRatesApplied, setAutoRatesApplied] = useState(false)
  const [shuttlecockManuallySet, setShuttlecockManuallySet] = useState(false)

  // Load locations on component mount
  useEffect(() => {
    const loadLocations = async () => {
      if (!user?.id) return

      try {
        setLocationsLoading(true)
        setLocationsError(null)
        const locationsData = await locationService.getLocationsByOrganizer(user.id)
        setLocations(locationsData)
      } catch (error: any) {
        console.error('Error loading locations:', error)
        setLocationsError(error.message || 'Failed to load locations')
      } finally {
        setLocationsLoading(false)
      }
    }

    loadLocations()
  }, [user?.id])

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.id) return

      try {
        setSettingsLoading(true)
        console.log('🔧 Loading organizer settings for session form')
        
        const settingsData = await settingsService.getSettings(user.id)
        setSettings(settingsData)
        
        console.log('✅ Settings loaded successfully:', settingsData)
      } catch (error: any) {
        console.error('❌ Error loading settings:', error)
        // Don't show error UI, just use defaults
      } finally {
        setSettingsLoading(false)
      }
    }

    loadSettings()
  }, [user?.id])

  // Apply auto-rates when settings are loaded or times change
  useEffect(() => {
    const applyAutoRates = async () => {
      if (!user?.id || !settings || settingsLoading) return
      
      // Only apply auto-rates if:
      // 1. Auto-rate selection is enabled
      // 2. We have not manually applied rates yet 
      // 3. Form data has empty rates (not pre-filled)
      // 4. We have start time for calculation
      const shouldApplyAutoRates = 
        settings.autoRateSelection && 
        !autoRatesApplied && 
        (!formData.courtRatePerHour || !formData.shuttlecockRateEach) &&
        formData.startTime

      if (!shouldApplyAutoRates) return

      try {
        console.log('🎯 Applying auto-rates for session time:', formData.startTime)
        
        const effectiveRates = await settingsService.getEffectiveRates(
          user.id,
          formData.startTime,
          settings.defaultCourtType
        )
        
        console.log('✅ Effective rates calculated:', effectiveRates)
        
        setFormData(prev => ({
          ...prev,
          courtRatePerHour: prev.courtRatePerHour || effectiveRates.courtRate.toString(),
          shuttlecockRateEach: prev.shuttlecockRateEach || effectiveRates.shuttlecockRate.toString()
        }))
        
        setAutoRatesApplied(true)
        
      } catch (error: any) {
        console.error('❌ Error applying auto-rates:', error)
        // Silently fail, user can set rates manually
      }
    }

    applyAutoRates()
  }, [user?.id, settings, settingsLoading, formData.startTime, autoRatesApplied, formData.courtRatePerHour, formData.shuttlecockRateEach])

  // Auto-shuttlecock estimation when hours change
  useEffect(() => {
    if (!settings || !settings.autoShuttlecockEstimation || shuttlecockManuallySet) return
    
    // Estimate ~2 shuttlecocks per hour (typical badminton usage)
    const estimatedShuttlecocks = Math.max(1, Math.round(formData.hoursPlayed * 2))
    
    // Only update if current value is default (6), not if we have initialData
    if (formData.shuttlecocksUsed === 6 && !shuttlecockManuallySet && !initialData?.shuttlecocksUsed) {
      setFormData(prev => ({
        ...prev,
        shuttlecocksUsed: estimatedShuttlecocks
      }))
    }
  }, [settings, formData.hoursPlayed, shuttlecockManuallySet, initialData?.shuttlecocksUsed])

  // Real-time cost calculation
  useEffect(() => {
    const input: UsageCostInput = {
      hoursPlayed: formData.hoursPlayed,
      courtRatePerHour: formData.courtRatePerHour || '0',
      shuttlecocksUsed: formData.shuttlecocksUsed,
      shuttlecockRateEach: formData.shuttlecockRateEach || '0',
      otherCosts: formData.otherCosts || '0',
      playerIds: [...formData.selectedPlayerIds, ...formData.temporaryPlayers.map(p => p.id)]
    }

    const breakdown = calculateUsageCosts(input)
    setCostBreakdown(breakdown)

    // Clear cost-related errors if calculation is valid
    if (breakdown.isValid) {
      const newErrors = { ...errors }
      delete newErrors.courtRatePerHour
      delete newErrors.shuttlecockRateEach
      delete newErrors.otherCosts
      delete newErrors.hoursPlayed
      delete newErrors.shuttlecocksUsed
      delete newErrors.selectedPlayerIds
      setErrors(newErrors)
    }
  }, [formData.hoursPlayed, formData.courtRatePerHour, formData.shuttlecocksUsed, formData.shuttlecockRateEach, formData.otherCosts, formData.selectedPlayerIds, formData.temporaryPlayers])

  const handleInputChange = (field: keyof SessionFormData, value: string | number | string[] | TemporaryPlayerData[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Track when shuttlecocks are manually set
    if (field === 'shuttlecocksUsed') {
      setShuttlecockManuallySet(true)
    }
    
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
    const newErrors: Partial<Record<keyof SessionFormData, string>> = {}

    // Required fields
    if (!formData.sessionDate) newErrors.sessionDate = 'Session date is required'
    if (!formData.location.trim()) newErrors.location = 'Location is required'
    if (!formData.courtRatePerHour) newErrors.courtRatePerHour = 'Court rate per hour is required'
    if (!formData.shuttlecockRateEach) newErrors.shuttlecockRateEach = 'Shuttlecock rate is required'

    // Validate rates
    if (formData.courtRatePerHour && !money(formData.courtRatePerHour).isPositive()) {
      newErrors.courtRatePerHour = 'Court rate must be greater than 0'
    }

    if (formData.shuttlecockRateEach && money(formData.shuttlecockRateEach).isNegative()) {
      newErrors.shuttlecockRateEach = 'Shuttlecock rate cannot be negative'
    }

    // Validate usage quantities
    if (formData.hoursPlayed <= 0) {
      newErrors.hoursPlayed = 'Hours played must be greater than 0'
    } else if (formData.hoursPlayed > 8) {
      newErrors.hoursPlayed = 'Maximum 8 hours per session'
    }

    if (formData.shuttlecocksUsed < 0) {
      newErrors.shuttlecocksUsed = 'Shuttlecocks used cannot be negative'
    }

    // Validate player selection (regular + temporary)
    const totalPlayers = formData.selectedPlayerIds.length + formData.temporaryPlayers.length
    if (totalPlayers === 0) {
      newErrors.selectedPlayerIds = 'At least 1 player must be selected'
    } else if (totalPlayers > 20) {
      newErrors.selectedPlayerIds = 'Maximum 20 players allowed'
    }

    // Validate time
    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      newErrors.endTime = 'End time must be after start time'
    }

    // Cost breakdown validation
    if (costBreakdown && !costBreakdown.isValid) {
      costBreakdown.errors.forEach(error => {
        if (error.includes('Court rate')) newErrors.courtRatePerHour = error
        else if (error.includes('Shuttlecock rate')) newErrors.shuttlecockRateEach = error
        else if (error.includes('Hours played')) newErrors.hoursPlayed = error
        else if (error.includes('Shuttlecocks used')) newErrors.shuttlecocksUsed = error
        else if (error.includes('player')) newErrors.selectedPlayerIds = error
        else if (error.includes('Other costs')) newErrors.otherCosts = error
      })
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !costBreakdown) {
      return
    }

    onSubmit({
      ...formData,
      costBreakdown
    })
  }

  const applyPreset = (presetKey: keyof typeof UsageRatePresets) => {
    // Use settings rates if available, otherwise fall back to hardcoded presets
    if (settings) {
      let courtRate: number
      let shuttlecockRate: number
      
      switch (presetKey) {
        case 'indoorPeakHour':
          courtRate = settings.courtRates.indoorPeak
          shuttlecockRate = settings.shuttlecockRates.peak
          break
        case 'indoorOffPeak':
          courtRate = settings.courtRates.indoorOffPeak
          shuttlecockRate = settings.shuttlecockRates.offPeak
          break
        case 'outdoorCourt':
          courtRate = settings.courtRates.outdoor
          shuttlecockRate = settings.shuttlecockRates.outdoor
          break
        case 'communityCourt':
          courtRate = settings.courtRates.community
          shuttlecockRate = settings.shuttlecockRates.community
          break
        default:
          // Fallback to preset
          const preset = UsageRatePresets[presetKey]
          if (typeof preset === 'object' && 'courtRate' in preset) {
            courtRate = preset.courtRate.toNumber()
            shuttlecockRate = preset.shuttlecockRate.toNumber()
          } else {
            return
          }
      }
      
      setFormData(prev => ({
        ...prev,
        courtRatePerHour: courtRate.toString(),
        shuttlecockRateEach: shuttlecockRate.toString()
      }))
    } else {
      // Fallback to hardcoded presets
      const preset = UsageRatePresets[presetKey]
      if (typeof preset === 'object' && 'courtRate' in preset) {
        setFormData(prev => ({
          ...prev,
          courtRatePerHour: preset.courtRate.toString(),
          shuttlecockRateEach: preset.shuttlecockRate.toString()
        }))
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Session Details */}
      <div className="relative overflow-hidden" style={{ 
        borderRadius: '24px',
        boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)',
        transform: 'translateZ(0)'
      }}>
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(34, 197, 94, 0.12) 100%)',
          borderRadius: '24px'
        }}></div>
        <div className="absolute top-0 left-0 w-64 h-64 rounded-full blur-3xl -translate-x-32 -translate-y-32" style={{
          background: 'linear-gradient(to bottom right, rgba(124, 58, 237, 0.08), transparent)'
        }}></div>
        <div className="absolute inset-0 backdrop-blur-xl" style={{
          border: '1px solid rgba(255, 255, 255, 0.18)',
          backgroundColor: 'rgba(255, 255, 255, 0.12)',
          borderRadius: '24px',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.05)'
        }}></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-60" style={{
          background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.05) 0%, transparent 50%, rgba(34, 197, 94, 0.05) 100%)',
          borderRadius: '24px'
        }}></div>
        <div className="relative p-6">
          <h3 className="text-lg font-semibold mb-4" style={{
            background: 'linear-gradient(to right, #7c3aed, #22c55e)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>Session Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Date *
            </label>
            <input
              type="date"
              value={formData.sessionDate}
              onChange={(e) => handleInputChange('sessionDate', e.target.value)}
              className={cn(
                'w-full h-12 px-3 py-2 border rounded-lg text-base text-gray-900',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
                errors.sessionDate ? 'border-red-500' : 'border-gray-300'
              )}
            />
            {errors.sessionDate && (
              <p className="text-sm text-red-600 mt-1">{errors.sessionDate}</p>
            )}
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location *
            </label>
            <select
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className={cn(
                'w-full h-12 px-3 py-2 border rounded-lg text-base text-gray-900',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
                errors.location ? 'border-red-500' : 'border-gray-300'
              )}
            >
              <option value="">Select location</option>
              {locationsLoading ? (
                <option disabled>Loading locations...</option>
              ) : locationsError ? (
                <option disabled>Error loading locations</option>
              ) : locations.length === 0 ? (
                <option disabled>No locations available</option>
              ) : (
                locations.map(location => (
                  <option key={location.id} value={location.name}>
                    {location.name}
                  </option>
                ))
              )}
            </select>
            {errors.location && (
              <p className="text-sm text-red-600 mt-1">{errors.location}</p>
            )}
            {!locationsLoading && locations.length === 0 && !locationsError && (
              <p className="text-sm text-amber-600 flex items-center space-x-1 mt-1">
                <span>⚠️</span>
                <span>No locations configured. You can add location details in the notes field.</span>
              </p>
            )}
            {locationsError && (
              <p className="text-sm text-red-600 flex items-center space-x-1 mt-1">
                <span>❌</span>
                <span>{locationsError}</span>
              </p>
            )}
          </div>

          {/* Start Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Time
            </label>
            <input
              type="time"
              value={formData.startTime}
              onChange={(e) => handleInputChange('startTime', e.target.value)}
              className="w-full h-12 px-3 py-2 border border-gray-300 rounded-lg text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* End Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Time
            </label>
            <input
              type="time"
              value={formData.endTime}
              onChange={(e) => handleInputChange('endTime', e.target.value)}
              className={cn(
                'w-full h-12 px-3 py-2 border rounded-lg text-base text-gray-900',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
                errors.endTime ? 'border-red-500' : 'border-gray-300'
              )}
            />
            {errors.endTime && (
              <p className="text-sm text-red-600 mt-1">{errors.endTime}</p>
            )}
          </div>
        </div>
        </div>
      </div>

      {/* Usage Details */}
      <div className="relative overflow-hidden" style={{ 
        borderRadius: '24px',
        boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)',
        transform: 'translateZ(0)'
      }}>
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(249, 115, 22, 0.12) 100%)',
          borderRadius: '24px'
        }}></div>
        <div className="absolute top-0 left-0 w-48 h-48 rounded-full blur-3xl -translate-x-24 -translate-y-24" style={{
          background: 'linear-gradient(to bottom right, rgba(245, 158, 11, 0.08), transparent)'
        }}></div>
        <div className="absolute inset-0 backdrop-blur-xl" style={{
          border: '1px solid rgba(255, 255, 255, 0.18)',
          backgroundColor: 'rgba(255, 255, 255, 0.12)',
          borderRadius: '24px',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.05)'
        }}></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-60" style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, transparent 50%, rgba(249, 115, 22, 0.05) 100%)',
          borderRadius: '24px'
        }}></div>
        <div className="relative p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-semibold" style={{
                background: 'linear-gradient(to right, #f59e0b, #7c3aed)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>Usage & Rates</h3>
            {settings && autoRatesApplied && (
              <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full flex items-center space-x-1">
                <span>⚡</span>
                <span>Auto-rates applied</span>
              </span>
            )}
          </div>
          
          {/* Quick Presets */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => applyPreset('indoorPeakHour')}
              className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors whitespace-nowrap"
            >
              Indoor Peak
            </button>
            <button
              type="button"
              onClick={() => applyPreset('indoorOffPeak')}
              className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors whitespace-nowrap"
            >
              Indoor Off-Peak
            </button>
            <button
              type="button"
              onClick={() => applyPreset('outdoorCourt')}
              className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors whitespace-nowrap"
            >
              Outdoor
            </button>
            <button
              type="button"
              onClick={() => applyPreset('communityCourt')}
              className="text-xs px-3 py-1 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors whitespace-nowrap"
            >
              Community
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Court Usage */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Court Usage</h4>
            
            {/* Hours Played */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hours Played *
              </label>
              <div className="flex flex-col space-y-3">
                <input
                  type="number"
                  min="0.5"
                  max="8"
                  step="0.5"
                  value={formData.hoursPlayed}
                  onChange={(e) => handleInputChange('hoursPlayed', parseFloat(e.target.value) || 0)}
                  className={cn(
                    'w-24 h-12 px-3 py-2 border rounded-lg text-base text-gray-900 text-center',
                    'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
                    errors.hoursPlayed ? 'border-red-500' : 'border-gray-300'
                  )}
                />
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4].map(hours => (
                    <button
                      key={hours}
                      type="button"
                      onClick={() => handleInputChange('hoursPlayed', hours)}
                      className={cn(
                        'px-3 py-1 text-sm rounded-full transition-colors',
                        formData.hoursPlayed === hours
                          ? 'text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      )}
                      style={formData.hoursPlayed === hours ? {
                        background: 'linear-gradient(to right, #7c3aed, #6d28d9)',
                        color: 'white'
                      } : {}}
                    >
                      {hours}h
                    </button>
                  ))}
                </div>
              </div>
              {errors.hoursPlayed && (
                <p className="text-sm text-red-600 mt-1">{errors.hoursPlayed}</p>
              )}
            </div>

            {/* Court Rate Per Hour */}
            <MoneyInput
              label="Court Rate per Hour *"
              value={formData.courtRatePerHour}
              onChange={(value, isValid) => handleInputChange('courtRatePerHour', value)}
              placeholder="40.00"
              error={errors.courtRatePerHour}
              helperText="Hourly rate for court rental"
            />
          </div>

          {/* Shuttlecock Usage */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Shuttlecock Usage</h4>
            
            {/* Shuttlecocks Used */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Shuttlecocks Used
                </label>
                {settings?.autoShuttlecockEstimation && !shuttlecockManuallySet && (
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full flex items-center space-x-1">
                    <span>🤖</span>
                    <span>Auto-estimated</span>
                  </span>
                )}
              </div>
              <div className="flex flex-col space-y-3">
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={formData.shuttlecocksUsed}
                  onChange={(e) => handleInputChange('shuttlecocksUsed', parseInt(e.target.value) || 0)}
                  className={cn(
                    'w-24 h-12 px-3 py-2 border rounded-lg text-base text-gray-900 text-center',
                    'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
                    errors.shuttlecocksUsed ? 'border-red-500' : 'border-gray-300'
                  )}
                />
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5, 6].map(count => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => handleInputChange('shuttlecocksUsed', count)}
                      className={cn(
                        'px-3 py-1 text-sm rounded-full transition-colors',
                        formData.shuttlecocksUsed === count
                          ? 'text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      )}
                      style={formData.shuttlecocksUsed === count ? {
                        background: 'linear-gradient(to right, #7c3aed, #6d28d9)',
                        color: 'white'
                      } : {}}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>
              {errors.shuttlecocksUsed && (
                <p className="text-sm text-red-600 mt-1">{errors.shuttlecocksUsed}</p>
              )}
            </div>

            {/* Shuttlecock Rate Each */}
            <MoneyInput
              label="Shuttlecock Rate (each) *"
              value={formData.shuttlecockRateEach}
              onChange={(value, isValid) => handleInputChange('shuttlecockRateEach', value)}
              placeholder="2.00"
              error={errors.shuttlecockRateEach}
              helperText="Cost per shuttlecock"
            />
          </div>
        </div>

        {/* Other Costs */}
        <div className="mt-4">
          <MoneyInput
            label="Other Costs"
            value={formData.otherCosts}
            onChange={(value, isValid) => handleInputChange('otherCosts', value)}
            placeholder="0.00"
            error={errors.otherCosts}
            helperText="Any additional expenses (drinks, parking, etc.)"
          />
        </div>
        </div>
      </div>

      {/* Player Selection */}
      <div className="relative overflow-hidden" style={{ 
        borderRadius: '24px',
        boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)',
        transform: 'translateZ(0)'
      }}>
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(59, 130, 246, 0.12) 100%)',
          borderRadius: '24px'
        }}></div>
        <div className="absolute top-0 right-0 w-56 h-56 rounded-full blur-3xl translate-x-28 -translate-y-28" style={{
          background: 'linear-gradient(to bottom left, rgba(34, 197, 94, 0.08), transparent)'
        }}></div>
        <div className="absolute inset-0 backdrop-blur-xl" style={{
          border: '1px solid rgba(255, 255, 255, 0.18)',
          backgroundColor: 'rgba(255, 255, 255, 0.12)',
          borderRadius: '24px',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.05)'
        }}></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-60" style={{
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, transparent 50%, rgba(59, 130, 246, 0.05) 100%)',
          borderRadius: '24px'
        }}></div>
        <div className="relative p-6">
          <PlayerSelectionGrid
          players={players}
          selectedPlayerIds={formData.selectedPlayerIds}
          onSelectionChange={(selectedIds) => handleInputChange('selectedPlayerIds', selectedIds)}
          temporaryPlayers={formData.temporaryPlayers}
          onTemporaryPlayersChange={(temporaryPlayers) => handleInputChange('temporaryPlayers', temporaryPlayers)}
          maxSelection={20}
          loading={false}
          error={errors.selectedPlayerIds}
        />
        </div>
      </div>

      {/* Cost Breakdown */}
      {costBreakdown && (
        <div className="relative overflow-hidden" style={{ 
          borderRadius: '24px',
          boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)',
          transform: 'translateZ(0)'
        }}>
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(99, 102, 241, 0.12) 100%)',
            borderRadius: '24px'
          }}></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full blur-3xl -translate-x-20 translate-y-20" style={{
            background: 'linear-gradient(to top right, rgba(59, 130, 246, 0.08), transparent)'
          }}></div>
          <div className="absolute inset-0 backdrop-blur-xl" style={{
            border: '1px solid rgba(255, 255, 255, 0.18)',
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            borderRadius: '24px',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.05)'
          }}></div>
          <div className="absolute top-0 left-0 w-full h-full opacity-60" style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, transparent 50%, rgba(99, 102, 241, 0.05) 100%)',
            borderRadius: '24px'
          }}></div>
          <div className="relative p-6">
            <h4 className="font-medium mb-3" style={{
              background: 'linear-gradient(to right, #3b82f6, #22c55e)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>Cost Breakdown</h4>
          
          {/* Usage Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
            <div>
              <p className="text-gray-600">Hours Played</p>
              <p className="font-semibold">{costBreakdown.hoursPlayed}h</p>
            </div>
            <div>
              <p className="text-gray-600">Court Rate/Hour</p>
              <MoneyDisplay value={costBreakdown.courtRatePerHour} size="sm" />
            </div>
            <div>
              <p className="text-gray-600">Shuttlecocks Used</p>
              <p className="font-semibold">{costBreakdown.shuttlecocksUsed}</p>
            </div>
            <div>
              <p className="text-gray-600">Shuttle Rate/Each</p>
              <MoneyDisplay value={costBreakdown.shuttlecockRateEach} size="sm" />
            </div>
          </div>
          
          {/* Cost Totals */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Court Total</p>
              <MoneyDisplay value={costBreakdown.courtTotalCost} size="sm" />
              <p className="text-xs text-gray-500">{costBreakdown.hoursPlayed}h × ${costBreakdown.courtRatePerHour.toString()}</p>
            </div>
            <div>
              <p className="text-gray-600">Shuttle Total</p>
              <MoneyDisplay value={costBreakdown.shuttlecockTotalCost} size="sm" />
              <p className="text-xs text-gray-500">{costBreakdown.shuttlecocksUsed} × ${costBreakdown.shuttlecockRateEach.toString()}</p>
            </div>
            <div>
              <p className="text-gray-600">Other Costs</p>
              <MoneyDisplay value={costBreakdown.otherCosts} size="sm" />
            </div>
            <div>
              <p className="text-gray-600">Total Cost</p>
              <MoneyDisplay value={costBreakdown.totalCost} size="lg" className="font-semibold" />
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">
                Cost per player ({costBreakdown.playerCount} player{costBreakdown.playerCount === 1 ? '' : 's'}):
              </span>
              <MoneyDisplay 
                value={costBreakdown.costPerPlayer} 
                size="lg" 
                className="font-bold text-primary" 
              />
            </div>
          </div>

          {!costBreakdown.isValid && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-medium">Calculation Errors:</p>
              <ul className="text-sm text-red-600 mt-1 space-y-1">
                {costBreakdown.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="relative overflow-hidden" style={{ 
        borderRadius: '20px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.2)',
        transform: 'translateZ(0)'
      }}>
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, rgba(156, 163, 175, 0.08) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(107, 114, 128, 0.08) 100%)',
          borderRadius: '20px'
        }}></div>
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl translate-x-16 -translate-y-16" style={{
          background: 'linear-gradient(to bottom left, rgba(156, 163, 175, 0.06), transparent)'
        }}></div>
        <div className="absolute inset-0 backdrop-blur-md" style={{
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.05)'
        }}></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-50" style={{
          background: 'linear-gradient(135deg, rgba(156, 163, 175, 0.03) 0%, transparent 50%, rgba(107, 114, 128, 0.03) 100%)',
          borderRadius: '20px'
        }}></div>
        <div className="relative p-6">
          <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
            Notes (Optional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Any additional notes about this session..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-3 pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          loading={loading}
          disabled={loading || !costBreakdown?.isValid}
          className="relative overflow-hidden font-bold text-base transition-all duration-500 hover:shadow-xl hover:-translate-y-1 transform"
          style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)',
            boxShadow: '0 8px 32px rgba(59, 130, 246, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
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
            <span className="text-xl">🏸</span>
            <span>{loading ? 'Recording...' : 'Record Session'}</span>
          </span>
        </Button>
      </div>
    </form>
  )
}