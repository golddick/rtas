// store/hod/student/supervisorForStudentStore.ts
import { create } from 'zustand'
import { Supervisor } from '../supervisor/type/supervisor'


const API_BASE = process.env.NEXT_PUBLIC_API_BASE || ''

interface SupervisorForStudentState {
  supervisors: Supervisor[]
  isLoading: boolean
  error: string | null
  
  fetchAvailableSupervisors: (departmentId: string) => Promise<void>
  clearError: () => void
}

export const useSupervisorForStudentStore = create<SupervisorForStudentState>()(
  (set) => ({
    supervisors: [],
    isLoading: false,
    error: null,

    fetchAvailableSupervisors: async (departmentId: string) => {
      set({ isLoading: true, error: null })
      
      try {
        const url = `${API_BASE}/api/hod/supervisors/available?departmentId=${departmentId}`
        console.log('Fetching supervisors from:', url)
        
        const response = await fetch(url, {
          credentials: 'include',
        })

        const result = await response.json()
        console.log('Supervisors response:', result)

        if (!response.ok) {
          throw new Error(result.message || 'Failed to fetch supervisors')
        }

        // Get the data array
        let supervisorsData = result.data || result.supervisors || []
        
        // Ensure it's an array
        if (!Array.isArray(supervisorsData)) {
          supervisorsData = supervisorsData ? [supervisorsData] : []
        }
        
        console.log(`Found ${supervisorsData.length} supervisors`)

        set({ 
          supervisors: supervisorsData,
          isLoading: false 
        })
      } catch (error: any) {
        console.error('[FETCH_AVAILABLE_SUPERVISORS_ERROR]', error)
        set({ 
          supervisors: [],
          isLoading: false, 
          error: error.message || 'Failed to fetch supervisors'
        })
      }
    },

    clearError: () => set({ error: null }),
  })
)

// Selector hooks
export const useAvailableSupervisors = () => useSupervisorForStudentStore((state) => state.supervisors)
export const useSupervisorsLoading = () => useSupervisorForStudentStore((state) => state.isLoading)
export const useSupervisorsError = () => useSupervisorForStudentStore((state) => state.error)