// store/supervisor/dashboard/supervisorDashboardStore.ts - Alternative with derived values
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface DashboardStats {
  totalStudents: number
  pendingProposals: number
  approvedProposals: number
  totalProposals: number
  topicsCount: number
  totalInterests: number
  studentsWithApprovedTopics: number
  approvedPercentage: number
}

export interface DashboardMetrics {
  averageReviewTime: number
}

export interface RecentActivity {
  id: string
  type: 'approved' | 'rejected' | 'submitted' | 'reviewed'
  message: string
  details?: string | null
  date: string
}

export interface PendingReview {
  id: string
  studentName: string
  studentId: string
  studentMatricNumber?: string | null
  title: string
  submittedDate?: Date | null
  timeAgo: string
  status: string
}

export interface SupervisorInfo {
  id: string
  fullName: string
  email: string
  department: string
  staffNumber?: string | null
}

export interface DashboardData {
  stats: DashboardStats
  metrics: DashboardMetrics
  recentActivity: RecentActivity[]
  pendingReviews: PendingReview[]
  supervisorInfo: SupervisorInfo
}

// Add computed properties
export interface ComputedDashboardData extends DashboardData {
  studentsWithProposals: number
  underReviewProposals: number
  revisionNeededProposals: number
  rejectedProposals: number
  proposalStatusDistribution: Array<{ name: string; value: number; color: string }>
  studentProgressData: Array<{ name: string; value: number; color: string }>
}

interface SupervisorDashboardState {
  data: DashboardData | null
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  
  // Computed getters
  getComputedData: () => ComputedDashboardData | null
  
  // Actions
  fetchDashboardData: () => Promise<void>
  clearError: () => void
  reset: () => void
}

export const useSupervisorDashboardStore = create<SupervisorDashboardState>()(
  persist(
    (set, get) => ({
      data: null,
      loading: false,
      error: null,
      lastUpdated: null,

      getComputedData: () => {
        const { data } = get()
        if (!data) return null

        // Calculate derived values
        const studentsWithProposals = data.stats.totalStudents - (data.stats.totalStudents - (data.stats.totalProposals > 0 ? Math.min(data.stats.totalStudents, data.stats.totalProposals) : 0))
        
        // For demo purposes - in real app, these would come from API
        const underReviewProposals = Math.max(0, data.stats.pendingProposals - 2)
        const revisionNeededProposals = Math.floor(data.stats.pendingProposals * 0.2)
        const rejectedProposals = Math.floor(data.stats.totalProposals * 0.1)

        // Prepare chart data
        const proposalStatusDistribution = [
          { name: 'Approved', value: data.stats.approvedProposals, color: '#10b981' },
          { name: 'Pending', value: data.stats.pendingProposals, color: '#f59e0b' },
          { name: 'Under Review', value: underReviewProposals, color: '#3b82f6' },
          { name: 'Revision Needed', value: revisionNeededProposals, color: '#8b5cf6' },
          { name: 'Rejected', value: rejectedProposals, color: '#ef4444' }
        ].filter(item => item.value > 0)

        const studentProgressData = [
          { name: 'With Proposal', value: studentsWithProposals, color: '#3b82f6' },
          { name: 'No Proposal', value: data.stats.totalStudents - studentsWithProposals, color: '#9ca3af' }
        ].filter(item => item.value > 0)

        return {
          ...data,
          studentsWithProposals,
          underReviewProposals,
          revisionNeededProposals,
          rejectedProposals,
          proposalStatusDistribution,
          studentProgressData
        }
      },

      fetchDashboardData: async () => {
        set({ loading: true, error: null })
        try {
          const response = await fetch('/api/supervisor/dashboard')
          if (!response.ok) {
            throw new Error('Failed to fetch dashboard data')
          }

          const result = await response.json()
          
          if (!result.success) {
            throw new Error(result.message || 'Failed to fetch dashboard data')
          }

          set({
            data: result.data,
            loading: false,
            lastUpdated: new Date()
          })
        } catch (error) {
          console.error('Dashboard fetch error:', error)
          set({
            error: error instanceof Error ? error.message : 'An error occurred',
            loading: false
          })
        }
      },

      clearError: () => {
        set({ error: null })
      },

      reset: () => {
        set({
          data: null,
          loading: false,
          error: null,
          lastUpdated: null
        })
      }
    }),
    {
      name: 'supervisor-dashboard-storage',
      partialize: (state) => ({
        lastUpdated: state.lastUpdated
      })
    }
  )
)