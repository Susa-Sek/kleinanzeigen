'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { MessageThread } from '@/components/MessageThread'
import { Button } from '@/components/ui/button'
import { useMessages } from '@/hooks/useMessages'
import { ArrowLeft } from 'lucide-react'
import { Conversation, Account } from '@/types'

export default function ConversationPage() {
  const params = useParams()
  const router = useRouter()
  const conversationId = params.id as string

  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [account, setAccount] = useState<Account | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const {
    messages,
    isLoading: messagesLoading,
    sendMessage
  } = useMessages({ conversationId })

  useEffect(() => {
    const fetchConversationDetails = async () => {
      try {
        const response = await fetch(`/api/conversations/${conversationId}`)
        if (response.ok) {
          const data = await response.json()
          setConversation(data.conversation)

          // Fetch account details
          if (data.conversation?.account_id) {
            const accountResponse = await fetch(`/api/accounts/${data.conversation.account_id}`)
            if (accountResponse.ok) {
              const accountData = await accountResponse.json()
              setAccount(accountData.account)
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch conversation:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (conversationId) {
      fetchConversationDetails()
    }
  }, [conversationId])

  return (
    <div className="h-screen flex flex-col">
      {/* Top Bar */}
      <div className="border-b bg-white p-4 shadow-sm">
        <div className="container mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/inbox')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Inbox
          </Button>
        </div>
      </div>

      {/* Message Thread */}
      <MessageThread
        conversation={conversation}
        account={account}
        messages={messages}
        isLoading={isLoading || messagesLoading}
        onSendMessage={sendMessage}
      />
    </div>
  )
}
