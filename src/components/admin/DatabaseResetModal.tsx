'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { databaseResetService } from '@/lib/services/database-reset'

interface DatabaseResetModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  organizerId: string
}

export function DatabaseResetModal({ isOpen, onClose, onConfirm, organizerId }: DatabaseResetModalProps) {
  const [step, setStep] = useState<'preview' | 'confirm' | 'typing'>('preview')
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<any>(null)
  const [previewLoading, setPreviewLoading] = useState(true)

  const requiredText = 'DELETE ALL MY DATA'

  // Load preview when modal opens
  useEffect(() => {
    if (isOpen && organizerId) {
      setPreviewLoading(true)
      databaseResetService.getResetPreview(organizerId)
        .then(result => {
          setPreview(result)
        })
        .catch(error => {
          console.error('Error loading reset preview:', error)
          setPreview({ success: false, error: error.message })
        })
        .finally(() => {
          setPreviewLoading(false)
        })
    } else {
      setStep('preview')
      setConfirmText('')
      setPreview(null)
      setPreviewLoading(true)
    }
  }, [isOpen, organizerId])

  if (!isOpen) return null

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
      onClose()
    } catch (error) {
      console.error('Reset failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalRecords = preview?.counts ? Object.values(preview.counts).reduce((sum: number, count: number) => sum + count, 0) : 0

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4 z-50 transition-all duration-300"
      style={{
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)'
      }}
    >
      <div 
        className="max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 animate-in fade-in-0 zoom-in-95"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: '24px'
        }}
      >
        {/* Danger Header */}
        <div 
          className="p-6 border-b border-white/20"
          style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)'
          }}
        >
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{
              background: 'linear-gradient(to bottom right, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.2))',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}>
              <span className="text-2xl">⚠️</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-red-600">DANGER: Reset Database</h2>
              <p className="text-red-500 text-sm">This action cannot be undone!</p>
            </div>
            <button
              onClick={onClose}
              className="ml-auto p-2 rounded-full hover:bg-red-100 transition-colors"
            >
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {step === 'preview' && (
            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                <div className="flex items-start space-x-3">
                  <span className="text-red-500 text-xl mt-1">🔥</span>
                  <div>
                    <h3 className="font-semibold text-red-800 mb-2">What will be deleted:</h3>
                    <p className="text-red-700 text-sm mb-3">
                      This will permanently delete ALL of your data including sessions, players, payments, and settings. 
                      This action is irreversible and there is no way to recover the data.
                    </p>
                  </div>
                </div>
              </div>

              {previewLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading data preview...</p>
                </div>
              ) : preview?.success ? (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Records to be deleted:</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span>Sessions:</span>
                      <span className="font-semibold text-red-600">{preview.counts.sessions.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Session Participants:</span>
                      <span className="font-semibold text-red-600">{preview.counts.session_participants.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Players:</span>
                      <span className="font-semibold text-red-600">{preview.counts.players.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payments:</span>
                      <span className="font-semibold text-red-600">{preview.counts.payments.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Locations:</span>
                      <span className="font-semibold text-red-600">{preview.counts.locations.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Settings:</span>
                      <span className="font-semibold text-red-600">{preview.counts.organizer_settings.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="border-t border-gray-200 mt-3 pt-3">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total Records:</span>
                      <span className="text-red-600">{totalRecords.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700">Error loading preview: {preview?.error || 'Unknown error'}</p>
                </div>
              )}

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="text-gray-600 border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => setStep('confirm')}
                  disabled={previewLoading || !preview?.success}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Continue to Confirmation
                </Button>
              </div>
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                <h3 className="font-semibold text-red-800 mb-2">Final Confirmation Required</h3>
                <p className="text-red-700 text-sm mb-4">
                  You are about to delete <strong>{totalRecords.toLocaleString()} records</strong> permanently. 
                  This includes all your sessions, players, payments, and settings.
                </p>
                <p className="text-red-700 text-sm font-medium">
                  To confirm, type exactly: <code className="bg-red-100 px-2 py-1 rounded">{requiredText}</code>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmation Text:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={requiredText}
                  className="w-full px-4 py-3 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 font-mono"
                  autoComplete="off"
                  spellCheck={false}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {confirmText.length > 0 && confirmText !== requiredText && (
                    <span className="text-red-500">Text does not match. Please type exactly as shown above.</span>
                  )}
                  {confirmText === requiredText && (
                    <span className="text-green-600">✓ Confirmation text matches</span>
                  )}
                </p>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setStep('preview')}
                  className="text-gray-600 border-gray-300 hover:bg-gray-50"
                >
                  ← Back
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={confirmText !== requiredText || loading}
                  className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting All Data...
                    </>
                  ) : (
                    '🔥 DELETE ALL DATA'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}