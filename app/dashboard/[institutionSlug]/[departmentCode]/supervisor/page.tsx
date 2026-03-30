// app/(dashboard)/supervisor/dashboard/page.tsx
'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/card-component'
import { StatCard } from '@/components/stat-card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Users, Clock, CheckCircle, MessageSquare, TrendingUp, 
  FileText, Loader2, AlertCircle, ArrowRight 
} from 'lucide-react'
import Link from 'next/link'
import { useSupervisorDashboardStore } from '@/store/supervisor/dashboard/supervisorDashboardStore'
import { useUser } from '@/store/user/userStore'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'approved':
      return <div className="w-2 h-2 rounded-full bg-green-600 mt-2 flex-shrink-0" />
    case 'rejected':
      return <div className="w-2 h-2 rounded-full bg-red-600 mt-2 flex-shrink-0" />
    case 'submitted':
      return <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
    default:
      return <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
  }
}

const formatStatus = (status: string) => {
  return status.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ')
}

// Chart colors
const CHART_COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444']

export default function SupervisorDashboard() {
  const router = useRouter()
  const user = useUser()
  const params = useParams()
  const institutionSlug = params.institutionSlug as string
  const departmentCode = params.departmentCode as string

  const { data, loading, error, lastUpdated, fetchDashboardData, clearError } = useSupervisorDashboardStore()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const handleRefresh = () => {
    fetchDashboardData()
  }

  // Calculate derived stats for charts
  const totalProposals = data?.stats.totalProposals || 0
  const approvedProposals = data?.stats.approvedProposals || 0
  const pendingProposals = data?.stats.pendingProposals || 0
  
  // Calculate derived values (these would come from API in real app)
  const underReviewProposals = Math.max(0, Math.floor(pendingProposals * 0.6))
  const revisionNeededProposals = Math.max(0, Math.floor(pendingProposals * 0.3))
  const rejectedProposals = Math.max(0, Math.floor(totalProposals * 0.1))
  
  // Students with proposals (estimated)
  const studentsWithProposals = Math.min(data?.stats.totalStudents || 0, Math.floor(totalProposals * 0.8))

  // Prepare chart data
  const proposalStatusData = [
    { name: 'Approved', value: approvedProposals, color: '#10b981' },
    { name: 'Pending', value: pendingProposals, color: '#f59e0b' },
    { name: 'Under Review', value: underReviewProposals, color: '#3b82f6' },
    { name: 'Revision Needed', value: revisionNeededProposals, color: '#8b5cf6' },
    { name: 'Rejected', value: rejectedProposals, color: '#ef4444' }
  ].filter(item => item.value > 0)

  const studentProgressData = [
    { name: 'With Proposal', value: studentsWithProposals, color: '#3b82f6' },
    { name: 'No Proposal', value: (data?.stats.totalStudents || 0) - studentsWithProposals, color: '#9ca3af' }
  ].filter(item => item.value > 0)

  const weeklyActivityData = [
    { day: 'Mon', submissions: 4, reviews: 3, approvals: 2 },
    { day: 'Tue', submissions: 6, reviews: 5, approvals: 3 },
    { day: 'Wed', submissions: 3, reviews: 4, approvals: 2 },
    { day: 'Thu', submissions: 5, reviews: 6, approvals: 4 },
    { day: 'Fri', submissions: 7, reviews: 5, approvals: 3 },
    { day: 'Sat', submissions: 2, reviews: 2, approvals: 1 },
    { day: 'Sun', submissions: 1, reviews: 1, approvals: 0 }
  ]

  const monthlyTrendData = [
    { month: 'Jan', proposals: 12, approvals: 8 },
    { month: 'Feb', proposals: 15, approvals: 10 },
    { month: 'Mar', proposals: 18, approvals: 12 },
    { month: 'Apr', proposals: 14, approvals: 11 },
    { month: 'May', proposals: 20, approvals: 15 },
    { month: 'Jun', proposals: 16, approvals: 13 }
  ]

  if (error) {
    return (
      <DashboardLayout>
        <main className="flex-1 md:ml-0 overflow-hidden">
          <div className="p-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={clearError} className="mt-4" variant="outline">
              Dismiss
            </Button>
            <Button onClick={handleRefresh} className="mt-4 ml-2" variant="outline">
              <Loader2 size={16} className="mr-2" />
              Retry
            </Button>
          </div>
        </main>
      </DashboardLayout>
    )
  }

  const welcomeName = data?.supervisorInfo?.fullName?.split(' ')[0] || user?.fullName?.split(' ')[0] || 'Supervisor'

  return (
    <DashboardLayout>
      <main className="flex-1 md:ml-0 overflow-hidden">
        <DashboardHeader
          title={`Welcome back, ${welcomeName}`}
          subtitle="Manage your students and review research proposals"
          onSearch={(query) => {
            console.log('Search:', query)
            router.push(`dashboard/${institutionSlug}/${departmentCode}/supervisor/students?search=${encodeURIComponent(query)}`)
          }}
        />

        <div className="p-6 space-y-6 animate-fade-in">
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Students"
              value={loading ? "..." : data?.stats.totalStudents?.toString() || "0"}
              icon={<Users size={24} />}
              trend={!loading && data?.stats.totalStudents ? { value: 8, direction: 'up' } : undefined}
            />
            <StatCard
              label="Pending Reviews"
              value={loading ? "..." : data?.stats.pendingProposals?.toString() || "0"}
              icon={<Clock size={24} />}
              color="warning"
            />
            <StatCard
              label="Approved Topics"
              value={loading ? "..." : data?.stats.approvedProposals?.toString() || "0"}
              icon={<CheckCircle size={24} />}
              color="success"
            />
            <StatCard
              label="Student Interests"
              value={loading ? "..." : data?.stats.totalInterests?.toString() || "0"}
              icon={<MessageSquare size={24} />}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Proposal Status Distribution */}
            <Card animated hover>
              <CardHeader>
                <CardTitle className="text-lg">Proposal Status Distribution</CardTitle>
                <CardDescription>Current status of all proposals</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-64 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : proposalStatusData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={proposalStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {proposalStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Student Progress Distribution */}
            <Card animated hover>
              <CardHeader>
                <CardTitle className="text-lg">Student Progress</CardTitle>
                <CardDescription>Students with and without proposals</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-64 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : studentProgressData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={studentProgressData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {studentProgressData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Scrollable */}
            <div className="lg:col-span-2 space-y-6 overflow-y-auto max-h-[calc(100vh-280px)] hidden-scrollbar pr-2">
              {/* Pending Reviews */}
              <Card animated hover>
                <CardHeader>
                  <CardTitle>Pending Proposals for Review</CardTitle>
                  <CardDescription>
                    {data?.stats.pendingProposals || 0} proposals waiting for your feedback
                  </CardDescription>
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
                  ) : data?.pendingReviews.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
                      <p className="text-muted-foreground">No pending reviews! Great job!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {data?.pendingReviews.map((review) => (
                        <div 
                          key={review.id} 
                          className="flex items-center justify-between p-4 bg-secondary rounded-lg border border-border hover:border-primary transition-colors duration-200 cursor-pointer"
                          onClick={() => router.push(`/supervisor/proposals?view=${review.id}`)}
                        >
                          <div className="flex-1">
                            <p className="font-semibold text-foreground">{review.studentName}</p>
                            <p className="text-sm text-muted-foreground">{review.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs text-muted-foreground">{review.timeAgo}</p>
                              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                {formatStatus(review.status)}
                              </span>
                            </div>
                          </div>
                          <Button size="sm" className="ml-4">
                            Review
                            <ArrowRight size={14} className="ml-1" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>

            {/* Right Column - Scrollable with same height */}
            <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-280px)] hidden-scrollbar  pr-2">
              {/* Student Overview */}
              <Card animated hover>
                <CardHeader>
                  <CardTitle className="text-lg">Student Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Assigned</span>
                      <span className="font-semibold text-foreground text-lg">
                        {loading ? "..." : data?.stats.totalStudents || 0}
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${data?.stats.approvedPercentage || 0}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">With Approved Topics</span>
                      <span className="font-semibold text-foreground">
                        {loading ? "..." : data?.stats.studentsWithApprovedTopics || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Approval Rate</span>
                      <span className="font-semibold text-foreground">
                        {loading ? "..." : `${data?.stats.approvedPercentage || 0}%`}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/${institutionSlug}/${departmentCode}/supervisor/students`}
                    className="block"
                  >
                    <Button variant="outline" className="w-full gap-2">
                      <Users size={16} />
                      View All Students
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Research Topics Overview */}
              <Card animated hover>
                <CardHeader>
                  <CardTitle className="text-lg">Research Topics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Topics Created</span>
                      <span className="font-semibold text-foreground text-lg">
                        {loading ? "..." : data?.stats.topicsCount || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Student Interests</span>
                      <span className="font-semibold text-foreground text-lg">
                        {loading ? "..." : data?.stats.totalInterests || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Avg. Interests per Topic</span>
                      <span className="font-semibold text-foreground">
                        {loading || !data?.stats.topicsCount ? "..." : 
                          (data.stats.totalInterests / data.stats.topicsCount).toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <Link 
                  href={`/dashboard/${institutionSlug}/${departmentCode}/supervisor/topics`}
                  className="block">
                    <Button className="w-full gap-2">
                      <TrendingUp size={16} />
                      Manage Topics
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card animated hover>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-secondary rounded-lg">
                    <span className="text-sm">Total Proposals</span>
                    <span className="font-bold text-lg">
                      {loading ? "..." : data?.stats.totalProposals || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-secondary rounded-lg">
                    <span className="text-sm">Avg. Review Time</span>
                    <span className="font-bold text-lg">
                      {loading ? "..." : `${data?.metrics.averageReviewTime || 0} days`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-secondary rounded-lg">
                    <span className="text-sm">Completion Rate</span>
                    <span className="font-bold text-lg">
                      {loading || !data?.stats.totalProposals ? "..." : 
                        `${Math.round((data.stats.approvedProposals / data.stats.totalProposals) * 100)}%`}
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
                    <p className="font-semibold">{data?.supervisorInfo?.department || 'Loading...'}</p>
                  </div>
                  {data?.supervisorInfo?.staffNumber && (
                    <div>
                      <p className="text-xs text-muted-foreground">Staff Number</p>
                      <p className="font-semibold">{data.supervisorInfo.staffNumber}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-semibold text-sm break-all">{data?.supervisorInfo?.email || 'Loading...'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Last Updated */}
              {lastUpdated && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  Last updated: {new Date(lastUpdated).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </DashboardLayout>
  )
}