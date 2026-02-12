'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Bell } from 'lucide-react'
import { getNotificationPermission, requestNotificationPermission, isNotificationSupported } from '@/lib/notifications/push'
import { showSuccess, showError } from '@/lib/toast'

export default function SettingsPage() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [notificationSoundEnabled, setNotificationSoundEnabled] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Check browser permission
        if (isNotificationSupported()) {
          setBrowserPermission(getNotificationPermission())
        }

        // Fetch settings from backend
        const response = await fetch('/api/settings/notifications')
        if (response.ok) {
          const data = await response.json()
          setNotificationsEnabled(data.notifications_enabled || false)
          setNotificationSoundEnabled(data.notification_sound_enabled !== false)
        }
      } catch (error) {
        console.error('Failed to load settings:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [])

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled && browserPermission !== 'granted') {
      // Request browser permission first
      const permission = await requestNotificationPermission()
      setBrowserPermission(permission)

      if (permission !== 'granted') {
        showError('Permission denied', 'Please enable notifications in your browser settings.')
        return
      }
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/settings/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifications_enabled: enabled })
      })

      if (!response.ok) throw new Error('Failed to save settings')

      setNotificationsEnabled(enabled)
      showSuccess(enabled ? 'Notifications enabled' : 'Notifications disabled')
    } catch {
      showError('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSoundToggle = async (enabled: boolean) => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/settings/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_sound_enabled: enabled })
      })

      if (!response.ok) throw new Error('Failed to save settings')

      setNotificationSoundEnabled(enabled)
      showSuccess(enabled ? 'Notification sounds enabled' : 'Notification sounds disabled')
    } catch {
      showError('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your notification preferences and account settings</p>
      </div>

      {/* Notifications Settings */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-gray-600" />
            <CardTitle>Notifications</CardTitle>
          </div>
          <CardDescription>
            Configure how and when you receive notifications for new messages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <>
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-6 w-12" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-6 w-12" />
              </div>
            </>
          ) : (
            <>
              {!isNotificationSupported() && (
                <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 text-sm text-yellow-800">
                  Your browser doesn't support notifications. Please use Chrome, Firefox, or Edge.
                </div>
              )}

              {browserPermission === 'denied' && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800">
                  Notifications are blocked in your browser. Please enable them in your browser settings.
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">Push Notifications</h3>
                  <p className="text-sm text-gray-600">
                    Receive browser notifications for new messages
                  </p>
                </div>
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={handleNotificationToggle}
                  disabled={isSaving || !isNotificationSupported()}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">Notification Sounds</h3>
                  <p className="text-sm text-gray-600">
                    Play a sound when notifications appear
                  </p>
                </div>
                <Switch
                  checked={notificationSoundEnabled}
                  onCheckedChange={handleSoundToggle}
                  disabled={isSaving || !notificationsEnabled}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Account Settings Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>
            Manage your account preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Additional account settings will be available in a future update.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
