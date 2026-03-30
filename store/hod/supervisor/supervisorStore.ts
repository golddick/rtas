// store/hod/supervisorStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CreateSupervisorData, Supervisor, SupervisorFilters, SupervisorResponse, UpdateSupervisorData } from './type/supervisor'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || ''

interface SupervisorState {
  // State
  supervisors: Supervisor[]
  currentSupervisor: Supervisor | null
  isLoading: boolean
  error: string | null
  totalCount: number
  filters: SupervisorFilters

  // Actions
  fetchSupervisors: (departmentId: string, filters?: SupervisorFilters) => Promise<void>
  fetchSupervisor: (id: string) => Promise<void>
  createSupervisor: (data: CreateSupervisorData) => Promise<Supervisor>
  updateSupervisor: (id: string, data: UpdateSupervisorData) => Promise<Supervisor>
  deleteSupervisor: (id: string) => Promise<void>
  toggleSupervisorStatus: (id: string, currentStatus: string) => Promise<Supervisor>
  setFilters: (filters: Partial<SupervisorFilters>) => void
  clearFilters: () => void
  clearError: () => void
  clearCurrent: () => void
}

export const useSupervisorStore = create<SupervisorState>()(
  persist(
    (set, get) => ({
      // Initial state
      supervisors: [],
      currentSupervisor: null,
      isLoading: false,
      error: null,
      totalCount: 0,
      filters: {
        search: ''
      },

      // Fetch all supervisors for a department
      fetchSupervisors: async (departmentId: string, filters?: SupervisorFilters) => {
        set({ isLoading: true, error: null })
        
        try {
          // Merge existing filters with new filters
          const currentFilters = get().filters
          const mergedFilters = { ...currentFilters, ...filters }
          
          // Build query string
          const queryParams = new URLSearchParams()
          queryParams.append('departmentId', departmentId)
          
          if (mergedFilters.status && mergedFilters.status !== 'all') {
            queryParams.append('status', mergedFilters.status)
          }
          if (mergedFilters.search) {
            queryParams.append('search', mergedFilters.search)
          }

          const url = `${API_BASE}/api/hod/supervisors?${queryParams.toString()}`
          
          const response = await fetch(url, {
            credentials: 'include',
          }) 

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.message || 'Failed to fetch supervisors')
          }

          set({ 
            supervisors: result.data || [],
            totalCount: result.pagination?.total || result.data?.length || 0,
            filters: mergedFilters,
            isLoading: false 
          })
        } catch (error: any) {
          console.error('[FETCH_SUPERVISORS_ERROR]', error)
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to fetch supervisors'
          })
        }
      },

      // Fetch single supervisor
      fetchSupervisor: async (id: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch(`${API_BASE}/api/hod/supervisors/${id}`, {
            credentials: 'include',
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.message || 'Failed to fetch supervisor')
          }

          set({ 
            currentSupervisor: result.data,
            isLoading: false 
          })
        } catch (error: any) {
          console.error('[FETCH_SUPERVISOR_ERROR]', error)
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to fetch supervisor'
          })
        }
      },

      // Create supervisor
      createSupervisor: async (data: CreateSupervisorData) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch(`${API_BASE}/api/hod/supervisors`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
            credentials: 'include',
          })

          const result: SupervisorResponse = await response.json()

          if (!response.ok) {
            throw new Error(result.message || result.error || 'Failed to create supervisor')
          }

          // Add to list
          if (result.data) {
            set({ 
              supervisors: [result.data, ...get().supervisors],
              isLoading: false 
            })
          }

          return result.data!
        } catch (error: any) {
          console.error('[CREATE_SUPERVISOR_ERROR]', error)
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to create supervisor'
          })
          throw error
        }
      },

      // Update supervisor
      updateSupervisor: async (id: string, data: UpdateSupervisorData) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch(`${API_BASE}/api/hod/supervisors/${id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
            credentials: 'include',
          })

          const result: SupervisorResponse = await response.json()

          if (!response.ok) {
            throw new Error(result.message || result.error || 'Failed to update supervisor')
          }

          // Update in list
          if (result.data) {
            set({ 
              supervisors: get().supervisors.map(sup => 
                sup.id === id ? result.data! : sup
              ),
              currentSupervisor: result.data,
              isLoading: false 
            })
          }

          return result.data!
        } catch (error: any) {
          console.error('[UPDATE_SUPERVISOR_ERROR]', error)
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to update supervisor'
          })
          throw error
        }
      },

      // Delete supervisor
      deleteSupervisor: async (id: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch(`${API_BASE}/api/hod/supervisors/${id}`, {
            method: 'DELETE',
            credentials: 'include',
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.message || 'Failed to delete supervisor')
          }

          // Remove from list
          set({ 
            supervisors: get().supervisors.filter(sup => sup.id !== id),
            isLoading: false 
          })
        } catch (error: any) {
          console.error('[DELETE_SUPERVISOR_ERROR]', error)
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to delete supervisor'
          })
          throw error
        }
      },

      // Toggle supervisor status
      toggleSupervisorStatus: async (id: string, currentStatus: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
          
          const response = await fetch(`${API_BASE}/api/hod/supervisors/${id}/status`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: newStatus }),
            credentials: 'include',
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.message || 'Failed to update supervisor status')
          }

          // Update in list
          if (result.data) {
            set({ 
              supervisors: get().supervisors.map(sup => 
                sup.id === id ? result.data! : sup
              ),
              isLoading: false 
            })
          }

          return result.data!
        } catch (error: any) {
          console.error('[TOGGLE_SUPERVISOR_STATUS_ERROR]', error)
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to update supervisor status'
          })
          throw error
        }
      },

      // Set filters
      setFilters: (filters: Partial<SupervisorFilters>) => {
        set({ filters: { ...get().filters, ...filters } })
      },

      // Clear filters
      clearFilters: () => {
        set({ 
          filters: {
            search: ''
          }
        })
      },

      // Clear error
      clearError: () => set({ error: null }),

      // Clear current supervisor
      clearCurrent: () => set({ currentSupervisor: null }),
    }),
    {
      name: 'supervisor-storage',
      partialize: (state) => ({ 
        filters: state.filters
      }),
    }
  )
)

// Selector hooks
export const useSupervisors = () => useSupervisorStore((state) => state.supervisors)
export const useCurrentSupervisor = () => useSupervisorStore((state) => state.currentSupervisor)
export const useSupervisorLoading = () => useSupervisorStore((state) => state.isLoading)
export const useSupervisorError = () => useSupervisorStore((state) => state.error)
export const useSupervisorFilters = () => useSupervisorStore((state) => state.filters)