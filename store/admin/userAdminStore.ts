// store/admin/userAdminStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CreateUserData, UpdateUserData, User, UserFilters, UserResponse, UserStatus } from '../user/type'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || ''

interface UserAdminState {
  // State
  users: User[]
  currentUser: User | null
  isLoading: boolean
  error: string | null
  totalCount: number
  filters: UserFilters

  // Actions
  fetchUsers: (filters?: UserFilters) => Promise<void>
  fetchUser: (id: string) => Promise<void>
  createUser: (data: CreateUserData) => Promise<User>
  updateUser: (id: string, data: UpdateUserData) => Promise<User>
  deleteUser: (id: string) => Promise<void>
  toggleUserStatus: (id: string, currentStatus: UserStatus) => Promise<User>
  resetPassword: (id: string) => Promise<{ tempPassword: string }>
  setFilters: (filters: Partial<UserFilters>) => void
  clearFilters: () => void
  clearError: () => void
  clearCurrent: () => void
}

export const useUserAdminStore = create<UserAdminState>()(
  persist(
    (set, get) => ({
      // Initial state
      users: [],
      currentUser: null,
      isLoading: false,
      error: null,
      totalCount: 0,
      filters: {
        role: 'all',
        status: 'all',
        search: ''
      },

      // Fetch all users with filters
      fetchUsers: async (filters?: UserFilters) => {
        set({ isLoading: true, error: null })
        
        try {
          // Merge existing filters with new filters
          const currentFilters = get().filters
          const mergedFilters = { ...currentFilters, ...filters }
          
          // Build query string
          const queryParams = new URLSearchParams()
          if (mergedFilters.role && mergedFilters.role !== 'all') {
            queryParams.append('role', mergedFilters.role)
          }
          if (mergedFilters.status && mergedFilters.status !== 'all') {
            queryParams.append('status', mergedFilters.status)
          }
          if (mergedFilters.institutionId) {
            queryParams.append('institutionId', mergedFilters.institutionId)
          }
          if (mergedFilters.departmentId) {
            queryParams.append('departmentId', mergedFilters.departmentId)
          }
          if (mergedFilters.search) {
            queryParams.append('search', mergedFilters.search)
          }

          const url = `${API_BASE}/api/admin/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
          
          const response = await fetch(url, {
            credentials: 'include',
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.message || 'Failed to fetch users')
          }

          set({ 
            users: result.data || [],
            totalCount: result.pagination?.total || result.data?.length || 0,
            filters: mergedFilters,
            isLoading: false 
          })
        } catch (error: any) {
          console.error('[FETCH_USERS_ERROR]', error)
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to fetch users'
          })
        }
      },

      // Fetch single user
      fetchUser: async (id: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch(`${API_BASE}/api/admin/users/${id}`, {
            credentials: 'include',
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.message || 'Failed to fetch user')
          }

          set({ 
            currentUser: result.data,
            isLoading: false 
          })
        } catch (error: any) {
          console.error('[FETCH_USER_ERROR]', error)
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to fetch user'
          })
        }
      },

      // Create user
      createUser: async (data: CreateUserData) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch(`${API_BASE}/api/admin/users`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
            credentials: 'include',
          })

          const result: UserResponse = await response.json()

          if (!response.ok) {
            throw new Error(result.message || result.error || 'Failed to create user')
          }

          // Add to list if it exists
          if (result.data) {
            set({ 
              users: [result.data, ...get().users],
              isLoading: false 
            })
          }

          return result.data!
        } catch (error: any) {
          console.error('[CREATE_USER_ERROR]', error)
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to create user'
          })
          throw error
        }
      },

      // Update user
      updateUser: async (id: string, data: UpdateUserData) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch(`${API_BASE}/api/admin/users/${id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
            credentials: 'include',
          })

          const result: UserResponse = await response.json()

          if (!response.ok) {
            throw new Error(result.message || result.error || 'Failed to update user')
          }

          // Update in list
          if (result.data) {
            set({ 
              users: get().users.map(user => 
                user.id === id ? result.data! : user
              ),
              currentUser: result.data,
              isLoading: false 
            })
          }

          return result.data!
        } catch (error: any) {
          console.error('[UPDATE_USER_ERROR]', error)
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to update user'
          })
          throw error
        }
      },

      // Delete user
      deleteUser: async (id: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch(`${API_BASE}/api/admin/users/${id}`, {
            method: 'DELETE',
            credentials: 'include',
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.message || 'Failed to delete user')
          }

          // Remove from list
          set({ 
            users: get().users.filter(user => user.id !== id),
            isLoading: false 
          })
        } catch (error: any) {
          console.error('[DELETE_USER_ERROR]', error)
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to delete user'
          })
          throw error
        }
      },

      // Toggle user status (Active/Inactive)
      toggleUserStatus: async (id: string, currentStatus: UserStatus) => {
        set({ isLoading: true, error: null })
        
        try {
          const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
          
          const response = await fetch(`${API_BASE}/api/admin/users/${id}/status`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: newStatus }),
            credentials: 'include',
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.message || 'Failed to update user status')
          }

          // Update in list
          if (result.data) {
            set({ 
              users: get().users.map(user => 
                user.id === id ? result.data! : user
              ),
              isLoading: false 
            })
          }

          return result.data!
        } catch (error: any) {
          console.error('[TOGGLE_USER_STATUS_ERROR]', error)
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to update user status'
          })
          throw error
        }
      },

      // Reset password
      resetPassword: async (id: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch(`${API_BASE}/api/admin/users/${id}/reset-password`, {
            method: 'POST',
            credentials: 'include',
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.message || 'Failed to reset password')
          }

          set({ isLoading: false })
          
          return { tempPassword: result.tempPassword }
        } catch (error: any) {
          console.error('[RESET_PASSWORD_ERROR]', error)
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to reset password'
          })
          throw error
        }
      },

      // Set filters
      setFilters: (filters: Partial<UserFilters>) => {
        set({ filters: { ...get().filters, ...filters } })
      },

      // Clear filters
      clearFilters: () => {
        set({ 
          filters: {
            role: 'all',
            status: 'all',
            search: ''
          }
        })
      },

      // Clear error
      clearError: () => set({ error: null }),

      // Clear current user
      clearCurrent: () => set({ currentUser: null }),
    }),
    {
      name: 'user-admin-storage',
      partialize: (state) => ({ 
        filters: state.filters
      }),
    }
  )
)

// Selector hooks
export const useAdminUsers = () => useUserAdminStore((state) => state.users)
export const useCurrentAdminUser = () => useUserAdminStore((state) => state.currentUser)
export const useUserAdminLoading = () => useUserAdminStore((state) => state.isLoading)
export const useUserAdminError = () => useUserAdminStore((state) => state.error)
export const useUserAdminFilters = () => useUserAdminStore((state) => state.filters)