// types/supervisor.ts
export interface Supervisor {
  id: string
  fullName: string
  email: string
  phone?: string | null
  staffNumber?: string | null
  faculty?: string | null
  avatar?: string | null
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED'
  departmentId: string
  department?: {
    id: string
    name: string
    code: string
    faculty: string
    maxStudents: number
  }
  institutionId: string
  institution?: {
    id: string
    name: string
    code: string
    slug: string
  }
  students: StudentSummary[]
  studentCount: number
  approvedTopics: number
  maxCapacity: number
  createdAt: string
  updatedAt: string
}

export interface StudentSummary {
  id: string
  fullName: string
  email: string
  matricNumber?: string | null
  program?: Program | null
}

export interface CreateSupervisorData {
  fullName: string
  email: string
  staffNumber: string
  phone?: string
  specialization?: string
  departmentId: string
  institutionId: string
}

export interface UpdateSupervisorData extends Partial<CreateSupervisorData> {
  status?: 'ACTIVE' | 'INACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED'
  avatar?: string | null
}

export interface SupervisorFilters {
  departmentId?: string
  status?: string
  search?: string
}

export interface SupervisorResponse {
  success: boolean
  data?: Supervisor
  supervisors?: Supervisor[]
  message?: string
  error?: string
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// From schema
export type Program = 'BSC' | 'MSC' | 'PHD'
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED'