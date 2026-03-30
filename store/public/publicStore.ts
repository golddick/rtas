// store/public/publicStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Institution {
  id: string
  name: string
  code: string
  slug?: string
}

export interface Department {
  id: string
  name: string
  code: string
  institutionId: string
}

interface PublicState {
  // State
  institutions: Institution[]
  departments: Department[]
  isLoading: boolean
  error: string | null

  // Actions
  fetchInstitutions: () => Promise<void>
  fetchDepartments: (institutionId?: string) => Promise<void>
  clearError: () => void
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || ''

export const usePublicStore = create<PublicState>()(
  persist(
    (set, get) => ({
      // Initial state
      institutions: [],
      departments: [],
      isLoading: false,
      error: null,

      // Fetch all active institutions
      fetchInstitutions: async () => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch(`${API_BASE}/api/public/institutions`)
          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.message || 'Failed to fetch institutions')
          }

          set({ 
            institutions: result.data || [],
            isLoading: false 
          })
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to fetch institutions'
          })
        }
      },

      // Fetch departments (optionally filtered by institution)
      fetchDepartments: async (institutionId?: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const url = institutionId 
            ? `${API_BASE}/api/public/departments?institutionId=${institutionId}`
            : `${API_BASE}/api/public/departments`
            
          const response = await fetch(url)
          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.message || 'Failed to fetch departments')
          }

          set({ 
            departments: result.data || [],
            isLoading: false 
          })
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to fetch departments'
          })
        }
      },

      // Clear error
      clearError: () => set({ error: null }),
    }),
    {
      name: 'public-storage',
      partialize: (state) => ({ 
        institutions: state.institutions,
        departments: state.departments
      }),
    }
  )
)

// Selector hooks
export const usePublicInstitutions = () => usePublicStore((state) => state.institutions)
export const usePublicDepartments = () => usePublicStore((state) => state.departments)
export const usePublicLoading = () => usePublicStore((state) => state.isLoading)
export const usePublicError = () => usePublicStore((state) => state.error)