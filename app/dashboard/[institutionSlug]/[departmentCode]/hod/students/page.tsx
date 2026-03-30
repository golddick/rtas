'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/card-component'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  Eye, 
  Mail, 
  UserCheck, 
  Upload, 
  CheckSquare, 
  Square,
  Search,
  AlertCircle,
  RefreshCw,
  X
} from 'lucide-react'
import { ViewStudentModal } from '@/components/modals/view-student-modal'
import { MessageModal } from '@/components/modals/message-modal'
import { AllocateSupervisorModal } from '@/components/modals/allocate-supervisor-modal'
import { useStudentStore } from '@/store/hod/student/studentStore'
import { useSupervisorForStudentStore } from '@/store/hod/student/supervisorForStudentStore'
import { useAuthStore } from '@/store/user/userStore'
import { useToast } from '@/components/ui/use-toast'

export default function StudentsPage() {
  const params = useParams()
  const institutionSlug = params.institutionSlug as string
  const departmentCode = params.departmentCode as string
  const { toast } = useToast()

  const { user, isLoading: authLoading } = useAuthStore()

  const { 
    students, 
    fetchStudents, 
    allocateSupervisor,
    smartAllocate,
    unassignedCount,
    isLoading: studentsLoading, 
    error: storeError,
    filters,
    setFilters,
    clearError 
  } = useStudentStore()

  const { 
    supervisors, 
    fetchAvailableSupervisors, 
    isLoading: supervisorsLoading,
    error: supervisorsError
  } = useSupervisorForStudentStore()

  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [messageStudent, setMessageStudent] = useState<any>(null)
  const [allocateStudent, setAllocateStudent] = useState<any>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState(filters.search || '')
  const [statusFilter, setStatusFilter] = useState(filters.status || 'all')
  const [supervisorFilter, setSupervisorFilter] = useState(filters.supervisorId || 'all')
  const [showImportModal, setShowImportModal] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Get department ID from user based on role
  const departmentId = user?.role === 'HOD' 
    ? user?.department?.id 
    : user?.supervisorDepartment?.id

  // Fetch students when we have department ID
  useEffect(() => {
    if (departmentId) {
      fetchStudents(departmentId, {
        search: searchTerm,
        status: statusFilter,
        supervisorId: supervisorFilter !== 'all' ? supervisorFilter : undefined
      })
    }
  }, [departmentId, fetchStudents])

  // Fetch available supervisors when needed
  useEffect(() => {
    if (departmentId && (selectedIds.length > 0 || allocateStudent)) {
        console.log('Fetching supervisors for department ID:', departmentId)
      fetchAvailableSupervisors(departmentId)
    }
  }, [selectedIds.length, allocateStudent, departmentId, fetchAvailableSupervisors])

  // Debounce search
  useEffect(() => {
    if (!departmentId) return
    
    const timer = setTimeout(() => {
      setFilters({ search: searchTerm })
      fetchStudents(departmentId, {
        search: searchTerm,
        status: statusFilter,
        supervisorId: supervisorFilter !== 'all' ? supervisorFilter : undefined
      })
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm, statusFilter, supervisorFilter, departmentId, fetchStudents, setFilters])

  console.log('Students:', students)

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const status = e.target.value
    setStatusFilter(status)
    setFilters({ status })
  }

  const handleSupervisorFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const supervisorId = e.target.value
    setSupervisorFilter(supervisorId)
    setFilters({ supervisorId })
  }

  const handleRefresh = () => {
    if (departmentId) {
      fetchStudents(departmentId, {
        search: searchTerm,
        status: statusFilter,
        supervisorId: supervisorFilter !== 'all' ? supervisorFilter : undefined
      })
      toast({
        title: 'Success',
        description: 'Students list refreshed',
      })
    }
  }

  const toggleStudentSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(sid => sid !== id)
        : [...prev, id]
    )
  }

  const allocateSelectedStudents = async (supervisorId: string, supervisorName: string) => {
    if (selectedIds.length === 0) {
      toast({
        title: 'Error',
        description: 'No students selected',
        variant: 'destructive',
      })
      return
    }
    
    try {
      await allocateSupervisor({
        studentIds: selectedIds,
        supervisorId
      })
      setSelectedIds([])
      toast({
        title: 'Success',
        description: `Successfully allocated ${selectedIds.length} students to ${supervisorName}`,
      })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to allocate students',
        variant: 'destructive',
      })
    }
  }

  const handleSmartAutoAllocate = async () => {
    const unassigned = students.filter(s => !s.supervisorId).map(s => s.id)
    if (unassigned.length === 0) {
      toast({
        title: 'Info',
        description: 'All students are already assigned to supervisors.',
      })
      return
    }

    try {
      const result = await smartAllocate({ studentIds: unassigned })
      toast({
        title: 'Success',
        description: `Smart allocation complete: ${result.allocated} students allocated successfully, ${result.failed} failed.`,
      })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Smart allocation failed',
        variant: 'destructive',
      })
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImportFile(e.target.files[0])
    }
  }

  const handleImport = async () => {
    if (!importFile) {
      toast({
        title: 'Error',
        description: 'Please select a CSV file to import',
        variant: 'destructive',
      })
      return
    }

    try {
      // Import functionality would go here
      toast({
        title: 'Success',
        description: 'Import feature coming soon',
      })
      setShowImportModal(false)
      setImportFile(null)
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Import failed',
        variant: 'destructive',
      })
    }
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

  const getProposalStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'text-green-600'
      case 'PENDING': return 'text-yellow-600'
      case 'SUBMITTED': return 'text-blue-600'
      case 'REJECTED': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  console.log('Students array:', students)
