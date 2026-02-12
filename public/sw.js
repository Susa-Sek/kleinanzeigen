// Service Worker for Push Notifications

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  event.waitUntil(clients.claim())
})

// Handle push notifications (for future Web Push API integration)
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event)

  if (!event.data) {
    return
  }

  try {
    const data = event.data.json()

    const options = {
      body: data.body || 'New message received',
      icon: data.icon || '/logo.png',
      badge: data.badge || '/badge.png',
      tag: data.tag || 'default',
      data: data.data || {},
      requireInteraction: false,
      silent: false
    }

    event.waitUntil(
      self.registration.showNotification(data.title || 'eBay Kleinanzeigen', options)
    )
  } catch (error) {
    console.error('Error handling push notification:', error)
  }
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.notification)

  event.notification.close()

  const urlToOpen = event.notification.data?.url || '/dashboard/inbox'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes('/dashboard') && 'focus' in client) {
          // Navigate to the conversation and focus
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            url: urlToOpen
          })
          return client.focus()
        }
      }

      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})

// Handle messages from the app
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data)

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
