'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Mail, Phone, User, Building2, Briefcase, Hash, AlertCircle } from 'lucide-react'
import { usePublicStore } from '@/store/public/publicStore'

interface EditUserModalProps {
  isOpen: boolean
  onClose: () => void
  onUpdate: (userId: string, data: any) => Promise<void>
  user: any
  isLoading?: boolean
}

export function EditUserModal({ isOpen, onClose, onUpdate, user, isLoading }: EditUserModalProps) {
  const { institutions, fetchInstitutions } = usePublicStore()
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: '',
    status: '',
    emailVerified: false,
    institutionId: '',
    departmentId: '',
    supervisorDepartmentId: '',
    matricNumber: '',
    staffNumber: '',
    program: '',
  })
  const [error, setError] = useState('')
  const [filteredDepartments, setFilteredDepartments] = useState<any[]>([])

  useEffect(() => {
    fetchInstitutions()
  }, [])

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || '',
        status: user.status || 'ACTIVE',
        emailVerified: user.emailVerified || false,
        institutionId: user.institutionId || '',
        departmentId: user.departmentId || '',
        supervisorDepartmentId: user.supervisorDepartmentId || '',
        matricNumber: user.matricNumber || '',
        staffNumber: user.staffNumber || '',
        program: user.program || '',
      })
    }
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Prepare update data - only send fields that have values
    const updateData: any = {}
    
    if (formData.fullName !== user.fullName) updateData.fullName = formData.fullName
    if (formData.email !== user.email) updateData.email = formData.email
    if (formData.phone !== user.phone) updateData.phone = formData.phone || null
    if (formData.status !== user.status) updateData.status = formData.status
    if (formData.emailVerified !== user.emailVerified) updateData.emailVerified = formData.emailVerified
    
    // Role-specific fields
    if (user.role === 'STUDENT') {
      if (formData.matricNumber !== user.matricNumber) updateData.matricNumber = formData.matricNumber || null
      if (formData.program !== user.program) updateData.program = formData.program || null
      if (formData.departmentId !== user.departmentId) updateData.departmentId = formData.departmentId || null
    } else if (user.role === 'SUPERVISOR') {
      if (formData.staffNumber !== user.staffNumber) updateData.staffNumber = formData.staffNumber || null
      if (formData.supervisorDepartmentId !== user.supervisorDepartmentId) {
        updateData.supervisorDepartmentId = formData.supervisorDepartmentId || null
      }
    } else if (user.role === 'HOD') {
      if (formData.staffNumber !== user.staffNumber) updateData.staffNumber = formData.staffNumber || null
      if (formData.departmentId !== user.departmentId) updateData.departmentId = formData.departmentId || null
    }

    // Only update if there are changes
    if (Object.keys(updateData).length === 0) {
      onClose()
      return
    }

    try {
      await onUpdate(user.id, updateData)
    } catch (err: any) {
      setError(err.message || 'Failed to update user')
    }
  }

  if (!isOpen) return null

  const isStudent = user?.role === 'STUDENT'
  const isSupervisor = user?.role === 'SUPERVISOR'
  const isHod = user?.role === 'HOD'

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-background rounded-xl border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="border-b border-border p-6 flex items-start justify-between sticky top-0 bg-background z-10">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-1">Edit User</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-3">
            <AlertCircle className="text-destructive flex-shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b pb-2">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="PENDING">Pending</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="emailVerified"
                  id="emailVerified"
                  checked={formData.emailVerified}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-border cursor-pointer"
                />
                <label htmlFor="emailVerified" className="text-sm text-foreground cursor-pointer">
                  Email Verified
                </label>
              </div>
            </div>
          </div>

          {/* Institution Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b pb-2">Institution & Department</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Institution</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <select
                    name="institutionId"
                    value={formData.institutionId}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select Institution</option>
                    {institutions.map((inst: any) => (
                      <option key={inst.id} value={inst.id}>
                        {inst.name} ({inst.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {(isStudent || isHod) && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Department</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <input
                      type="text"
                      name="departmentId"
                      value={formData.departmentId}
                      onChange={handleChange}
                      placeholder="Department ID"
                      className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              )}

              {isSupervisor && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Supervisor Department</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <input
                      type="text"
                      name="supervisorDepartmentId"
                      value={formData.supervisorDepartmentId}
                      onChange={handleChange}
                      placeholder="Department ID"
                      className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Role-specific Information */}
          {(isStudent || isSupervisor || isHod) && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground border-b pb-2">
                {isStudent ? 'Student Information' : 'Staff Information'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isStudent && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Matric Number</label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <input
                          type="text"
                          name="matricNumber"
                          value={formData.matricNumber}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Program</label>
                      <select
                        name="program"
                        value={formData.program}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Select Program</option>
                        <option value="BSC">BSc</option>
                        <option value="MSC">MSc</option>
                        <option value="PHD">PhD</option>
                      </select>
                    </div>
                  </>
                )}

                {(isSupervisor || isHod) && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Staff Number</label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                      <input
                        type="text"
                        name="staffNumber"
                        value={formData.staffNumber}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⚪</span>
                  Saving...
                </span>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}