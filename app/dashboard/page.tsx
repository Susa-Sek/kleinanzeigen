'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, MessageSquare, Bell, Settings, ArrowRight } from 'lucide-react'

interface DashboardStats {
  accountCount: number
  activeAccounts: number
  totalConversations: number
  unreadCount: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    accountCount: 0,
    activeAccounts: 0,
    totalConversations: 0,
    unreadCount: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch dashboard stats
        const response = await fetch('/api/dashboard/stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  const quickActions = [
    {
      title: 'Account Management',
      description: 'Add and manage your eBay Kleinanzeigen accounts',
      icon: Users,
      href: '/dashboard/accounts',
      color: 'text-blue-600 bg-blue-50'
    },
    {
      title: 'Unified Inbox',
      description: 'View and reply to all your messages in one place',
      icon: MessageSquare,
      href: '/dashboard/inbox',
      color: 'text-green-600 bg-green-50',
      badge: stats.unreadCount > 0 ? stats.unreadCount : undefined
    },
    {
      title: 'Notifications',
      description: 'Configure push notification preferences',
      icon: Bell,
      href: '/dashboard/settings',
      color: 'text-purple-600 bg-purple-50'
    }
  ]

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome to your eBay Kleinanzeigen Multi-Account Manager</p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Accounts</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold">{stats.accountCount}</div>
            )}
            {!isLoading && (
              <p className="text-xs text-gray-500 mt-1">
                {stats.activeAccounts} active
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold">{stats.totalConversations}</div>
            )}
            {!isLoading && (
              <p className="text-xs text-gray-500 mt-1">
                Total conversations
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Unread Messages</CardTitle>
            <Bell className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold text-orange-600">{stats.unreadCount}</div>
            )}
            {!isLoading && (
              <p className="text-xs text-gray-500 mt-1">
                Require attention
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">System Status</CardTitle>
            <Settings className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <Badge variant="default" className="bg-green-600">
                Operational
              </Badge>
            )}
            {!isLoading && (
              <p className="text-xs text-gray-500 mt-2">
                All systems running
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link key={action.title} href={action.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className={`rounded-lg p-3 ${action.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      {action.badge !== undefined && (
                        <Badge variant="destructive" className="ml-2">
                          {action.badge}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg">{action.title}</CardTitle>
                    <CardDescription>{action.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="ghost" className="w-full justify-between group">
                      Go to {action.title}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Getting Started */}
      {!isLoading && stats.accountCount === 0 && (
        <Card className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Follow these steps to set up your account</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 list-decimal list-inside">
              <li className="text-sm">
                <Link href="/dashboard/accounts" className="text-blue-600 hover:underline font-medium">
                  Add your first eBay Kleinanzeigen account
                </Link>
              </li>
              <li className="text-sm">
                Wait for the initial sync to complete (this may take a few minutes)
              </li>
              <li className="text-sm">
                <Link href="/dashboard/inbox" className="text-blue-600 hover:underline font-medium">
                  View your unified inbox
                </Link>
                {' '}and start managing conversations
              </li>
              <li className="text-sm">
                Enable push notifications to get alerts for new messages
              </li>
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
