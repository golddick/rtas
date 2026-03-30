// store/supervisorProposalStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ProposalReview {
  id: string
  feedback: string
  rating: number
  status: string
  reviewerName: string
  reviewerEmail: string
  reviewerRole: string
  createdAt: Date
  updatedAt: Date
}

export interface SupervisorProposal {
  id: string
  title: string
  description: string | null
  abstract: string
  studentName: string
  studentId: string
  studentEmail?: string | null
  studentMatricNumber?: string | null
  studentPhone?: string | null
  studentProgram?: string | null
  supervisorName: string
  supervisorEmail?: string | null
  supervisorStaffNumber?: string | null
  supervisorPhone?: string | null
  submittedDate: string
  status: string
  score: number | null
  documentUrl?: string | null
  documentName?: string | null
  pages: number
  priority: string
  department?: {
    id: string
    name: string
    code: string
    faculty: string
  } | null
  reviews: ProposalReview[]
  reviewDate?: Date | null
  approvedDate?: Date | null
  createdAt: Date
  updatedAt: Date
}

interface SupervisorProposalState {
  proposals: SupervisorProposal[]
  selectedProposal: SupervisorProposal | null
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
    search: string
  }
  approvedIds: string[]
  
  // Actions
  fetchProposals: (page?: number, limit?: number) => Promise<void>
  fetchProposalById: (id: string) => Promise<void>
  updateProposalStatus: (proposalId: string, status: string, feedback?: string, rating?: number) => Promise<void>
  setSelectedProposal: (proposal: SupervisorProposal | null) => void
  setFilters: (filters: Partial<SupervisorProposalState['filters']>) => void
  approveProposal: (proposalId: string) => void
  clearError: () => void
  reset: () => void
}

export const useSupervisorProposalStore = create<SupervisorProposalState>()(
  persist(
    (set, get) => ({
      proposals: [],
      selectedProposal: null,
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
        search: ''
      },
      approvedIds: [],

    fetchProposals: async (page = 1, limit = 10) => {
  set({ loading: true, error: null })
  try {
    const { filters } = get()
    const params = new URLSearchParams()
    
    params.append('page', page.toString())
    params.append('limit', limit.toString())
    
    if (filters.status && filters.status !== 'all' && filters.status !== 'undefined') {
      params.append('status', filters.status)
    }
    
    if (filters.search && filters.search.trim()) {
      params.append('search', filters.search.trim()) 
    }

    const response = await fetch(`/api/supervisor/proposals?${params.toString()}`)
    if (!response.ok) {
      throw new Error('Failed to fetch proposals')
    }

    const data = await response.json()
    
    // Ensure all proposals have supervisor fields
    const proposalsWithSupervisor = data.data.map((proposal: any) => ({
      ...proposal,
      supervisorName: proposal.supervisorName || 'Not Assigned',
      supervisorEmail: proposal.supervisorEmail,
      supervisorStaffNumber: proposal.supervisorStaffNumber,
      supervisorPhone: proposal.supervisorPhone,
    }))
    
    set({
      proposals: proposalsWithSupervisor,
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
      fetchProposalById: async (id: string) => {
        set({ loading: true, error: null })
        try {
          const response = await fetch(`/api/supervisor/proposals/${id}`)
          if (!response.ok) {
            throw new Error('Failed to fetch proposal')
          }

          const data = await response.json()
          set({
            selectedProposal: data.data,
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
          const response = await fetch('/api/supervisor/proposals', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ proposalId, status, feedback, rating })
          })

          if (!response.ok) {
            throw new Error('Failed to update proposal')
          }

          const data = await response.json()
          
          // Update the proposal in the list
          const { proposals } = get()
          const updatedProposals = proposals.map(proposal =>
            proposal.id === proposalId
              ? { 
                  ...proposal, 
                  status, 
                  score: rating !== undefined ? rating : proposal.score,
                  ...(status === 'APPROVED' && { approvedDate: new Date() }),
                  ...(status === 'UNDER_REVIEW' && { reviewDate: new Date() })
                }
              : proposal
          )
          
          // Update selected proposal if it's the same
          const { selectedProposal } = get()
          const updatedSelectedProposal = selectedProposal?.id === proposalId
            ? { 
                ...selectedProposal, 
                status, 
                score: rating !== undefined ? rating : selectedProposal.score,
                ...(status === 'APPROVED' && { approvedDate: new Date() }),
                ...(status === 'UNDER_REVIEW' && { reviewDate: new Date() })
              }
            : selectedProposal
          
          // Update approved IDs if status is APPROVED
          const { approvedIds } = get()
          let updatedApprovedIds = [...approvedIds]
          if (status === 'APPROVED' && !approvedIds.includes(proposalId)) {
            updatedApprovedIds.push(proposalId)
          } else if (status !== 'APPROVED' && approvedIds.includes(proposalId)) {
            updatedApprovedIds = approvedIds.filter(id => id !== proposalId)
          }
          
          set({
            proposals: updatedProposals,
            selectedProposal: updatedSelectedProposal,
            approvedIds: updatedApprovedIds,
            loading: false
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'An error occurred',
            loading: false
          })
        }
      },

      setSelectedProposal: (proposal: SupervisorProposal | null) => {
        set({ selectedProposal: proposal })
      },

      setFilters: (filters) => {
        set(state => ({
          filters: { ...state.filters, ...filters },
          pagination: { ...state.pagination, page: 1 }
        }))
        get().fetchProposals(1, get().pagination.limit)
      },

      approveProposal: (proposalId: string) => {
        const { approvedIds } = get()
        if (!approvedIds.includes(proposalId)) {
          set({ approvedIds: [...approvedIds, proposalId] })
        }
      },

      clearError: () => {
        set({ error: null })
      },

      reset: () => {
        set({
          proposals: [],
          selectedProposal: null,
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
            search: ''
          },
          approvedIds: []
        })
      }
    }),
    {
      name: 'supervisor-proposal-storage',
      partialize: (state) => ({
        filters: state.filters,
        approvedIds: state.approvedIds
      })
    }
  )
)