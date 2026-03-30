'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CreateInstitutionData, Institution } from '@/store/admin/type/institution'


interface AddInstitutionModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (data: CreateInstitutionData) => Promise<void>
  editingInstitution?: Institution | null
}

export function AddInstitutionModal({ 
  isOpen, 
  onClose, 
  onAdd, 
  editingInstitution 
}: AddInstitutionModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    address: '',
    website: '',
    logoUrl: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (editingInstitution) {
      setFormData({
        name: editingInstitution.name || '',
        code: editingInstitution.code || '',
        description: editingInstitution.description || '',
        address: editingInstitution.address || '',
        website: editingInstitution.website || '',
        logoUrl: editingInstitution.logoUrl || '',
      })
    } else {
      setFormData({
        name: '',
        code: '',
        description: '',
        address: '',
        website: '',
        logoUrl: '',
      })
    }
    setError('')
  }, [editingInstitution, isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await onAdd(formData)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to save institution')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] w-full max-w-lg">
        <div className="bg-background border rounded-lg shadow-lg">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-lg font-semibold">
              {editingInstitution ? 'Edit Institution' : 'Add New Institution'}
            </h2>
            <button onClick={onClose} className="rounded-sm opacity-70 hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Institution Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., University of Lagos"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Institution Code *</label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary uppercase"
                placeholder="e.g., UNILAG"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Brief description of the institution"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Physical address"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Website</label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="https://university.edu"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Logo URL</label>
              <input
                type="url"
                name="logoUrl"
                value={formData.logoUrl}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : editingInstitution ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}