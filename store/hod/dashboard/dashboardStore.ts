// store/dashboardStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface DashboardStats {
  totalStudents: number
//   totalSupervisors: number
  activeSupervisors: number
  totalProposals: number
  approvedProposals: number
  pendingProposals: number
  rejectedProposals: number
  underReviewProposals: number
  revisionNeededProposals: number
}

export interface DashboardMetrics {
  approvalRate: number
  averageReviewTime: number
}

export interface RecentProposal {
  id: string
  title: string
  studentName: string
  supervisorName: string
  submittedDate: string
  status: string
  timeAgo: string
}

export interface TopSupervisor {
  id: string
  name: string
  email: string
  staffNumber: string | null
  studentsCount: number
  approvedTopics: number
}

export interface DepartmentInfo {
  name: string
  code: string
  faculty: string
  totalStudent: number
  totalSupervisors: number
  totalProposals: number
}

export interface DashboardData {
  stats: DashboardStats
  metrics: DashboardMetrics
  recentProposals: RecentProposal[]
  topSupervisors: TopSupervisor[]
  departmentInfo: DepartmentInfo
}

interface DashboardState {
  data: DashboardData | null
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  
  // Actions
  fetchDashboardData: () => Promise<void>
  clearError: () => void
  reset: () => void
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      data: null,
      loading: false,
      error: null,
      lastUpdated: null,

      fetchDashboardData: async () => {
        set({ loading: true, error: null })
        try {
          const response = await fetch('/api/hod/dashboard')
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
      name: 'dashboard-storage',
      partialize: (state) => ({
        lastUpdated: state.lastUpdated
        // Don't persist the actual data, just the timestamp
      })
    }
  )
)