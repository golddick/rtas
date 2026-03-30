// app/dashboard/[institutionSlug]/[departmentCode]/student/page.tsx
'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/card-component'
import { StatCard } from '@/components/stat-card'
import { Button } from '@/components/ui/button'
import { 
  Loader2, Users, AlertCircle, Clock, MessageSquare, 
  FileText, CheckCircle, XCircle, Eye, Send, UserPlus 
} from 'lucide-react'
import { useStudentDashboardStore } from '@/store/student/dashboard/dashboardStore'


const getStatusColor = (status: string) => {
  switch (status) {
    case 'APPROVED':
      return 'text-green-600 bg-green-50 border-green-200'
    case 'UNDER_REVIEW':
      return 'text-blue-600 bg-blue-50 border-blue-200'
    case 'REVISION_REQUESTED':
      return 'text-orange-600 bg-orange-50 border-orange-200'
    case 'SUBMITTED':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    case 'REJECTED':
      return 'text-red-600 bg-red-50 border-red-200'
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'APPROVED':
      return <CheckCircle size={16} />
    case 'UNDER_REVIEW':
      return <Clock size={16} />
    case 'REVISION_REQUESTED':
      return <AlertCircle size={16} />
    case 'REJECTED':
      return <XCircle size={16} />
    default:
      return <FileText size={16} />
  }
}

const formatStatus = (status: string) => {
  if (status === 'No Proposal') return 'No Proposal'
  return status.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ')
}

