// Browser Push Notification Utilities

export interface NotificationOptions {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: Record<string, unknown>
}

/**
 * Check if browser supports notifications
 */
export function isNotificationSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) {
    return 'denied'
  }
  return Notification.permission
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    throw new Error('Notifications are not supported in this browser')
  }

  const permission = await Notification.requestPermission()
  return permission
}

/**
 * Register service worker for notifications
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker not supported')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js')
    console.log('Service Worker registered:', registration)
    return registration
  } catch (error) {
    console.error('Service Worker registration failed:', error)
    return null
  }
}

/**
 * Show a browser notification
 */
export async function showNotification(options: NotificationOptions): Promise<void> {
  const permission = getNotificationPermission()

  if (permission !== 'granted') {
    console.warn('Notification permission not granted')
    return
  }

  // Check if app is currently visible
  if (document.visibilityState === 'visible') {
    console.log('App is visible, skipping notification')
    return
  }

  try {
    const registration = await navigator.serviceWorker.ready

    await registration.showNotification(options.title, {
      body: options.body,
      icon: options.icon || '/logo.png',
      badge: options.badge || '/badge.png',
      tag: options.tag,
      data: options.data,
      requireInteraction: false,
      silent: false
    })
  } catch (error) {
    console.error('Failed to show notification:', error)
  }
}

/**
 * Check if app is currently visible
 */
export function isAppVisible(): boolean {
  return document.visibilityState === 'visible'
}

/**
 * Initialize notification system
 */
export async function initializeNotifications(): Promise<{
  supported: boolean
  permission: NotificationPermission
  registration: ServiceWorkerRegistration | null
}> {
  const supported = isNotificationSupported()

  if (!supported) {
    return {
      supported: false,
      permission: 'denied',
      registration: null
    }
  }

  const permission = getNotificationPermission()
  const registration = await registerServiceWorker()

  return {
    supported,
    permission,
    registration
  }
}

/**
 * Save notification preference to backend
 */
export async function saveNotificationPreference(enabled: boolean): Promise<void> {
  try {
    const response = await fetch('/api/settings/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notifications_enabled: enabled })
    })

    if (!response.ok) {
      throw new Error('Failed to save notification preference')
    }
  } catch (error) {
    console.error('Error saving notification preference:', error)
    throw error
  }
}

/**
 * Get notification preferences from backend
 */
export async function getNotificationPreferences(): Promise<{
  notifications_enabled: boolean
  notification_sound_enabled: boolean
}> {
  try {
    const response = await fetch('/api/settings/notifications')

    if (!response.ok) {
      throw new Error('Failed to fetch notification preferences')
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching notification preferences:', error)
    return {
      notifications_enabled: false,
      notification_sound_enabled: true
    }
  }
}
