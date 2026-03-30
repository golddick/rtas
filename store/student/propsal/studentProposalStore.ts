// store/student/propsal/studentProposalStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface StudentProposal {
  id: string
  title: string
  description: string
  submittedDate: string
  status: string
  score: number | null
  documentUrl?: string | null
  documentName?: string | null
  feedback?: string | null
  supervisorName?: string
}

interface ProposalFormData {
  title: string
  description: string
  documentUrl?: string | null
  documentName?: string | null
  documentSize?: number | null
}

interface StudentProposalState {
  proposals: StudentProposal[]
  loading: boolean
  error: string | null
  submitting: boolean
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  filters: {
    status: string
  }
  
  // Actions
  fetchProposals: (page?: number, limit?: number) => Promise<void>
  fetchProposalById: (id: string) => Promise<StudentProposal | null>
  createProposal: (data: ProposalFormData) => Promise<boolean>
  updateProposal: (id: string, data: Partial<ProposalFormData>) => Promise<boolean>
  deleteProposal: (id: string) => Promise<boolean>
  clearError: () => void
  reset: () => void
}

export const useStudentProposalStore = create<StudentProposalState>()(
  persist(
    (set, get) => ({
      proposals: [],
      loading: false,
      error: null,
      submitting: false,
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
      },
      filters: {
        status: 'all'
      },

      fetchProposals: async (page = 1, limit = 10) => {
        set({ loading: true, error: null })
        try {
          const { filters } = get()
          const params = new URLSearchParams()
          params.append('page', page.toString())
          params.append('limit', limit.toString())
          
          if (filters.status && filters.status !== 'all') {
            params.append('status', filters.status)
          }

          const response = await fetch(`/api/student/proposals?${params.toString()}`)
          if (!response.ok) {
            throw new Error('Failed to fetch proposals')
          }

          const result = await response.json()
          
          if (!result.success) {
            throw new Error(result.message || 'Failed to fetch proposals')
          }

          set({
            proposals: result.data,
            pagination: result.pagination,
            loading: false
          })
        } catch (error) {
          console.error('Fetch proposals error:', error)
          set({
            error: error instanceof Error ? error.message : 'An error occurred',
            loading: false
          })
        }
      },

      fetchProposalById: async (id: string) => {
        set({ loading: true, error: null })
        try {
          const response = await fetch(`/api/student/proposals/${id}`)
          
          if (!response.ok) {
            throw new Error('Failed to fetch proposal')
          }

          const result = await response.json()
          
          if (!result.success) {
            throw new Error(result.message || 'Failed to fetch proposal')
          }

          // Check if proposal already exists in state
          const currentProposals = get().proposals
          const existingIndex = currentProposals.findIndex(p => p.id === result.data.id)
          
          let updatedProposals
          if (existingIndex >= 0) {
            // Update existing proposal
            updatedProposals = [...currentProposals]
            updatedProposals[existingIndex] = result.data
          } else {
            // Add new proposal
            updatedProposals = [result.data, ...currentProposals]
          }
          
          set({
            proposals: updatedProposals,
            loading: false
          })
          
          return result.data
        } catch (error) {
          console.error('Fetch proposal by id error:', error)
          set({
            error: error instanceof Error ? error.message : 'An error occurred',
            loading: false
          })
          return null
        }
      },

      createProposal: async (data: ProposalFormData) => {
        set({ submitting: true, error: null })
        try {
          const response = await fetch('/api/student/proposals', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
          })

          if (!response.ok) {
            throw new Error('Failed to create proposal')
          }

          const result = await response.json()
          
          if (!result.success) {
            throw new Error(result.message || 'Failed to create proposal')
          }

          // Refresh proposals list
          await get().fetchProposals()
          
          set({ submitting: false })
          return true
        } catch (error) {
          console.error('Create proposal error:', error)
          set({
            error: error instanceof Error ? error.message : 'An error occurred',
            submitting: false
          })
          return false
        }
      },

      updateProposal: async (id: string, data: Partial<ProposalFormData>) => {
        set({ submitting: true, error: null })
        try {
          const response = await fetch('/api/student/proposals', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ proposalId: id, ...data })
          })

          if (!response.ok) {
            throw new Error('Failed to update proposal')
          }

          const result = await response.json()
          
          if (!result.success) {
            throw new Error(result.message || 'Failed to update proposal')
          }

          // Update the proposal in the local state
          const currentProposals = get().proposals
          const updatedProposals = currentProposals.map(proposal =>
            proposal.id === id ? { ...proposal, ...data } : proposal
          )
          
          set({ 
            proposals: updatedProposals,
            submitting: false 
          })
          
          return true
        } catch (error) {
          console.error('Update proposal error:', error)
          set({
            error: error instanceof Error ? error.message : 'An error occurred',
            submitting: false
          })
          return false
        }
      },

      deleteProposal: async (id: string) => {
        set({ loading: true, error: null })
        try {
          const response = await fetch(`/api/student/proposals?id=${id}`, {
            method: 'DELETE'
          })

          if (!response.ok) {
            throw new Error('Failed to delete proposal')
          }

          const result = await response.json()
          
          if (!result.success) {
            throw new Error(result.message || 'Failed to delete proposal')
          }

          // Remove from local state
          const currentProposals = get().proposals
          const updatedProposals = currentProposals.filter(p => p.id !== id)
          
          set({
            proposals: updatedProposals,
            loading: false
          })
          
          return true
        } catch (error) {
          console.error('Delete proposal error:', error)
          set({
            error: error instanceof Error ? error.message : 'An error occurred',
            loading: false
          })
          return false
        }
      },

      clearError: () => {
        set({ error: null })
      },

      reset: () => {
        set({
          proposals: [],
          loading: false,
          error: null,
          submitting: false,
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0
          },
          filters: {
            status: 'all'
          }
        })
      }
    }),
    {
      name: 'student-proposal-storage',
      partialize: (state) => ({
        filters: state.filters
      })
    }
  )
)



