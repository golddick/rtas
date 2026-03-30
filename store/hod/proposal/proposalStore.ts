// store/proposalStore.ts
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

export interface Proposal {
  id: string
  title: string
  description: string
  abstract: string
  studentName: string
  studentEmail: string
  studentMatricNumber: string
  studentPhone?: string
  supervisorName: string
  supervisorEmail?: string
  supervisorStaffNumber?: string
  supervisorPhone?: string
  submittedDate: string
  status: string
  score: number | null
  documentUrl?: string
  department: {
    id: string
    name: string
    code: string
    faculty?: string
  }
  reviews: ProposalReview[]
  reviewDate?: Date
  approvedDate?: Date
  createdAt: Date
  updatedAt: Date
}

interface ProposalState {
  proposals: Proposal[]
  selectedProposal: Proposal | null
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
  
  // Actions
  fetchProposals: (page?: number, limit?: number) => Promise<void>
  fetchProposalById: (id: string) => Promise<void>
  updateProposalStatus: (proposalId: string, status: string, score?: number) => Promise<void>
  setSelectedProposal: (proposal: Proposal | null) => void
  setFilters: (filters: Partial<ProposalState['filters']>) => void
  clearError: () => void
  reset: () => void
}

export const useProposalStore = create<ProposalState>()(
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
        status: 'All',
        search: ''
      },

      fetchProposals: async (page = 1, limit = 10) => {
        set({ loading: true, error: null })
        try {
          const { filters } = get()
          const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...(filters.status !== 'All' && { status: filters.status }),
            ...(filters.search && { search: filters.search })
          })

          const response = await fetch(`/api/hod/proposals?${params}`)
          if (!response.ok) {
            throw new Error('Failed to fetch proposals')
          }

          const data = await response.json()
          set({
            proposals: data.data,
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
          const response = await fetch(`/api/hod/proposals/${id}`)
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

      updateProposalStatus: async (proposalId: string, status: string, score?: number) => {
        set({ loading: true, error: null })
        try {
          const response = await fetch('/api/hod/proposals', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ proposalId, status, score })
          })

          if (!response.ok) {
            throw new Error('Failed to update proposal')
          }

          const data = await response.json()
          
          // Update the proposal in the list
          const { proposals } = get()
          const updatedProposals = proposals.map(proposal =>
            proposal.id === proposalId
              ? { ...proposal, status, score: score !== undefined ? score : proposal.score }
              : proposal
          )
          
          // Update selected proposal if it's the same
          const { selectedProposal } = get()
          const updatedSelectedProposal = selectedProposal?.id === proposalId
            ? { ...selectedProposal, status, score: score !== undefined ? score : selectedProposal.score }
            : selectedProposal
          
          set({
            proposals: updatedProposals,
            selectedProposal: updatedSelectedProposal,
            loading: false
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'An error occurred',
            loading: false
          })
        }
      },

      setSelectedProposal: (proposal: Proposal | null) => {
        set({ selectedProposal: proposal })
      },

      setFilters: (filters) => {
        set(state => ({
          filters: { ...state.filters, ...filters },
          pagination: { ...state.pagination, page: 1 } // Reset to first page when filters change
        }))
        // Refetch with new filters
        get().fetchProposals(1, get().pagination.limit)
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
            status: 'All',
            search: ''
          }
        })
      }
    }),
    {
      name: 'proposal-storage',
      partialize: (state) => ({
        filters: state.filters
      })
    }
  )
)