export default function StudentDashboard() {
  const params = useParams()
  const router = useRouter()
  const institutionSlug = params.institutionSlug as string
  const departmentCode = params.departmentCode as string
  
  const { data, loading, error, fetchDashboardData, clearData } = useStudentDashboardStore()

  useEffect(() => {
    fetchDashboardData()
    
    // Cleanup on unmount
    return () => {
      clearData()
    }
  }, [fetchDashboardData, clearData])

  if (loading) {
    return (
      <DashboardLayout>
        <main className="flex-1 md:ml-0 overflow-hidden">
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading your dashboard...</p>
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
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={() => fetchDashboardData()}>
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </DashboardLayout>
    )
  }

  const proposalStatusClass = getStatusColor(data?.stats.proposalStatus || 'No Proposal')
  const proposalStatusIcon = getStatusIcon(data?.stats.proposalStatus || 'No Proposal')

  return (
    <DashboardLayout>
      <main className="flex-1 md:ml-0 overflow-hidden">
        <DashboardHeader
          title={`Welcome back, ${data?.user?.fullName?.split(' ')[0] || 'Student'}`}
          subtitle="Track your research proposals and connect with your supervisor"
        />

        <div className="p-6 space-y-6 animate-fade-in">
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Supervisor"
              value={data?.supervisor?.fullName || 'Not Assigned'}
              icon={<Users size={24} />}
              color={data?.supervisor ? 'success' : 'warning'}
            />
            <StatCard
              label="Proposal Status"
              value={formatStatus(data?.stats.proposalStatus || 'No Proposal')}
              icon={proposalStatusIcon}
              color={
                data?.stats.proposalStatus === 'APPROVED' ? 'success' : 
                data?.stats.proposalStatus === 'REJECTED' ? 'warning' : 
                data?.stats.proposalStatus === 'UNDER_REVIEW' ? 'primary' : 'warning'
              }
            />
            <StatCard
              label="Days Since Submission"
              value={data?.stats.daysSinceSubmission?.toString() || '-'}
              icon={<Clock size={24} />}
            />
            <StatCard
              label="Unread Messages"
              value={data?.stats.unreadMessages?.toString() || '0'}
              icon={<MessageSquare size={24} />}
              color={data?.stats.unreadMessages && data.stats.unreadMessages > 0 ? 'warning' : 'primary'}
            />
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Current Proposal */}
              <Card animated hover>
                <CardHeader>
                  <CardTitle>Current Proposal</CardTitle>
                  <CardDescription>Status and details of your submitted research topic</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data?.currentProposal ? (
                    <>
                      <div className={`p-4 rounded-lg border ${proposalStatusClass}`}>
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-foreground">{data.currentProposal.title}</h4>
                          <span className="flex items-center gap-1 text-xs font-medium">
                            {proposalStatusIcon}
                            {formatStatus(data.currentProposal.status)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          {data.currentProposal.description}
                        </p>
                        {data.currentProposal.feedback && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs font-medium text-gray-700 mb-1">Latest Feedback:</p>
                            <p className="text-sm text-gray-600">{data.currentProposal.feedback}</p>
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Submitted</p>
                          <p className="font-semibold text-foreground">
                            {data.currentProposal.submittedAt 
                              ? new Date(data.currentProposal.submittedAt).toLocaleDateString()
                              : 'Not submitted'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Department</p>
                          <p className="font-semibold text-foreground">{data?.department?.name || 'N/A'}</p>
                        </div>
                        {data.currentProposal.score && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Score</p>
                            <p className="font-semibold text-foreground">{data.currentProposal.score}/100</p>
                          </div>
                        )}
                      </div>
                      {data.currentProposal.status !== 'APPROVED' && data.currentProposal.status !== 'REJECTED' && (
                        <div className="flex gap-3 pt-2">
                          <Link href={`/dashboard/${institutionSlug}/${departmentCode}/student/proposals/edit/${data.currentProposal.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye size={16} className="mr-2" />
                              Edit Proposal
                            </Button>
                          </Link>
                          {data.currentProposal.status === 'REVISION_REQUESTED' && (
                            <Button size="sm">
                              <FileText size={16} className="mr-2" />
                              View Feedback
                            </Button>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 mb-4">You haven't submitted any proposal yet</p>
                      <Link href={`/dashboard/${institutionSlug}/${departmentCode}/student/proposals/add`}>
                        <Button>
                          <FileText size={16} className="mr-2" />
                          Submit Your First Proposal
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card animated hover>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Your latest interactions and updates</CardDescription>
                </CardHeader>
                <CardContent>
                  {data?.recentActivities && data.recentActivities.length > 0 ? (
                    <div className="space-y-4">
                      {data.recentActivities.map((activity, idx) => (
                        <div key={idx} className="flex gap-3 pb-4 border-b border-border last:border-0 last:pb-0">
                          <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm text-foreground">{activity.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(activity.date).toLocaleDateString()} at {new Date(activity.date).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No recent activities</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Supervisor Card */}
              <Card animated hover>
                <CardHeader>
                  <CardTitle className="text-lg">Your Supervisor</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data?.supervisor ? (
                    <>
                      <div className="flex items-center gap-3 pb-4 border-b border-border">
                        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-lg">
                          {data.supervisor.fullName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{data.supervisor.fullName}</p>
                          <p className="text-xs text-muted-foreground">{data.supervisor.department || 'Department'}</p>
                          <p className="text-xs text-muted-foreground mt-1">{data.supervisor.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/dashboard/${institutionSlug}/${departmentCode}/student/messages`} className="flex-1">
                          <Button className="w-full gap-2">
                            <Send size={16} />
                            Send Message
                          </Button>
                        </Link>
                        <Button variant="outline" className="gap-2">
                          <UserPlus size={16} />
                          View Profile
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-muted-foreground mb-2">No supervisor assigned yet</p>
                      <p className="text-xs text-muted-foreground">
                        Your department will assign a supervisor soon
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card animated hover>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link href={`/dashboard/${institutionSlug}/${departmentCode}/student/proposals/add`}>
                    <button className="w-full px-4 py-2 text-left text-primary font-medium hover:bg-secondary rounded-lg transition-colors duration-200 flex items-center gap-2">
                      <FileText size={16} />
                      Submit New Proposal
                    </button>
                  </Link>
                  <Link href={`/dashboard/${institutionSlug}/${departmentCode}/student/proposals`}>
                    <button className="w-full px-4 py-2 text-left text-primary font-medium hover:bg-secondary rounded-lg transition-colors duration-200 flex items-center gap-2">
                      <Eye size={16} />
                      View All Proposals
                    </button>
                  </Link>
                  <Link href={`/dashboard/${institutionSlug}/${departmentCode}/student/messages`}>
                    <button className="w-full px-4 py-2 text-left text-primary font-medium hover:bg-secondary rounded-lg transition-colors duration-200 flex items-center gap-2">
                      <MessageSquare size={16} />
                      Messages {data?.stats.unreadMessages && data.stats.unreadMessages > 0 && `(${data.stats.unreadMessages})`}
                    </button>
                  </Link>
                  <Link href={`/dashboard/${institutionSlug}/${departmentCode}/student/supervisor`}>
                    <button className="w-full px-4 py-2 text-left text-primary font-medium hover:bg-secondary rounded-lg transition-colors duration-200 flex items-center gap-2">
                      <Users size={16} />
                      View Supervisor Details
                    </button>
                  </Link>
                </CardContent>
              </Card>

              {/* Tips Card */}
              <Card animated hover>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle size={14} className="text-primary mt-0.5 flex-shrink-0" />
                      <span>Submit your proposal before the deadline</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle size={14} className="text-primary mt-0.5 flex-shrink-0" />
                      <span>Check messages regularly for supervisor feedback</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle size={14} className="text-primary mt-0.5 flex-shrink-0" />
                      <span>Review feedback carefully and make revisions</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </DashboardLayout>
  )
}