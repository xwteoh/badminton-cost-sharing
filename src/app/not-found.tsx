'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center space-y-6 max-w-md">
        {/* 404 Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
          <span className="text-3xl">🔍</span>
        </div>
        
        {/* Error Message */}
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-muted-foreground">
            404
          </h1>
          <h2 className="text-2xl font-bold text-foreground">
            Page not found
          </h2>
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        
        {/* Actions */}
        <div className="space-y-3">
          <Link href="/" className="w-full">
            <Button className="w-full" size="lg">
              Go to home page
            </Button>
          </Link>
          
          <Button 
            variant="outline"
            onClick={() => window.history.back()}
            className="w-full"
            size="lg"
          >
            Go back
          </Button>
        </div>
      </div>
    </div>
  )
}