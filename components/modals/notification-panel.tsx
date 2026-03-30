// components/notification-panel.tsx
'use client'

import { useEffect, useRef } from 'react'
import { Bell, CheckCheck, X, Loader2, AlertCircle, Info, CheckCircle, AlertTriangle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useNotificationStore } from '@/store/notification/notificationStore'

interface NotificationPanelProps {
  isOpen: boolean
  onClose: () => void
  onNotificationClick?: (notification: any) => void
}

const getIcon = (type: string) => {
  switch (type) {
    case 'SUCCESS':
      return <CheckCircle size={16} className="text-green-500" />
    case 'WARNING':
      return <AlertTriangle size={16} className="text-yellow-500" />
    case 'ERROR':
      return <AlertCircle size={16} className="text-red-500" />
    default:
      return <Info size={16} className="text-blue-500" />
  }
}

export function NotificationPanel({ isOpen, onClose, onNotificationClick }: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const {
    notifications,
    unreadCount,
    loading,
    hasMore,
    fetchNotifications,
    markAsRead,
    markAllAsRead
  } = useNotificationStore()

  useEffect(() => {
    if (isOpen) {
      fetchNotifications(true)
    }
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchNotifications(false)
    }
  }

  const handleNotificationClick = async (notification: any) => {
    if (!notification.isRead) {
      await markAsRead(notification.id)
    }
    if (onNotificationClick) {
      onNotificationClick(notification)
    }
  }

  if (!isOpen) return null

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-12 w-96 bg-background border border-border rounded-lg shadow-lg z-50 animate-slide-down"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-primary" />
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-primary text-white text-xs rounded-full px-2 py-0.5">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
          >
            <CheckCheck size={14} />
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {loading && notifications.length === 0 ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell size={48} className="mx-auto text-muted-foreground mb-3 opacity-50" />
            <p className="text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <>
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 border-b border-border hover:bg-secondary/50 transition-colors cursor-pointer ${
                  !notification.isRead ? 'bg-primary/5' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm font-semibold text-foreground">
                        {notification.title}
                      </p>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    {!notification.isRead && (
                      <div className="mt-2">
                        <span className="inline-block w-2 h-2 bg-primary rounded-full"></span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {hasMore && (
              <div className="p-3 text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin mx-auto" />
                  ) : (
                    'Load more'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}