console.log(' supervisors:', supervisors)


  // Combine loading states
  const isLoading = authLoading || studentsLoading || supervisorsLoading

  if (authLoading) {
    return (
      <DashboardLayout>
        <main className="flex-1 overflow-hidden">
          <DashboardHeader title="Manage Students" />
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
          <DashboardHeader title="Manage Students" />
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
          <DashboardHeader title="Manage Students" />
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

  const displayError = storeError || supervisorsError

  return (
    <DashboardLayout>
      <main className="flex-1 overflow-hidden">
        <DashboardHeader
          title="Manage Students"
          subtitle={`${user.institution?.name || 'Institution'} • ${user.role === 'HOD' ? user.department?.name : user.supervisorDepartment?.name || 'Department'}`}
        />

        <div className="p-6 space-y-6 animate-fade-in max-w-7xl mx-auto">
          {/* Error Message */}
          {displayError && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="text-destructive flex-shrink-0" size={20} />
                <p className="text-sm text-destructive">{displayError}</p>
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
                All Students ({students.length})
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Manage student records and supervisory assignments
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button 
                variant="outline" 
                className="gap-2" 
                onClick={() => setShowImportModal(true)}
              >
                <Upload size={18} />
                Import CSV
              </Button>
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
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedIds.length > 0 && (
            <Card className="bg-blue-50 border-blue-200 animate-slide-down">
              <CardContent className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <p className="text-sm font-medium text-foreground">
                  {selectedIds.length} student{selectedIds.length !== 1 ? 's' : ''} selected
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    size="sm" 
                    onClick={() => {
                      if (supervisors.length > 0) {
                        allocateSelectedStudents(supervisors[0].id, supervisors[0].fullName)
                      } else {
                        toast({
                          title: 'Error',
                          description: 'No supervisors available',
                          variant: 'destructive',
                        })
                      }
                    }}
                  >
                    <UserCheck size={16} className="mr-1" />
                    Allocate to Supervisors
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setSelectedIds([])}>
                    Clear Selection
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Smart Auto-Allocation Card */}
          {unassignedCount > 0 && (
            <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20 animate-slide-up">
              <CardContent className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-foreground">Auto-Assign Unallocated Students</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {unassignedCount} student{unassignedCount !== 1 ? 's' : ''} waiting for supervisor assignment
                  </p>
                </div>
                <Button 
                  onClick={handleSmartAutoAllocate}
                  disabled={unassignedCount === 0 || isLoading}
                  className="gap-2"
                >
                  <UserCheck size={16} />
                  Smart Allocate
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  type="text"
                  placeholder="Search by name, email, or matric number..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Status</label>
                  <select
                    value={statusFilter}
                    onChange={handleStatusFilterChange}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="all">All Statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="PENDING_VERIFICATION">Pending</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Supervisor</label>
                  <select
                    value={supervisorFilter}
                    onChange={handleSupervisorFilterChange}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="all">All Supervisors</option>
                    <option value="unassigned">Not Assigned</option>
                    {supervisors.map(sup => (
                      <option key={sup.id} value={sup.id}>{sup.fullName}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Students Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {students.length > 0 ? (
              students.map((student, idx) => (
                <Card 
                  key={student.id} 
                  className={`hover:shadow-md transition-all duration-300 animate-slide-up ${
                    selectedIds.includes(student.id) ? 'ring-2 ring-primary bg-blue-50' : ''
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base capitalize">{student.fullName}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">{student.matricNumber || 'No ID'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleStudentSelect(student.id)}
                          className="p-1 hover:bg-secondary rounded transition-colors"
                        >
                          {selectedIds.includes(student.id) ? (
                            <CheckSquare size={20} className="text-primary" />
                          ) : (
                            <Square size={20} className="text-muted-foreground" />
                          )}
                        </button>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(student.status)}`}>
                          {student.status}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <p><span className="text-muted-foreground">Email:</span> {student.email}</p>
                      <p><span className="text-muted-foreground">Program:</span> {student.program || 'Not specified'}</p>
                      <p>
                        <span className="text-muted-foreground">Supervisor:</span>{' '}
                        {student.supervisor ? (
                          <span className="font-medium capitalize">{student.supervisor.fullName}</span>
                        ) : (
                          <span className="text-red-600 font-medium">Not Assigned</span>
                        )}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Proposal:</span>{' '}
                        <span className={`font-medium ${getProposalStatusColor(student.proposalStatus)}`}>
                          {student.proposalStatus}
                        </span>
                      </p>
                    </div>
                    
                    <div className="flex gap-2 pt-2 flex-wrap">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => setSelectedStudent(student)}>
                        <Eye size={16} />
                      </Button>
                      {!student.supervisorId && (
                        <Button size="sm" className="flex-1" onClick={() => setAllocateStudent(student)}>
                          <UserCheck size={16} />
                          Assign
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => setMessageStudent(student)}>
                        <Mail size={16} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="col-span-2">
                <CardContent className="p-12 text-center">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">No Students Found</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    No students match your current filters.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Modals */}
        {selectedStudent && (
          <ViewStudentModal
            isOpen={!!selectedStudent}
            onClose={() => setSelectedStudent(null)}
            student={{
              id: parseInt(selectedStudent.id),
              name: selectedStudent.fullName,
              email: selectedStudent.email,
              studentId: selectedStudent.matricNumber || selectedStudent.id,
              phone: selectedStudent.phone || undefined,
              department: selectedStudent.department?.name,
              joinDate: new Date(selectedStudent.createdAt).toLocaleDateString(),
              proposalStatus: selectedStudent.proposalStatus,
              progress: 75,
              program: selectedStudent.program || undefined,
              bio: `${selectedStudent.fullName} is a ${selectedStudent.program || ''} student.`,
            }}
          />
        )}

        {messageStudent && (
          <MessageModal
            isOpen={!!messageStudent}
            onClose={() => setMessageStudent(null)}
            recipientName={messageStudent.fullName}
            recipientEmail={messageStudent.email}
            onSend={(message, subject) => {
              toast({
                title: 'Success',
                description: `Message sent to ${messageStudent.fullName}`,
              })
              setMessageStudent(null)
            }}
          />
        )}

        {allocateStudent && (
          <AllocateSupervisorModal
            isOpen={!!allocateStudent}
            onClose={() => setAllocateStudent(null)}
            studentName={allocateStudent.fullName}
            studentId={allocateStudent.id}
            supervisors={supervisors}
            onAllocate={async (supervisorId, supervisorName) => {
              try {
                await allocateSupervisor({
                  studentIds: [allocateStudent.id],
                  supervisorId
                })
                setAllocateStudent(null)
                toast({
                  title: 'Success',
                  description: `${allocateStudent.fullName} has been allocated to ${supervisorName}`,
                })
              } catch (err: any) {
                toast({
                  title: 'Error',
                  description: err.message || 'Failed to allocate student',
                  variant: 'destructive',
                })
              }
            }}
          />
        )}

        {/* Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <Card className="w-full max-w-md animate-scale-in">
              <CardHeader className="flex items-center justify-between border-b">
                <CardTitle>Import Students</CardTitle>
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
                    File should contain columns: fullName, email, matricNumber, program, phone
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

