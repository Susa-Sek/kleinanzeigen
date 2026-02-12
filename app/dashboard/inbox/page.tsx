'use client'

import { useState, useEffect } from 'react'
import { ConversationList } from '@/components/ConversationList'
import { MessageThread } from '@/components/MessageThread'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { useConversations } from '@/hooks/useConversations'
import { useMessages } from '@/hooks/useMessages'
import { Account } from '@/types'

export default function InboxPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string>('')
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)

  const {
    conversations,
    isLoading: conversationsLoading,
    hasMore,
    loadMore
  } = useConversations({
    accountId: selectedAccountId || undefined,
    unreadOnly
  })

  const {
    messages,
    isLoading: messagesLoading,
    sendMessage
  } = useMessages({
    conversationId: selectedConversationId || '',
    enabled: !!selectedConversationId
  })

  // Fetch accounts for filter
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await fetch('/api/accounts')
        if (response.ok) {
          const data = await response.json()
          setAccounts(data.accounts || [])
        }
      } catch (error) {
        console.error('Failed to fetch accounts:', error)
      }
    }
    fetchAccounts()
  }, [])

  // Get selected conversation details
  const selectedConversation = conversations.find(c => c.id === selectedConversationId) || null
  const selectedAccount = selectedConversation
    ? accounts.find(a => a.id === selectedConversation.account_id) || null
    : null

  return (
    <div className="h-screen flex flex-col">
      {/* Top Bar */}
      <div className="border-b bg-white p-4 shadow-sm">
        <div className="container mx-auto flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Unified Inbox</h1>
          <div className="flex items-center gap-4">
            {/* Account Filter */}
            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Accounts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Accounts</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.account_name || account.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Unread Filter */}
            <div className="flex items-center gap-2">
              <Switch
                id="unread-only"
                checked={unreadOnly}
                onCheckedChange={setUnreadOnly}
              />
              <label htmlFor="unread-only" className="text-sm text-gray-700 cursor-pointer">
                Unread only
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: 2-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Conversation List */}
        <div className="w-96 border-r bg-white overflow-y-auto flex flex-col">
          <ConversationList
            conversations={conversations}
            isLoading={conversationsLoading}
            selectedConversationId={selectedConversationId || undefined}
            onConversationSelect={setSelectedConversationId}
          />

          {/* Load More Button */}
          {hasMore && !conversationsLoading && (
            <div className="p-4 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={loadMore}
              >
                Load More
              </Button>
            </div>
          )}
        </div>

        {/* Right: Message Thread */}
        <MessageThread
          conversation={selectedConversation}
          account={selectedAccount}
          messages={messages}
          isLoading={messagesLoading}
          onSendMessage={sendMessage}
        />
      </div>
    </div>
  )
}
