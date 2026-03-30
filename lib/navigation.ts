// Navigation configuration for all routes
export const navigationRoutes = {
  // Landing & Auth
  landing: '/',
  login: '/login',
  register: '/register',

  // Student Dashboard
  student: {
    dashboard: '/dashboard/student',
    proposals: '/dashboard/student/proposals',
    supervisor: '/dashboard/student/supervisor',
    history: '/dashboard/student/history',
    messages: '/dashboard/student/messages',
  },

  // Supervisor Dashboard
  supervisor: {
    dashboard: '/dashboard/supervisor',
    students: '/dashboard/supervisor/students',
    proposals: '/dashboard/supervisor/proposals',
    approved: '/dashboard/supervisor/approved',
    messages: '/dashboard/supervisor/messages',
  },

  // HOD Dashboard
  hod: {
    dashboard: '/dashboard/hod',
    supervisors: '/dashboard/hod/supervisors',
    students: '/dashboard/hod/students',
    proposals: '/dashboard/hod/proposals',
    analytics: '/dashboard/hod/analytics',
    messages: '/dashboard/hod/messages',
  },

  // Admin Dashboard
  admin: {
    dashboard: '/dashboard/admin',
    users: '/dashboard/admin/users',
    departments: '/dashboard/admin/departments',
    logs: '/dashboard/admin/logs',
    settings: '/dashboard/admin/settings',
  },
}

// Button action handlers
export const handleNavigation = (path: string) => {
  if (typeof window !== 'undefined') {
    window.location.href = path
  }
}

export const handleAction = (action: string, context?: any) => {
  const actionMap: Record<string, (ctx?: any) => void> = {
    // Auth actions
    'auth.login': () => handleNavigation(navigationRoutes.login),
    'auth.register': () => handleNavigation(navigationRoutes.register),
    'auth.logout': () => alert('Logout - implement logout handler'),

    // Student actions
    'student.createProposal': () => alert('Open Create Proposal Modal'),
    'student.viewProposal': (ctx) => alert(`View proposal: ${ctx?.title}`),
    'student.requestSupervisor': () => alert('Open Request Supervisor Form'),
    'student.sendMessage': (ctx) => alert(`Message ${ctx?.name}`),

    // Supervisor actions
    'supervisor.reviewProposal': (ctx) => alert(`Review proposal: ${ctx?.title}`),
    'supervisor.approveTopic': (ctx) => alert(`Approve: ${ctx?.title}`),
    'supervisor.viewStudent': (ctx) => alert(`View student: ${ctx?.name}`),

    // HOD actions
    'hod.addSupervisor': () => alert('Open Add Supervisor Modal'),
    'hod.assignStudent': (ctx) => alert(`Assign supervisor to ${ctx?.name}`),
    'hod.viewAnalytics': () => alert('Open Analytics Dashboard'),

    // Admin actions
    'admin.createUser': () => alert('Open Create User Dialog'),
    'admin.manageRoles': (ctx) => alert(`Manage roles for ${ctx?.name}`),
    'admin.systemBackup': () => alert('Starting system backup...'),
  }

  const handler = actionMap[action]
  if (handler) {
    handler(context)
  } else {
    console.warn(`Action not found: ${action}`)
  }
}

// Role-based route access
export const roleRoutes = {
  student: [
    navigationRoutes.student.dashboard,
    navigationRoutes.student.proposals,
    navigationRoutes.student.supervisor,
    navigationRoutes.student.history,
    navigationRoutes.student.messages,
  ],
  supervisor: [
    navigationRoutes.supervisor.dashboard,
    navigationRoutes.supervisor.students,
    navigationRoutes.supervisor.proposals,
    navigationRoutes.supervisor.approved,
    navigationRoutes.supervisor.messages,
  ],
  hod: [
    navigationRoutes.hod.dashboard,
    navigationRoutes.hod.supervisors,
    navigationRoutes.hod.students,
    navigationRoutes.hod.proposals,
    navigationRoutes.hod.analytics,
    navigationRoutes.hod.messages,
  ],
  admin: [
    navigationRoutes.admin.dashboard,
    navigationRoutes.admin.users,
    navigationRoutes.admin.departments,
    navigationRoutes.admin.logs,
    navigationRoutes.admin.settings,
  ],
}
