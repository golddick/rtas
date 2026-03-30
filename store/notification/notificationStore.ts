// store/notificationStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'
  isRead: boolean
  createdAt: Date
}

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: string | null
  hasMore: boolean
  totalCount: number

  // Actions
  fetchNotifications: (reset?: boolean) => Promise<void>
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  clearError: () => void
  reset: () => void
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      loading: false,
      error: null,
      hasMore: true,
      totalCount: 0,

      fetchNotifications: async (reset = false) => {
        set({ loading: true, error: null })
        try {
          const currentNotifications = get().notifications
          const offset = reset ? 0 : currentNotifications.length
          
          const response = await fetch(`/api/notifications?offset=${offset}&limit=20`)
          if (!response.ok) {
            throw new Error('Failed to fetch notifications')
          }

          const result = await response.json()
          
          if (!result.success) {
            throw new Error(result.message || 'Failed to fetch notifications')
          }

          const newNotifications = reset 
            ? result.data.notifications 
            : [...currentNotifications, ...result.data.notifications]

          set({
            notifications: newNotifications,
            unreadCount: result.data.unreadCount,
            hasMore: result.data.hasMore,
            totalCount: result.data.totalCount,
            loading: false
          })
        } catch (error) {
          console.error('Fetch notifications error:', error)
          set({
            error: error instanceof Error ? error.message : 'An error occurred',
            loading: false
          })
        }
      },

      markAsRead: async (notificationId: string) => {
        try {
          const response = await fetch('/api/notifications', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ notificationId })
          })

          if (!response.ok) {
            throw new Error('Failed to mark notification as read')
          }

          // Update local state
          const { notifications, unreadCount } = get()
          const updatedNotifications = notifications.map(notif =>
            notif.id === notificationId ? { ...notif, isRead: true } : notif
          )

          set({
            notifications: updatedNotifications,
            unreadCount: Math.max(0, unreadCount - 1)
          })
        } catch (error) {
          console.error('Mark as read error:', error)
        }
      },

      markAllAsRead: async () => {
        try {
          const response = await fetch('/api/notifications', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ markAll: true })
          })

          if (!response.ok) {
            throw new Error('Failed to mark all notifications as read')
          }

          // Update local state
          const { notifications } = get()
          const updatedNotifications = notifications.map(notif => ({ ...notif, isRead: true }))

          set({
            notifications: updatedNotifications,
            unreadCount: 0
          })
        } catch (error) {
          console.error('Mark all as read error:', error)
        }
      },

      clearError: () => {
        set({ error: null })
      },

      reset: () => {
        set({
          notifications: [],
          unreadCount: 0,
          loading: false,
          error: null,
          hasMore: true,
          totalCount: 0
        })
      }
    }),
    {
      name: 'notification-storage',
      partialize: (state) => ({
        unreadCount: state.unreadCount
      })
    }
  )
)