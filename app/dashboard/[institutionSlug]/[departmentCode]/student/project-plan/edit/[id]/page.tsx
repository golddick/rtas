// app/dashboard/[institutionSlug]/[departmentCode]/student/project-plan/edit/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/card-component'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, Save, X, Calendar, Clock, Plus, Trash2 } from 'lucide-react'
import { useProjectPlanStore } from '@/store/student/projectPlan/projectPlanStore'

type PlanStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'
type MilestoneStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE'

interface MilestoneForm {
  id: string
  title: string
  description: string
  dueDate: string
  status: MilestoneStatus
  order: number
  completion: number
}

export default function EditProjectPlanPage() {
  const params = useParams()
  const router = useRouter()
  const institutionSlug = params.institutionSlug as string
  const departmentCode = params.departmentCode as string
  const planId = params.id as string

  const { currentPlan, loading, error, fetchProjectPlanById, updateProjectPlan, updateMilestone, clearError } = useProjectPlanStore()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<PlanStatus>('DRAFT')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [milestones, setMilestones] = useState<MilestoneForm[]>([])
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (planId) {
      fetchProjectPlanById(planId)
    }
  }, [planId, fetchProjectPlanById])

  useEffect(() => {
    if (currentPlan) {
      setTitle(currentPlan.title)
      setDescription(currentPlan.description)
      setStatus(currentPlan.status as PlanStatus)
      setStartDate(currentPlan.startDate ? new Date(currentPlan.startDate).toISOString().split('T')[0] : '')
      setEndDate(currentPlan.endDate ? new Date(currentPlan.endDate).toISOString().split('T')[0] : '')
      setMilestones(currentPlan.milestones.map(m => ({
        id: m.id,
        title: m.title,
        description: m.description || '',
        dueDate: m.dueDate ? new Date(m.dueDate).toISOString().split('T')[0] : '',
        status: m.status as MilestoneStatus,
        order: m.order || 0,
        completion: m.completion
      })))
    }
  }, [currentPlan])

  const handleMilestoneChange = (index: number, field: keyof MilestoneForm, value: any) => {
    const updated = [...milestones]
    updated[index] = { ...updated[index], [field]: value }
    setMilestones(updated)
    setHasChanges(true)
  }

  const handleAddMilestone = () => {
    const newOrder = milestones.length + 1
    setMilestones([
      ...milestones,
      {
        id: `temp_${Date.now()}`,
        title: '',
        description: '',
        dueDate: '',
        status: 'PENDING',
        order: newOrder,
        completion: 0
      }
    ])
    setHasChanges(true)
  }

  const handleRemoveMilestone = (index: number) => {
    const updated = milestones.filter((_, i) => i !== index)
    const reordered = updated.map((m, idx) => ({ ...m, order: idx + 1 }))
    setMilestones(reordered)
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Title is required')
      return
    }

    setSaving(true)
    try {
      // Update project plan basic info
      await updateProjectPlan(planId, {
        title: title.trim(),
        description: description.trim(),
        status: status,
        startDate: startDate ? new Date(startDate).toISOString() : null,
        endDate: endDate ? new Date(endDate).toISOString() : null,
      })

      // Update milestones
      for (const milestone of milestones) {
        if (milestone.id.startsWith('temp_')) {
          // This is a new milestone - you may need a create endpoint
          console.log('Would create new milestone:', milestone)
        } else {
          // Update existing milestone
          await updateMilestone(planId, milestone.id, {
            title: milestone.title,
            description: milestone.description,
            dueDate: milestone.dueDate ? new Date(milestone.dueDate).toISOString() : null,
            status: milestone.status,
            order: milestone.order,
            completion: milestone.completion
          })
        }
      }

      setHasChanges(false)
      router.push(`/dashboard/${institutionSlug}/${departmentCode}/student/project-plan/${planId}`)
    } catch (err) {
      console.error('Failed to save:', err)
      alert('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  if (loading && !currentPlan) {
    return (
      <DashboardLayout>
        <main className="flex-1 md:ml-0 overflow-hidden">
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading project plan...</p>
          </div>
        </main>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <main className="flex-1 md:ml-0 overflow-hidden">
          <div className="p-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
              <Button variant="outline" size="sm" className="ml-4" onClick={clearError}>
                Dismiss
              </Button>
            </Alert>
          </div>
        </main>
      </DashboardLayout>
    )
  }

  if (!currentPlan) {
    return (
      <DashboardLayout>
        <main className="flex-1 md:ml-0 overflow-hidden">
          <div className="p-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Project plan not found</AlertDescription>
            </Alert>
            <Button className="mt-4" onClick={() => router.back()}>
              Go Back
            </Button>
          </div>
        </main>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <main className="flex-1 md:ml-0 overflow-hidden">
        <DashboardHeader
          title="Edit Project Plan"
          subtitle="Update your project plan details and milestones"
        />

        <div className="p-6 space-y-6 animate-fade-in">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Update the core details of your project plan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Project Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value)
                    setHasChanges(true)
                  }}
                  placeholder="Enter project title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value)
                    setHasChanges(true)
                  }}
                  rows={4}
                  placeholder="Describe your project plan"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value as PlanStatus)
                      setHasChanges(true)
                    }}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="ACTIVE">Active</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value)
                      setHasChanges(true)
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value)
                      setHasChanges(true)
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Milestones Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Milestones</CardTitle>
                <CardDescription>Manage your project milestones and deadlines</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleAddMilestone} className="gap-1">
                <Plus size={14} />
                Add Milestone
              </Button>
            </CardHeader>
            <CardContent>
              {milestones.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No milestones added yet</p>
                  <Button variant="link" onClick={handleAddMilestone} className="mt-2">
                    Add your first milestone
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {milestones.map((milestone, index) => (
                    <div key={milestone.id} className="border border-border rounded-lg p-4 relative">
                      <div className="absolute top-2 right-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMilestone(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div className="space-y-2">
                          <Label>Milestone Title *</Label>
                          <Input
                            value={milestone.title}
                            onChange={(e) => handleMilestoneChange(index, 'title', e.target.value)}
                            placeholder="e.g., Literature Review"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Due Date</Label>
                          <Input
                            type="date"
                            value={milestone.dueDate}
                            onChange={(e) => handleMilestoneChange(index, 'dueDate', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>Description</Label>
                          <Textarea
                            value={milestone.description}
                            onChange={(e) => handleMilestoneChange(index, 'description', e.target.value)}
                            rows={2}
                            placeholder="Describe what needs to be accomplished"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <select
                            value={milestone.status}
                            onChange={(e) => handleMilestoneChange(index, 'status', e.target.value as MilestoneStatus)}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <option value="PENDING">Pending</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="OVERDUE">Overdue</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>Order / Phase</Label>
                          <Input
                            type="number"
                            value={milestone.order}
                            onChange={(e) => handleMilestoneChange(index, 'order', parseInt(e.target.value))}
                            min={1}
                            max={milestones.length}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={handleCancel} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !hasChanges}>
              {saving ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </DashboardLayout>
  )
}