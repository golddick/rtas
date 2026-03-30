// store/supervisorStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface StudentProposal {
  id: string
  title: string
  documentUrl: string 
  documentName: string 
  documentSize: number 
  status: string 
  score: number | null
  submittedDate: string | null
  reviewDate: Date | null
  approvedDate: Date | null
  latestFeedback?: string
  latestRating?: number
}

export interface Milestone {
  id: string
  title: string
  status: string
  dueDate: Date | null
  completion: number
}

export interface ProjectPlan {
  id: string
  title: string
  status: string
  milestones: Milestone[]
}

export interface Student {
  id: string
  fullName: string
  studentId: string
  email: string
  phone?: string | null
  matricNumber?: string | null
  program?: string | null
  joinDate: string
  status: string
  proposal: StudentProposal | null
  proposalStatus: string
  progress: number
  projectPlan: ProjectPlan | null
  department?: {
    id: string
    name: string
    code: string
    faculty: string
  } | null
  createdAt: Date
  updatedAt: Date
}

interface SupervisorState {
  students: Student[]
  selectedStudent: Student | null
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
    proposalStatus: string
    search: string
  }
  
  // Actions
  fetchStudents: (page?: number, limit?: number) => Promise<void>
  fetchStudentById: (id: string) => Promise<void>
  updateProposalStatus: (proposalId: string, status: string, feedback?: string, rating?: number) => Promise<void>
  setSelectedStudent: (student: Student | null) => void
  setFilters: (filters: Partial<SupervisorState['filters']>) => void
  clearError: () => void
  reset: () => void
}

export const useSupervisorStore = create<SupervisorState>()(
  persist(
    (set, get) => ({
      students: [],
      selectedStudent: null,
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
        proposalStatus: 'all',
        search: ''
      },

      fetchStudents: async (page = 1, limit = 10) => {
        set({ loading: true, error: null })
        try {
          const { filters } = get()
          const params = new URLSearchParams()
          
          params.append('page', page.toString())
          params.append('limit', limit.toString())
          
          // Only add filters if they have valid values
          if (filters.status && filters.status !== 'all' && filters.status !== 'undefined') {
            params.append('status', filters.status)
          }
          
          if (filters.proposalStatus && filters.proposalStatus !== 'all' && filters.proposalStatus !== 'undefined') {
            params.append('proposalStatus', filters.proposalStatus)
          }
          
          if (filters.search && filters.search.trim()) {
            params.append('search', filters.search.trim())
          }

          const response = await fetch(`/api/supervisor/students?${params.toString()}`)
          if (!response.ok) {
            throw new Error('Failed to fetch students')
          }

          const data = await response.json()
          set({
            students: data.data,
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

      fetchStudentById: async (id: string) => {
        set({ loading: true, error: null })
        try {
          const response = await fetch(`/api/supervisor/students/${id}`)
          if (!response.ok) {
            throw new Error('Failed to fetch student')
          }

          const data = await response.json()
          set({
            selectedStudent: data.data,
            loading: false
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'An error occurred',
            loading: false
          })
        }
      },

      updateProposalStatus: async (proposalId: string, status: string, feedback?: string, rating?: number) => {
        set({ loading: true, error: null })
        try {
          const response = await fetch(`/api/supervisor/proposals/${proposalId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status, feedback, rating })
          })

          if (!response.ok) {
            throw new Error('Failed to update proposal')
          }

          const data = await response.json()
          
          // Update the student's proposal in the list
          const { students } = get()
          const updatedStudents = students.map(student => {
            if (student.proposal?.id === proposalId) {
              return {
                ...student,
                proposal: student.proposal ? {
                  ...student.proposal,
                  status,
                  ...(status === 'APPROVED' && { approvedDate: new Date() }),
                  ...(status === 'UNDER_REVIEW' && { reviewDate: new Date() })
                } : null,
                proposalStatus: status
              }
            }
            return student
          })
          
          // Update selected student if it's the same
          const { selectedStudent } = get()
          const updatedSelectedStudent = selectedStudent?.proposal?.id === proposalId
            ? {
                ...selectedStudent,
                proposal: selectedStudent.proposal ? {
                  ...selectedStudent.proposal,
                  status,
                  ...(status === 'APPROVED' && { approvedDate: new Date() }),
                  ...(status === 'UNDER_REVIEW' && { reviewDate: new Date() })
                } : null,
                proposalStatus: status
              }
            : selectedStudent
          
          set({
            students: updatedStudents,
            selectedStudent: updatedSelectedStudent,
            loading: false
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'An error occurred',
            loading: false
          })
        }
      },

      setSelectedStudent: (student: Student | null) => {
        set({ selectedStudent: student })
      },

      setFilters: (filters) => {
        set(state => ({
          filters: { ...state.filters, ...filters },
          pagination: { ...state.pagination, page: 1 }
        }))
        // Fetch with new filters
        get().fetchStudents(1, get().pagination.limit)
      },

      clearError: () => {
        set({ error: null })
      },

      reset: () => {
        set({
          students: [],
          selectedStudent: null,
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
            proposalStatus: 'all',
            search: ''
          }
        })
      }
    }),
    {
      name: 'supervisor-storage',
      partialize: (state) => ({
        filters: state.filters
      })
    }
  )
)