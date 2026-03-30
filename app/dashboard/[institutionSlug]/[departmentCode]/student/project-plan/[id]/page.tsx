// app/dashboard/[institutionSlug]/[departmentCode]/student/project-plan/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
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
  ArrowLeft, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  FileText,
  User,
  Edit,
  Trash2,
  ChevronRight
} from 'lucide-react'
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

const getMilestoneStatusIcon = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return <CheckCircle size={16} className="text-green-600" />
    case 'IN_PROGRESS':
      return <Clock size={16} className="text-blue-600" />
    case 'OVERDUE':
      return <AlertCircle size={16} className="text-red-600" />
    default:
      return <Clock size={16} className="text-gray-500" />
  }
}

const formatDate = (date: string | null) => {
  if (!date) return 'Not set'
  return new Date(date).toLocaleDateString()
}

export default function ProjectPlanDetailPage() {
  const params = useParams()
  const router = useRouter()
  const institutionSlug = params.institutionSlug as string
  const departmentCode = params.departmentCode as string
  const planId = params.id as string
  
  const { 
    currentPlan, 
    loading, 
    error, 
    fetchProjectPlanById, 
    updateMilestone,
    deleteProjectPlan,
    clearError 
  } = useProjectPlanStore()
  
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (planId) {
      fetchProjectPlanById(planId)
    }
  }, [planId, fetchProjectPlanById])

  const handleUpdateMilestone = async (milestoneId: string, currentStatus: string) => {
    setUpdating(true)
    
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
    
    try {
      await updateMilestone(planId, milestoneId, { status: newStatus })
    } finally {
      setUpdating(false)
    }
  }

  const handleDeletePlan = async () => {
    if (confirm('Are you sure you want to delete this project plan? This action cannot be undone.')) {
      await deleteProjectPlan(planId)
      router.push(`/dashboard/${institutionSlug}/${departmentCode}/student/project-plan`)
    }
  }

  const calculateProgress = () => {
    if (!currentPlan?.milestones?.length) return 0
    const completed = currentPlan.milestones.filter(m => m.status === 'COMPLETED').length
    return Math.round((completed / currentPlan.milestones.length) * 100)
  }

  if (loading) {
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
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Project Plan Not Found</h3>
                <p className="text-muted-foreground mb-6">
                  The project plan you're looking for doesn't exist or you don't have access to it.
                </p>
                <Button onClick={() => router.push(`/dashboard/${institutionSlug}/${departmentCode}/student/project-plan`)}>
                  <ArrowLeft size={16} className="mr-2" />
                  Back to Project Plans
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </DashboardLayout>
    )
  }

  const progress = calculateProgress()
  const statusColor = getStatusColor(currentPlan.status)

  return (
    <DashboardLayout>
      <main className="flex-1 md:ml-0 overflow-hidden">
        <DashboardHeader 
          title={currentPlan.title}
          subtitle="Project Plan Details"
        />

        <div className="p-6 space-y-6 animate-fade-in">
          {/* Header Actions */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push(`/dashboard/${institutionSlug}/${departmentCode}/student/project-plan/edit/${planId}`)}
              >
                <Edit size={14} className="mr-1" />
                Edit Plan
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-red-600 hover:text-red-700"
                onClick={handleDeletePlan}
              >
                <Trash2 size={14} className="mr-1" />
                Delete
              </Button>
            </div>
            <Link href={`/dashboard/${institutionSlug}/${departmentCode}/student/proposals/${currentPlan.proposalId}`}>
              <Button variant="outline" size="sm">
                <FileText size={14} className="mr-1" />
                View Proposal
              </Button>
            </Link>
          </div>

          {/* Overview Card */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{currentPlan.title}</CardTitle>
                  <CardDescription className="mt-2">{currentPlan.description}</CardDescription>
                </div>
                <Badge className={statusColor}>
                  {currentPlan.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg">
                  <Calendar size={18} className="text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Start Date</p>
                    <p className="font-medium">{formatDate(currentPlan.startDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg">
                  <Calendar size={18} className="text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">End Date</p>
                    <p className="font-medium">{formatDate(currentPlan.endDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg">
                  <User size={18} className="text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Supervisor</p>
                    <p className="font-medium">{currentPlan.proposal?.supervisor?.fullName || 'Not Assigned'}</p>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium text-foreground">Overall Progress</p>
                  <span className="text-sm font-semibold text-primary">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Milestones Section */}
          <Card>
            <CardHeader>
              <CardTitle>Milestones</CardTitle>
              <CardDescription>
                Track your progress by updating milestone statuses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentPlan.milestones.map((milestone) => {
                  const milestoneStatusColor = getMilestoneStatusColor(milestone.status)
                  const isOverdue = milestone.status === 'OVERDUE'
                  const isCompleted = milestone.status === 'COMPLETED'
                  
                  return (
                    <div 
                      key={milestone.id} 
                      className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                        isCompleted ? 'bg-green-50 border-green-200' : 
                        isOverdue ? 'bg-red-50 border-red-200' : 
                        'bg-secondary border-border'
                      }`}
                    >
                      <button
                        onClick={() => handleUpdateMilestone(milestone.id, milestone.status)}
                        disabled={updating}
                        className="flex-shrink-0"
                      >
                        {getMilestoneStatusIcon(milestone.status)}
                      </button>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`font-medium ${isCompleted ? 'line-through text-green-700' : isOverdue ? 'text-red-700' : 'text-foreground'}`}>
                            {milestone.title}
                          </p>
                          {milestone.order && (
                            <Badge variant="outline" className="text-xs">
                              Phase {milestone.order}
                            </Badge>
                          )}
                        </div>
                        {milestone.description && (
                          <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Due: {formatDate(milestone.dueDate)}</span>
                          {milestone.completion > 0 && (
                            <span>Completion: {milestone.completion}%</span>
                          )}
                        </div>
                      </div>
                      
                      <Badge 
                        className={`cursor-pointer ${milestoneStatusColor}`}
                        onClick={() => handleUpdateMilestone(milestone.id, milestone.status)}
                      >
                        {milestone.status === 'COMPLETED' ? 'Completed' : 
                         milestone.status === 'IN_PROGRESS' ? 'In Progress' : 
                         milestone.status === 'OVERDUE' ? 'Overdue' : 'Pending'}
                        <ChevronRight size={12} className="ml-1" />
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Timeline View */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar size={18} />
                Timeline View
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentPlan.milestones.map((milestone, idx) => {
                  const isCompleted = milestone.status === 'COMPLETED'
                  const daysRemaining = milestone.dueDate 
                    ? Math.ceil((new Date(milestone.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                    : null
                  
                  return (
                    <div key={milestone.id} className="relative">
                      {idx < currentPlan.milestones.length - 1 && (
                        <div className="absolute left-[15px] top-[40px] bottom-0 w-0.5 bg-border" />
                      )}
                      <div className="flex gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isCompleted ? 'bg-green-100' : 'bg-primary/10'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle size={16} className="text-green-600" />
                          ) : (
                            <span className="text-xs font-medium text-primary">{milestone.order}</span>
                          )}
                        </div>
                        <div className="flex-1 pb-6">
                          <p className={`font-medium ${isCompleted ? 'line-through text-green-700' : 'text-foreground'}`}>
                            {milestone.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Due: {formatDate(milestone.dueDate)}
                            {daysRemaining !== null && daysRemaining > 0 && !isCompleted && (
                              <span className="ml-2 text-blue-600">({daysRemaining} days remaining)</span>
                            )}
                            {daysRemaining !== null && daysRemaining < 0 && !isCompleted && (
                              <span className="ml-2 text-red-600">(Overdue by {Math.abs(daysRemaining)} days)</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </DashboardLayout>
  )
}