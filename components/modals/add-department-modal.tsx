'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/card-component'
import { Button } from '@/components/ui/button'
import { X, Plus, Mail, Building2 } from 'lucide-react'

// Define the expected return type from onAdd
interface DepartmentResult {
  id: string
  name: string
  code: string
  [key: string]: any
}

interface AddDepartmentModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (data: any, sendInvite?: boolean, hodEmail?: string) => Promise<DepartmentResult | void>
  onUpdate?: (id: string, data: any) => Promise<void>
  onSendInvite?: (departmentId: string, email: string) => Promise<any>
  editingDept?: any | null
  institutions: Array<{ id: string; name: string; code: string }>
}

export function AddDepartmentModal({ 
  isOpen, 
  onClose, 
  onAdd, 
  onUpdate,
  onSendInvite,
  editingDept, 
  institutions 
}: AddDepartmentModalProps) {
  const [step, setStep] = useState<'form' | 'invite'>('form')
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    faculty: '',
    description: '',
    maxStudents: 150,
    institutionId: '',
  })
  const [hodEmail, setHodEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Reset form when editingDept changes or modal opens
  useEffect(() => {
    if (editingDept) {
      setFormData({
        name: editingDept.name || '',
        code: editingDept.code || '',
        faculty: editingDept.faculty || '',
        description: editingDept.description || '',
        maxStudents: editingDept.maxStudents || 150,
        institutionId: editingDept.institutionId || editingDept.institution?.id || '',
      })
      setStep('form')
    } else {
      setFormData({
        name: '',
        code: '',
        faculty: '',
        description: '',
        maxStudents: 150,
        institutionId: '',
      })
      setStep('form')
    }
    setHodEmail('')
    setError('')
  }, [editingDept, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate form
    if (!formData.name || !formData.code || !formData.description || !formData.institutionId || !formData.faculty) {
      setError('Please fill in all required fields')
      return
    }

    if (editingDept && onUpdate) {
      // Update existing department
      setIsLoading(true)
      try {
        await onUpdate(editingDept.id, formData)
        resetForm()
      } catch (err: any) {
        setError(err.message || 'Failed to update department')
      } finally {
        setIsLoading(false)
      }
    } else {
      // New department - go to invite step
      setStep('invite')
    }
  }

  const handleSendInvitation = async () => {
    if (!hodEmail) {
      setError('Please enter an email address')
      return
    }

    setIsLoading(true)
    try {
      // First create the department
      const result = await onAdd(formData, true, hodEmail)
      
      // If there's a specific invite function, use it (for resending)
      if (onSendInvite && result && 'id' in result) {
        await onSendInvite(result.id, hodEmail)
      }
      
      resetForm()
    } catch (err: any) {
      setError(err.message || 'Failed to create department and send invitation')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkipInvitation = async () => {
    setIsLoading(true)
    try {
      await onAdd(formData, false)
      resetForm()
    } catch (err: any) {
      setError(err.message || 'Failed to create department')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      faculty: '',
      description: '',
      maxStudents: 150,
      institutionId: '',
    })
    setHodEmail('')
    setStep('form')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md animate-scale-in">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>
            {step === 'form' 
              ? (editingDept ? 'Edit Department' : 'Add New Department')
              : 'Invite Head of Department'
            }
          </CardTitle>
          <button
            onClick={onClose}
            className="p-1 hover:bg-secondary rounded transition-colors"
          >
            <X size={20} className="text-foreground" />
          </button>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {step === 'form' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Institution Selection */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Institution <span className="text-destructive">*</span>
                </label>
                <select
                  value={formData.institutionId}
                  onChange={(e) => setFormData({ ...formData, institutionId: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  disabled={isLoading}
                >
                  <option value="">Select Institution</option>
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name} ({inst.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Department Name */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Department Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Computer Science"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Faculty */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Faculty <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.faculty}
                  onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                  placeholder="e.g., Faculty of Science"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Department Code */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Department Code <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., CS"
                  maxLength={10}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary uppercase"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Description <span className="text-destructive">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Department description"
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Max Students */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Max Students per Supervisor
                </label>
                <input
                  type="number"
                  value={formData.maxStudents}
                  onChange={(e) => setFormData({ ...formData, maxStudents: parseInt(e.target.value) })}
                  min="1"
                  max="500"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={isLoading}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  className="flex-1 gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="animate-spin">⚪</span>
                  ) : (
                    <Plus size={16} />
                  )}
                  {editingDept ? 'Update Department' : 'Next'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center space-y-2">
                <Mail className="mx-auto text-primary" size={32} />
                <div>
                  <p className="font-semibold text-foreground">Invite HOD</p>
                  <p className="text-sm text-muted-foreground">
                    Send an invitation to the Head of Department for <strong>{formData.name}</strong>
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  HOD Email Address <span className="text-destructive">*</span>
                </label>
                <input
                  type="email"
                  value={hodEmail}
                  onChange={(e) => setHodEmail(e.target.value)}
                  placeholder="hod@university.edu"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  disabled={isLoading}
                />
              </div>

              <p className="text-xs text-muted-foreground">
                An invitation email will be sent to this address. The HOD can click the link to accept the position.
              </p>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleSendInvitation}
                  disabled={!hodEmail || isLoading}
                  className="flex-1 gap-2"
                >
                  {isLoading ? (
                    <span className="animate-spin">⚪</span>
                  ) : (
                    <Mail size={16} />
                  )}
                  Send & Create
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handleSkipInvitation}
                  disabled={isLoading}
                >
                  Skip
                </Button>
              </div>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setStep('form')}
                disabled={isLoading}
              >
                Back
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}