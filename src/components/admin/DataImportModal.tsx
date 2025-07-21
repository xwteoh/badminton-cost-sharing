'use client'

import React, { useState, useRef } from 'react'
import { X, Upload, AlertTriangle, CheckCircle, FileText, Database, Users, Calendar, CreditCard, MapPin, BarChart3, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { dataImportService, type ImportOptions, type ImportValidationResult, type ImportResult } from '@/lib/services/data-import'

interface DataImportModalProps {
  isOpen: boolean
  onClose: () => void
  organizerId: string
}

export function DataImportModal({ isOpen, onClose, organizerId }: DataImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(null)
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    conflictResolution: 'skip_duplicates',
    validateOnly: false,
    clearExistingData: false
  })
  const [isValidating, setIsValidating] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [step, setStep] = useState<'select' | 'validate' | 'configure' | 'import' | 'complete'>('select')

  const resetModal = () => {
    setSelectedFile(null)
    setValidationResult(null)
    setImportResult(null)
    setStep('select')
    setImportOptions({
      conflictResolution: 'skip_duplicates',
      validateOnly: false,
      clearExistingData: false
    })
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setValidationResult(null)
      setImportResult(null)
      setStep('validate')
      validateFile(file)
    }
  }

  const validateFile = async (file: File) => {
    setIsValidating(true)
    try {
      const result = await dataImportService.validateImportFile(file)
      setValidationResult(result)
      setStep(result.isValid ? 'configure' : 'validate')
    } catch (error) {
      console.error('Validation error:', error)
      setValidationResult({
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Validation failed'],
        warnings: [],
        metadata: null,
        recordCounts: {
          players: 0,
          sessions: 0,
          session_participants: 0,
          payments: 0,
          player_balances: 0,
          locations: 0
        },
        conflicts: []
      })
    } finally {
      setIsValidating(false)
    }
  }

  const handleImport = async () => {
    if (!selectedFile) return

    setIsImporting(true)
    setStep('import')
    
    try {
      const result = await dataImportService.importData(selectedFile, organizerId, importOptions)
      setImportResult(result)
      setStep('complete')
    } catch (error) {
      console.error('Import error:', error)
      setImportResult({
        success: false,
        message: error instanceof Error ? error.message : 'Import failed',
        recordsProcessed: { players: 0, sessions: 0, session_participants: 0, payments: 0, player_balances: 0, locations: 0 },
        recordsSkipped: { players: 0, sessions: 0, session_participants: 0, payments: 0, player_balances: 0, locations: 0 },
        recordsCreated: { players: 0, sessions: 0, session_participants: 0, payments: 0, player_balances: 0, locations: 0 },
        recordsUpdated: { players: 0, sessions: 0, session_participants: 0, payments: 0, player_balances: 0, locations: 0 },
        conflicts: [],
        errors: [error instanceof Error ? error.message : 'Import failed'],
        warnings: []
      })
      setStep('complete')
    } finally {
      setIsImporting(false)
    }
  }

  const getDataTypeIcon = (type: string) => {
    switch (type) {
      case 'players': return <Users className="h-4 w-4" />
      case 'sessions': return <Calendar className="h-4 w-4" />
      case 'session_participants': return <FileText className="h-4 w-4" />
      case 'payments': return <CreditCard className="h-4 w-4" />
      case 'player_balances': return <BarChart3 className="h-4 w-4" />
      case 'locations': return <MapPin className="h-4 w-4" />
      default: return <Database className="h-4 w-4" />
    }
  }

  const getDataTypeLabel = (type: string) => {
    switch (type) {
      case 'players': return 'Players'
      case 'sessions': return 'Sessions'
      case 'session_participants': return 'Session Participants'
      case 'payments': return 'Payments'
      case 'player_balances': return 'Player Balances'
      case 'locations': return 'Locations'
      default: return type
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (!isOpen) return null

  const renderSelectStep = () => (
    <div className="text-center py-8">
      <div className="mb-6">
        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4">
          <Upload className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Backup File</h3>
        <p className="text-gray-600">Choose a JSON backup file to restore your badminton data</p>
      </div>

      <div 
        className="border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-blue-400 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-2">Click to select file or drag and drop</p>
        <p className="text-sm text-gray-500">JSON files only, maximum 50MB</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center space-x-2 text-yellow-800">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-medium">Important</span>
        </div>
        <p className="text-yellow-700 text-sm mt-1">
          Importing data will modify your existing records. Consider exporting a backup before proceeding.
        </p>
      </div>
    </div>
  )

  const renderValidateStep = () => (
    <div className="py-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
          <FileText className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">File Validation</h3>
          <p className="text-gray-600">Checking file format and data integrity</p>
        </div>
      </div>

      {isValidating ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Validating file...</p>
        </div>
      ) : validationResult ? (
        <div className="space-y-4">
          {/* File Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">File Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Filename:</span>
                <span className="ml-2 font-medium">{selectedFile?.name}</span>
              </div>
              <div>
                <span className="text-gray-500">Size:</span>
                <span className="ml-2 font-medium">{selectedFile ? formatFileSize(selectedFile.size) : 'Unknown'}</span>
              </div>
              {validationResult.metadata && (
                <>
                  <div>
                    <span className="text-gray-500">Export Date:</span>
                    <span className="ml-2 font-medium">{new Date(validationResult.metadata.exportDate).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Total Records:</span>
                    <span className="ml-2 font-medium">{validationResult.metadata.totalRecords}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Validation Status */}
          <div className={`p-4 rounded-lg border ${
            validationResult.isValid 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center space-x-2 mb-2">
              {validationResult.isValid ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={`font-medium ${
                validationResult.isValid ? 'text-green-800' : 'text-red-800'
              }`}>
                {validationResult.isValid ? 'Validation Successful' : 'Validation Failed'}
              </span>
            </div>
            
            {validationResult.errors.length > 0 && (
              <div className="mt-3">
                <p className="text-red-800 font-medium text-sm mb-2">Errors:</p>
                <ul className="text-red-700 text-sm space-y-1">
                  {validationResult.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {validationResult.warnings.length > 0 && (
              <div className="mt-3">
                <p className="text-yellow-800 font-medium text-sm mb-2">Warnings:</p>
                <ul className="text-yellow-700 text-sm space-y-1">
                  {validationResult.warnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Record Counts */}
          {validationResult.isValid && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-3">Data to Import</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(validationResult.recordCounts).map(([type, count]) => (
                  <div key={type} className="bg-white/70 rounded-lg p-3">
                    <div className="flex items-center space-x-2 text-blue-600 mb-1">
                      {getDataTypeIcon(type)}
                      <span className="text-xs font-medium">{getDataTypeLabel(type)}</span>
                    </div>
                    <div className="text-lg font-bold text-blue-900">{count}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )

  const renderConfigureStep = () => (
    <div className="py-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
          <CheckCircle className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Import Configuration</h3>
          <p className="text-gray-600">Configure how the data should be imported</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Conflict Resolution */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Conflict Resolution</label>
          <div className="space-y-3">
            {[
              {
                id: 'skip_duplicates',
                label: 'Skip Duplicates',
                description: 'Keep existing data, skip duplicate records',
                recommended: true
              },
              {
                id: 'replace_duplicates',
                label: 'Replace Duplicates',
                description: 'Replace existing records with imported data',
                recommended: false
              },
              {
                id: 'merge_data',
                label: 'Merge Data',
                description: 'Intelligently merge conflicting records',
                recommended: false
              }
            ].map((option) => (
              <label key={option.id} className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="conflictResolution"
                  value={option.id}
                  checked={importOptions.conflictResolution === option.id}
                  onChange={(e) => setImportOptions(prev => ({ ...prev, conflictResolution: e.target.value as any }))}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">{option.label}</span>
                    {option.recommended && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md">Recommended</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Additional Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Additional Options</label>
          <div className="space-y-3">
            <label className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={importOptions.clearExistingData}
                onChange={(e) => setImportOptions(prev => ({ ...prev, clearExistingData: e.target.checked }))}
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">Clear Existing Data</span>
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-md">Destructive</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">Delete all existing data before importing (use for fresh restore)</p>
              </div>
            </label>

            <label className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={importOptions.validateOnly}
                onChange={(e) => setImportOptions(prev => ({ ...prev, validateOnly: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <span className="font-medium text-gray-900">Validation Only</span>
                <p className="text-sm text-gray-600 mt-1">Test the import without making changes</p>
              </div>
            </label>
          </div>
        </div>

        {/* Warning for destructive operations */}
        {importOptions.clearExistingData && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Warning</span>
            </div>
            <p className="text-red-700 text-sm mt-1">
              This will permanently delete all your existing data before importing. This action cannot be undone.
            </p>
          </div>
        )}
      </div>
    </div>
  )

  const renderImportStep = () => (
    <div className="text-center py-8">
      <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4">
        {isImporting ? (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        ) : (
          <Database className="h-8 w-8 text-white" />
        )}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {isImporting ? 'Importing Data...' : 'Import Ready'}
      </h3>
      <p className="text-gray-600">
        {isImporting 
          ? 'Please wait while we import your data. This may take a few moments.'
          : 'Ready to import your badminton data.'
        }
      </p>
      {isImporting && (
        <div className="mt-6 text-sm text-gray-500">
          <p>⚠️ Do not close this window during import</p>
        </div>
      )}
    </div>
  )

  const renderCompleteStep = () => (
    <div className="py-6">
      <div className="text-center mb-6">
        <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 ${
          importResult?.success 
            ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
            : 'bg-gradient-to-br from-red-500 to-red-600'
        }`}>
          {importResult?.success ? (
            <CheckCircle className="h-8 w-8 text-white" />
          ) : (
            <AlertCircle className="h-8 w-8 text-white" />
          )}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {importResult?.success ? 'Import Successful!' : 'Import Failed'}
        </h3>
        <p className="text-gray-600">{importResult?.message}</p>
      </div>

      {importResult?.success && (
        <div className="bg-green-50 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-green-900 mb-3">Import Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(importResult.recordsCreated).map(([type, count]) => (
              count > 0 && (
                <div key={type} className="bg-white/70 rounded-lg p-3">
                  <div className="flex items-center space-x-2 text-green-600 mb-1">
                    {getDataTypeIcon(type)}
                    <span className="text-xs font-medium">{getDataTypeLabel(type)}</span>
                  </div>
                  <div className="text-lg font-bold text-green-900">{count} created</div>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {importResult && importResult.errors.length > 0 && (
        <div className="bg-red-50 rounded-lg p-4">
          <h4 className="font-medium text-red-900 mb-3">Errors</h4>
          <ul className="text-red-700 text-sm space-y-1">
            {importResult.errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Upload className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Import Data</h2>
              <p className="text-sm text-gray-600">Restore your badminton data from a backup file</p>
            </div>
          </div>
          <button
            onClick={() => {
              resetModal()
              onClose()
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            {[
              { id: 'select', label: 'Select File' },
              { id: 'validate', label: 'Validate' },
              { id: 'configure', label: 'Configure' },
              { id: 'import', label: 'Import' },
              { id: 'complete', label: 'Complete' }
            ].map((stepItem, index) => (
              <div key={stepItem.id} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === stepItem.id 
                    ? 'bg-blue-600 text-white' 
                    : index < ['select', 'validate', 'configure', 'import', 'complete'].indexOf(step)
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {index < ['select', 'validate', 'configure', 'import', 'complete'].indexOf(step) ? '✓' : index + 1}
                </div>
                <span className="ml-2 text-sm font-medium text-gray-700">{stepItem.label}</span>
                {index < 4 && <div className="w-8 h-px bg-gray-300 mx-4"></div>}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {step === 'select' && renderSelectStep()}
          {step === 'validate' && renderValidateStep()}
          {step === 'configure' && renderConfigureStep()}
          {step === 'import' && renderImportStep()}
          {step === 'complete' && renderCompleteStep()}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {step === 'select' && '📁 Select a JSON backup file to begin'}
            {step === 'validate' && '🔍 Checking file format and integrity'}
            {step === 'configure' && '⚙️ Configure import settings'}
            {step === 'import' && '📊 Processing your data'}
            {step === 'complete' && '✅ Import process completed'}
          </div>
          <div className="flex space-x-3">
            {step === 'configure' && (
              <Button
                variant="outline"
                onClick={() => setStep('validate')}
                disabled={isImporting}
              >
                Back
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                resetModal()
                onClose()
              }}
              disabled={isImporting}
            >
              {step === 'complete' ? 'Close' : 'Cancel'}
            </Button>
            {step === 'validate' && validationResult?.isValid && (
              <Button
                onClick={() => setStep('configure')}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                Continue
              </Button>
            )}
            {step === 'configure' && (
              <Button
                onClick={handleImport}
                disabled={isImporting}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                {importOptions.validateOnly ? 'Validate Import' : 'Start Import'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}