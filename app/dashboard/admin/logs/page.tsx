'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { Sidebar } from '@/components/sidebar'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/card-component'
import { Button } from '@/components/ui/button'
import { Shield, Users, BarChart3, Settings, Activity, Download, Eye, AlertCircle } from 'lucide-react'



const logs = [
  {
    id: 1,
    timestamp: '2024-01-25 14:35:22',
    level: 'INFO',
    action: 'User Created',
    user: 'Dr. Sarah Chen',
    module: 'User Management',
    details: 'New faculty member registered in system',
  },
  {
    id: 2,
    timestamp: '2024-01-25 13:20:15',
    level: 'INFO',
    action: 'Department Updated',
    user: 'Admin User',
    module: 'Department Management',
    details: 'Computer Science faculty quota updated',
  },
  {
    id: 3,
    timestamp: '2024-01-25 12:10:08',
    level: 'WARNING',
    action: 'Failed Login Attempt',
    user: 'Unknown',
    module: 'Authentication',
    details: 'Invalid credentials from IP: 192.168.1.100',
  },
  {
    id: 4,
    timestamp: '2024-01-25 11:45:33',
    level: 'INFO',
    action: 'Proposal Approved',
    user: 'System Auto',
    module: 'Proposal Management',
    details: 'Automatic approval by supervisor system',
  },
  {
    id: 5,
    timestamp: '2024-01-25 10:30:12',
    level: 'ERROR',
    action: 'Database Connection Error',
    user: 'System',
    module: 'Database',
    details: 'Connection timeout to primary database - retry initiated',
  },
  {
    id: 6,
    timestamp: '2024-01-25 09:15:44',
    level: 'INFO',
    action: 'Backup Completed',
    user: 'System Auto',
    module: 'System Maintenance',
    details: 'Daily database backup completed successfully',
  },
]

const getLevelColor = (level: string) => {
  switch (level) {
    case 'INFO':
      return 'bg-blue-100 text-blue-700'
    case 'WARNING':
      return 'bg-yellow-100 text-yellow-700'
    case 'ERROR':
      return 'bg-red-100 text-red-700'
    case 'CRITICAL':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

const getLevelIcon = (level: string) => {
  switch (level) {
    case 'INFO':
      return '→'
    case 'WARNING':
      return '⚠'
    case 'ERROR':
      return '✕'
    case 'CRITICAL':
      return '!'
    default:
      return '•'
  }
}

export default function LogsPage() {
  return (
    <DashboardLayout>
      <main className="flex-1 md:ml-0 overflow-hidden">
        <DashboardHeader
          title="System Logs"
          subtitle="Monitor system activities and security events"
        />

        <div className="p-6 space-y-6 animate-fade-in">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <input
              type="text"
              placeholder="Search logs..."
              className="flex-1 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => alert('Apply filters')}>
                Filter
              </Button>
              <Button variant="outline" onClick={() => alert('Download logs')}>
                <Download size={16} className="mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            {['All', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'].map((filter) => (
              <Button key={filter} variant="outline" size="sm" onClick={() => alert(`Filter: ${filter}`)}>
                {filter}
              </Button>
            ))}
          </div>

          {/* Logs List */}
          <div className="space-y-3">
            {logs.map((log, idx) => (
              <Card key={log.id} className="hover:shadow-md transition-all duration-300 animate-slide-up" >
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {/* Level Badge */}
                    <div className="flex-shrink-0">
                      <span className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${getLevelColor(log.level)} text-lg font-bold`}>
                        {getLevelIcon(log.level)}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                        <div>
                          <p className="font-medium">{log.action}</p>
                          <p className="text-sm text-muted-foreground">{log.details}</p>
                        </div>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getLevelColor(log.level)} whitespace-nowrap`}>
                          {log.level}
                        </span>
                      </div>

                      {/* Metadata */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <p><span className="font-medium">Time:</span> {log.timestamp}</p>
                        <p><span className="font-medium">User:</span> {log.user}</p>
                        <p><span className="font-medium">Module:</span> {log.module}</p>
                        <p><span className="font-medium">Log ID:</span> #{String(log.id).padStart(6, '0')}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => alert(`View details for log ${log.id}`)}>
                        <Eye size={16} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Critical Alerts */}
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle size={20} className="text-red-600" />
                Critical Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Database Connection Error:</span> Retry mechanism activated. 3 attempts remaining.
                </p>
                <p>
                  <span className="font-medium">Failed Login Attempts:</span> 5 failed attempts from IP 192.168.1.100. Account locked for 15 minutes.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </DashboardLayout>
  )
}
