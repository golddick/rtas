'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/card-component'
import { Button } from '@/components/ui/button'
import { X, Edit, Users, FileText, Mail, Building2 } from 'lucide-react'

interface ViewDepartmentModalProps {
  isOpen: boolean
  onClose: () => void
  onEdit: () => void
  department: any | null
}

export function ViewDepartmentModal({ isOpen, onClose, onEdit, department }: ViewDepartmentModalProps) {
  if (!isOpen || !department) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md animate-scale-in">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-lg">{department.name}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {department.institution?.name} • Code: {department.code}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-secondary rounded transition-colors"
          >
            <X size={20} className="text-foreground" />
          </button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Faculty and HOD Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-secondary rounded-lg p-3">
              <Building2 size={16} className="text-primary mb-1" />
              <p className="text-xs text-muted-foreground">Faculty</p>
              <p className="text-sm font-semibold">{department.faculty || 'N/A'}</p>
            </div>
            <div className="bg-secondary rounded-lg p-3">
              <Mail size={16} className="text-primary mb-1" />
              <p className="text-xs text-muted-foreground">HOD</p>
              <p className="text-sm font-semibold">
                { department.hod?.email || department.hod?.fullName || 'Not Assigned'}
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-sm font-medium text-foreground mb-1">Description</p>
            <p className="text-sm text-muted-foreground">{department.description}</p>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-secondary rounded-lg p-3 text-center">
              <Users size={20} className="text-primary mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Supervisors</p>
              <p className="text-lg font-bold text-foreground">
                {department.supervisorCount || department._count?.supervisors || 0}
              </p>
            </div>
            <div className="bg-secondary rounded-lg p-3 text-center">
              <Users size={20} className="text-primary mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Students</p>
              <p className="text-lg font-bold text-foreground">
                {department.studentCount || department._count?.students || 0}
              </p>
            </div>
            <div className="bg-secondary rounded-lg p-3 text-center">
              <FileText size={20} className="text-primary mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Proposals</p>
              <p className="text-lg font-bold text-foreground">
                {department.proposalCount || department._count?.proposals || 0}
              </p>
            </div>
          </div>

          {/* Capacity Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs font-medium text-blue-900 mb-1">Capacity Settings</p>
            <p className="text-sm text-blue-800">
              Max {department.maxStudents || 150} students per supervisor
            </p>
          </div>

          {/* Status Badge */}
          <div className="flex justify-center">
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
              department.status === 'Active' || department.hodId
                ? 'bg-green-100 text-green-700' 
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {department.status || (department.hodId ? 'Active' : 'Pending HOD')}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={onEdit}
              variant="outline"
              className="flex-1 gap-2"
            >
              <Edit size={16} />
              Edit Department
            </Button>
            <Button
              onClick={onClose}
              className="flex-1"
            >
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



