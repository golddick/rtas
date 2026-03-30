// store/admin/institutionStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CreateInstitutionData, Institution, InstitutionResponse, UpdateInstitutionData } from './type/institution'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || ''

interface InstitutionState {
  // State
  institutions: Institution[]
  currentInstitution: Institution | null
  isLoading: boolean
  error: string | null
  totalCount: number

  // Actions
  fetchInstitutions: () => Promise<void>
  fetchInstitution: (id: string) => Promise<void>
  createInstitution: (data: CreateInstitutionData) => Promise<Institution>
  updateInstitution: (id: string, data: UpdateInstitutionData) => Promise<Institution>
  deleteInstitution: (id: string) => Promise<void>
  clearError: () => void
  clearCurrent: () => void
}

export const useInstitutionStore = create<InstitutionState>()(
  persist(
    (set, get) => ({
      // Initial state
      institutions: [],
      currentInstitution: null,
      isLoading: false,
      error: null,
      totalCount: 0,

      // Fetch all institutions
      fetchInstitutions: async () => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch(`${API_BASE}/api/admin/institutions`, {
            credentials: 'include',
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.message || 'Failed to fetch institutions')
          }

          set({ 
            institutions: result.data || [],
            totalCount: result.data?.length || 0,
            isLoading: false 
          })
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to fetch institutions'
          })
        }
      },

      // Fetch single institution
      fetchInstitution: async (id: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch(`${API_BASE}/api/admin/institutions/${id}`, {
            credentials: 'include',
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.message || 'Failed to fetch institution')
          }

          set({ 
            currentInstitution: result.data,
            isLoading: false 
          })
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to fetch institution'
          })
        }
      },

      // Create institution
      createInstitution: async (data: CreateInstitutionData) => {
        set({ isLoading: true, error: null })
        
        try {

            const cleanData = {
            name: data.name,
            code: data.code,
            description: data.description || undefined,
            address: data.address || undefined,
            website: data.website || undefined,
            logoUrl: data.logoUrl || undefined,
            }

          const response = await fetch(`${API_BASE}/api/admin/institutions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(cleanData),
            credentials: 'include',
          })

          const result: InstitutionResponse = await response.json()

          if (!response.ok) {
            throw new Error(result.message || result.error || 'Failed to create institution')
          }

          // Add to list
          if (result.data) {
            set({ 
              institutions: [result.data, ...get().institutions],
              isLoading: false 
            })
          }

          return result.data!
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to create institution'
          })
          throw error
        }
      },

      // Update institution
      updateInstitution: async (id: string, data: UpdateInstitutionData) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch(`${API_BASE}/api/admin/institutions/${id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
            credentials: 'include',
          })

          const result: InstitutionResponse = await response.json()

          if (!response.ok) {
            throw new Error(result.message || result.error || 'Failed to update institution')
          }

          // Update in list
          if (result.data) {
            set({ 
              institutions: get().institutions.map(inst => 
                inst.id === id ? result.data! : inst
              ),
              currentInstitution: result.data,
              isLoading: false 
            })
          }

          return result.data!
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to update institution'
          })
          throw error
        }
      },

      // Delete institution
      deleteInstitution: async (id: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch(`${API_BASE}/api/admin/institutions/${id}`, {
            method: 'DELETE',
            credentials: 'include',
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.message || 'Failed to delete institution')
          }

          // Remove from list
          set({ 
            institutions: get().institutions.filter(inst => inst.id !== id),
            isLoading: false 
          })
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to delete institution'
          })
          throw error
        }
      },

      // Clear error
      clearError: () => set({ error: null }),

      // Clear current institution
      clearCurrent: () => set({ currentInstitution: null }),
    }),
    {
      name: 'institution-storage',
      partialize: (state) => ({ 
        institutions: state.institutions,
        totalCount: state.totalCount
      }),
    }
  )
)

// Selector hooks
export const useInstitutions = () => useInstitutionStore((state) => state.institutions)
export const useCurrentInstitution = () => useInstitutionStore((state) => state.currentInstitution)
export const useInstitutionLoading = () => useInstitutionStore((state) => state.isLoading)
export const useInstitutionError = () => useInstitutionStore((state) => state.error)