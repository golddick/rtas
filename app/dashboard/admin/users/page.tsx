'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/card-component'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Search, 
  AlertCircle,
  RefreshCw,
  Lock,
  Power,
} from 'lucide-react'
import { useUserAdminStore } from '@/store/admin/userAdminStore'
import { ViewStudentModal } from '@/components/modals/view-student-modal'
import { EditUserModal } from '@/components/modals/edit-user-modal'

const getRoleColor = (role: string) => {
  switch (role) {
    case 'SUPERVISOR':
      return 'bg-blue-100 text-blue-700'
    case 'HOD':
      return 'bg-purple-100 text-purple-700'
    case 'STUDENT':
      return 'bg-green-100 text-green-700'
    case 'ADMIN':
      return 'bg-red-100 text-red-700'
    case 'SUPER_ADMIN':
      return 'bg-orange-100 text-orange-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

const formatRole = (role: string) => {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'Super Admin'
    case 'HOD':
      return 'HOD'
    default:
      return role.charAt(0) + role.slice(1).toLowerCase()
  }
}

export default function UsersPage() {
  const { 
    users, 
    fetchUsers, 
    toggleUserStatus,
    resetPassword,
    deleteUser,
    updateUser,
    isLoading, 
    error,
    filters,
    setFilters,
    clearError 
  } = useUserAdminStore()

  const [searchTerm, setSearchTerm] = useState(filters.search || '')
  const [selectedRole, setSelectedRole] = useState(filters.role || 'all')
  const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all')
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [tempPassword, setTempPassword] = useState<string | null>(null)

  // Fetch users on mount and when filters change
  useEffect(() => {
    fetchUsers({
      role: selectedRole as any,
      status: selectedStatus as any,
      search: searchTerm
    })
  }, [selectedRole, selectedStatus])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters({ search: searchTerm })
      fetchUsers({
        role: selectedRole as any,
        status: selectedStatus as any,
        search: searchTerm
      })
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const role = e.target.value as any
    setSelectedRole(role)
    setFilters({ role })
  }

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const status = e.target.value as any
    setSelectedStatus(status)
    setFilters({ status })
  }

  const handleRefresh = () => {
    fetchUsers({
      role: selectedRole as any,
      status: selectedStatus as any,
      search: searchTerm
    })
  }

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    setActionLoading(userId)
    try {
      await toggleUserStatus(userId, currentStatus as any)
    } catch (error) {
      // Error handled by store
    } finally {
      setActionLoading(null)
    }
  }

  const handleResetPassword = async (userId: string, userEmail: string) => {
    if (!confirm(`Reset password for ${userEmail}?`)) return
    
    setActionLoading(userId)
    try {
      const result = await resetPassword(userId)
      if (result.tempPassword) {
        setTempPassword(result.tempPassword)
        setTimeout(() => setTempPassword(null), 5000)
      }
    } catch (error) {
      // Error handled by store
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) return
    
    setActionLoading(userId)
    try {
      await deleteUser(userId)
    } catch (error) {
      // Error handled by store
    } finally {
      setActionLoading(null)
    }
  }

  const handleEditUser = (user: any) => {
    setEditingUser(user)
  }

  const handleUpdateUser = async (userId: string, data: any) => {
    setActionLoading(userId)
    try {
      await updateUser(userId, data)
      setEditingUser(null)
    } catch (error) {
      // Error handled by store
    } finally {
      setActionLoading(null)
    }
  }

  const roles = ['all', 'STUDENT', 'SUPERVISOR', 'HOD']
  const statuses = ['all', 'ACTIVE', 'INACTIVE', 'PENDING']

  if (isLoading && users.length === 0) {
    return (
      <DashboardLayout>
        <main className="flex-1 overflow-hidden">
          <DashboardHeader title="User Management" />
          <div className="p-6 flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </main>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <main className="flex-1 overflow-hidden">
        <DashboardHeader
          title="User Management"
          subtitle="Manage all users and their roles in the system"
        />

        <div className="p-6 space-y-6 animate-fade-in">
          {/* Temp Password Display */}
          {tempPassword && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-start gap-3">
              <div className="text-green-500">🔑</div>
              <div>
                <p className="text-sm font-medium text-green-600">Temporary Password Generated</p>
                <p className="text-xs text-green-600 mt-1">
                  Temp password: <code className="bg-green-100 px-2 py-1 rounded">{tempPassword}</code>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  In production, this would be emailed to the user.
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="text-destructive flex-shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Header with Add Button and Refresh */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                All Users ({users.length})
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Manage user accounts, roles, and permissions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="gap-2"
                disabled={isLoading}
              >
                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                Refresh
              </Button>
              <Button 
                className="gap-2 animate-scale-in" 
                onClick={() => alert('Open Create User Dialog')}
              >
                <Plus size={18} />
                Add User
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <Card className="animate-slide-up">
            <CardContent className="p-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  type="text"
                  placeholder="Search by name, email, or ID..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Role</label>
                  <select
                    value={selectedRole}
                    onChange={handleRoleChange}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {roles.map(role => (
                      <option key={role} value={role}>
                        {role === 'all' ? 'All Roles' : formatRole(role)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Status</label>
                  <select
                    value={selectedStatus}
                    onChange={handleStatusChange}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {statuses.map(status => (
                      <option key={status} value={status}>
                        {status === 'all' ? 'All Statuses' : status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary">
                    <th className="text-left px-6 py-4 font-semibold text-foreground">User</th>
                    <th className="text-left px-6 py-4 font-semibold text-foreground">Role</th>
                    <th className="text-left px-6 py-4 font-semibold text-foreground">Department</th>
                    <th className="text-left px-6 py-4 font-semibold text-foreground">ID</th>
                    <th className="text-left px-6 py-4 font-semibold text-foreground">Status</th>
                    <th className="text-left px-6 py-4 font-semibold text-foreground">Verified</th>
                    <th className="text-left px-6 py-4 font-semibold text-foreground">Joined</th>
                    <th className="text-left px-6 py-4 font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-border hover:bg-secondary transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">
                            {user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{user.fullName}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                          {formatRole(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {user.department?.name || user.supervisorDepartment?.name || '-'}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-xs">
                        {user.id }
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-2 text-xs font-medium ${
                          user.status === 'ACTIVE' ? 'text-green-700' : 
                          user.status === 'INACTIVE' ? 'text-gray-600' : 'text-yellow-700'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${
                            user.status === 'ACTIVE' ? 'bg-green-500' : 
                            user.status === 'INACTIVE' ? 'bg-gray-400' : 'bg-yellow-500'
                          }`}></span>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 text-xs ${
                          user.emailVerified ? 'text-green-600' : 'text-gray-400'
                        }`}>
                          {user.emailVerified ? '✓' : '✗'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-xs">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setSelectedUser(user)}
                            title="View"
                            disabled={actionLoading === user.id}
                          >
                            <Eye size={14} />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEditUser(user)}
                            title="Edit"
                            disabled={actionLoading === user.id}
                          >
                            <Edit size={14} />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleToggleStatus(user.id, user.status)}
                            title={user.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                            disabled={actionLoading === user.id}
                          >
                            <Power size={14} className={user.status === 'ACTIVE' ? 'text-green-600' : 'text-gray-400'} />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleResetPassword(user.id, user.email)}
                            title="Reset Password"
                            disabled={actionLoading === user.id}
                          >
                            <Lock size={14} />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDeleteUser(user.id, user.fullName)}
                            title="Delete"
                            disabled={actionLoading === user.id}
                            className="hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* View User Modal */}
        {selectedUser && (
          <ViewStudentModal
            isOpen={!!selectedUser}
            onClose={() => setSelectedUser(null)}
            onMessage={() => alert(`Message ${selectedUser.fullName}`)}
            student={{
              id: parseInt(selectedUser.id),
              name: selectedUser.fullName,
              studentId: selectedUser.matricNumber || selectedUser.staffNumber || selectedUser.id,
              email: selectedUser.email,
              phone: selectedUser.phone || undefined,
              department: selectedUser.department?.name || selectedUser.supervisorDepartment?.name,
              joinDate: new Date(selectedUser.createdAt).toLocaleDateString(),
              proposalStatus: 'Under Review',
              progress: 75,
              specialization: selectedUser.program || undefined,
              bio: `${selectedUser.role} in ${selectedUser.department?.name || 'department'}`,
            }}
          />
        )}

        {/* Edit User Modal */}
        {editingUser && (
          <EditUserModal
            isOpen={!!editingUser}
            onClose={() => setEditingUser(null)}
            onUpdate={handleUpdateUser}
            user={editingUser}
            isLoading={actionLoading === editingUser.id}
          />
        )}
      </main>
    </DashboardLayout>
  )
}