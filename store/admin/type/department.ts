// types/department.ts
export interface Department {
  id: string
  name: string
  code: string
  faculty: string
  description?: string | null
  maxStudents: number
  institutionId: string
  hodId?: string | null
  createdAt: string
  updatedAt: string
  
  // Relations (optional)
  institution?: {
    id: string
    name: string
    code: string
  }
  hod?: {
    id: string
    fullName: string
    email: string
  } | null
  
  // Stats (optional)
  supervisorCount?: number
  studentCount?: number
  proposalCount?: number
  approvalRate?: string
  status?: string
}

export interface CreateDepartmentData {
  name: string
  code: string
  faculty: string
  description: string
  maxStudents: number
  institutionId: string
}

export interface UpdateDepartmentData extends Partial<CreateDepartmentData> {
  hodId?: string | null
  status?: string
}

export interface DepartmentResponse {
  success: boolean
  data?: Department
  departments?: Department[]
  message?: string
  error?: string
}

export interface HODInvitation {
  id: string
  email: string
  code: string
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED'
  expiresAt: string
  createdAt: string
  departmentId: string
  institutionId: string
  invitedById: string
  invitedUserId?: string | null
}

export interface HODInvitationData {
  email: string
  departmentId: string
  departmentName: string
  institutionName: string
  expiresIn?: number
}