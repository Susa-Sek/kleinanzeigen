'use client'

import { useState, useEffect } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Bell, X } from 'lucide-react'
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  registerServiceWorker,
  saveNotificationPreference
} from '@/lib/notifications/push'

export function NotificationPermissionBanner() {
  const [show, setShow] = useState(false)
  const [isRequesting, setIsRequesting] = useState(false)
  const [attemptCount, setAttemptCount] = useState(0)

  useEffect(() => {
    // Check if we should show the banner
    const checkPermission = () => {
      if (!isNotificationSupported()) {
        return
      }

      const permission = getNotificationPermission()
      const attempts = parseInt(localStorage.getItem('notification_attempts') || '0')

      // Show banner if permission is default (not yet asked) or denied with <3 attempts
      if (permission === 'default' || (permission === 'denied' && attempts < 3)) {
        setShow(true)
        setAttemptCount(attempts)
      }
    }

    checkPermission()
  }, [])

  const handleEnableNotifications = async () => {
    setIsRequesting(true)

    try {
      const permission = await requestNotificationPermission()

      if (permission === 'granted') {
        // Register service worker
        await registerServiceWorker()

        // Save preference to backend
        await saveNotificationPreference(true)

        // Hide banner on success
        setShow(false)
      } else {
        // User denied - increment attempt count
        const newAttemptCount = attemptCount + 1
        setAttemptCount(newAttemptCount)
        localStorage.setItem('notification_attempts', newAttemptCount.toString())

        // Hide banner after 3 attempts (respect user's choice)
        if (newAttemptCount >= 3) {
          setShow(false)
        }
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error)
    } finally {
      setIsRequesting(false)
    }
  }

  const handleDismiss = () => {
    setShow(false)
    // Increment attempt count when dismissed
    const newAttemptCount = attemptCount + 1
    localStorage.setItem('notification_attempts', newAttemptCount.toString())
  }

  if (!show || !isNotificationSupported()) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <Alert className="shadow-lg border-blue-500 bg-blue-50">
        <div className="flex items-start gap-3">
          <Bell className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <AlertDescription className="text-gray-900">
              <strong className="block mb-1">Enable notifications</strong>
              Get instant alerts when new messages arrive, even when the app is not open.
            </AlertDescription>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                onClick={handleEnableNotifications}
                disabled={isRequesting}
              >
                {isRequesting ? 'Enabling...' : 'Enable'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                disabled={isRequesting}
              >
                Not now
              </Button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-500 hover:text-gray-700"
            disabled={isRequesting}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </Alert>
    </div>
  )
}
