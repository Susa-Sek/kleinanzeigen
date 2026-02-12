import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Message } from '@/types'

interface UseMessagesOptions {
  conversationId: string
  enabled?: boolean
}

interface UseMessagesResult {
  messages: Message[]
  isLoading: boolean
  error: string | null
  refetch: () => void
  sendMessage: (content: string) => Promise<void>
}

export function useMessages({ conversationId, enabled = true }: UseMessagesOptions): UseMessagesResult {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMessages = async () => {
    if (!enabled || !conversationId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch messages')
      }

      const data = await response.json()
      setMessages(data.messages || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async (content: string) => {
    if (!conversationId) {
      throw new Error('No conversation selected')
    }

    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: content })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send message')
      }

      // Refetch messages after sending
      await fetchMessages()
    } catch (err) {
      throw err
    }
  }

  useEffect(() => {
    fetchMessages()

    if (!enabled || !conversationId) return

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, enabled])

  return {
    messages,
    isLoading,
    error,
    refetch: fetchMessages,
    sendMessage
  }
}
