// app/(dashboard)/hod/dashboard/page.tsx
'use client'

import { useEffect } from 'react'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/card-component'
import { StatCard } from '@/components/stat-card'
import { Button } from '@/components/ui/button'
import { Users, FileText, TrendingUp, AlertCircle, RefreshCw, Award, Clock, CheckCircle, XCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useRouter } from 'next/navigation'
import { useDashboardStore } from '@/store/hod/dashboard/dashboardStore'

const formatStatus = (status: string) => {
  return status.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ')
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'APPROVED':
      return 'bg-green-100 text-green-700'
    case 'SUBMITTED':
      return 'bg-gray-100 text-gray-700'
    case 'UNDER_REVIEW':
      return 'bg-blue-100 text-blue-700'
    case 'REVISION_REQUESTED':
      return 'bg-orange-100 text-orange-700'
    case 'REJECTED':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

export default function HODDashboard() {
  const router = useRouter()
  const { data, loading, error, lastUpdated, fetchDashboardData, clearError } = useDashboardStore()

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const handleRefresh = () => {
    fetchDashboardData()
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={clearError} className="mt-4" variant="outline">
          Dismiss
        </Button>
        <Button onClick={handleRefresh} className="mt-4 ml-2" variant="outline">
          <RefreshCw size={16} className="mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="flex gap-0">
      <main className="flex-1 md:ml-0 overflow-hidden">
        <div>
          <DashboardHeader
          title={`Welcome back, HOD`}
          subtitle="Monitor departmental research activity and manage allocations"
        />

        </div>

        <div className="p-6 space-y-6 animate-fade-in">
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Students"
              value={loading ? "..." : data?.stats.totalStudents?.toString() || "0"}
              icon={<Users size={24} />}
              trend={!loading && data?.stats.totalStudents ? { value: 12, direction: 'up' } : undefined}
            />
            <StatCard
              label="Active Supervisors"
              value={loading ? "..." : data?.stats.activeSupervisors?.toString() || "0"}
              icon={<Users size={24} />}
            />
            <StatCard
              label="Approved Topics"
              value={loading ? "..." : data?.stats.approvedProposals?.toString() || "0"}
              icon={<FileText size={24} />}
              color="success"
            />
            <StatCard
              label="Pending Approval"
              value={loading ? "..." : data?.stats.pendingProposals?.toString() || "0"}
              icon={<TrendingUp size={24} />}
              color="warning"
            />
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Department Overview */}
              <Card animated hover>
                <CardHeader>
                  <CardTitle>Department Overview</CardTitle>
                  <CardDescription>Current semester statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Approval Rate</p>
                        <p className="text-2xl font-bold text-foreground">
                          {loading ? "..." : `${data?.metrics.approvalRate || 0}%`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground mb-1">Average Review Time</p>
                        <p className="text-2xl font-bold text-foreground">
                          {loading ? "..." : `${data?.metrics.averageReviewTime || 0} days`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-xs text-muted-foreground mb-1">Approved</p>
                        <p className="text-2xl font-bold text-green-600">
                          {loading ? "..." : data?.stats.approvedProposals || 0}
                        </p>
                      </div>
                      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="text-xs text-muted-foreground mb-1">Pending</p>
                        <p className="text-2xl font-bold text-yellow-600">
                          {loading ? "..." : data?.stats.pendingProposals || 0}
                        </p>
                      </div>
                      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-xs text-muted-foreground mb-1">Rejected</p>
                        <p className="text-2xl font-bold text-red-600">
                          {loading ? "..." : data?.stats.rejectedProposals || 0}
                        </p>
                      </div>
                    </div>

                    {/* Additional Stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs text-muted-foreground mb-1">Under Review</p>
                        <p className="text-lg font-bold text-blue-600">
                          {loading ? "..." : data?.stats.underReviewProposals || 0}
                        </p>
                      </div>
                      <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <p className="text-xs text-muted-foreground mb-1">Revision Needed</p>
                        <p className="text-lg font-bold text-orange-600">
                          {loading ? "..." : data?.stats.revisionNeededProposals || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Proposals */}
              <Card animated hover>
                <CardHeader>
                  <CardTitle>Recent Proposals</CardTitle>
                  <CardDescription>Latest submissions from students</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="p-4 bg-secondary rounded-lg animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : data?.recentProposals.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No recent proposals</p>
                  ) : (
                    <div className="space-y-3">
                      {data?.recentProposals.map((item, idx) => (
                        <div 
                          key={item.id} 
                          className="p-4 bg-secondary rounded-lg border border-border hover:border-primary transition-colors duration-200 cursor-pointer"
                          onClick={() => router.push(`/hod/proposals?view=${item.id}`)}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <p className="font-semibold text-foreground">{item.title}</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {item.studentName} • {item.supervisorName}
                              </p>
                            </div>
                            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusColor(item.status)}`}>
                              {formatStatus(item.status)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">{item.timeAgo}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Top Supervisors */}
              <Card animated hover>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award size={20} />
                    Top Supervisors
                  </CardTitle>
                  <CardDescription>By number of supervised students</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="p-3 bg-secondary rounded-lg animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : data?.topSupervisors.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No supervisors found</p>
                  ) : (
                    data?.topSupervisors.map((sup, idx) => (
                      <div 
                        key={sup.id} 
                        className="p-3 bg-secondary rounded-lg border border-border hover:border-primary transition-colors duration-200 cursor-pointer"
                        onClick={() => router.push(`/hod/supervisors/${sup.id}`)}
                      >
                        <p className="font-semibold text-foreground text-sm">{sup.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {sup.studentsCount} students • {sup.approvedTopics} approved topics
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card animated hover>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock size={20} />
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-secondary rounded-lg">
                    <span className="text-sm">Total Proposals</span>
                    <span className="font-bold text-lg">
                      {loading ? "..." : data?.stats.totalProposals || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-secondary rounded-lg">
                    <span className="text-sm">Active Supervisors</span>
                    <span className="font-bold text-lg">
                      {loading ? "..." : data?.stats.activeSupervisors || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-secondary rounded-lg">
                    <span className="text-sm">Total Students</span>
                    <span className="font-bold text-lg">
                      {loading ? "..." : data?.stats.totalStudents || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Department Info */}
              <Card animated hover>
                <CardHeader>
                  <CardTitle className="text-lg">Department Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Department</p>
                    <p className="font-semibold">{data?.departmentInfo?.name || 'Loading...'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Faculty</p>
                    <p className="font-semibold">{data?.departmentInfo?.faculty || 'Loading...'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Department Code</p>
                    <p className="font-semibold">{data?.departmentInfo?.code || 'Loading...'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Last Updated */}
              {lastUpdated && (
                <p className="text-xs text-muted-foreground text-center">
                  Last updated: {new Date(lastUpdated).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}