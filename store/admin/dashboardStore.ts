// store/admin/dashboardStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DashboardStats, DepartmentPerformance, QuickStats, RecentActivity, SystemService, UserDistribution } from './type/dashboard'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || ''

interface DashboardState {
  // State
  stats: DashboardStats | null
  recentActivities: RecentActivity[]
  systemStatus: SystemService[]
  userDistribution: UserDistribution[]
  departmentPerformance: DepartmentPerformance[]
  quickStats: QuickStats | null
  isLoading: boolean
  error: string | null
  lastFetched: number | null

  // Actions
  fetchDashboardStats: () => Promise<void>
  fetchRecentActivities: (limit?: number) => Promise<void>
  fetchSystemStatus: () => Promise<void>
  fetchUserDistribution: () => Promise<void>
  fetchDepartmentPerformance: () => Promise<void>
  fetchQuickStats: () => Promise<void>
  refreshAll: () => Promise<void>
  clearError: () => void
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      // Initial state
      stats: null,
      recentActivities: [],
      systemStatus: [],
      userDistribution: [],
      departmentPerformance: [],
      quickStats: null,
      isLoading: false,
      error: null,
      lastFetched: null,

      // Fetch all dashboard stats
      fetchDashboardStats: async () => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch(`${API_BASE}/api/admin/dashboard/stats`, {
            credentials: 'include',
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.message || 'Failed to fetch dashboard stats')
          }

          set({ 
            stats: result.data,
            lastFetched: Date.now(),
            isLoading: false 
          })
        } catch (error: any) {
          console.error('[FETCH_DASHBOARD_STATS_ERROR]', error)
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to fetch dashboard stats'
          })
        }
      },

      // Fetch recent activities
      fetchRecentActivities: async (limit: number = 10) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch(`${API_BASE}/api/admin/dashboard/activities?limit=${limit}`, {
            credentials: 'include',
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.message || 'Failed to fetch recent activities')
          }

          set({ 
            recentActivities: result.data || [],
            isLoading: false 
          })
        } catch (error: any) {
          console.error('[FETCH_RECENT_ACTIVITIES_ERROR]', error)
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to fetch recent activities'
          })
        }
      },

      // Fetch system status
      fetchSystemStatus: async () => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch(`${API_BASE}/api/admin/dashboard/system-status`, {
            credentials: 'include',
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.message || 'Failed to fetch system status')
          }

          set({ 
            systemStatus: result.data || [],
            isLoading: false 
          })
        } catch (error: any) {
          console.error('[FETCH_SYSTEM_STATUS_ERROR]', error)
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to fetch system status'
          })
        }
      },

      // Fetch user distribution
      fetchUserDistribution: async () => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch(`${API_BASE}/api/admin/dashboard/user-distribution`, {
            credentials: 'include',
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.message || 'Failed to fetch user distribution')
          }

          set({ 
            userDistribution: result.data || [],
            isLoading: false 
          })
        } catch (error: any) {
          console.error('[FETCH_USER_DISTRIBUTION_ERROR]', error)
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to fetch user distribution'
          })
        }
      },

      // Fetch department performance
      fetchDepartmentPerformance: async () => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch(`${API_BASE}/api/admin/dashboard/department-performance`, {
            credentials: 'include',
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.message || 'Failed to fetch department performance')
          }

          set({ 
            departmentPerformance: result.data || [],
            isLoading: false 
          })
        } catch (error: any) {
          console.error('[FETCH_DEPARTMENT_PERFORMANCE_ERROR]', error)
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to fetch department performance'
          })
        }
      },

      // Fetch quick stats
      fetchQuickStats: async () => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch(`${API_BASE}/api/admin/dashboard/quick-stats`, {
            credentials: 'include',
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.message || 'Failed to fetch quick stats')
          }

          set({ 
            quickStats: result.data || null,
            isLoading: false 
          })
        } catch (error: any) {
          console.error('[FETCH_QUICK_STATS_ERROR]', error)
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to fetch quick stats'
          })
        }
      },

      // Refresh all dashboard data
      refreshAll: async () => {
        set({ isLoading: true, error: null })
        
        try {
          await Promise.all([
            get().fetchDashboardStats(),
            get().fetchRecentActivities(),
            get().fetchSystemStatus(),
            get().fetchUserDistribution(),
            get().fetchDepartmentPerformance(),
            get().fetchQuickStats(),
          ])
        } catch (error: any) {
          console.error('[REFRESH_ALL_ERROR]', error)
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to refresh dashboard data'
          })
        }
      },

      // Clear error
      clearError: () => set({ error: null }),
    }),
    {
      name: 'dashboard-storage',
      partialize: (state) => ({ 
        lastFetched: state.lastFetched 
      }),
    }
  )
)

// Selector hooks
export const useDashboardStats = () => useDashboardStore((state) => state.stats)
export const useRecentActivities = () => useDashboardStore((state) => state.recentActivities)
export const useSystemStatus = () => useDashboardStore((state) => state.systemStatus)
export const useUserDistribution = () => useDashboardStore((state) => state.userDistribution)
export const useDepartmentPerformance = () => useDashboardStore((state) => state.departmentPerformance)
export const useQuickStats = () => useDashboardStore((state) => state.quickStats)
export const useDashboardLoading = () => useDashboardStore((state) => state.isLoading)
export const useDashboardError = () => useDashboardStore((state) => state.error)
export const useLastFetched = () => useDashboardStore((state) => state.lastFetched)