// store/messageStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Conversation {
  id: string
  name: string
  role: string
  email: string
  lastMessage: string
  timestamp: Date
  unread: boolean
  unreadCount: number
  avatar: string
  otherUserId: string
  status: string
}

export interface Message {
  id: string
  content: string
  senderId: string
  receiverId: string
  isRead: boolean
  readAt: Date | null
  createdAt: Date
  isOwn: boolean
}

export interface OtherParticipant {
  id: string
  fullName: string
  email: string
  role: string
}

interface MessageState {
  conversations: Conversation[]
  currentConversation: {
    id: string
    messages: Message[]
    otherParticipant: OtherParticipant | null
  } | null
  loading: boolean
  error: string | null
  sending: boolean
  
  // Actions
  fetchConversations: () => Promise<void>
  fetchMessages: (conversationId: string) => Promise<void>
  sendMessage: (recipientId: string, content: string, subject?: string) => Promise<boolean>
  archiveConversation: (conversationId: string) => Promise<void>
  unarchiveConversation: (conversationId: string) => Promise<void>
  deleteConversation: (conversationId: string) => Promise<void>
  markConversationRead: (conversationId: string) => Promise<void>
  setCurrentConversation: (conversationId: string | null) => void
  clearError: () => void
  reset: () => void
}

export const useMessageStore = create<MessageState>()(
  persist(
    (set, get) => ({
      conversations: [],
      currentConversation: null,
      loading: false,
      error: null,
      sending: false,

      fetchConversations: async () => {
        set({ loading: true, error: null })
        try {
          const response = await fetch('/api/messages/conversations')
          if (!response.ok) {
            throw new Error('Failed to fetch conversations')
          }

          const result = await response.json()
          
          if (!result.success) {
            throw new Error(result.message || 'Failed to fetch conversations')
          }

          set({
            conversations: result.data,
            loading: false
          })
        } catch (error) {
          console.error('Fetch conversations error:', error)
          set({
            error: error instanceof Error ? error.message : 'An error occurred',
            loading: false
          })
        }
      },

        fetchMessages: async (conversationId: string) => {
        set({ loading: true, error: null })
        try {
            console.log('[fetchMessages] Fetching messages for conversation:', conversationId)
            
            // Make sure conversationId is not undefined
            if (!conversationId) {
            throw new Error('Conversation ID is required')
            }
            
            const response = await fetch(`/api/messages/conversations/${conversationId}`)
            if (!response.ok) {
            throw new Error('Failed to fetch messages')
            }

            const result = await response.json()
            
            if (!result.success) {
            throw new Error(result.message || 'Failed to fetch messages')
            }

            set({
            currentConversation: {
                id: result.data.conversation.id,
                messages: result.data.messages,
                otherParticipant: result.data.otherParticipant
            },
            loading: false
            })

            // Update unread status in conversations list
            const { conversations } = get()
            const updatedConversations = conversations.map(conv =>
            conv.id === conversationId
                ? { ...conv, unread: false, unreadCount: 0 }
                : conv
            )
            set({ conversations: updatedConversations })
        } catch (error) {
            console.error('[fetchMessages] Error:', error)
            set({
            error: error instanceof Error ? error.message : 'An error occurred',
            loading: false
            })
        }
        },

      sendMessage: async (recipientId: string, content: string, subject?: string) => {
        console.log(recipientId, 'stpr rec id')

        set({ sending: true, error: null })
        try { 
          const response = await fetch('/api/messages/conversations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ recipientId, content, subject })
          })

          if (!response.ok) {
            throw new Error('Failed to send message')
          }

          const result = await response.json()
          
          if (!result.success) {
            throw new Error(result.message || 'Failed to send message')
          }

          // Refresh conversations
          await get().fetchConversations()
          
          // If we have a current conversation, refresh messages
          const { currentConversation } = get()
          if (currentConversation && 
              (currentConversation.id === result.data.conversation.id ||
               (currentConversation.otherParticipant?.id === recipientId))) {
            await get().fetchMessages(result.data.conversation.id)
          }
          
          set({ sending: false })
          return true
        } catch (error) {
          console.error('Send message error:', error)
          set({
            error: error instanceof Error ? error.message : 'An error occurred',
            sending: false
          })
          return false
        }
      },

      archiveConversation: async (conversationId: string) => {
        set({ loading: true, error: null })
        try {
          const response = await fetch('/api/messages/conversations', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ conversationId, action: 'archive' })
          })

          if (!response.ok) {
            throw new Error('Failed to archive conversation')
          }

          // Refresh conversations
          await get().fetchConversations()
          
          set({ loading: false })
        } catch (error) {
          console.error('Archive conversation error:', error)
          set({
            error: error instanceof Error ? error.message : 'An error occurred',
            loading: false
          })
        }
      },

      unarchiveConversation: async (conversationId: string) => {
        set({ loading: true, error: null })
        try {
          const response = await fetch('/api/messages/conversations', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ conversationId, action: 'unarchive' })
          })

          if (!response.ok) {
            throw new Error('Failed to unarchive conversation')
          }

          // Refresh conversations
          await get().fetchConversations()
          
          set({ loading: false })
        } catch (error) {
          console.error('Unarchive conversation error:', error)
          set({
            error: error instanceof Error ? error.message : 'An error occurred',
            loading: false
          })
        }
      },

      deleteConversation: async (conversationId: string) => {
        set({ loading: true, error: null })
        try {
          const response = await fetch('/api/messages/conversations', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ conversationId, action: 'delete' })
          })

          if (!response.ok) {
            throw new Error('Failed to delete conversation')
          }

          // Refresh conversations
          await get().fetchConversations()
          
          // Clear current conversation if it was deleted
          const { currentConversation } = get()
          if (currentConversation?.id === conversationId) {
            set({ currentConversation: null })
          }
          
          set({ loading: false })
        } catch (error) {
          console.error('Delete conversation error:', error)
          set({
            error: error instanceof Error ? error.message : 'An error occurred',
            loading: false
          })
        }
      },

      markConversationRead: async (conversationId: string) => {
        try {
          await fetch('/api/messages/conversations', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ conversationId, action: 'mark_read' })
          })
        } catch (error) {
          console.error('Mark conversation read error:', error)
        }
      },

      setCurrentConversation: (conversationId: string | null) => {
        if (conversationId) {
          get().fetchMessages(conversationId)
          get().markConversationRead(conversationId)
        } else {
          set({ currentConversation: null })
        }
      },

      clearError: () => {
        set({ error: null })
      },

      reset: () => {
        set({
          conversations: [],
          currentConversation: null,
          loading: false,
          error: null,
          sending: false
        })
      }
    }),
    {
      name: 'message-storage',
      partialize: (state) => ({
        conversations: state.conversations
      })
    }
  )
)