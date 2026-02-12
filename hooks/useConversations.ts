import { useEffect, useState } from 'react'
import { ConversationWithAccount } from '@/types'

interface UseConversationsOptions {
  accountId?: string
  unreadOnly?: boolean
  limit?: number
  offset?: number
}

interface UseConversationsResult {
  conversations: ConversationWithAccount[]
  isLoading: boolean
  error: string | null
  hasMore: boolean
  totalCount: number
  refetch: () => void
  loadMore: () => void
}

export function useConversations(options: UseConversationsOptions = {}): UseConversationsResult {
  const { accountId, unreadOnly = false, limit = 50, offset: initialOffset = 0 } = options

  const [conversations, setConversations] = useState<ConversationWithAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [offset, setOffset] = useState(initialOffset)

  const fetchConversations = async (appendMode = false) => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: (appendMode ? offset : 0).toString()
      })

      if (accountId) params.append('account_id', accountId)
      if (unreadOnly) params.append('unread_only', 'true')

      const response = await fetch(`/api/conversations?${params}`)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch conversations')
      }

      const data = await response.json()

      if (appendMode) {
        setConversations(prev => [...prev, ...(data.conversations || [])])
      } else {
        setConversations(data.conversations || [])
        setOffset(0)
      }

      setHasMore(data.has_more || false)
      setTotalCount(data.total_count || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const loadMore = () => {
    if (!isLoading && hasMore) {
      setOffset(prev => prev + limit)
    }
  }

  useEffect(() => {
    fetchConversations(false)
  }, [accountId, unreadOnly, limit])

  useEffect(() => {
    if (offset > 0) {
      fetchConversations(true)
    }
  }, [offset])

  return {
    conversations,
    isLoading,
    error,
    hasMore,
    totalCount,
    refetch: () => fetchConversations(false),
    loadMore
  }
}
