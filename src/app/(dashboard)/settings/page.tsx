'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/Button'
import { MoneyInput } from '@/components/ui/MoneyInput'
import { DatabaseResetModal } from '@/components/admin/DatabaseResetModal'
import { DataExportModal } from '@/components/admin/DataExportModal'
import { DataImportModal } from '@/components/admin/DataImportModal'
import { settingsService, type SettingsFormData } from '@/lib/services/settings'
import { databaseResetService } from '@/lib/services/database-reset'
import { cn } from '@/lib/utils/cn'

export default function SettingsPage() {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState<SettingsFormData>({
    courtRates: {
      indoorPeak: 50.00,
      indoorOffPeak: 35.00,
      outdoor: 15.00,
      community: 25.00
    },
    shuttlecockRates: {
      peak: 2.50,
      offPeak: 2.00,
      outdoor: 1.50,
      community: 1.80
    },
    peakHours: {
      morningStart: '07:00',
      morningEnd: '10:00',
      eveningStart: '18:00',
      eveningEnd: '22:00'
    },
    defaultCourtType: 'indoor_peak',
    autoRateSelection: true,
    autoShuttlecockEstimation: true
  })
  const [dataLoading, setDataLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)

  // Redirect unauthenticated users
  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/login'
    }
  }, [user, loading, router])

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.id) return

      try {
        setDataLoading(true)
        setError(null)
        
        console.log('🔧 Loading settings for user:', user.id)
        const settings = await settingsService.getSettings(user.id)
        
        setFormData(settings)
        console.log('✅ Settings loaded successfully')
        
      } catch (error: any) {
        console.error('❌ Error loading settings:', error)
        setError(error.message || 'Failed to load settings')
      } finally {
        setDataLoading(false)
      }
    }

    loadSettings()
  }, [user?.id])

  // Show loading while checking auth or loading data
  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{
        background: 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.03), #ffffff, rgba(99, 102, 241, 0.03))'
      }}>
        {/* Premium Loading Background */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.05), transparent, rgba(99, 102, 241, 0.05))'
        }}></div>
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl -translate-x-48 -translate-y-48" style={{
          background: 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.1), transparent)'
        }}></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full blur-3xl translate-x-40 translate-y-40" style={{
          background: 'linear-gradient(to top left, rgba(99, 102, 241, 0.1), transparent)'
        }}></div>
        
        <div className="relative z-10 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl backdrop-blur-md shadow-2xl mb-6" style={{
            background: 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.2))',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
            <span className="text-4xl filter drop-shadow-lg">⚙️</span>
          </div>
          <div className="space-y-4">
            <div className="relative">
              <div className="w-12 h-12 mx-auto">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200" style={{ borderTopColor: '#3b82f6' }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold" style={{
                background: 'linear-gradient(to right, #3b82f6, #6366f1)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Loading Settings
              </h3>
              <p className="text-sm font-medium" style={{ color: '#6b7280' }}>
                Preparing configuration interface...
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return

    setSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      console.log('💾 Updating settings:', formData)
      await settingsService.updateSettings(user.id, formData)
      
      setSuccess('Settings updated successfully!')
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
      
    } catch (error: any) {
      console.error('❌ Error updating settings:', error)
      setError(error.message || 'Failed to update settings')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCourtRateChange = (field: keyof typeof formData.courtRates, value: number) => {
    setFormData(prev => ({
      ...prev,
      courtRates: {
        ...prev.courtRates,
        [field]: value
      }
    }))
  }

  const handleShuttlecockRateChange = (field: keyof typeof formData.shuttlecockRates, value: number) => {
    setFormData(prev => ({
      ...prev,
      shuttlecockRates: {
        ...prev.shuttlecockRates,
        [field]: value
      }
    }))
  }

  const handlePeakHoursChange = (field: keyof typeof formData.peakHours, value: string) => {
    setFormData(prev => ({
      ...prev,
      peakHours: {
        ...prev.peakHours,
        [field]: value
      }
    }))
  }

  const handleResetDatabase = async () => {
    if (!user?.id) return

    setResetLoading(true)
    setError(null)
    setSuccess(null)

    try {
      console.log('🚨 Initiating database reset for user:', user.id)
      const result = await databaseResetService.resetDatabase(user.id)
      
      if (result.success) {
        setSuccess(`Database reset successful! Deleted ${Object.values(result.deletedCounts).reduce((sum, count) => sum + count, 0)} records.`)
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(null), 5000)
      } else {
        setError(`Database reset failed: ${result.message}`)
        if (result.errors.length > 0) {
          console.error('Reset errors:', result.errors)
        }
      }
      
    } catch (error: any) {
      console.error('❌ Error resetting database:', error)
      setError(error.message || 'Failed to reset database')
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{
      background: 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.03), #ffffff, rgba(99, 102, 241, 0.03))'
    }}>
      {/* Premium Background Pattern */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.05), transparent, rgba(99, 102, 241, 0.05))'
      }}></div>
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl -translate-x-48 -translate-y-48" style={{
        background: 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.08), transparent)'
      }}></div>
      <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full blur-3xl translate-x-40 translate-y-40" style={{
        background: 'linear-gradient(to top left, rgba(99, 102, 241, 0.08), transparent)'
      }}></div>
      <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full blur-3xl -translate-x-32 -translate-y-32" style={{
        background: 'linear-gradient(to bottom right, rgba(168, 85, 247, 0.05), transparent)'
      }}></div>
      
      <div className="relative z-10 max-w-4xl mx-auto p-4 lg:p-6 space-y-6 lg:space-y-8">
        {/* Premium Header */}
        <div className="relative overflow-hidden" style={{ 
          borderRadius: '24px',
          boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)',
          transform: 'translateZ(0)'
        }}>
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(99, 102, 241, 0.12) 100%)',
            borderRadius: '24px'
          }}></div>
          <div className="absolute top-0 left-0 w-64 h-64 rounded-full blur-3xl -translate-x-32 -translate-y-32" style={{
            background: 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.08), transparent)'
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
          
          <div className="relative p-4 lg:p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-3 lg:space-x-4">
              <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-2xl flex items-center justify-center shadow-2xl backdrop-blur-md" style={{
                background: 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.2))',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                <span className="text-2xl lg:text-3xl filter drop-shadow-lg">⚙️</span>
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold" style={{
                  background: 'linear-gradient(to right, #3b82f6, #6366f1, #8b5cf6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Settings
                </h1>
                <p className="mt-1 flex items-center space-x-2 text-sm lg:text-base" style={{ color: '#6b7280' }}>
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{
                    background: 'linear-gradient(to right, #3b82f6, #6366f1)'
                  }}></span>
                  <span>Configure your default rates and preferences</span>
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="hidden lg:flex items-center space-x-2 text-xs rounded-lg px-3 py-2 backdrop-blur-sm" style={{
                background: 'rgba(255, 255, 255, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: '#6b7280'
              }}>
                <span>🔧</span>
                <span>Configuration Panel</span>
              </div>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/dashboard'}
                className="transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 backdrop-blur-sm"
                style={{
                  borderColor: 'rgba(59, 130, 246, 0.2)',
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
                <span className="mr-2">←</span>
                Dashboard
              </Button>
            </div>
          </div>
        </div>

        {/* Premium Success Message */}
        {success && (
          <div className="relative overflow-hidden" style={{ 
            borderRadius: '20px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.2)',
            transform: 'translateZ(0)'
          }}>
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)',
              borderRadius: '20px'
            }}></div>
            <div className="absolute inset-0 backdrop-blur-md" style={{
              border: '1px solid rgba(34, 197, 94, 0.2)',
              backgroundColor: 'rgba(34, 197, 94, 0.05)',
              borderRadius: '20px',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}></div>
            <div className="relative p-4 lg:p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{
                  background: 'linear-gradient(to bottom right, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.2))',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                  <span>✅</span>
                </div>
                <div className="flex-1">
                  <span className="font-semibold" style={{ color: '#15803d' }}>Settings saved successfully!</span>
                  <p className="mt-1 text-sm" style={{ color: '#166534' }}>{success}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Premium Error Message */}
        {error && (
          <div className="relative overflow-hidden" style={{ 
            borderRadius: '20px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.2)',
            transform: 'translateZ(0)'
          }}>
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)',
              borderRadius: '20px'
            }}></div>
            <div className="absolute inset-0 backdrop-blur-md" style={{
              border: '1px solid rgba(239, 68, 68, 0.2)',
              backgroundColor: 'rgba(239, 68, 68, 0.05)',
              borderRadius: '20px',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}></div>
            <div className="relative p-4 lg:p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{
                  background: 'linear-gradient(to bottom right, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.2))',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                  <span>❌</span>
                </div>
                <div className="flex-1">
                  <span className="font-semibold" style={{ color: '#dc2626' }}>Error saving settings</span>
                  <p className="mt-1 text-sm" style={{ color: '#b91c1c' }}>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Premium Settings Form */}
        <form onSubmit={handleSubmit} className="space-y-6 lg:space-y-8">
          {/* Premium Court Rates */}
          <div className="relative overflow-hidden" style={{ 
            borderRadius: '24px',
            boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)',
            transform: 'translateZ(0)'
          }}>
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(34, 197, 94, 0.12) 100%)',
              borderRadius: '24px'
            }}></div>
            <div className="absolute bottom-0 right-0 w-56 h-56 rounded-full blur-3xl translate-x-28 translate-y-28" style={{
              background: 'linear-gradient(to top left, rgba(59, 130, 246, 0.08), transparent)'
            }}></div>
            <div className="absolute inset-0 backdrop-blur-xl" style={{
              border: '1px solid rgba(255, 255, 255, 0.18)',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              borderRadius: '24px',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.05)'
            }}></div>
            <div className="absolute top-0 left-0 w-full h-full opacity-60" style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, transparent 50%, rgba(34, 197, 94, 0.05) 100%)',
              borderRadius: '24px'
            }}></div>
            
            <div className="relative p-6 lg:p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl backdrop-blur-md" style={{
                  background: 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.2), rgba(34, 197, 94, 0.2))',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                  <span className="text-xl filter drop-shadow-lg">🏸</span>
                </div>
                <h2 className="text-lg lg:text-2xl font-semibold" style={{
                  background: 'linear-gradient(to right, #3b82f6, #22c55e)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Court Rates (per hour)
                </h2>
              </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Indoor Peak Hours
                </label>
                <MoneyInput
                  value={formData.courtRates.indoorPeak}
                  onChange={(value) => handleCourtRateChange('indoorPeak', value)}
                  className="w-full"
                  placeholder="50.00"
                />
                <p className="text-xs text-gray-500 mt-1">Weekday evenings, weekend mornings</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Indoor Off-Peak Hours
                </label>
                <MoneyInput
                  value={formData.courtRates.indoorOffPeak}
                  onChange={(value) => handleCourtRateChange('indoorOffPeak', value)}
                  className="w-full"
                  placeholder="35.00"
                />
                <p className="text-xs text-gray-500 mt-1">Weekday daytime, late nights</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Outdoor Courts
                </label>
                <MoneyInput
                  value={formData.courtRates.outdoor}
                  onChange={(value) => handleCourtRateChange('outdoor', value)}
                  className="w-full"
                  placeholder="15.00"
                />
                <p className="text-xs text-gray-500 mt-1">Open-air courts, weather dependent</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Community Centers
                </label>
                <MoneyInput
                  value={formData.courtRates.community}
                  onChange={(value) => handleCourtRateChange('community', value)}
                  className="w-full"
                  placeholder="25.00"
                />
                <p className="text-xs text-gray-500 mt-1">PA, CC, and public facilities</p>
              </div>
              </div>
            </div>
          </div>

          {/* Premium Shuttlecock Rates */}
          <div className="relative overflow-hidden" style={{ 
            borderRadius: '24px',
            boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)',
            transform: 'translateZ(0)'
          }}>
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(168, 85, 247, 0.12) 100%)',
              borderRadius: '24px'
            }}></div>
            <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full blur-3xl -translate-x-28 translate-y-28" style={{
              background: 'linear-gradient(to top right, rgba(245, 158, 11, 0.08), transparent)'
            }}></div>
            <div className="absolute inset-0 backdrop-blur-xl" style={{
              border: '1px solid rgba(255, 255, 255, 0.18)',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              borderRadius: '24px',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.05)'
            }}></div>
            <div className="absolute top-0 left-0 w-full h-full opacity-60" style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, transparent 50%, rgba(168, 85, 247, 0.05) 100%)',
              borderRadius: '24px'
            }}></div>
            
            <div className="relative p-6 lg:p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl backdrop-blur-md" style={{
                  background: 'linear-gradient(to bottom right, rgba(245, 158, 11, 0.2), rgba(168, 85, 247, 0.2))',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                  <span className="text-xl filter drop-shadow-lg">🏸</span>
                </div>
                <h2 className="text-lg lg:text-2xl font-semibold" style={{
                  background: 'linear-gradient(to right, #f59e0b, #a855f7)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Shuttlecock Rates (per shuttlecock)
                </h2>
              </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Peak Hours
                </label>
                <MoneyInput
                  value={formData.shuttlecockRates.peak}
                  onChange={(value) => handleShuttlecockRateChange('peak', value)}
                  className="w-full"
                  placeholder="2.50"
                />
                <p className="text-xs text-gray-500 mt-1">Premium shuttlecocks for peak times</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Off-Peak Hours
                </label>
                <MoneyInput
                  value={formData.shuttlecockRates.offPeak}
                  onChange={(value) => handleShuttlecockRateChange('offPeak', value)}
                  className="w-full"
                  placeholder="2.00"
                />
                <p className="text-xs text-gray-500 mt-1">Standard shuttlecocks for off-peak</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Outdoor Courts
                </label>
                <MoneyInput
                  value={formData.shuttlecockRates.outdoor}
                  onChange={(value) => handleShuttlecockRateChange('outdoor', value)}
                  className="w-full"
                  placeholder="1.50"
                />
                <p className="text-xs text-gray-500 mt-1">Weather-resistant shuttlecocks</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Community Centers
                </label>
                <MoneyInput
                  value={formData.shuttlecockRates.community}
                  onChange={(value) => handleShuttlecockRateChange('community', value)}
                  className="w-full"
                  placeholder="1.80"
                />
                <p className="text-xs text-gray-500 mt-1">Community-grade shuttlecocks</p>
              </div>
              </div>
            </div>
          </div>

          {/* Premium Peak Hours Configuration */}
          <div className="relative overflow-hidden" style={{ 
            borderRadius: '24px',
            boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)',
            transform: 'translateZ(0)'
          }}>
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(34, 197, 94, 0.12) 100%)',
              borderRadius: '24px'
            }}></div>
            <div className="absolute top-0 right-0 w-56 h-56 rounded-full blur-3xl translate-x-28 -translate-y-28" style={{
              background: 'linear-gradient(to bottom left, rgba(168, 85, 247, 0.08), transparent)'
            }}></div>
            <div className="absolute inset-0 backdrop-blur-xl" style={{
              border: '1px solid rgba(255, 255, 255, 0.18)',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              borderRadius: '24px',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.05)'
            }}></div>
            <div className="absolute top-0 left-0 w-full h-full opacity-60" style={{
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.05) 0%, transparent 50%, rgba(34, 197, 94, 0.05) 100%)',
              borderRadius: '24px'
            }}></div>
            
            <div className="relative p-6 lg:p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl backdrop-blur-md" style={{
                  background: 'linear-gradient(to bottom right, rgba(168, 85, 247, 0.2), rgba(34, 197, 94, 0.2))',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                  <span className="text-xl filter drop-shadow-lg">🕐</span>
                </div>
                <h2 className="text-lg lg:text-2xl font-semibold" style={{
                  background: 'linear-gradient(to right, #a855f7, #22c55e)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Peak Hours Definition
                </h2>
              </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800">Morning Peak</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={formData.peakHours.morningStart}
                      onChange={(e) => handlePeakHoursChange('morningStart', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={formData.peakHours.morningEnd}
                      onChange={(e) => handlePeakHoursChange('morningEnd', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800">Evening Peak</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={formData.peakHours.eveningStart}
                      onChange={(e) => handlePeakHoursChange('eveningStart', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={formData.peakHours.eveningEnd}
                      onChange={(e) => handlePeakHoursChange('eveningEnd', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
              <div className="mt-6 p-4 rounded-lg backdrop-blur-sm" style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.2)'
              }}>
                <p className="text-sm" style={{ color: '#1e40af' }}>
                  <strong>Current Peak Hours:</strong> {formData.peakHours.morningStart} - {formData.peakHours.morningEnd} (morning) and {formData.peakHours.eveningStart} - {formData.peakHours.eveningEnd} (evening)
                </p>
              </div>
            </div>
          </div>

          {/* Premium Preferences */}
          <div className="relative overflow-hidden" style={{ 
            borderRadius: '24px',
            boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)',
            transform: 'translateZ(0)'
          }}>
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(59, 130, 246, 0.12) 100%)',
              borderRadius: '24px'
            }}></div>
            <div className="absolute bottom-0 right-0 w-56 h-56 rounded-full blur-3xl translate-x-28 translate-y-28" style={{
              background: 'linear-gradient(to top left, rgba(34, 197, 94, 0.08), transparent)'
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
            
            <div className="relative p-6 lg:p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl backdrop-blur-md" style={{
                  background: 'linear-gradient(to bottom right, rgba(34, 197, 94, 0.2), rgba(59, 130, 246, 0.2))',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                  <span className="text-xl filter drop-shadow-lg">⚡</span>
                </div>
                <h2 className="text-lg lg:text-2xl font-semibold" style={{
                  background: 'linear-gradient(to right, #22c55e, #3b82f6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Preferences
                </h2>
              </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Court Type
                </label>
                <select
                  value={formData.defaultCourtType}
                  onChange={(e) => setFormData(prev => ({ ...prev, defaultCourtType: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="indoor_peak">Indoor Peak</option>
                  <option value="indoor_offpeak">Indoor Off-Peak</option>
                  <option value="outdoor">Outdoor</option>
                  <option value="community">Community</option>
                </select>
              </div>

              <div className="space-y-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.autoRateSelection}
                    onChange={(e) => setFormData(prev => ({ ...prev, autoRateSelection: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Auto Rate Selection</span>
                    <p className="text-xs text-gray-500">Automatically select rates based on session time</p>
                  </div>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.autoShuttlecockEstimation}
                    onChange={(e) => setFormData(prev => ({ ...prev, autoShuttlecockEstimation: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Auto Shuttlecock Estimation</span>
                    <p className="text-xs text-gray-500">Estimate shuttlecock usage based on hours played</p>
                  </div>
                </label>
              </div>
              </div>
            </div>
          </div>

          {/* Premium Save Buttons */}
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.location.href = '/dashboard'}
              disabled={submitting}
              className="transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 backdrop-blur-sm"
              style={{
                borderColor: 'rgba(59, 130, 246, 0.2)',
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
            <Button
              type="submit"
              disabled={submitting}
              className="transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(to right, #3b82f6, #6366f1)',
                color: 'white',
                border: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to right, #2563eb, #4f46e5)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to right, #3b82f6, #6366f1)'
              }}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <span className="mr-2">💾</span>
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Admin Tools - Organizer Only */}
        {userProfile?.role === 'organizer' && (
          <div className="relative overflow-hidden" style={{ 
            borderRadius: '24px',
            boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)',
            transform: 'translateZ(0)'
          }}>
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(255, 255, 255, 0.95) 50%, rgba(245, 158, 11, 0.12) 100%)',
              borderRadius: '24px'
            }}></div>
            <div className="absolute top-0 left-0 w-56 h-56 rounded-full blur-3xl -translate-x-28 -translate-y-28" style={{
              background: 'linear-gradient(to bottom right, rgba(239, 68, 68, 0.08), transparent)'
            }}></div>
            <div className="absolute inset-0 backdrop-blur-xl" style={{
              border: '1px solid rgba(255, 255, 255, 0.18)',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              borderRadius: '24px',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.05)'
            }}></div>
            <div className="absolute top-0 left-0 w-full h-full opacity-60" style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, transparent 50%, rgba(245, 158, 11, 0.05) 100%)',
              borderRadius: '24px'
            }}></div>
            
            <div className="relative p-6 lg:p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl backdrop-blur-md" style={{
                  background: 'linear-gradient(to bottom right, rgba(239, 68, 68, 0.2), rgba(245, 158, 11, 0.2))',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                  <span className="text-xl filter drop-shadow-lg">🔧</span>
                </div>
                <h2 className="text-lg lg:text-2xl font-semibold" style={{
                  background: 'linear-gradient(to right, #ef4444, #f59e0b)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Admin Tools
                </h2>
              </div>
              
              <div className="space-y-4">
                {/* Data Migration Tool */}
                <div className="p-4 rounded-xl backdrop-blur-sm border" style={{
                  background: 'rgba(255, 255, 255, 0.7)',
                  borderColor: 'rgba(239, 68, 68, 0.2)'
                }}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        🔄 Data Migration
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        One-time import tool for migrating existing badminton session data, participants, and payment records from spreadsheets or other systems.
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md">Sessions</span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-md">Players</span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-md">Payments</span>
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-md">One-time only</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => router.push('/admin/migrate')}
                      className="ml-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                      style={{
                        background: 'linear-gradient(to right, #ef4444, #dc2626)',
                        color: 'white',
                        border: 'none'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(to right, #dc2626, #b91c1c)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(to right, #ef4444, #dc2626)'
                      }}
                    >
                      <span className="mr-2">🚀</span>
                      Open Migration Tool
                    </Button>
                  </div>
                </div>

                {/* Reset Database Tool */}
                <div className="p-4 rounded-xl backdrop-blur-sm border" style={{
                  background: 'rgba(255, 255, 255, 0.7)',
                  borderColor: 'rgba(239, 68, 68, 0.3)'
                }}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-red-600 mb-2">
                        🔥 Reset Database
                      </h3>
                      <p className="text-sm text-red-700 mb-3">
                        <strong>DANGER:</strong> Permanently delete all your data including sessions, players, payments, and settings. 
                        This action cannot be undone.
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-md">Irreversible</span>
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-md">All Data</span>
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-md">No Recovery</span>
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-md">Use with Caution</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => setShowResetModal(true)}
                      disabled={resetLoading}
                      className="ml-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                      style={{
                        background: 'linear-gradient(to right, #dc2626, #b91c1c)',
                        color: 'white',
                        border: 'none'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(to right, #b91c1c, #991b1b)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(to right, #dc2626, #b91c1c)'
                      }}
                    >
                      {resetLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Resetting...
                        </>
                      ) : (
                        <>
                          <span className="mr-2">⚠️</span>
                          Reset Database
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Data Export Tool */}
                <div className="p-4 rounded-xl backdrop-blur-sm border" style={{
                  background: 'rgba(255, 255, 255, 0.7)',
                  borderColor: 'rgba(34, 197, 94, 0.2)'
                }}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        📊 Data Export
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Download a complete backup of your badminton data including sessions, players, payments, and financial records.
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-md">Full Backup</span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md">Date Range</span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-md">Selective Export</span>
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-md">JSON Format</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => setShowExportModal(true)}
                      className="ml-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                      style={{
                        background: 'linear-gradient(to right, #22c55e, #16a34a)',
                        color: 'white',
                        border: 'none'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(to right, #16a34a, #15803d)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(to right, #22c55e, #16a34a)'
                      }}
                    >
                      <span className="mr-2">💾</span>
                      Export Data
                    </Button>
                  </div>
                </div>

                {/* Data Import Tool */}
                <div className="p-4 rounded-xl backdrop-blur-sm border" style={{
                  background: 'rgba(255, 255, 255, 0.7)',
                  borderColor: 'rgba(99, 102, 241, 0.2)'
                }}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        📁 Data Import
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Restore your badminton data from a backup file. Perfect for data recovery or migrating between devices.
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-md">File Validation</span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md">Conflict Detection</span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-md">Safe Import</span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-md">Data Recovery</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => setShowImportModal(true)}
                      className="ml-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                      style={{
                        background: 'linear-gradient(to right, #6366f1, #4f46e5)',
                        color: 'white',
                        border: 'none'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(to right, #4f46e5, #4338ca)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(to right, #6366f1, #4f46e5)'
                      }}
                    >
                      <span className="mr-2">📤</span>
                      Import Data
                    </Button>
                  </div>
                </div>
              </div>

              {/* Warning Notice */}
              <div className="mt-6 p-4 rounded-lg backdrop-blur-sm" style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)'
              }}>
                <div className="flex items-center space-x-2">
                  <span className="text-red-500">⚠️</span>
                  <p className="text-sm text-red-800 font-medium">
                    Admin tools can modify database records directly. Always export a backup before using destructive operations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Premium Settings Tips */}
        <div className="relative overflow-hidden" style={{ 
          borderRadius: '20px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.2)',
          transform: 'translateZ(0)'
        }}>
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%)',
            borderRadius: '20px'
          }}></div>
          <div className="absolute inset-0 backdrop-blur-md" style={{
            border: '1px solid rgba(59, 130, 246, 0.2)',
            backgroundColor: 'rgba(59, 130, 246, 0.05)',
            borderRadius: '20px',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          }}></div>
          <div className="relative p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{
                background: 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.2))',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                <span>💡</span>
              </div>
              <h3 className="text-lg font-semibold" style={{
                background: 'linear-gradient(to right, #3b82f6, #6366f1)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Settings Tips
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ color: '#1e40af' }}>
              <div className="space-y-2">
                <h4 className="font-medium">Rate Configuration</h4>
                <ul className="text-sm space-y-1">
                  <li>• Set rates to match your usual venues</li>
                  <li>• Peak hours typically cost 30-50% more</li>
                  <li>• Outdoor courts are usually cheapest</li>
                  <li>• Community centers offer mid-range pricing</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Auto Features</h4>
                <ul className="text-sm space-y-1">
                  <li>• Auto rate selection saves time when recording</li>
                  <li>• Shuttlecock estimation: ~2 per hour played</li>
                  <li>• You can always override defaults when needed</li>
                  <li>• Settings apply to all future sessions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <DatabaseResetModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleResetDatabase}
        organizerId={user?.id || ''}
      />
      
      <DataExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        organizerId={user?.id || ''}
      />
      
      <DataImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        organizerId={user?.id || ''}
      />
    </div>
  )
}