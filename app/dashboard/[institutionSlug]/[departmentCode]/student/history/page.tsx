'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Sidebar } from '@/components/sidebar'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/card-component'
import { Button } from '@/components/ui/button'
import { Home, FileText, Users, Clock, MessageSquare, Download, Eye } from 'lucide-react'


const history = [
  {
    date: '2024-01-15',
    event: 'Proposal Approved',
    title: 'Machine Learning for Medical Image Analysis',
    status: 'approved',
    details: 'Your proposal has been approved by Dr. Ahmed Hassan with a score of 95/100.',
  },
  {
    date: '2024-01-15',
    event: 'Proposal Submitted',
    title: 'Machine Learning for Medical Image Analysis',
    status: 'submitted',
    details: 'You submitted your research proposal for review.',
  },
  {
    date: '2024-01-10',
    event: 'Supervisor Assigned',
    title: 'Dr. Ahmed Hassan',
    status: 'info',
    details: 'You have been assigned Dr. Ahmed Hassan as your research supervisor.',
  },
  {
    date: '2024-01-08',
    event: 'Supervisor Request Approved',
    title: 'Requested Dr. Ahmed Hassan',
    status: 'approved',
    details: 'Your supervisor request has been approved by the department.',
  },
  {
    date: '2024-01-05',
    event: 'Supervisor Request Submitted',
    title: 'Requested Dr. Ahmed Hassan',
    status: 'submitted',
    details: 'You submitted a request to assign Dr. Ahmed Hassan as your supervisor.',
  },
  {
    date: '2024-01-01',
    event: 'Program Started',
    title: 'Master of Computer Science',
    status: 'info',
    details: 'You officially enrolled in the Master of Computer Science program.',
  },
]

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'approved':
      return <div className="w-4 h-4 rounded-full bg-green-500" />
    case 'rejected':
      return <div className="w-4 h-4 rounded-full bg-red-500" />
    case 'submitted':
      return <div className="w-4 h-4 rounded-full bg-blue-500" />
    case 'pending':
      return <div className="w-4 h-4 rounded-full bg-yellow-500" />
    default:
      return <div className="w-4 h-4 rounded-full bg-gray-500" />
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-700'
    case 'rejected':
      return 'bg-red-100 text-red-700'
    case 'submitted':
      return 'bg-blue-100 text-blue-700'
    case 'pending':
      return 'bg-yellow-100 text-yellow-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

export default function HistoryPage() {
  const [viewingItem, setViewingItem] = useState<any>(null)

  return (
    <DashboardLayout>
      
      <main className="flex-1 md:ml-0 overflow-hidden">
        <DashboardHeader
          title="Activity History"
          subtitle="Track all your interactions with the research approval system"
        />

        <div className="p-6 space-y-6 animate-fade-in">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-1">Timeline</h2>
            <p className="text-sm text-muted-foreground">All activities from newest to oldest</p>
          </div>

          {/* Timeline */}
          <div className="space-y-4">
            {history.map((item, idx) => (
              <div key={idx} className="relative pl-8 pb-4 last:pb-0 animate-slide-up" style={{ animationDelay: `${idx * 50}ms` }}>
                {/* Timeline dot */}
                <div className="absolute left-0 top-0">
                  {getStatusIcon(item.status)}
                </div>

                {/* Timeline line */}
                {idx !== history.length - 1 && (
                  <div className="absolute left-1.5 top-4 w-0.5 h-12 bg-border" />
                )}

                {/* Content */}
                <Card className="hover:shadow-md transition-all duration-300">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <CardTitle className="text-base mb-1">{item.event}</CardTitle>
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </span>
                        <p className="text-xs text-muted-foreground mt-2">{item.date}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">{item.details}</p>
                    <div className="flex gap-2">
                      {item.event.includes('Proposal') && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => setViewingItem(item)}>
                            <Eye size={16} className="mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => alert(`Download: ${item.title}`)}>
                            <Download size={16} className="mr-1" />
                            Download
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Total Events', value: history.length },
                  { label: 'Proposals Submitted', value: 2 },
                  { label: 'Approvals', value: 2 },
                  { label: 'Days Active', value: '21' },
                ].map((stat, idx) => (
                  <div key={idx} className="text-center p-3 bg-secondary rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Proposal View Modal */}
        {viewingItem && viewingItem.event.includes('Proposal') && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-background rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] flex flex-col animate-scale-in">
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-xl font-semibold text-foreground">Proposal Details</h2>
                <button
                  onClick={() => setViewingItem(null)}
                  className="p-1 hover:bg-secondary rounded transition-colors"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Proposal Title</h3>
                  <p className="text-foreground">{viewingItem.title}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Description</h3>
                  <p className="text-muted-foreground">{viewingItem.details}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="p-3 bg-secondary rounded-lg">
                    <p className="text-xs text-muted-foreground">Event</p>
                    <p className="font-semibold text-foreground">{viewingItem.event}</p>
                  </div>
                  <div className="p-3 bg-secondary rounded-lg">
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="font-semibold text-foreground">{viewingItem.date}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Status</h3>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(viewingItem.status)}`}>
                    {viewingItem.status.charAt(0).toUpperCase() + viewingItem.status.slice(1)}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 p-6 border-t border-border">
                <button className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all font-medium flex items-center justify-center gap-2">
                  <Download size={16} />
                  Download
                </button>
                <button onClick={() => setViewingItem(null)} className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-secondary transition-all font-medium">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </DashboardLayout>
  )
}