// // store/studentProposalStore.ts
// import { create } from 'zustand'
// import { persist } from 'zustand/middleware'

// export interface StudentProposal {
//   id: string
//   title: string
//   description: string
//   submittedDate: string
//   status: string
//   score: number | null
//   documentUrl?: string | null
//   documentName?: string | null
//   feedback?: string | null
//   supervisorName?: string
// }

// interface ProposalFormData {
//   title: string
//   description: string
//   documentUrl?: string | null
//   documentName?: string | null
//   documentSize?: number | null
// }

// interface StudentProposalState {
//   proposals: StudentProposal[]
//   loading: boolean
//   error: string | null
//   submitting: boolean
//   pagination: {
//     page: number
//     limit: number
//     total: number
//     totalPages: number
//   }
//   filters: {
//     status: string
//   }
  
//   // Actions
//   fetchProposals: (page?: number, limit?: number) => Promise<void>
//   createProposal: (data: ProposalFormData) => Promise<boolean>
//   updateProposal: (id: string, data: Partial<ProposalFormData>) => Promise<boolean>
//   deleteProposal: (id: string) => Promise<boolean>
//   clearError: () => void
//   reset: () => void
// }

// export const useStudentProposalStore = create<StudentProposalState>()(
//   persist(
//     (set, get) => ({
//       proposals: [],
//       loading: false,
//       error: null,
//       submitting: false,
//       pagination: {
//         page: 1,
//         limit: 10,
//         total: 0,
//         totalPages: 0
//       },
//       filters: {
//         status: 'all'
//       },

//       fetchProposals: async (page = 1, limit = 10) => {
//         set({ loading: true, error: null })
//         try {
//           const { filters } = get()
//           const params = new URLSearchParams()
//           params.append('page', page.toString())
//           params.append('limit', limit.toString())
          
//           if (filters.status && filters.status !== 'all') {
//             params.append('status', filters.status)
//           }

//           const response = await fetch(`/api/student/proposals?${params.toString()}`)
//           if (!response.ok) {
//             throw new Error('Failed to fetch proposals')
//           }

//           const result = await response.json()
          
//           if (!result.success) {
//             throw new Error(result.message || 'Failed to fetch proposals')
//           }

//           set({
//             proposals: result.data,
//             pagination: result.pagination,
//             loading: false
//           })
//         } catch (error) {
//           console.error('Fetch proposals error:', error)
//           set({
//             error: error instanceof Error ? error.message : 'An error occurred',
//             loading: false
//           })
//         }
//       },

//       createProposal: async (data: ProposalFormData) => {
//         set({ submitting: true, error: null })
//         try {
//           const response = await fetch('/api/student/proposals', {
//             method: 'POST',
//             headers: {
//               'Content-Type': 'application/json'
//             },
//             body: JSON.stringify(data)
//           })

//           if (!response.ok) {
//             throw new Error('Failed to create proposal')
//           }

//           const result = await response.json()
          
//           if (!result.success) {
//             throw new Error(result.message || 'Failed to create proposal')
//           }

//           // Refresh proposals list
//           await get().fetchProposals()
          
//           set({ submitting: false })
//           return true
//         } catch (error) {
//           console.error('Create proposal error:', error)
//           set({
//             error: error instanceof Error ? error.message : 'An error occurred',
//             submitting: false
//           })
//           return false
//         }
//       },

//       updateProposal: async (id: string, data: Partial<ProposalFormData>) => {
//         set({ submitting: true, error: null })
//         try {
//           const response = await fetch('/api/student/proposals', {
//             method: 'PATCH',
//             headers: {
//               'Content-Type': 'application/json'
//             },
//             body: JSON.stringify({ proposalId: id, ...data })
//           })

//           if (!response.ok) {
//             throw new Error('Failed to update proposal')
//           }

//           const result = await response.json()
          
//           if (!result.success) {
//             throw new Error(result.message || 'Failed to update proposal')
//           }

//           // Refresh proposals list
//           await get().fetchProposals()
          
//           set({ submitting: false })
//           return true
//         } catch (error) {
//           console.error('Update proposal error:', error)
//           set({
//             error: error instanceof Error ? error.message : 'An error occurred',
//             submitting: false
//           })
//           return false
//         }
//       },

//       deleteProposal: async (id: string) => {
//         set({ loading: true, error: null })
//         try {
//           const response = await fetch(`/api/student/proposals?id=${id}`, {
//             method: 'DELETE'
//           })

//           if (!response.ok) {
//             throw new Error('Failed to delete proposal')
//           }

//           const result = await response.json()
          
//           if (!result.success) {
//             throw new Error(result.message || 'Failed to delete proposal')
//           }

//           // Refresh proposals list
//           await get().fetchProposals()
          
//           set({ loading: false })
//           return true
//         } catch (error) {
//           console.error('Delete proposal error:', error)
//           set({
//             error: error instanceof Error ? error.message : 'An error occurred',
//             loading: false
//           })
//           return false
//         }
//       },

//       clearError: () => {
//         set({ error: null })
//       },

//       reset: () => {
//         set({
//           proposals: [],
//           loading: false,
//           error: null,
//           submitting: false,
//           pagination: {
//             page: 1,
//             limit: 10,
//             total: 0,
//             totalPages: 0
//           },
//           filters: {
//             status: 'all'
//           }
//         })
//       }
//     }),
//     {
//       name: 'student-proposal-storage',
//       partialize: (state) => ({
//         filters: state.filters
//       })
//     }
//   )
// )