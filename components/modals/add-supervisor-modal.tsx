'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/card-component'

interface AddSupervisorModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (supervisorData: any) => Promise<void>
  editingSupervisor?: any | null
}

export function AddSupervisorModal({ isOpen, onClose, onAdd, editingSupervisor }: AddSupervisorModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    staffNumber: '',
    phone: '',
    specialization: '',
    maxCapacity: 15,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (editingSupervisor) {
      setFormData({
        name: editingSupervisor.fullName || '',
        email: editingSupervisor.email || '',
        staffNumber: editingSupervisor.staffNumber || '',
        phone: editingSupervisor.phone || '',
        specialization: editingSupervisor.specialization || '',
        maxCapacity: editingSupervisor.maxCapacity || 15,
      })
    } else {
      setFormData({
        name: '',
        email: '',
        staffNumber: '',
        phone: '',
        specialization: '',
        maxCapacity: 15,
      })
    }
    setErrors({})
  }, [editingSupervisor, isOpen])

  if (!isOpen) return null

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    if (!formData.email.includes('@')) newErrors.email = 'Invalid email format'
    if (!formData.staffNumber.trim()) newErrors.staffNumber = 'Staff number is required'
    if (!formData.specialization.trim()) newErrors.specialization = 'Specialization is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (validateForm()) {
      setIsLoading(true)
      try {
        await onAdd(formData)
        setFormData({ name: '', email: '', staffNumber: '', phone: '', specialization: '', maxCapacity: 15 })
        onClose()
      } catch (error) {
        // Error handled by store
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <Card className="w-full max-w-md animate-scale-in">
        <CardHeader className="flex items-center justify-between border-b">
          <CardTitle>{editingSupervisor ? 'Edit Supervisor' : 'Add New Supervisor'}</CardTitle>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Full Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Dr. John Doe"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={isLoading}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john.doe@university.edu"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={isLoading}
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Staff Number *</label>
            <input
              type="text"
              value={formData.staffNumber}
              onChange={(e) => setFormData({ ...formData, staffNumber: e.target.value })}
              placeholder="e.g., ST-2024-001"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={isLoading}
            />
            {errors.staffNumber && <p className="text-xs text-red-500 mt-1">{errors.staffNumber}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Phone Number</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 234 567 8900"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Specialization *</label>
            <input
              type="text"
              value={formData.specialization}
              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              placeholder="e.g., Machine Learning"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={isLoading}
            />
            {errors.specialization && <p className="text-xs text-red-500 mt-1">{errors.specialization}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Max Student Capacity</label>
            <input
              type="number"
              value={formData.maxCapacity}
              onChange={(e) => setFormData({ ...formData, maxCapacity: parseInt(e.target.value) })}
              min="1"
              max="50"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={isLoading}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1" disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="flex-1" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⚪</span>
                  {editingSupervisor ? 'Updating...' : 'Adding...'}
                </span>
              ) : (
                editingSupervisor ? 'Update Supervisor' : 'Add Supervisor'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}