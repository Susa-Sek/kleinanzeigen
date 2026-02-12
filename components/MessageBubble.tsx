'use client'

import { format } from 'date-fns'
import { Message } from '@/types'
import { User, UserCircle } from 'lucide-react'

interface MessageBubbleProps {
  message: Message
  isOwnMessage: boolean
}

export function MessageBubble({ message, isOwnMessage }: MessageBubbleProps) {
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      return format(date, 'MMM d, yyyy HH:mm')
    } catch {
      return 'Unknown time'
    }
  }

  return (
    <div className={`flex gap-3 mb-4 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 ${isOwnMessage ? 'ml-2' : 'mr-2'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          isOwnMessage ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-700'
        }`}>
          {isOwnMessage ? (
            <User className="h-5 w-5" />
          ) : (
            <UserCircle className="h-5 w-5" />
          )}
        </div>
      </div>

      {/* Message content */}
      <div className={`flex flex-col max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-gray-700">
            {isOwnMessage ? 'You' : message.sender}
          </span>
          <span className="text-xs text-gray-500">
            {formatTimestamp(message.timestamp)}
          </span>
        </div>

        <div
          className={`rounded-lg px-4 py-2 ${
            isOwnMessage
              ? 'bg-blue-600 text-white rounded-tr-none'
              : 'bg-gray-100 text-gray-900 rounded-tl-none'
          }`}
        >
          {message.subject && (
            <div className={`font-semibold mb-1 pb-1 border-b ${
              isOwnMessage ? 'border-blue-500' : 'border-gray-300'
            }`}>
              {message.subject}
            </div>
          )}
          <div className="whitespace-pre-wrap break-words">
            {message.body}
          </div>
          {message.attachment_url && (
            <a
              href={message.attachment_url}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-block mt-2 text-sm underline ${
                isOwnMessage ? 'text-blue-200 hover:text-blue-100' : 'text-blue-600 hover:text-blue-800'
              }`}
            >
              View Attachment
            </a>
          )}
        </div>

        {!message.is_read && !isOwnMessage && (
          <span className="text-xs text-blue-600 font-medium mt-1">
            Unread
          </span>
        )}
      </div>
    </div>
  )
}
