// store/hod/types/types.ts

import { Program } from "@/lib/generated/prisma/enums"


export interface Student {
  id: string
  fullName: string
  email: string
  matricNumber?: string | null
  phone?: string | null
  program?: Program | null
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED'
  avatar?: string | null
  departmentId: string
  department?: {
    id: string
    name: string
    code: string
    faculty: string
  }
  institutionId: string
  institution?: {
    id: string
    name: string
    code: string
    slug: string
  }
  supervisorId?: string | null
  supervisor?: {
    id: string
    fullName: string
    email: string
    staffNumber?: string
  } | null
  proposal?: {
    id: string
    title: string
    status: string
    submittedDate?: string
  } | null
  proposalStatus: string
  projectPlan?: {
    id: string
    status: string
  } | null
  createdAt: string
  updatedAt: string
}

export interface StudentFilters {
  departmentId?: string
  status?: string
  supervisorId?: string
  proposalStatus?: string
  search?: string
}

export interface AllocateSupervisorData {
  studentIds: string[]
  supervisorId: string
}

export interface SmartAllocationData {
  studentIds: string[]
  preferences?: {
    supervisorId?: string
    departmentId?: string
  }
}

export interface StudentResponse {
  success: boolean
  data?: Student
  students?: Student[]
  message?: string
  error?: string
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

