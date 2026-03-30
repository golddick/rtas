'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
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
  Upload,
  Mail,
  Power,
  X
} from 'lucide-react'
import { ViewSupervisorModal } from '@/components/modals/view-supervisor-modal'
import { AddSupervisorModal } from '@/components/modals/add-supervisor-modal'
import { useSupervisorStore } from '@/store/hod/supervisor/supervisorStore'
import { useAuthStore } from '@/store/user/userStore'


export default function SupervisorsPage() {
  const params = useParams()
  const institutionSlug = params.institutionSlug as string
  const departmentCode = params.departmentCode as string

  const { user, isLoading: authLoading } = useAuthStore()

  const { 
    supervisors, 
    fetchSupervisors, 
    createSupervisor,
    updateSupervisor,
    deleteSupervisor,
    toggleSupervisorStatus,
    isLoading: storeLoading, 
    error,
    filters,
    setFilters,
    clearError 
  } = useSupervisorStore()

  const [showAddModal, setShowAddModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [selectedSupervisor, setSelectedSupervisor] = useState<any>(null)
  const [editingSupervisor, setEditingSupervisor] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState(filters.search || '')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [importFile, setImportFile] = useState<File | null>(null)

  // Get department ID from user based on role
  const departmentId = user?.role === 'HOD' 
    ? user?.department?.id 
    : user?.role === 'SUPERVISOR' 
      ? user?.supervisorDepartment?.id 
      : null

  const institutionId = user?.institution?.id

  // Verify URL matches user's department
  useEffect(() => {
    if (user && departmentId) {
      const userInstitutionSlug = user.institution?.slug
      const userDepartmentCode = user.role === 'HOD' 
        ? user.department?.code?.toLowerCase()
        : user.supervisorDepartment?.code?.toLowerCase()

      if (userInstitutionSlug !== institutionSlug || userDepartmentCode !== departmentCode) {
        // This should not happen as the middleware should handle it
        console.error('URL does not match user department')
      }
    }
  }, [user, institutionSlug, departmentCode, departmentId])

  // Fetch supervisors when we have department ID
  useEffect(() => {
    if (departmentId) {
      fetchSupervisors(departmentId, {
        search: searchTerm
      })
    }
  }, [departmentId, fetchSupervisors])

  // Debounce search
  useEffect(() => {
    if (!departmentId) return
    
    const timer = setTimeout(() => {
      setFilters({ search: searchTerm })
      fetchSupervisors(departmentId, {
        search: searchTerm
      })
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm, departmentId, fetchSupervisors, setFilters])


  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleRefresh = () => {
    if (departmentId) {
      fetchSupervisors(departmentId, {
        search: searchTerm
      })
    }
  }

  const handleAddSupervisor = async (data: any) => {
    if (!departmentId || !institutionId) {
      alert('Missing department or institution information')
      return
    }

    try {
      await createSupervisor({
        fullName: data.name,
        email: data.email,
        staffNumber: data.staffNumber || `SUP-${Date.now()}`,
        phone: data.phone,
        specialization: data.specialization,
        departmentId,
        institutionId,
      })
      setShowAddModal(false)
    } catch (error) {
      // Error handled by store
    }
  }

  const handleUpdateSupervisor = async (id: string, data: any) => {
    setActionLoading(id)
    try {
      await updateSupervisor(id, data)
      setEditingSupervisor(null)
    } catch (error) {
      // Error handled by store
    } finally {
      setActionLoading(null)
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    setActionLoading(id)
    try {
      await toggleSupervisorStatus(id, currentStatus)
    } catch (error) {
      // Error handled by store
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteSupervisor = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) return
    
    setActionLoading(id)
    try {
      await deleteSupervisor(id)
    } catch (error) {
      // Error handled by store
    } finally {
      setActionLoading(null)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImportFile(e.target.files[0])
    }
  }

  const handleImport = async () => {
    if (!importFile) {
      alert('Please select a CSV file to import')
      return
    }
    
    setShowImportModal(false)
    // Import functionality would go here
    alert('Import feature coming soon')
    setImportFile(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-700'
      case 'INACTIVE': return 'bg-gray-100 text-gray-700'
      case 'PENDING_VERIFICATION': return 'bg-yellow-100 text-yellow-700'
      case 'SUSPENDED': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Active'
      case 'INACTIVE': return 'Inactive'
      case 'PENDING_VERIFICATION': return 'Pending'
      case 'SUSPENDED': return 'Suspended'
      default: return status
    }
  }

  // Combine loading states
  const isLoading = authLoading || storeLoading

  if (authLoading) {
    return (
      <DashboardLayout>
        <main className="flex-1 overflow-hidden">
          <DashboardHeader title="Manage Supervisors" />
          <div className="p-6 flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </main>
      </DashboardLayout>
    )
  }

  if (!user) {
    return (
      <DashboardLayout>
        <main className="flex-1 overflow-hidden">
          <DashboardHeader title="Manage Supervisors" />
          <div className="p-6">
            <Card>
              <CardContent className="p-12 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
                <h3 className="text-lg font-semibold text-foreground">Not Authenticated</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Please log in to access this page.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </DashboardLayout>
    )
  }

  if (!departmentId) {
    return (
      <DashboardLayout>
        <main className="flex-1 overflow-hidden">
          <DashboardHeader title="Manage Supervisors" />
          <div className="p-6">
            <Card>
              <CardContent className="p-12 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
                <h3 className="text-lg font-semibold text-foreground">Department Not Found</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  You don't have a department assigned to your account.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <main className="flex-1 overflow-hidden">
        <DashboardHeader
          title="Manage Supervisors"
          subtitle={`${user.institution?.name || 'Institution'} • ${user.role === 'HOD' ? user.department?.name : user.supervisorDepartment?.name || 'Department'}`}
        />

        <div className="p-6 space-y-6 animate-fade-in max-w-7xl mx-auto">
          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="text-destructive flex-shrink-0" size={20} />
                <p className="text-sm text-destructive">{error}</p>
              </div>
              <Button variant="outline" size="sm" onClick={clearError}>
                Dismiss
              </Button>
            </div>
          )}

          {/* Header with Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Supervisors ({supervisors.length})
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Manage department faculty and their student allocations
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Import Button */}
              <Button 
                variant="outline" 
                className="gap-2" 
                onClick={() => setShowImportModal(true)}
              >
                <Upload size={18} />
                Import CSV
              </Button>

              {/* Refresh Button */}
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

              {/* Add Button */}
              <Button 
                className="gap-2 animate-scale-in" 
                onClick={() => {
                  setEditingSupervisor(null)
                  setShowAddModal(true)
                }}
              >
                <Plus size={18} />
                Add Supervisor
              </Button>
            </div>
          </div>

          {/* Search */}
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  type="text"
                  placeholder="Search by name, email, or staff number..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </CardContent>
          </Card>

          {/* Supervisors List */}
          <div className="space-y-4">
            {supervisors.length > 0 ? (
              supervisors.map((supervisor, idx) => (
                <Card key={supervisor.id} className="overflow-hidden hover:shadow-md transition-all duration-300 animate-slide-up">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg capitalize">{supervisor.fullName}</CardTitle>
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(supervisor.status)}`}>
                            {getStatusDisplay(supervisor.status)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{supervisor.email}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {supervisor.department?.name || 'Department'} • {supervisor.staffNumber && `Staff #${supervisor.staffNumber}`}
                        </p>
                        {supervisor.faculty && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Faculty: {supervisor.faculty}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setSelectedSupervisor(supervisor)
                            setShowViewModal(true)
                          }}
                          disabled={actionLoading === supervisor.id}
                        >
                          <Eye size={16} />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setEditingSupervisor(supervisor)
                            setShowAddModal(true)
                          }}
                          disabled={actionLoading === supervisor.id}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleToggleStatus(supervisor.id, supervisor.status)}
                          title={supervisor.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                          disabled={actionLoading === supervisor.id}
                        >
                          <Power size={16} className={supervisor.status === 'ACTIVE' ? 'text-green-600' : 'text-gray-400'} />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDeleteSupervisor(supervisor.id, supervisor.fullName)}
                          disabled={actionLoading === supervisor.id}
                          className="hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="p-3 bg-secondary rounded-lg">
                        <p className="text-xs text-muted-foreground font-medium">Students</p>
                        <p className="text-xl font-semibold text-foreground mt-1">{supervisor.studentCount || 0}</p>
                      </div>
                      <div className="p-3 bg-secondary rounded-lg">
                        <p className="text-xs text-muted-foreground font-medium">Approved Topics</p>
                        <p className="text-xl font-semibold text-foreground mt-1">{supervisor.approvedTopics || 0}</p>
                      </div>
                      <div className="p-3 bg-secondary rounded-lg sm:col-span-2">
                        <Button 
                          className="w-full gap-2" 
                          size="sm" 
                          variant="outline"
                          onClick={() => alert(`Send message to ${supervisor.fullName}`)}
                        >
                          <Mail size={16} />
                          Send Message
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">No Supervisors Found</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Get started by adding your first supervisor.
                  </p>
                  <Button 
                    className="mt-4 gap-2"
                    onClick={() => {
                      setEditingSupervisor(null)
                      setShowAddModal(true)
                    }}
                  >
                    <Plus size={18} />
                    Add Supervisor
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Add/Edit Supervisor Modal */}
        <AddSupervisorModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false)
            setEditingSupervisor(null)
          }}
          onAdd={editingSupervisor ? 
            (data) => handleUpdateSupervisor(editingSupervisor.id, data) : 
            handleAddSupervisor
          }
          editingSupervisor={editingSupervisor}
        />

        {/* View Supervisor Modal */}
        {selectedSupervisor && (
          <ViewSupervisorModal
            isOpen={showViewModal}
            onClose={() => {
              setShowViewModal(false)
              setSelectedSupervisor(null)
            }}
            onMessage={() => alert(`Send message to ${selectedSupervisor.fullName}`)}
            supervisor={{
              id: parseInt(selectedSupervisor.id),
              name: selectedSupervisor.fullName,
              email: selectedSupervisor.email,
              phone: selectedSupervisor.phone || '+1 (555) 123-4567',
              staffNumber: selectedSupervisor.staffNumber,
              department: selectedSupervisor.department?.name,
              faculty: selectedSupervisor.department?.faculty,
              specialization: selectedSupervisor.specialization || 'Not specified',
              students: selectedSupervisor.studentCount || 0,
              approvedTopics: selectedSupervisor.approvedTopics || 0,
              status: selectedSupervisor.status,
            }}
          />
        )}

        {/* Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <Card className="w-full max-w-md animate-scale-in">
              <CardHeader className="flex items-center justify-between border-b">
                <CardTitle>Import Supervisors</CardTitle>
                <button 
                  onClick={() => {
                    setShowImportModal(false)
                    setImportFile(null)
                  }} 
                  className="p-2 hover:bg-secondary rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-foreground mb-2">
                    {importFile ? importFile.name : 'Choose a CSV file to import'}
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    File should contain columns: fullName, email, staffNumber, phone, specialization
                  </p>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label htmlFor="csv-upload">
                    <Button variant="outline" asChild>
                      <span>Select File</span>
                    </Button>
                  </label>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => {
                    setShowImportModal(false)
                    setImportFile(null)
                  }} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleImport} disabled={!importFile} className="flex-1">
                    Import
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </DashboardLayout>
  )
}