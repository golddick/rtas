// types/dashboard.ts
export interface DashboardStats {
  totalUsers: number
  totalStudents: number
  totalSupervisors: number
  totalHODs: number
  totalAdmins: number
  totalInstitutions: number
  totalDepartments: number
  totalProposals: number
  pendingProposals: number
  approvedProposals: number
  rejectedProposals: number
  systemUptime: number
  activeAlerts: number
  recentActivities: RecentActivity[]
  systemStatus: SystemService[]
  userDistribution: UserDistribution[]
  departmentPerformance: DepartmentPerformance[]
  quickStats: QuickStats
}

export interface RecentActivity {
  id: string
  action: string
  description: string
  user: string
  time: string
  type: 'user_create' | 'user_update' | 'dept_create' | 'dept_update' | 'proposal_approve' | 'system_backup' | 'security_audit'
}

export interface SystemService {
  name: string
  status: 'online' | 'offline' | 'degraded'
  uptime: string
  latency?: number
}

export interface UserDistribution {
  role: string
  count: number
  percentage: number
}

export interface DepartmentPerformance {
  id: string
  name: string
  code: string
  proposals: number
  approved: number
  rate: string
  facultyCount: number
  studentCount: number
}

export interface QuickStats {
  newUsersToday: number
  newProposalsToday: number
  activeSessions: number
  storageUsed: string
  backupSize: string
  lastBackup: string
}

export interface DashboardResponse {
  success: boolean
  data?: DashboardStats
  message?: string
  error?: string
}