'use client'

import { X, Building2, MapPin, Globe, Users, BookOpen, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Institution } from '@/store/admin/type/institution'


interface ViewInstitutionModalProps {
  isOpen: boolean
  onClose: () => void
  onEdit: () => void
  institution: Institution
}

export function ViewInstitutionModal({ 
  isOpen, 
  onClose, 
  onEdit, 
  institution 
}: ViewInstitutionModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-background border rounded-lg shadow-lg">
          <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-background">
            <h2 className="text-lg font-semibold">Institution Details</h2>
            <button onClick={onClose} className="rounded-sm opacity-70 hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Header with Logo */}
            <div className="flex items-start gap-4">
              {institution.logoUrl ? (
                <img 
                  src={institution.logoUrl} 
                  alt={institution.name}
                  className="w-20 h-20 object-contain rounded-lg border"
                />
              ) : (
                <div className="w-20 h-20 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Building2 className="text-primary" size={32} />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold">{institution.name}</h3>
                    <p className="text-sm text-muted-foreground">Code: {institution.code}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    institution.status === 'ACTIVE' 
                      ? 'bg-green-100 text-green-700' 
                      : institution.status === 'INACTIVE'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {institution.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            {institution.description && (
              <div className="space-y-2">
                <h4 className="font-medium">Description</h4>
                <p className="text-sm text-muted-foreground">{institution.description}</p>
              </div>
            )}

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {institution.address && (
                <div className="flex items-start gap-2">
                  <MapPin size={18} className="text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Address</p>
                    <p className="text-sm">{institution.address}</p>
                  </div>
                </div>
              )}
              {institution.website && (
                <div className="flex items-start gap-2">
                  <Globe size={18} className="text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Website</p>
                    <a 
                      href={institution.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {institution.website}
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-secondary rounded-lg text-center">
                <Layers className="mx-auto mb-2 text-primary" size={24} />
                <p className="text-2xl font-bold">{institution.departmentCount || 0}</p>
                <p className="text-xs text-muted-foreground">Departments</p>
              </div>
              <div className="p-4 bg-secondary rounded-lg text-center">
                <Users className="mx-auto mb-2 text-primary" size={24} />
                <p className="text-2xl font-bold">{institution.userCount || 0}</p>
                <p className="text-xs text-muted-foreground">Users</p>
              </div>
              <div className="p-4 bg-secondary rounded-lg text-center">
                <BookOpen className="mx-auto mb-2 text-primary" size={24} />
                <p className="text-2xl font-bold">{institution.proposalCount || 0}</p>
                <p className="text-xs text-muted-foreground">Proposals</p>
              </div>
              <div className="p-4 bg-secondary rounded-lg text-center">
                <Building2 className="mx-auto mb-2 text-primary" size={24} />
                <p className="text-2xl font-bold">{institution.departments?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Active Depts</p>
              </div>
            </div>

            {/* Departments List */}
            {institution.departments && institution.departments.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Departments</h4>
                <div className="grid grid-cols-1 gap-2">
                  {institution.departments.map((dept) => (
                    <div key={dept.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{dept.name}</p>
                          <p className="text-xs text-muted-foreground">Code: {dept.code}</p>
                        </div>
                        {dept.hod && (
                          <p className="text-sm">HOD: {dept.hod.fullName}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={onEdit}>
                Edit Institution
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}