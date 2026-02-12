'use client'

import { useEffect, useRef } from 'react'
import { MessageBubble } from './MessageBubble'
import { ReplyInput } from './ReplyInput'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, ExternalLink } from 'lucide-react'
import { Message, Conversation, Account } from '@/types'

interface MessageThreadProps {
  conversation: Conversation | null
  account: Account | null
  messages: Message[]
  isLoading: boolean
  onSendMessage: (content: string) => Promise<void>
}

export function MessageThread({
  conversation,
  account,
  messages,
  isLoading,
  onSendMessage
}: MessageThreadProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="rounded-full bg-gray-100 p-6 mb-4 inline-block">
            <MessageSquare className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversation selected</h3>
          <p className="text-gray-600 text-sm max-w-md">
            Select a conversation from the list to view messages and reply.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {conversation.partner_name || 'Unknown'}
            </h2>
            {conversation.listing_title && (
              <p className="text-sm text-gray-600 mb-2">
                {conversation.listing_title}
              </p>
            )}
            <div className="flex items-center gap-2">
              {account && (
                <Badge variant="secondary">
                  {account.account_name || account.email}
                </Badge>
              )}
              {conversation.unread_count > 0 && (
                <Badge variant="default" className="bg-blue-600">
                  {conversation.unread_count} unread
                </Badge>
              )}
            </div>
          </div>
          {conversation.listing_url && (
            <a
              href={conversation.listing_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
            >
              View Listing
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`flex gap-3 ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}>
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="space-y-2 max-w-[70%]">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-600">No messages in this conversation yet.</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => {
              // Determine if this is the user's own message
              // You might need to adjust this logic based on your data structure
              const isOwnMessage = message.sender === account?.email
              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwnMessage={isOwnMessage}
                />
              )
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Reply Input */}
      <ReplyInput onSendMessage={onSendMessage} disabled={!account?.is_active} />
    </div>
  )
}
