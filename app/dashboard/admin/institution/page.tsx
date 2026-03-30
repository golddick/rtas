'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/card-component'
import { Button } from '@/components/ui/button'
import { 
  Plus, Edit, Trash2, Eye, Building2, Users, BookOpen, 
  AlertCircle, MapPin, Globe 
} from 'lucide-react'
import { useInstitutionStore } from '@/store/admin/institutionStore'
import { CreateInstitutionData, Institution } from '@/store/admin/type/institution'
import { AddInstitutionModal } from '../_component/add-institution-modal'
import { ViewInstitutionModal } from '../_component/view-institution-modal'

export default function InstitutionsPage() {
  const { 
    institutions, 
    fetchInstitutions, 
    createInstitution,
    updateInstitution,
    deleteInstitution,
    isLoading, 
    error 
  } = useInstitutionStore()
  
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingInstitution, setEditingInstitution] = useState<Institution | null>(null)

  // Fetch institutions on mount
  useEffect(() => {
    fetchInstitutions()
  }, [])

  const handleAddInstitution = async (data: CreateInstitutionData) => {
    await createInstitution(data)
  }

  const handleUpdateInstitution = async (data: CreateInstitutionData) => {
    if (editingInstitution) {
      await updateInstitution(editingInstitution.id, data)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await deleteInstitution(id)
      } catch (error) {
        // Error is handled by store
      }
    }
  }

  if (isLoading && institutions.length === 0) {
    return (
      <DashboardLayout>
        <main className="flex-1 overflow-hidden">
          <DashboardHeader title="Institution Management" />
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
          title="Institution Management"
          subtitle="Manage institutions, their departments, and settings"
        />

        <div className="p-6 space-y-6 animate-fade-in">
          {/* Header with Add Button */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                All Institutions ({institutions.length})
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Manage educational institutions and their departments
              </p>
            </div>
            <Button 
              className="w-full sm:w-auto gap-2 animate-scale-in" 
              onClick={() => {
                setEditingInstitution(null)
                setShowAddModal(true)
              }}
            >
              <Plus size={18} />
              Add Institution
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="text-destructive flex-shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Institutions Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {institutions.map((inst, idx) => (
              <Card key={inst.id} className="hover:shadow-md transition-all duration-300 animate-slide-up" >
                <CardHeader>
                  <div className="flex items-start gap-3">
                    {inst.logoUrl ? (
                      <img 
                        src={inst.logoUrl} 
                        alt={inst.name}
                        className="w-12 h-12 object-contain rounded-lg border"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Building2 className="text-primary" size={24} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{inst.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">Code: {inst.code}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Status and Quick Info */}
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      inst.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-700' 
                        : inst.status === 'INACTIVE'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {inst.status}
                    </span>
                    {inst.website && (
                      <a 
                        href={inst.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        <Globe size={12} />
                        Website
                      </a>
                    )}
                  </div>

                  {/* Description */}
                  {inst.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {inst.description}
                    </p>
                  )}

                  {/* Address */}
                  {inst.address && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin size={16} className="text-muted-foreground shrink-0 mt-0.5" />
                      <span className="text-muted-foreground line-clamp-1">{inst.address}</span>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="text-center">
                      <p className="text-lg font-bold">{inst.departmentCount || 0}</p>
                      <p className="text-xs text-muted-foreground">Departments</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold">{inst.userCount || 0}</p>
                      <p className="text-xs text-muted-foreground">Users</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold">{inst.proposalCount || 0}</p>
                      <p className="text-xs text-muted-foreground">Proposals</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => {
                      setSelectedInstitution(inst)
                      setShowViewModal(true)
                    }}>
                      <Eye size={16} />
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => {
                      setEditingInstitution(inst)
                      setShowAddModal(true)
                    }}>
                      <Edit size={16} />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 hover:bg-red-50 hover:text-red-600" 
                      onClick={() => handleDelete(inst.id, inst.name)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {institutions.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No Institutions</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Get started by creating your first institution.
              </p>
              <Button 
                className="mt-4 gap-2"
                onClick={() => {
                  setEditingInstitution(null)
                  setShowAddModal(true)
                }}
              >
                <Plus size={18} />
                Add Institution
              </Button>
            </div>
          )}
        </div>

        {/* Add/Edit Institution Modal */}
        <AddInstitutionModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false)
            setEditingInstitution(null)
          }}
          onAdd={editingInstitution ? handleUpdateInstitution : handleAddInstitution}
          editingInstitution={editingInstitution}
        />

        {/* View Institution Modal */}
        {selectedInstitution && (
          <ViewInstitutionModal
            isOpen={showViewModal}
            onClose={() => {
              setShowViewModal(false)
              setSelectedInstitution(null)
            }}
            onEdit={() => {
              setShowViewModal(false)
              setEditingInstitution(selectedInstitution)
              setShowAddModal(true)
            }}
            institution={selectedInstitution}
          />
        )}
      </main>
    </DashboardLayout>
  )
}