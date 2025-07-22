'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import { SessionDetailsView } from '@/components/business/SessionDetailsView'
import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/Button'
import { playerService } from '@/lib/services/players'
import { sessionService } from '@/lib/services/sessions'

export default function SessionDetailsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('id')
  
  const [sessionData, setSessionData] = useState<any>(null)
  const [participants, setParticipants] = useState<any[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Redirect unauthenticated users
  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/login'
    }
  }, [user, loading, router])

  // Fetch session details
  useEffect(() => {
    const fetchSessionDetails = async () => {
      if (!user?.id || !sessionId) return

      try {
        setDataLoading(true)
        setError(null)

        console.log('📋 Fetching session details for ID:', sessionId)

        // Fetch session details with participants
        const sessions = await sessionService.getSessionsByOrganizer(user.id)
        const session = sessions.find(s => s.id === sessionId)

        if (!session) {
          throw new Error('Session not found')
        }

        console.log('✅ Session found:', session)
        setSessionData(session)

        // Set participants if they exist in the session data
        if (session.participants) {
          setParticipants(session.participants)
        }

      } catch (error: any) {
        console.error('Error fetching session details:', error)
        setError(error.message || 'Failed to load session details')
      } finally {
        setDataLoading(false)
      }
    }

    fetchSessionDetails()
  }, [user?.id, sessionId])

  // Show loading while checking auth or loading data
  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-4">
            <span className="text-3xl text-white">📋</span>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-200 mx-auto" style={{ borderTopColor: '#3b82f6' }}></div>
          <p className="text-sm text-gray-600">Loading session details...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl shadow-lg mb-4">
            <span className="text-3xl text-white">❌</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Error Loading Session</h2>
          <p className="text-gray-600 max-w-md">{error}</p>
          <Button
            onClick={() => window.location.href = '/upcoming-sessions'}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700"
          >
            <span className="mr-2">←</span>
            Back to Sessions
          </Button>
        </div>
      </div>
    )
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-500 to-gray-600 rounded-2xl shadow-lg mb-4">
            <span className="text-3xl text-white">🔍</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Session Not Found</h2>
          <p className="text-gray-600 max-w-md">The session you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button
            onClick={() => window.location.href = '/upcoming-sessions'}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700"
          >
            <span className="mr-2">←</span>
            Back to Sessions
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-4 space-y-8">
        {/* Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl"></div>
          <div className="relative p-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">📋</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Session Details
                </h1>
                <p className="text-gray-600 mt-1 flex items-center space-x-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                  <span>Detailed view of your badminton session</span>
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {sessionData.status === 'planned' && (
                <Button
                  onClick={() => {
                    const params = new URLSearchParams({
                      fromPlanned: sessionData.id,
                      date: sessionData.session_date,
                      startTime: sessionData.start_time || '',
                      endTime: sessionData.end_time || '',
                      location: sessionData.location || '',
                      notes: sessionData.notes || ''
                    })
                    window.location.href = `/record-session?${params.toString()}`
                  }}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <span className="mr-2">🏸</span>
                  Record Session
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => window.location.href = '/upcoming-sessions'}
                className="border-gray-300 bg-white/50 text-gray-700 hover:bg-white hover:shadow-md transition-all duration-200"
              >
                <span className="mr-2">←</span>
                Back to Sessions
              </Button>
            </div>
          </div>
        </div>

        {/* Session Details Component */}
        <SessionDetailsView 
          session={sessionData} 
          participants={participants}
          onEdit={() => {
            if (sessionData.status === 'completed') {
              window.location.href = `/edit-session?id=${sessionData.id}`
            } else {
              window.location.href = `/create-session?edit=${sessionData.id}`
            }
          }}
          onCancel={async () => {
            if (confirm('Are you sure you want to cancel this session?')) {
              try {
                await sessionService.updateSession(sessionData.id, { 
                  status: 'cancelled',
                  notes: `${sessionData.notes || ''  } (Cancelled by organizer)`
                })
                window.location.href = '/upcoming-sessions'
              } catch (error: any) {
                alert(`Failed to cancel session: ${error.message}`)
              }
            }
          }}
        />
      </div>
    </div>
  )
}