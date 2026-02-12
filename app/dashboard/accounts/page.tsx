'use client'

import { useEffect, useState } from 'react'
import { AccountCard } from '@/components/AccountCard'
import { AddAccountDialog } from '@/components/AddAccountDialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, Inbox } from 'lucide-react'
import { Account } from '@/types'

const MAX_ACCOUNTS = 5

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAccounts = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/accounts')
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch accounts')
      }

      const data = await response.json()
      setAccounts(data.accounts || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAccounts()
  }, [])

  const maxAccountsReached = accounts.length >= MAX_ACCOUNTS

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Account Management</h1>
          <p className="text-gray-600 mt-2">
            Manage your eBay Kleinanzeigen accounts ({accounts.length}/{MAX_ACCOUNTS} accounts)
          </p>
        </div>
        <AddAccountDialog onAccountAdded={fetchAccounts} maxAccountsReached={maxAccountsReached} />
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {maxAccountsReached && (
        <Alert className="mb-6">
          <AlertDescription>
            Maximum 5 accounts allowed. Please delete an account to add a new one.
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3 border rounded-lg p-6">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <div className="flex gap-2 pt-4">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-gray-100 p-6 mb-4">
            <Inbox className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No accounts yet</h3>
          <p className="text-gray-600 mb-6 max-w-md">
            Add your first eBay Kleinanzeigen account to start syncing messages and managing conversations.
          </p>
          <AddAccountDialog onAccountAdded={fetchAccounts} />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onUpdate={fetchAccounts}
              onDelete={fetchAccounts}
            />
          ))}
        </div>
      )}
    </div>
  )
}
