'use client'

import { useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Trash2, Edit2, Loader2, AlertCircle, CheckCircle2, XCircle, Clock, Eye, EyeOff } from 'lucide-react'
import { Account } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import { showSuccess } from '@/lib/toast'

interface AccountCardProps {
  account: Account
  onUpdate?: () => void
  onDelete?: () => void
}

export function AccountCard({ account, onUpdate, onDelete }: AccountCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const [editFormData, setEditFormData] = useState({
    password: '',
    account_name: account.account_name
  })

  const handleToggleActive = async () => {
    setIsUpdating(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(`/api/accounts/${account.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ is_active: !account.is_active })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update account')
      }

      showSuccess(`Account ${account.is_active ? 'deactivated' : 'activated'}`)
      onUpdate?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(`/api/accounts/${account.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete account')
      }

      setShowDeleteDialog(false)
      showSuccess('Account deleted successfully')
      onDelete?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const updateData: { account_name: string; password?: string } = {
        account_name: editFormData.account_name
      }
      if (editFormData.password) {
        updateData.password = editFormData.password
      }

      const response = await fetch(`/api/accounts/${account.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update account')
      }

      setShowEditDialog(false)
      setEditFormData({ ...editFormData, password: '' })
      showSuccess('Account updated successfully')
      onUpdate?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsUpdating(false)
    }
  }

  const getStatusIcon = () => {
    if (!account.is_active) {
      return <XCircle className="h-4 w-4 text-gray-500" />
    }
    if (account.last_synced_at) {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />
    }
    return <Clock className="h-4 w-4 text-yellow-500" />
  }

  const getStatusText = () => {
    if (!account.is_active) return 'Inactive'
    if (!account.last_synced_at) return 'Never synced'
    return `Synced ${formatDistanceToNow(new Date(account.last_synced_at), { addSuffix: true })}`
  }

  return (
    <>
      <Card className={`hover:shadow-lg transition-shadow ${!account.is_active ? 'opacity-60' : ''}`}>
        <CardHeader className="space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{account.account_name || 'Unnamed Account'}</h3>
              <p className="text-sm text-gray-600">{account.email}</p>
            </div>
            <Badge variant={account.is_active ? 'default' : 'secondary'}>
              {account.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {getStatusIcon()}
            <span>{getStatusText()}</span>
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Switch
              checked={account.is_active}
              onCheckedChange={handleToggleActive}
              disabled={isUpdating}
            />
            <span className="text-sm text-gray-600">
              {account.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditDialog(true)}
              disabled={isUpdating}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleEdit}>
            <DialogHeader>
              <DialogTitle>Edit Account</DialogTitle>
              <DialogDescription>
                Update account nickname or password. Email cannot be changed.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-500">Email (read-only)</label>
                <Input value={account.email} disabled />
              </div>

              <div className="grid gap-2">
                <label htmlFor="edit-account-name" className="text-sm font-medium">
                  Nickname
                </label>
                <Input
                  id="edit-account-name"
                  type="text"
                  placeholder="e.g., Business, Private"
                  value={editFormData.account_name}
                  onChange={(e) => setEditFormData({ ...editFormData, account_name: e.target.value })}
                  disabled={isUpdating}
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="edit-password" className="text-sm font-medium">
                  New Password (optional)
                </label>
                <div className="relative">
                  <Input
                    id="edit-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Leave blank to keep current password"
                    value={editFormData.password}
                    onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                    disabled={isUpdating}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    disabled={isUpdating}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)} disabled={isUpdating}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this account? All conversations and messages from this account will be permanently deleted.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="rounded-lg bg-red-50 p-4 border border-red-200">
            <p className="text-sm font-medium text-red-900">This action cannot be undone!</p>
            <p className="text-sm text-red-700 mt-1">
              Account: <strong>{account.email}</strong>
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Account'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
