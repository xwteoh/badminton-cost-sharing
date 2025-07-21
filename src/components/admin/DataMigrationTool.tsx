'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { MigrationData, migrateBadmintonData, MigrationResult } from '@/lib/migrations/dataMigration'
import { exampleMigrationData, runExampleMigration } from '@/lib/migrations/exampleMigration'

interface DataMigrationToolProps {
  organizerId: string
}

export function DataMigrationTool({ organizerId }: DataMigrationToolProps) {
  const [migrationData, setMigrationData] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<MigrationResult | null>(null)
  const [showExample, setShowExample] = useState(false)

  const handleMigration = async () => {
    if (!migrationData.trim()) {
      alert('Please enter migration data')
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      // Parse the JSON data
      const data: MigrationData = JSON.parse(migrationData)
      
      // Run migration
      const migrationResult = await migrateBadmintonData(organizerId, data)
      setResult(migrationResult)
      
    } catch (error) {
      setResult({
        success: false,
        message: `Failed to parse migration data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        stats: {
          sessions_created: 0,
          standalone_players_created: 0,
          standalone_players_updated: 0,
          session_players_created: 0,
          session_players_updated: 0,
          payments_created: 0,
          participant_records_created: 0
        },
        errors: [error instanceof Error ? error.message : 'Unknown error']
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleExampleMigration = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const migrationResult = await runExampleMigration(organizerId)
      setResult(migrationResult)
    } catch (error) {
      setResult({
        success: false,
        message: `Example migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        stats: {
          sessions_created: 0,
          standalone_players_created: 0,
          standalone_players_updated: 0,
          session_players_created: 0,
          session_players_updated: 0,
          payments_created: 0,
          participant_records_created: 0
        },
        errors: [error instanceof Error ? error.message : 'Unknown error']
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadExampleData = () => {
    setMigrationData(JSON.stringify(exampleMigrationData, null, 2))
    setShowExample(false)
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">🔄 Data Migration Tool</h2>
        <p className="text-gray-600 mb-6">
          One-time migration tool for importing badminton players, sessions, participants, and payments.
          <br />
          You can migrate standalone players, sessions with participants, or both together.
          <br />
          <strong>⚠️ This will create new records in your database. Use with caution!</strong>
        </p>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Button
            onClick={handleExampleMigration}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? '⏳ Running...' : '🚀 Run Example Migration'}
          </Button>
          <Button
            onClick={() => setShowExample(!showExample)}
            variant="outline"
          >
            {showExample ? 'Hide Example' : '👁️ View Example Data'}
          </Button>
          <Button
            onClick={loadExampleData}
            variant="outline"
          >
            📋 Load Example to Editor
          </Button>
        </div>

        {/* Example Data Display */}
        {showExample && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
            <h3 className="font-semibold text-gray-900 mb-2">Example Migration Data Structure:</h3>
            <pre className="text-xs text-gray-700 overflow-x-auto">
              {JSON.stringify(exampleMigrationData, null, 2)}
            </pre>
          </div>
        )}

        {/* Migration Data Input */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Migration Data (JSON Format)
            </label>
            <textarea
              value={migrationData}
              onChange={(e) => setMigrationData(e.target.value)}
              placeholder="Paste your migration data here as JSON array..."
              rows={20}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            />
          </div>

          <Button
            onClick={handleMigration}
            disabled={isLoading || !migrationData.trim()}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
          >
            {isLoading ? '⏳ Migrating Data...' : '🚀 Start Migration'}
          </Button>
        </div>

        {/* Migration Result */}
        {result && (
          <div className={`mt-6 p-4 rounded-lg border ${
            result.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <h3 className={`font-semibold mb-2 ${
              result.success ? 'text-green-900' : 'text-red-900'
            }`}>
              {result.success ? '✅ Migration Successful!' : '❌ Migration Failed'}
            </h3>
            
            <p className={`mb-4 ${
              result.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {result.message}
            </p>

            {/* Statistics */}
            {result.success && (
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{result.stats.sessions_created}</div>
                  <div className="text-xs text-green-700">Sessions Created</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{result.stats.standalone_players_created}</div>
                  <div className="text-xs text-blue-700">Standalone Players Created</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-600">{result.stats.session_players_created}</div>
                  <div className="text-xs text-cyan-700">Session Players Created</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{result.stats.standalone_players_updated + result.stats.session_players_updated}</div>
                  <div className="text-xs text-orange-700">Players Updated</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{result.stats.payments_created}</div>
                  <div className="text-xs text-purple-700">Payments Created</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">{result.stats.participant_records_created}</div>
                  <div className="text-xs text-indigo-700">Participants Added</div>
                </div>
              </div>
            )}

            {/* Errors */}
            {result.errors.length > 0 && (
              <div>
                <h4 className="font-medium text-red-900 mb-2">Errors:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {result.errors.map((error, index) => (
                    <li key={index} className="text-sm text-red-800">{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">📋 Migration Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
            <li>Prepare your data in the JSON format with 'players' and/or 'sessions' arrays</li>
            <li>For standalone players: include name, phone_number, and optional fields like skill_level</li>
            <li>For sessions: include date, location, costs, participants, and optionally payments</li>
            <li>Player phone numbers must be unique and in Singapore format (+65xxxxxxxx)</li>
            <li>All dates should be in YYYY-MM-DD format</li>
            <li>Payment methods: 'paynow', 'cash', 'bank_transfer', or 'other'</li>
            <li>Review the data carefully before running the migration</li>
            <li><strong>This is a one-time operation and cannot be easily undone!</strong></li>
          </ol>
        </div>

        {/* Data Format Help */}
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <h3 className="font-semibold text-yellow-900 mb-2">💡 Data Format Tips:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
            <li>If you have CSV/Excel data, convert it to the JSON format first</li>
            <li>You can migrate players only, sessions only, or both together in one operation</li>
            <li>The migration will automatically create or update players based on phone numbers</li>
            <li>Sessions will be created with 'completed' status</li>
            <li>Participant records link players to sessions with their owed amounts</li>
            <li>Payments are optional - you can migrate sessions first and add payments later</li>
            <li>Use the example data as a template for your own migration</li>
          </ul>
        </div>
      </div>
    </div>
  )
}