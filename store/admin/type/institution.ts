// types/institution.ts
export type InstitutionStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'

export interface Institution {
  id: string
  name: string
  code: string
  slug: string
  description?: string | null
  address?: string | null
  website?: string | null
  logoUrl?: string | null
  status: InstitutionStatus
  createdAt: string
  updatedAt: string
  
  // Stats (optional, for UI)
  departmentCount?: number
  userCount?: number
  proposalCount?: number
  departments?: InstitutionDepartment[]
}

export interface InstitutionDepartment {
  id: string
  name: string
  code: string
  faculty: string
  description?: string | null
  maxStudents: number
  hodId?: string | null
  hod?: {
    id: string
    fullName: string
    email: string
  } | null
  facultyCount?: number
  studentCount?: number
  proposalCount?: number
  status?: string
  approvalRate?: string
}

export interface CreateInstitutionData {
  name: string
  code: string
  description?: string
  address?: string
  website?: string
  logoUrl?: string
}

export interface UpdateInstitutionData extends Partial<CreateInstitutionData> {
  status?: InstitutionStatus
}

export interface InstitutionResponse {
  success: boolean
  data?: Institution
  institutions?: Institution[]
  message?: string
  error?: string
}