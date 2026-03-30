// store/hod/student/studentStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { 
  Student, 
  StudentFilters, 
  AllocateSupervisorData, 
  SmartAllocationData,
  StudentResponse 
} from './types/types'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || ''

interface StudentState {
  // State
  students: Student[]
  currentStudent: Student | null
  unassignedCount: number
  isLoading: boolean
  error: string | null
  totalCount: number
  filters: StudentFilters

  // Actions
  fetchStudents: (departmentId: string, filters?: StudentFilters) => Promise<void>
  fetchStudent: (id: string) => Promise<void>
  allocateSupervisor: (data: AllocateSupervisorData) => Promise<void>
  smartAllocate: (data: SmartAllocationData) => Promise<{ allocated: number; failed: number }>
  importStudents: (file: File, departmentId: string, institutionId: string) => Promise<{ success: number; failed: number }>
  setFilters: (filters: Partial<StudentFilters>) => void
  clearFilters: () => void
  clearError: () => void
  clearCurrent: () => void
}

export const useStudentStore = create<StudentState>()(
  persist(
    (set, get) => ({
      // Initial state
      students: [],
      currentStudent: null,
      unassignedCount: 0,
      isLoading: false,
      error: null,
      totalCount: 0,
      filters: {
        search: ''
      },

      // Fetch all students in a department
      fetchStudents: async (departmentId: string, filters?: StudentFilters) => {
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
          // Don't send supervisorId if it's 'all'
          if (mergedFilters.supervisorId && mergedFilters.supervisorId !== 'all') {
            queryParams.append('supervisorId', mergedFilters.supervisorId)
          }
          if (mergedFilters.proposalStatus && mergedFilters.proposalStatus !== 'all') {
            queryParams.append('proposalStatus', mergedFilters.proposalStatus)
          }
          if (mergedFilters.search) {
            queryParams.append('search', mergedFilters.search)
          }

          const url = `${API_BASE}/api/hod/students?${queryParams.toString()}`
          
          console.log('Fetching students from:', url)
          
          const response = await fetch(url, {
            credentials: 'include',
          })

          const result: StudentResponse = await response.json()

          console.log('API Response:', result)

          if (!response.ok) {
            throw new Error(result.message || 'Failed to fetch students')
          }

          // Safely extract students array - handle both formats
          let studentsData = result.students || (result.data ? [result.data] : [])
          
          // If the first element is an array, flatten it
          if (studentsData.length === 1 && Array.isArray(studentsData[0])) {
            studentsData = studentsData[0]
          }
          
          // Filter out any undefined values and ensure type safety
          const validStudents: Student[] = studentsData.filter(
            (s): s is Student => s !== null && s !== undefined
          )
          const unassigned = validStudents.filter(s => !s.supervisorId).length || 0

          set({ 
            students: validStudents,
            totalCount: result.pagination?.total || validStudents.length || 0,
            unassignedCount: unassigned,
            filters: mergedFilters,
            isLoading: false 
          })
        } catch (error: any) {
          console.error('[FETCH_STUDENTS_ERROR]', error)
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to fetch students'
          })
        }
      },

      // Fetch single student
      fetchStudent: async (id: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch(`${API_BASE}/api/hod/students/${id}`, {
            credentials: 'include',
          })

          const result: StudentResponse = await response.json()

          if (!response.ok) {
            throw new Error(result.message || 'Failed to fetch student')
          }

          set({ 
            currentStudent: result.data || null,
            isLoading: false 
          })
        } catch (error: any) {
          console.error('[FETCH_STUDENT_ERROR]', error)
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to fetch student'
          })
        }
      },

      // Allocate supervisor to students
      allocateSupervisor: async (data: AllocateSupervisorData) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch(`${API_BASE}/api/hod/students/allocate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
            credentials: 'include',
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.message || 'Failed to allocate supervisor')
          }

          // Refresh the student list
          const currentFilters = get().filters
          const departmentId = currentFilters.departmentId
          if (departmentId) {
            await get().fetchStudents(departmentId, currentFilters)
          }

          set({ isLoading: false })
        } catch (error: any) {
          console.error('[ALLOCATE_SUPERVISOR_ERROR]', error)
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to allocate supervisor'
          })
          throw error
        }
      },

      // Smart auto-allocation
      smartAllocate: async (data: SmartAllocationData) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch(`${API_BASE}/api/hod/students/smart-allocate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
            credentials: 'include',
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.message || 'Failed to auto-allocate students')
          }

          // Refresh the student list
          const currentFilters = get().filters
          const departmentId = currentFilters.departmentId
          if (departmentId) {
            await get().fetchStudents(departmentId, currentFilters)
          }

          set({ isLoading: false })
          
          return {
            allocated: result.allocated || 0,
            failed: result.failed || 0
          }
        } catch (error: any) {
          console.error('[SMART_ALLOCATE_ERROR]', error)
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to auto-allocate students'
          })
          throw error
        }
      },

      // Import students from CSV
      importStudents: async (file: File, departmentId: string, institutionId: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const formData = new FormData()
          formData.append('file', file)
          formData.append('departmentId', departmentId)
          formData.append('institutionId', institutionId)

          const response = await fetch(`${API_BASE}/api/hod/students/import`, {
            method: 'POST',
            body: formData,
            credentials: 'include',
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.message || 'Failed to import students')
          }

          // Refresh the list after import
          await get().fetchStudents(departmentId, get().filters)

          set({ isLoading: false })
          
          return {
            success: result.successCount || 0,
            failed: result.failedCount || 0
          }
        } catch (error: any) {
          console.error('[IMPORT_STUDENTS_ERROR]', error)
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to import students'
          })
          throw error
        }
      },

      // Set filters
      setFilters: (filters: Partial<StudentFilters>) => {
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

      // Clear current student
      clearCurrent: () => set({ currentStudent: null }),
    }),
    {
      name: 'student-storage',
      partialize: (state) => ({ 
        filters: state.filters
      }),
    }
  )
)

// Selector hooks
export const useStudents = () => useStudentStore((state) => state.students)
export const useCurrentStudent = () => useStudentStore((state) => state.currentStudent)
export const useUnassignedCount = () => useStudentStore((state) => state.unassignedCount)
export const useStudentLoading = () => useStudentStore((state) => state.isLoading)
export const useStudentError = () => useStudentStore((state) => state.error)
export const useStudentFilters = () => useStudentStore((state) => state.filters)