// store/admin/departmentStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CreateDepartmentData, Department, UpdateDepartmentData } from './type/department'
import { Institution } from './type/institution'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || ''

export interface DepartmentState {
  // State
  departments: Department[]
  currentDepartment: Department | null
  isLoading: boolean
  error: string | null
  totalCount: number
  availableInstitutions: Institution[]

  // Actions
  fetchDepartments: () => Promise<void>
  fetchDepartment: (id: string) => Promise<void>
  fetchAvailableInstitutions: () => Promise<void>
  createDepartment: (data: CreateDepartmentData, sendInvite?: boolean, hodEmail?: string) => Promise<Department>
  updateDepartment: (id: string, data: UpdateDepartmentData) => Promise<Department>
  deleteDepartment: (id: string) => Promise<void>
  sendHODInvite: (departmentId: string, hodEmail: string) => Promise<{ success: boolean; message: string }>
  clearError: () => void
  clearCurrent: () => void
}

export const useDepartmentStore = create<DepartmentState>()(
  persist(
    (set, get) => ({
      // Initial state
      departments: [],
      currentDepartment: null,
      isLoading: false,
      error: null,
      totalCount: 0,
      availableInstitutions: [],

      // Fetch all departments
      fetchDepartments: async () => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch(`${API_BASE}/api/admin/departments`, {
            credentials: 'include',
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.message || 'Failed to fetch departments')
          }

          set({ 
            departments: result.data || [],
            totalCount: result.data?.length || 0,
            isLoading: false 
          })
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to fetch departments'
          })
        }
      },

      // Fetch single department
      fetchDepartment: async (id: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch(`${API_BASE}/api/admin/departments/${id}`, {
            credentials: 'include',
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.message || 'Failed to fetch department')
          }

          set({ 
            currentDepartment: result.data,
            isLoading: false 
          })
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to fetch department'
          })
        }
      },

      // Fetch available institutions for dropdown
      fetchAvailableInstitutions: async () => {
        try {
          const response = await fetch(`${API_BASE}/api/admin/institutions`, {
            credentials: 'include',
          })

          const result = await response.json()

          if (response.ok) {
            set({ availableInstitutions: result.data || [] })
          }
        } catch (error) {
          console.error('Failed to fetch institutions:', error)
        }
      },

      // Create department
      createDepartment: async (data: CreateDepartmentData, sendInvite = false, hodEmail = '') => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch(`${API_BASE}/api/admin/departments`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ...data, sendInvite, hodEmail }),
            credentials: 'include',
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.message || result.error || 'Failed to create department')
          }

          // Add to list
          if (result.data) {
            set({ 
              departments: [result.data, ...get().departments],
              isLoading: false 
            })
          }

          return result.data!
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to create department'
          })
          throw error
        }
      },

      // Update department
      updateDepartment: async (id: string, data: UpdateDepartmentData) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch(`${API_BASE}/api/admin/departments/${id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
            credentials: 'include',
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.message || result.error || 'Failed to update department')
          }

          // Update in list
          if (result.data) {
            set({ 
              departments: get().departments.map(dept => 
                dept.id === id ? result.data! : dept
              ),
              currentDepartment: result.data,
              isLoading: false 
            })
          }

          return result.data!
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to update department'
          })
          throw error
        }
      },

      // Delete department
      deleteDepartment: async (id: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch(`${API_BASE}/api/admin/departments/${id}`, {
            method: 'DELETE',
            credentials: 'include',
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.message || 'Failed to delete department')
          }

          // Remove from list
          set({ 
            departments: get().departments.filter(dept => dept.id !== id),
            isLoading: false 
          })
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to delete department'
          })
          throw error
        }
      },

      // Send HOD invitation
      sendHODInvite: async (departmentId: string, hodEmail: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch(`${API_BASE}/api/admin/departments/${departmentId}/invite`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: hodEmail }),
            credentials: 'include',
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.message || 'Failed to send invitation')
          }

          set({ isLoading: false })
          return result
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to send invitation'
          })
          throw error
        }
      },

      // Clear error
      clearError: () => set({ error: null }),

      // Clear current department
      clearCurrent: () => set({ currentDepartment: null }),
    }),
    {
      name: 'department-storage',
      partialize: (state) => ({ 
        departments: state.departments,
        totalCount: state.totalCount
      }),
    }
  )
)

// Selector hooks
export const useDepartments = () => useDepartmentStore((state) => state.departments)
export const useCurrentDepartment = () => useDepartmentStore((state) => state.currentDepartment)
export const useDepartmentLoading = () => useDepartmentStore((state) => state.isLoading)
export const useDepartmentError = () => useDepartmentStore((state) => state.error)
export const useAvailableInstitutions = () => useDepartmentStore((state) => state.availableInstitutions)