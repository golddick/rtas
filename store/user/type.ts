// types/user.ts
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'HOD' | 'SUPERVISOR' | 'STUDENT'
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED'
export type Program = 'BSC' | 'MSC' | 'PHD'
export interface User {
  id: string
  email: string
  registrationEmail: string
  additionalEmail?: string | null
  fullName: string
  phone?: string | null
  role: UserRole
  avatar?: string | null
  status: UserStatus
  emailVerified: boolean
  institutionId?: string | null
  departmentId?: string | null
  supervisorDepartmentId?: string | null
  matricNumber?: string | null
  staffNumber?: string | null
  program?: Program | null
  supervisorId?: string | null
  createdAt: string
  updatedAt: string

  // Relations
  institution?: {
    id: string
    name: string
    code: string
    slug?: string
  }
  department?: {
    id: string
    name: string
    code: string
  }
  supervisorDepartment?: {
    id: string
    name: string
    code: string
  }
  supervisor?: {
    id: string
    fullName: string
    email: string
  }
}

export interface CreateUserData {
  email: string
  fullName: string
  password: string
  role: UserRole
  phone?: string
  institutionId: string
  departmentId?: string
  supervisorDepartmentId?: string
  // Student specific
  matricNumber?: string
  program?: Program
  // Staff specific
  staffNumber?: string
}

export interface UpdateUserData extends Partial<CreateUserData> {
  status?: UserStatus
  emailVerified?: boolean
  supervisorId?: string | null
}

export interface UserFilters {
  role?: UserRole | 'all'
  status?: UserStatus | 'all'
  institutionId?: string
  departmentId?: string
  search?: string
}

export interface UserResponse {
  success: boolean
  data?: User
  users?: User[]
  message?: string
  error?: string
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}