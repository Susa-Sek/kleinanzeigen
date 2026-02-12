'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="text-lg font-semibold mb-2">
            Something went wrong
          </AlertTitle>
          <AlertDescription className="text-sm">
            {error.message || 'An unexpected error occurred. Please try again.'}
          </AlertDescription>
        </Alert>

        <div className="flex gap-4">
          <Button onClick={() => reset()} className="flex-1">
            Try again
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/dashboard'}
            className="flex-1"
          >
            Go to Dashboard
          </Button>
        </div>

        {error.digest && (
          <p className="text-xs text-gray-500 mt-4 text-center">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
