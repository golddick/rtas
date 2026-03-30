// store/supervisorTopicStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface TopicInterest {
  id: string
  studentId: string
  studentName: string
  studentEmail: string
  studentMatricNumber?: string | null
  interestedAt: Date
}

export interface ResearchTopic {
  id: string
  title: string
  description: string
  category: string
  keywords: string
  difficulty: string
  status: string
  studentInterests: number
  interests: TopicInterest[]
  createdAt: Date
  updatedAt: Date
}

interface TopicFormData {
  title: string
  description: string
  category: string
  keywords: string
  difficulty: string
}

interface SupervisorTopicState {
  topics: ResearchTopic[]
  selectedTopic: ResearchTopic | null
  loading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  filters: {
    status: string
    category: string
    search: string
  }
  
  // Actions
  fetchTopics: (page?: number, limit?: number) => Promise<void>
  fetchTopicById: (id: string) => Promise<void>
  createTopic: (data: TopicFormData) => Promise<void>
  updateTopic: (id: string, data: Partial<TopicFormData & { status: string }>) => Promise<void>
  deleteTopic: (id: string) => Promise<void>
  setSelectedTopic: (topic: ResearchTopic | null) => void
  setFilters: (filters: Partial<SupervisorTopicState['filters']>) => void
  clearError: () => void
  reset: () => void
}

export const useSupervisorTopicStore = create<SupervisorTopicState>()(
  persist(
    (set, get) => ({
      topics: [],
      selectedTopic: null,
      loading: false,
      error: null,
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
      },
      filters: {
        status: 'all',
        category: 'all',
        search: ''
      },

      fetchTopics: async (page = 1, limit = 10) => {
        set({ loading: true, error: null })
        try {
          const { filters } = get()
          const params = new URLSearchParams()
          
          params.append('page', page.toString())
          params.append('limit', limit.toString())
          
          if (filters.status && filters.status !== 'all' && filters.status !== 'undefined') {
            params.append('status', filters.status)
          }
          
          if (filters.category && filters.category !== 'all' && filters.category !== 'undefined') {
            params.append('category', filters.category)
          }
          
          if (filters.search && filters.search.trim()) {
            params.append('search', filters.search.trim())
          }

          const response = await fetch(`/api/supervisor/topics?${params.toString()}`)
          if (!response.ok) {
            throw new Error('Failed to fetch topics')
          }

          const data = await response.json()
          set({
            topics: data.data,
            pagination: data.pagination,
            loading: false
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'An error occurred',
            loading: false
          })
        }
      },

      fetchTopicById: async (id: string) => {
        set({ loading: true, error: null })
        try {
          const response = await fetch(`/api/supervisor/topics/${id}`)
          if (!response.ok) {
            throw new Error('Failed to fetch topic')
          }

          const data = await response.json()
          set({
            selectedTopic: data.data,
            loading: false
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'An error occurred',
            loading: false
          })
        }
      },

      createTopic: async (data: TopicFormData) => {
        set({ loading: true, error: null })
        try {
          const response = await fetch('/api/supervisor/topics', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
          })

          if (!response.ok) {
            throw new Error('Failed to create topic')
          }

          const result = await response.json()
          
          // Refresh topics list
          await get().fetchTopics(get().pagination.page, get().pagination.limit)
          
          set({ loading: false })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'An error occurred',
            loading: false
          })
        }
      },

      updateTopic: async (id: string, data: Partial<TopicFormData & { status: string }>) => {
        set({ loading: true, error: null })
        try {
          const response = await fetch('/api/supervisor/topics', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id, ...data })
          })

          if (!response.ok) {
            throw new Error('Failed to update topic')
          }

          const result = await response.json()
          
          // Update topic in list
          const { topics } = get()
          const updatedTopics = topics.map(topic =>
            topic.id === id ? { ...topic, ...result.data } : topic
          )
          
          set({
            topics: updatedTopics,
            selectedTopic: result.data,
            loading: false
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'An error occurred',
            loading: false
          })
        }
      },

      deleteTopic: async (id: string) => {
        set({ loading: true, error: null })
        try {
          const response = await fetch(`/api/supervisor/topics?id=${id}`, {
            method: 'DELETE'
          })

          if (!response.ok) {
            throw new Error('Failed to delete topic')
          }

          // Remove topic from list
          const { topics } = get()
          const updatedTopics = topics.filter(topic => topic.id !== id)
          
          set({
            topics: updatedTopics,
            loading: false
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'An error occurred',
            loading: false
          })
        }
      },

      setSelectedTopic: (topic: ResearchTopic | null) => {
        set({ selectedTopic: topic })
      },

      setFilters: (filters) => {
        set(state => ({
          filters: { ...state.filters, ...filters },
          pagination: { ...state.pagination, page: 1 }
        }))
        get().fetchTopics(1, get().pagination.limit)
      },

      clearError: () => {
        set({ error: null })
      },

      reset: () => {
        set({
          topics: [],
          selectedTopic: null,
          loading: false,
          error: null,
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0
          },
          filters: {
            status: 'all',
            category: 'all',
            search: ''
          }
        })
      }
    }),
    {
      name: 'supervisor-topic-storage',
      partialize: (state) => ({
        filters: state.filters
      })
    }
  )
)