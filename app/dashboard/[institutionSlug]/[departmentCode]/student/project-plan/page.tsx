// app/dashboard/[institutionSlug]/[departmentCode]/student/project-plan/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/card-component'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Loader2, 
  Plus, 
  Edit, 
  Eye, 
  Download, 
  Trash2, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  FileText,
  User
} from 'lucide-react'
import { useStudentProposalStore } from '@/store/student/propsal/studentProposalStore'
import { useProjectPlanStore } from '@/store/student/projectPlan/projectPlanStore'

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-blue-100 text-blue-700'
    case 'COMPLETED':
      return 'bg-green-100 text-green-700'
    case 'ARCHIVED':
      return 'bg-gray-100 text-gray-700'
    default:
      return 'bg-yellow-100 text-yellow-700'
  }
}

const getMilestoneStatusColor = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return 'bg-green-100 text-green-700'
    case 'IN_PROGRESS':
      return 'bg-blue-100 text-blue-700'
    case 'OVERDUE':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

const formatDate = (date: string | null) => {
  if (!date) return 'Not set'
  return new Date(date).toLocaleDateString()
}

export default function ProjectPlanPage() {
  const params = useParams()
  const router = useRouter()
  const institutionSlug = params.institutionSlug as string
  const departmentCode = params.departmentCode as string
  
  const { 
    projectPlans, 
    loading, 
    error, 
    fetchProjectPlans, 
    createProjectPlan,
    updateMilestone,
    deleteProjectPlan,
    clearError 
  } = useProjectPlanStore()
  
  const { proposals, fetchProposals } = useStudentProposalStore()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedProposal, setSelectedProposal] = useState<string>('')
  const [creating, setCreating] = useState(false)
  const [selectedDuration, setSelectedDuration] = useState<number>(6)

  useEffect(() => {
    fetchProjectPlans()
    fetchProposals(1, 50)
  }, [fetchProjectPlans, fetchProposals])

  const approvedProposals = proposals
  // const approvedProposals = proposals.filter(p => p.status === 'APPROVED')
  const hasExistingPlan = (proposalId: string) => {
    return projectPlans.some(plan => plan.proposalId === proposalId)
  }

  console.log(approvedProposals, 'ava proposals')
  console.log(selectedProposal, 'sell proposals')

  const handleCreatePlan = async () => {
    if (!selectedProposal) {
      alert('Please select a proposal')
      return
    }
    
    if (!selectedDuration) {
      alert('Please select a duration')
      return
    }
    
    setCreating(true)
    try {
      const success = await createProjectPlan(selectedProposal, selectedDuration)
      if (success) {
        setShowCreateDialog(false)
        setSelectedProposal('')
        setSelectedDuration(6)
      }
    } finally {
      setCreating(false)
    }
  }

  const handleUpdateMilestone = async (planId: string, milestoneId: string, currentStatus: string) => {
    // Define the valid status types
    let newStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE'
    
    if (currentStatus === 'COMPLETED') {
      newStatus = 'PENDING'
    } else if (currentStatus === 'PENDING') {
      newStatus = 'IN_PROGRESS'
    } else if (currentStatus === 'IN_PROGRESS') {
      newStatus = 'COMPLETED'
    } else {
      newStatus = 'PENDING'
    }
    
    await updateMilestone(planId, milestoneId, { status: newStatus })
  }

  const handleDeletePlan = async (planId: string) => {
    if (confirm('Are you sure you want to delete this project plan?')) {
      await deleteProjectPlan(planId)
    }
  }

  const calculateProgress = (milestones: any[]) => {
    if (!milestones.length) return 0
    const completed = milestones.filter(m => m.status === 'COMPLETED').length
    return Math.round((completed / milestones.length) * 100)
  }

  if (loading && projectPlans.length === 0) {
    return (
      <DashboardLayout>
        <main className="flex-1 md:ml-0 overflow-hidden">
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading project plans...</p>
          </div>
        </main>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <main className="flex-1 md:ml-0 overflow-hidden">
        <DashboardHeader
          title="Project Plan"
          subtitle="Track your research project milestones and timeline"
        />

        <div className="p-6 space-y-6 animate-fade-in">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
              <Button variant="outline" size="sm" className="ml-4" onClick={clearError}>
                Dismiss
              </Button>
            </Alert>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {projectPlans.length === 0 ? 'No Active Projects' : `Active Projects (${projectPlans.length})`}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Monitor your research timeline and deliverables
              </p>
            </div>
            {approvedProposals.length > 0 && (
              <Button 
                className="w-full sm:w-auto gap-2 animate-scale-in"
                onClick={() => setShowCreateDialog(true)}
              >
                <Plus size={18} />
                Create Project Plan
              </Button>
            )}
          </div>

          {/* Create Plan Dialog */}
          {showCreateDialog && (
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">Create Project Plan</CardTitle>
                <CardDescription>
                  Select an approved proposal and choose the project duration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Select Proposal
                  </label>
                  <select
                    className="w-full p-3 border border-border rounded-lg bg-background"
                    value={selectedProposal}
                    onChange={(e) => setSelectedProposal(e.target.value)}
                  >
                    <option value="">Select a proposal...</option>
                    {approvedProposals.map(proposal => (
                      <option 
                        key={proposal.id} 
                        value={proposal.id}
                        disabled={hasExistingPlan(proposal.id)}
                      >
                        {proposal.title} {hasExistingPlan(proposal.id) ? '(Plan already exists)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Project Duration
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 3, label: '3 Months', description: 'Short-term project' },
                      { value: 6, label: '6 Months', description: 'Standard semester project' },
                      { value: 9, label: '9 Months', description: 'Extended project' },
                      { value: 12, label: '1 Year', description: 'Full academic year' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setSelectedDuration(option.value)}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          selectedDuration === option.value
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="font-semibold text-foreground">{option.label}</div>
                        <div className="text-xs text-muted-foreground mt-1">{option.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>What happens next?</strong> Based on your selected duration, we'll create a project plan with milestones evenly distributed across the timeline.
                  </p>
                </div>

                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={() => {
                    setShowCreateDialog(false)
                    setSelectedProposal('')
                    setSelectedDuration(6)
                  }}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreatePlan} 
                    disabled={!selectedProposal || !selectedDuration || creating}
                  >
                    {creating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      `Create ${selectedDuration}-Month Plan`
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Plans Message */}
          {projectPlans.length === 0 && !showCreateDialog && (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Project Plans Yet</h3>
                <p className="text-muted-foreground mb-6">
                  You need an approved proposal before you can create a project plan.
                </p>
                {approvedProposals.length === 0 ? (
                  <Button disabled>No Approved Proposals</Button>
                ) : (
                  <Button onClick={() => setShowCreateDialog(true)}>
                    Create Your First Project Plan
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Projects List */}
          {projectPlans.map((plan) => {
            const progress = calculateProgress(plan.milestones)
            const statusColor = getStatusColor(plan.status)
            
            return (
              <Card key={plan.id} className="hover:shadow-md transition-all duration-300 animate-slide-up">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{plan.title}</CardTitle>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {plan.proposal?.supervisor && (
                          <p className="flex items-center gap-1">
                            <User size={14} />
                            Supervisor: {plan.proposal.supervisor.fullName}
                          </p>
                        )}
                        <p className="flex items-center gap-1">
                          <Calendar size={14} />
                          Start: {formatDate(plan.startDate)}
                        </p>
                        <p className="flex items-center gap-1">
                          <Calendar size={14} />
                          End: {formatDate(plan.endDate)}
                        </p>
                      </div>
                    </div>
                    <Badge className={statusColor}>
                      {plan.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-medium text-foreground">Overall Progress</p>
                      <span className="text-sm font-semibold text-primary">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {/* Milestones */}
                  <div>
                    <h4 className="font-semibold text-foreground mb-3 text-sm">Milestones</h4>
                    <div className="space-y-3">
                      {plan.milestones.map((milestone) => {
                        const milestoneStatusColor = getMilestoneStatusColor(milestone.status)
                        const isOverdue = milestone.status === 'OVERDUE'
                        const isCompleted = milestone.status === 'COMPLETED'
                        
                        return (
                          <div key={milestone.id} className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                            <div className={`p-2 rounded-full ${isCompleted ? 'bg-green-100' : isOverdue ? 'bg-red-100' : 'bg-gray-100'}`}>
                              {isCompleted ? (
                                <CheckCircle size={16} className="text-green-700" />
                              ) : isOverdue ? (
                                <AlertCircle size={16} className="text-red-700" />
                              ) : (
                                <Clock size={16} className="text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className={`text-sm font-medium ${isCompleted ? 'text-green-700 line-through' : isOverdue ? 'text-red-700' : 'text-foreground'}`}>
                                {milestone.title}
                              </p>
                              {milestone.description && (
                                <p className="text-xs text-muted-foreground mt-1">{milestone.description}</p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                Due: {formatDate(milestone.dueDate)}
                              </p>
                            </div>
                            <Badge 
                              className={`cursor-pointer ${milestoneStatusColor}`}
                              onClick={() => handleUpdateMilestone(plan.id, milestone.id, milestone.status)}
                            >
                              {milestone.status === 'COMPLETED' ? 'Completed' : 
                               milestone.status === 'IN_PROGRESS' ? 'In Progress' : 
                               milestone.status === 'OVERDUE' ? 'Overdue' : 'Pending'}
                            </Badge>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 flex-wrap">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => router.push(`/dashboard/${institutionSlug}/${departmentCode}/student/project-plan/${plan.id}`)}
                    >
                      <Eye size={16} className="mr-1" />
                      View Details
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => router.push(`/dashboard/${institutionSlug}/${departmentCode}/student/project-plan/edit/${plan.id}`)}
                    >
                      <Edit size={16} className="mr-1" />
                      Edit Plan
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => alert('Download feature coming soon')}
                    >
                      <Download size={16} className="mr-1" />
                      Download
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 text-red-600 hover:text-red-700"
                      onClick={() => handleDeletePlan(plan.id)}
                    >
                      <Trash2 size={16} className="mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </main>
    </DashboardLayout>
  )
}







