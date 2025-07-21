'use client'

import React, { useState } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle, BarChart3 } from 'lucide-react'

interface PaymentAnalysis {
  totalPayments: number
  topLevelPayments: number
  sessionPayments: number
  paymentsByDate: Array<{ date: string; count: number }>
  paymentsByPlayer: Array<{ player: string; count: number }>
  paymentMethods: Array<{ method: string; count: number }>
  dateRange: {
    earliest: string
    latest: string
  }
  sessionDateRange: {
    earliest: string
    latest: string
  }
  sessionsCount: number
  errors: string[]
}

export default function DebugPaymentsPage() {
  const [file, setFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<PaymentAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)

  const analyzePayments = (data: any): PaymentAnalysis => {
    const analysis: PaymentAnalysis = {
      totalPayments: 0,
      topLevelPayments: 0,
      sessionPayments: 0,
      paymentsByDate: [],
      paymentsByPlayer: [],
      paymentMethods: [],
      dateRange: { earliest: '', latest: '' },
      sessionDateRange: { earliest: '', latest: '' },
      sessionsCount: 0,
      errors: []
    }

    const paymentsByDate = new Map<string, number>()
    const paymentsByPlayer = new Map<string, number>()
    const paymentMethods = new Map<string, number>()

    try {
      // Check top-level payments
      if (data.payments && Array.isArray(data.payments)) {
        analysis.topLevelPayments = data.payments.length
        console.log(`💰 Top-level payments array: ${analysis.topLevelPayments} payments`)
        
        // Analyze top-level payments
        data.payments.forEach((payment: any) => {
          analysis.totalPayments++
          
          // Count by date
          const date = payment.payment_date
          paymentsByDate.set(date, (paymentsByDate.get(date) || 0) + 1)
          
          // Count by player
          const player = payment.player_name
          paymentsByPlayer.set(player, (paymentsByPlayer.get(player) || 0) + 1)
          
          // Count by method
          const method = payment.payment_method || 'unknown'
          paymentMethods.set(method, (paymentMethods.get(method) || 0) + 1)
        })
      }

      // Check session-level payments
      if (data.sessions && Array.isArray(data.sessions)) {
        analysis.sessionsCount = data.sessions.length
        console.log(`🏸 Sessions found: ${analysis.sessionsCount}`)
        
        data.sessions.forEach((session: any, index: number) => {
          if (session.payments && Array.isArray(session.payments)) {
            const sessionPaymentCount = session.payments.length
            analysis.sessionPayments += sessionPaymentCount
            console.log(`   Session ${index + 1} (${session.date}): ${sessionPaymentCount} payments`)
            
            // Analyze session payments
            session.payments.forEach((payment: any) => {
              analysis.totalPayments++
              
              // Count by date
              const date = payment.payment_date
              paymentsByDate.set(date, (paymentsByDate.get(date) || 0) + 1)
              
              // Count by player
              const player = payment.player_name
              paymentsByPlayer.set(player, (paymentsByPlayer.get(player) || 0) + 1)
              
              // Count by method
              const method = payment.payment_method || 'unknown'
              paymentMethods.set(method, (paymentMethods.get(method) || 0) + 1)
            })
          }
        })
      }

      // Convert maps to sorted arrays
      analysis.paymentsByDate = Array.from(paymentsByDate.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20) // Top 20 dates

      analysis.paymentsByPlayer = Array.from(paymentsByPlayer.entries())
        .map(([player, count]) => ({ player, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20) // Top 20 players

      analysis.paymentMethods = Array.from(paymentMethods.entries())
        .map(([method, count]) => ({ method, count }))
        .sort((a, b) => b.count - a.count)

      // Calculate date ranges
      const allDates = Array.from(paymentsByDate.keys()).filter(Boolean).sort()
      if (allDates.length > 0) {
        analysis.dateRange = {
          earliest: allDates[0],
          latest: allDates[allDates.length - 1]
        }
      }

      // Calculate session date range
      if (data.sessions && data.sessions.length > 0) {
        const sessionDates = data.sessions.map((s: any) => s.date).filter(Boolean).sort()
        if (sessionDates.length > 0) {
          analysis.sessionDateRange = {
            earliest: sessionDates[0],
            latest: sessionDates[sessionDates.length - 1]
          }
        }
      }

    } catch (err) {
      analysis.errors.push(`Analysis error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }

    return analysis
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0]
    if (!uploadedFile) return

    setFile(uploadedFile)
    setError(null)
    setAnalysis(null)
    setIsAnalyzing(true)

    try {
      const text = await uploadedFile.text()
      const data = JSON.parse(text)
      
      const analysisResult = analyzePayments(data)
      setAnalysis(analysisResult)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze file')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setAnalysis(null)
    setError(null)
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Payment Data Analyzer
        </h1>
        <p className="text-gray-600">
          Upload your migration JSON file to analyze payment data and verify counts
        </p>
      </div>

      {/* File Upload Section */}
      <div className="mb-8">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="text-lg font-medium text-gray-900 mb-2">
              Upload Migration JSON File
            </div>
            <div className="text-sm text-gray-500">
              Click to select your badminton migration data file
            </div>
          </label>
        </div>

        {file && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-900">{file.name}</span>
              <span className="text-sm text-blue-600 ml-2">
                ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </div>
            <button
              onClick={handleReset}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Remove
            </button>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isAnalyzing && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing payment data...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-red-900 mb-1">Analysis Failed</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg border">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Payments</p>
                  <p className="text-2xl font-bold text-gray-900">{analysis.totalPayments}</p>
                  {analysis.totalPayments === 456 ? (
                    <div className="flex items-center text-green-600 text-sm">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Expected count ✓
                    </div>
                  ) : (
                    <div className="flex items-center text-orange-600 text-sm">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      Expected 456 ({456 - analysis.totalPayments} missing)
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border">
              <div className="flex items-center">
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Top-Level Payments</p>
                  <p className="text-2xl font-bold text-gray-900">{analysis.topLevelPayments}</p>
                  <p className="text-sm text-gray-600">In data.payments array</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border">
              <div className="flex items-center">
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Session Payments</p>
                  <p className="text-2xl font-bold text-gray-900">{analysis.sessionPayments}</p>
                  <p className="text-sm text-gray-600">In session objects</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border">
              <div className="flex items-center">
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Sessions</p>
                  <p className="text-2xl font-bold text-gray-900">{analysis.sessionsCount}</p>
                  <p className="text-sm text-gray-600">Total sessions found</p>
                </div>
              </div>
            </div>
          </div>

          {/* Date Ranges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Date Range</h3>
              {analysis.dateRange.earliest ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Earliest:</span>
                    <span className="text-sm font-medium">{analysis.dateRange.earliest}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Latest:</span>
                    <span className="text-sm font-medium">{analysis.dateRange.latest}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No payment dates found</p>
              )}
            </div>

            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Session Date Range</h3>
              {analysis.sessionDateRange.earliest ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Earliest:</span>
                    <span className="text-sm font-medium">{analysis.sessionDateRange.earliest}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Latest:</span>
                    <span className="text-sm font-medium">{analysis.sessionDateRange.latest}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No session dates found</p>
              )}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Methods</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {analysis.paymentMethods.map(({ method, count }) => (
                <div key={method} className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">{method}</p>
                  <p className="text-lg font-bold text-blue-600">{count}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Top Payment Dates */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Payment Dates</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {analysis.paymentsByDate.slice(0, 10).map(({ date, count }) => (
                <div key={date} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <span className="text-sm font-medium text-gray-900">{date}</span>
                  <span className="text-sm text-blue-600 font-medium">{count} payments</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Players */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Players by Payment Count</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {analysis.paymentsByPlayer.slice(0, 10).map(({ player, count }) => (
                <div key={player} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <span className="text-sm font-medium text-gray-900">{player}</span>
                  <span className="text-sm text-blue-600 font-medium">{count} payments</span>
                </div>
              ))}
            </div>
          </div>

          {/* Errors */}
          {analysis.errors.length > 0 && (
            <div className="bg-red-50 p-6 rounded-lg border border-red-200">
              <h3 className="text-lg font-medium text-red-900 mb-4">Analysis Errors</h3>
              <div className="space-y-2">
                {analysis.errors.map((error, index) => (
                  <p key={index} className="text-sm text-red-700">• {error}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}