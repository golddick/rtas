// store/student/supervisorStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Supervisor {
  id: string
  fullName: string
  email: string
  phone?: string | null
  staffNumber?: string | null
  department?: {
    id: string
    name: string
    code: string
    faculty: string
  } | null
  institution?: {
    id: string
    name: string
    code: string
    slug: string
  } | null
  specialization: string
  bio: string
  office: string
  officeHours: string
  studentsSupervised: number
  publications: number
  yearsExperience: number
  assignedSince?: Date | null
  recentFeedback: Array<{
    id: string
    topic: string
    feedback: string
    rating: number
    date: Date
    status: string
  }>
  lastMessageDate?: Date | null
}

interface SupervisorRequest {
  supervisorId: string
  researchInterests: string
  message?: string
}

interface StudentSupervisorState {
  supervisor: Supervisor | null
  hasSupervisor: boolean
  loading: boolean
  error: string | null
  requesting: boolean
  requestError: string | null
  
  // Actions
  fetchSupervisor: () => Promise<void>
  requestSupervisor: (data: SupervisorRequest) => Promise<void>
  cancelRequest: (requestId: string) => Promise<void>
  clearError: () => void
  reset: () => void
}

export const useStudentSupervisorStore = create<StudentSupervisorState>()(
  persist(
    (set, get) => ({
      supervisor: null,
      hasSupervisor: false,
      loading: false,
      error: null,
      requesting: false,
      requestError: null,

      fetchSupervisor: async () => {
        set({ loading: true, error: null })
        try {
          const response = await fetch('/api/student/supervisor')
          if (!response.ok) {
            throw new Error('Failed to fetch supervisor data')
          }

          const result = await response.json()
          
          if (!result.success) {
            throw new Error(result.message || 'Failed to fetch supervisor')
          }

          set({
            supervisor: result.data,
            hasSupervisor: result.hasSupervisor,
            loading: false
          })
        } catch (error) {
          console.error('Fetch supervisor error:', error)
          set({
            error: error instanceof Error ? error.message : 'An error occurred',
            loading: false
          })
        }
      },

      requestSupervisor: async (data: SupervisorRequest) => {
        set({ requesting: true, requestError: null })
        try {
          const response = await fetch('/api/student/supervisor/request', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
          })

          if (!response.ok) {
            throw new Error('Failed to submit supervisor request')
          }

          const result = await response.json()
          
          set({
            requesting: false
          })
        } catch (error) {
          console.error('Request supervisor error:', error)
          set({
            requestError: error instanceof Error ? error.message : 'An error occurred',
            requesting: false
          })
        }
      },

      cancelRequest: async (requestId: string) => {
        set({ requesting: true, requestError: null })
        try {
          const response = await fetch('/api/student/supervisor/request', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ requestId })
          })

          if (!response.ok) {
            throw new Error('Failed to cancel supervisor request')
          }

          set({
            requesting: false
          })
        } catch (error) {
          console.error('Cancel request error:', error)
          set({
            requestError: error instanceof Error ? error.message : 'An error occurred',
            requesting: false
          })
        }
      },

      clearError: () => {
        set({ error: null, requestError: null })
      },

      reset: () => {
        set({
          supervisor: null,
          hasSupervisor: false,
          loading: false,
          error: null,
          requesting: false,
          requestError: null
        })
      }
    }),
    {
      name: 'student-supervisor-storage',
      partialize: (state) => ({
        hasSupervisor: state.hasSupervisor
      })
    }
  )
)