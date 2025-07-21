'use client'

import React, { useState, useEffect } from 'react'
import { X, Download, Calendar, Database, FileText, Users, CreditCard, MapPin, BarChart3, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { dataExportService, type ExportOptions } from '@/lib/services/data-export'

interface DataExportModalProps {
  isOpen: boolean
  onClose: () => void
  organizerId: string
}

export function DataExportModal({ isOpen, onClose, organizerId }: DataExportModalProps) {
  const [exportType, setExportType] = useState<'full_backup' | 'date_range' | 'selective'>('full_backup')
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  })
  const [selectedTypes, setSelectedTypes] = useState<string[]>([
    'players', 'sessions', 'session_participants', 'payments', 'player_balances', 'locations'
  ])
  const [preview, setPreview] = useState<any>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportResult, setExportResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Load preview when modal opens or options change
  useEffect(() => {
    if (isOpen && organizerId) {
      loadPreview()
    }
  }, [isOpen, organizerId, exportType, dateRange, selectedTypes])

  const loadPreview = async () => {
    setIsLoadingPreview(true)
    setError(null)

    try {
      const options: ExportOptions = {
        type: exportType,
        ...(exportType === 'date_range' && dateRange.startDate && dateRange.endDate && {
          dateRange
        }),
        ...(exportType === 'selective' && {
          includeTypes: selectedTypes as any[]
        })
      }

      const previewResult = await dataExportService.getExportPreview(organizerId, options)
      
      if (previewResult.success) {
        setPreview(previewResult)
      } else {
        setError(previewResult.error || 'Failed to load preview')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preview')
    } finally {
      setIsLoadingPreview(false)
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    setError(null)
    setExportResult(null)

    try {
      const options: ExportOptions = {
        type: exportType,
        ...(exportType === 'date_range' && dateRange.startDate && dateRange.endDate && {
          dateRange
        }),
        ...(exportType === 'selective' && {
          includeTypes: selectedTypes as any[]
        })
      }

      const result = await dataExportService.exportOrganizerData(organizerId, options)
      
      if (result.success) {
        setExportResult(result)
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  const toggleDataType = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Download className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Export Data</h2>
              <p className="text-sm text-gray-600">Download a backup of your badminton data</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Export Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Export Type</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { 
                  id: 'full_backup', 
                  label: 'Full Backup', 
                  description: 'All data for complete backup',
                  icon: <Database className="h-5 w-5" />
                },
                { 
                  id: 'date_range', 
                  label: 'Date Range', 
                  description: 'Sessions and payments in date range',
                  icon: <Calendar className="h-5 w-5" />
                },
                { 
                  id: 'selective', 
                  label: 'Selective', 
                  description: 'Choose specific data types',
                  icon: <FileText className="h-5 w-5" />
                }
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => setExportType(type.id as any)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    exportType === type.id
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    {type.icon}
                    <span className="font-medium">{type.label}</span>
                  </div>
                  <p className="text-sm text-left">{type.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Date Range Selection */}
          {exportType === 'date_range' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Date Range</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">End Date</label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Selective Data Types */}
          {exportType === 'selective' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Data Types to Export</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {['players', 'sessions', 'session_participants', 'payments', 'player_balances', 'locations'].map((type) => (
                  <label key={type} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes(type)}
                      onChange={() => toggleDataType(type)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex items-center space-x-2 text-blue-600">
                      {getDataTypeIcon(type)}
                    </div>
                    <span className="font-medium text-gray-700">{getDataTypeLabel(type)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Preview */}
          {isLoadingPreview ? (
            <div className="mb-6 p-6 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="text-gray-600">Loading preview...</span>
              </div>
            </div>
          ) : preview ? (
            <div className="mb-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-4 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Export Preview
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                {Object.entries(preview.recordCounts).map(([type, count]) => (
                  <div key={type} className="bg-white/70 rounded-lg p-3">
                    <div className="flex items-center space-x-2 text-blue-600 mb-1">
                      {getDataTypeIcon(type)}
                      <span className="text-xs font-medium text-gray-600">{getDataTypeLabel(type)}</span>
                    </div>
                    <div className="text-lg font-bold text-blue-900">{count}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-blue-800">
                {preview.dateRange.earliest && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{preview.dateRange.earliest} to {preview.dateRange.latest}</span>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <FileText className="h-4 w-4" />
                  <span>Estimated size: {preview.estimatedFileSize}</span>
                </div>
              </div>
            </div>
          ) : null}

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center space-x-2 text-red-800">
                <span className="text-red-500">❌</span>
                <span className="font-medium">Error</span>
              </div>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          )}

          {/* Export Result */}
          {exportResult && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center space-x-2 text-green-800 mb-2">
                <span className="text-green-500">✅</span>
                <span className="font-medium">Export Successful!</span>
              </div>
              <p className="text-green-700 text-sm mb-3">{exportResult.message}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="bg-white/70 rounded p-2">
                  <div className="text-green-600 font-medium">Filename</div>
                  <div className="text-green-800">{exportResult.filename}</div>
                </div>
                <div className="bg-white/70 rounded p-2">
                  <div className="text-green-600 font-medium">File Size</div>
                  <div className="text-green-800">{formatFileSize(exportResult.fileSize)}</div>
                </div>
                <div className="bg-white/70 rounded p-2">
                  <div className="text-green-600 font-medium">Total Records</div>
                  <div className="text-green-800">{Object.values(exportResult.recordCounts).reduce((sum: number, count: number) => sum + count, 0)}</div>
                </div>
                <div className="bg-white/70 rounded p-2">
                  <div className="text-green-600 font-medium">Export Time</div>
                  <div className="text-green-800 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    Just now
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            💡 Tip: Keep regular backups of your data for safety
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isExporting}
            >
              {exportResult ? 'Close' : 'Cancel'}
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting || !preview || (exportType === 'date_range' && (!dateRange.startDate || !dateRange.endDate))}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}