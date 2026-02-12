'use client'

import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDistanceToNow } from 'date-fns'
import { ConversationWithAccount } from '@/types'
import { MessageSquare } from 'lucide-react'

interface ConversationListProps {
  conversations: ConversationWithAccount[]
  isLoading: boolean
  selectedConversationId?: string
  onConversationSelect?: (conversationId: string) => void
}

export function ConversationList({
  conversations,
  isLoading,
  selectedConversationId,
  onConversationSelect
}: ConversationListProps) {
  const handleConversationClick = (conversationId: string) => {
    onConversationSelect?.(conversationId)
  }

  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    } catch {
      return 'Unknown'
    }
  }

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 border-b">
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <div className="rounded-full bg-gray-100 p-6 mb-4">
          <MessageSquare className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversations</h3>
        <p className="text-gray-600 text-sm max-w-md">
          Your conversations will appear here once messages are synced from your accounts.
        </p>
      </div>
    )
  }

  return (
    <div className="divide-y">
      {conversations.map((conversation) => {
        const isSelected = conversation.id === selectedConversationId
        const isUnread = conversation.unread_count > 0
        const lastMessage = conversation.latest_message

        return (
          <button
            key={conversation.id}
            onClick={() => handleConversationClick(conversation.id)}
            className={`w-full text-left p-4 hover:bg-gray-50 transition-colors relative ${
              isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : ''
            } ${isUnread ? 'bg-blue-50/50' : ''}`}
          >
            {/* Unread indicator */}
            {isUnread && !isSelected && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-600 rounded-full" />
            )}

            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className={`font-semibold text-gray-900 ${isUnread ? 'font-bold' : ''}`}>
                {conversation.partner_name || 'Unknown'}
              </h3>
              {lastMessage && (
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {formatTimestamp(lastMessage.timestamp)}
                </span>
              )}
            </div>

            {conversation.listing_title && (
              <p className="text-sm text-gray-600 mb-1">
                {truncateText(conversation.listing_title, 50)}
              </p>
            )}

            {lastMessage && (
              <p className={`text-sm text-gray-600 ${isUnread ? 'font-medium' : ''}`}>
                {truncateText(lastMessage.body, 60)}
              </p>
            )}

            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {conversation.account.account_name || conversation.account.email}
              </Badge>
              {isUnread && (
                <Badge variant="default" className="text-xs bg-blue-600">
                  {conversation.unread_count} unread
                </Badge>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
