'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center space-y-6 max-w-md">
        {/* Error Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10 mb-4">
          <span className="text-3xl">⚠️</span>
        </div>
        
        {/* Error Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Something went wrong
          </h1>
          <p className="text-muted-foreground">
            We encountered an unexpected error. Please try again or contact support if the problem persists.
          </p>
        </div>
        
        {/* Error Details (in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-left bg-muted p-4 rounded-lg">
            <h3 className="font-mono text-sm font-semibold mb-2">Error Details:</h3>
            <p className="font-mono text-xs text-muted-foreground break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="font-mono text-xs text-muted-foreground mt-2">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}
        
        {/* Actions */}
        <div className="space-y-3">
          <Button 
            onClick={reset}
            className="w-full"
            size="lg"
          >
            Try again
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => window.location.href = '/'}
            className="w-full"
            size="lg"
          >
            Go to home page
          </Button>
        </div>
        
        {/* Support Info */}
        <p className="text-xs text-muted-foreground">
          If this error continues, please contact support with the error details above.
        </p>
      </div>
    </div>
  )
}