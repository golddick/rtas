'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/card-component'
import { Button } from '@/components/ui/button'
import { Plus, Edit, Trash2, Eye, AlertCircle, Building2, Users, FileText } from 'lucide-react'
import { AddDepartmentModal } from '@/components/modals/add-department-modal'
import { ViewDepartmentModal } from '@/components/modals/view-department-modal'
import { useDepartmentStore } from '@/store/admin/departmentStore'
import { useInstitutionStore } from '@/store/admin/institutionStore'

export default function DepartmentsPage() {
  const { 
    departments, 
    fetchDepartments, 
    createDepartment,
    updateDepartment,
    deleteDepartment,
    sendHODInvite,
    isLoading, 
    error,
    clearError
  } = useDepartmentStore()
  
  const { institutions, fetchInstitutions } = useInstitutionStore()
  
  const [selectedDept, setSelectedDept] = useState<any>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingDept, setEditingDept] = useState<any>(null)
  const [localError, setLocalError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Fetch departments and institutions on mount
  useEffect(() => {
    fetchDepartments()
    fetchInstitutions()
  }, [])

  // Clear messages after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  console.log(departments, 'admin dept')

  const handleAddDepartment = async (data: any, sendInvite?: boolean, hodEmail?: string) => {
    try {
      setLocalError('')
      const result = await createDepartment(data, sendInvite, hodEmail)
      setSuccessMessage(`Department "${result.name}" created successfully!`)
      setShowAddModal(false)
      setEditingDept(null)
    } catch (err: any) {
      setLocalError(err.message || 'Failed to create department')
    }
  }

  const handleUpdateDepartment = async (id: string, data: any) => {
    try {
      setLocalError('')
      const result = await updateDepartment(id, data)
      setSuccessMessage(`Department "${result.name}" updated successfully!`)
      setShowAddModal(false)
      setEditingDept(null)
    } catch (err: any) {
      setLocalError(err.message || 'Failed to update department')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      try {
        await deleteDepartment(id)
        setSuccessMessage(`Department "${name}" deleted successfully!`)
      } catch (err: any) {
        setLocalError(err.message || 'Failed to delete department')
      }
    }
  }

  const handleSendInvite = async (departmentId: string, email: string) => {
    try {
      const result = await sendHODInvite(departmentId, email)
      setSuccessMessage(result.message || `Invitation sent to ${email}`)
      return result
    } catch (err: any) {
      setLocalError(err.message || 'Failed to send invitation')
      throw err
    }
  }

  if (isLoading && departments.length === 0) {
    return (
      <DashboardLayout>
        <main className="flex-1 overflow-hidden">
          <DashboardHeader title="Department Management" />
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
          title="Department Management"
          subtitle="Manage departments across all institutions"
        />

        <div className="p-6 space-y-6 animate-fade-in">
          {/* Header with Add Button */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                All Departments ({departments.length})
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Monitor department performance and assignments
              </p>
            </div>
            <Button 
              className="w-full sm:w-auto gap-2 animate-scale-in" 
              onClick={() => {
                setEditingDept(null)
                setShowAddModal(true)
                setLocalError('')
              }}
            >
              <Plus size={18} />
              Add Department
            </Button>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-start gap-3">
              <div className="text-green-500">✓</div>
              <p className="text-sm text-green-600">{successMessage}</p>
            </div>
          )}

          {/* Error Message */}
          {(error || localError) && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="text-destructive flex-shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-destructive">{error || localError}</p>
            </div>
          )}

          {/* Departments Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {departments.map((dept: any, idx: number) => (
              <Card key={dept.id} className="hover:shadow-md transition-all duration-300 animate-slide-up">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{dept.name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        {dept.institution?.name} • Code: {dept.code}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      dept.status === 'Active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {dept.status || (dept.hodId ? 'Active' : 'Pending HOD')}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm">
                    <span className="text-muted-foreground font-medium">Faculty:</span>{' '}
                    <span className="font-medium">{dept.faculty || 'N/A'}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground font-medium">Head of Department:</span>{' '}
                    <span className="font-medium">{ dept.hod?.email || 'Not Assigned'}</span>
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-secondary rounded-lg">
                      <Users size={16} className="text-primary mb-1" />
                      <p className="text-xs text-muted-foreground">Supervisors</p>
                      <p className="text-xl font-bold">{dept.supervisorCount || 0}</p>
                    </div>
                    <div className="p-3 bg-secondary rounded-lg">
                      <Users size={16} className="text-primary mb-1" />
                      <p className="text-xs text-muted-foreground">Students</p>
                      <p className="text-xl font-bold">{dept.studentCount || dept._count?.students || 0}</p>
                    </div>
                    <div className="p-3 bg-secondary rounded-lg">
                      <FileText size={16} className="text-primary mb-1" />
                      <p className="text-xs text-muted-foreground">Proposals</p>
                      <p className="text-xl font-bold">{dept.proposalCount || dept._count?.proposals || 0}</p>
                    </div>
                    <div className="p-3 bg-secondary rounded-lg">
                      <p className="text-xs text-muted-foreground">Approval Rate</p>
                      <p className="text-xl font-bold text-primary">{dept.approvalRate || '0%'}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => {
                      setSelectedDept(dept)
                      setShowViewModal(true)
                    }}>
                      <Eye size={16} />
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => {
                      setEditingDept(dept)
                      setShowAddModal(true)
                    }}>
                      <Edit size={16} />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 hover:bg-red-50 hover:text-red-600" 
                      onClick={() => handleDelete(dept.id, dept.name)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {departments.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No Departments</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Get started by creating your first department.
              </p>
              <Button 
                className="mt-4 gap-2"
                onClick={() => {
                  setEditingDept(null)
                  setShowAddModal(true)
                }}
              >
                <Plus size={18} />
                Add Department
              </Button>
            </div>
          )}

          {/* Approval Rate Comparison (only show if there are departments) */}
          {departments.length > 0 && (
            <Card className="animate-slide-up">
              <CardHeader>
                <CardTitle className="text-base">Approval Rate Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {departments.map((dept: any) => (
                    <div key={dept.id}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium">{dept.name}</span>
                        <span className="text-muted-foreground">{dept.approvalRate || '0%'}</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300" 
                          style={{ width: dept.approvalRate || '0%' }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Add/Edit Department Modal */}
        <AddDepartmentModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false)
            setEditingDept(null)
            setLocalError('')
          }}
          onAdd={handleAddDepartment}
          onUpdate={handleUpdateDepartment}
          onSendInvite={handleSendInvite}
          editingDept={editingDept}
          institutions={institutions}
        />

        {/* View Department Modal */}
        {selectedDept && (
          <ViewDepartmentModal
            isOpen={showViewModal}
            onClose={() => {
              setShowViewModal(false)
              setSelectedDept(null)
            }}
            onEdit={() => {
              setShowViewModal(false)
              setEditingDept(selectedDept)
              setShowAddModal(true)
            }}
            department={selectedDept}
          />
        )}
      </main>
    </DashboardLayout>
  )
}