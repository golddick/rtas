'use client'

import { useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/card-component'
import { StatCard } from '@/components/stat-card'
import { Button } from '@/components/ui/button'
import { Shield, Users, FileText, BarChart3, Settings, Activity, AlertCircle, TrendingUp, RefreshCw } from 'lucide-react'
import { useDashboardStore } from '@/store/admin/dashboardStore'

export default function AdminDashboard() {
  const { 
    stats,
    recentActivities,
    systemStatus,
    userDistribution,
    departmentPerformance,
    quickStats,
    isLoading,
    error,
    refreshAll,
    clearError
  } = useDashboardStore()

  useEffect(() => {
    refreshAll()
  }, [])

  const handleRefresh = () => {
    refreshAll()
  }

  if (isLoading && !stats) {
    return (
      <DashboardLayout>
        <main className="flex-1 overflow-hidden">
          <DashboardHeader title="System Administration" />
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
          title="System Administration"
          subtitle="Monitor and manage the entire RTAS platform"
        />

        <div className="p-6 space-y-6 animate-fade-in">
          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start justify-between">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-destructive flex-shrink-0 mt-0.5" size={18} />
                <p className="text-sm text-destructive">{error}</p>
              </div>
              <Button variant="outline" size="sm" onClick={clearError}>
                Dismiss
              </Button>
            </div>
          )}

          {/* Refresh Button */}
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              Refresh Dashboard
            </Button>
          </div>

          {/* System Health */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Users"
              value={stats?.totalUsers?.toLocaleString() || '0'}
              icon={<Users size={24} />}
              trend={{ value: stats?.quickStats?.newUsersToday || 0, direction: 'up' }}
            />
            <StatCard
              label="Active Departments"
              value={stats?.totalDepartments?.toString() || '0'}
              icon={<BarChart3 size={24} />}
              trend={{ value: 1, direction: 'up' }}
            />
            <StatCard
              label="System Uptime"
              value={`${stats?.systemUptime || 99.98}%`}
              icon={<Activity size={24} />}
              color="success"
            />
            <StatCard
              label="Critical Alerts"
              value={stats?.activeAlerts?.toString() || '0'}
              icon={<AlertCircle size={24} />}
              color={stats?.activeAlerts && stats.activeAlerts > 0 ? 'warning' : 'success'}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <div className="lg:col-span-2">
              <Card className="animate-slide-up">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>System Activity</CardTitle>
                    <CardDescription>Last 24 hours</CardDescription>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {quickStats?.newUsersToday || 0} new users
                  </span>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentActivities.length > 0 ? (
                      recentActivities.map((activity, idx) => (
                        <div key={activity.id || idx} className="flex items-center justify-between p-3 bg-secondary rounded-lg animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
                          <div>
                            <p className="font-medium text-sm">{activity.action}</p>
                            <p className="text-xs text-muted-foreground">{activity.user}</p>
                          </div>
                          <span className="text-xs text-muted-foreground">{activity.time}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-8">No recent activity</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Status */}
            <Card className="animate-slide-up">
              <CardHeader>
                <CardTitle className="text-base">System Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {systemStatus.map((service, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{service.name}</p>
                      <p className="text-xs text-muted-foreground">{service.uptime}</p>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${
                      service.status === 'online' ? 'bg-green-500' : 
                      service.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Platform Statistics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="animate-slide-up">
              <CardHeader>
                <CardTitle className="text-base">User Distribution</CardTitle>
                <CardDescription>Total: {stats?.totalUsers?.toLocaleString()} users</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {userDistribution.map((user, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">{user.role}</span>
                      <span className="text-muted-foreground">{user.count.toLocaleString()} ({user.percentage}%)</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${user.percentage}%` }}></div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="animate-slide-up">
              <CardHeader>
                <CardTitle className="text-base">Department Performance</CardTitle>
                <CardDescription>Top performing departments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {departmentPerformance.map((dept, idx) => (
                  <div key={dept.id || idx} className="p-3 bg-secondary rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-sm">{dept.name}</p>
                        <p className="text-xs text-muted-foreground">{dept.proposals} proposals</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-primary">{dept.rate}</p>
                        <p className="text-xs text-muted-foreground">approval rate</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
    </DashboardLayout>
  )
}