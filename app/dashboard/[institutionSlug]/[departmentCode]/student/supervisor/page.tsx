// app/(dashboard)/student/supervisor/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/card-component'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Users, FileText, Clock, MessageSquare, Mail, Calendar, 
  BookOpen, Award, Eye, Loader2, AlertCircle, Send, Phone, MapPin
} from 'lucide-react'
import { ViewSupervisorModal } from '@/components/modals/view-supervisor-modal'
import { MessageModal } from '@/components/modals/message-modal'
import { useUser } from '@/store/user/userStore'
import { useMessageStore } from '@/store/message/messageStore'
import { useStudentSupervisorStore } from '@/store/student/supervisor/supervisorStore'

const formatDate = (date: Date | null | undefined) => {
  if (!date) return 'Not available'
  return new Date(date).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

export default function SupervisorPage() {
  const router = useRouter()
  const user = useUser()

  const { 
    supervisor, 
    hasSupervisor, 
    loading, 
    error, 
    requesting,
    requestError,
    fetchSupervisor, 
    requestSupervisor,
    clearError 
  } = useStudentSupervisorStore()


  const [showSupervisorModal, setShowSupervisorModal] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [researchInterests, setResearchInterests] = useState('')
  const [requestMessage, setRequestMessage] = useState('')
  const [selectedSupervisorId, setSelectedSupervisorId] = useState('')

      const {
      loading: messageLoading ,
      error: messageError,
      sendMessage,
      clearError: messageClearError
    } = useMessageStore()

  useEffect(() => {
    fetchSupervisor()
  }, [])

  const handleSendMessage = async (message: string, subject: string ) => {
   
    console.log('Sending message:', { subject, message, recipient: supervisor?.id })
    
    const recipientName = supervisor?.fullName
    const recipientId = supervisor?.id || ''
    
      await sendMessage(
      recipientId,
      message.trim(), 
      subject ? subject : `Message From ${recipientName}`
    )
  }

  const handleRequestSupervisor = async () => {
    if (!researchInterests.trim()) {
      alert('Please enter your research interests')
      return
    }
    
    await requestSupervisor({
      supervisorId: selectedSupervisorId,
      researchInterests: researchInterests.trim(),
      message: requestMessage
    })
    
    setShowRequestForm(false)
    setResearchInterests('')
    setRequestMessage('')
  }

  if (loading) {
    return (
      <DashboardLayout>
        <main className="flex-1 md:ml-0 overflow-hidden">
          <div className="p-6 flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
            </Alert>
            <Button onClick={clearError} className="mt-4" variant="outline">
              Dismiss
            </Button>
            <Button onClick={() => fetchSupervisor()} className="mt-4 ml-2" variant="outline">
              <Loader2 size={16} className="mr-2" />
              Retry
            </Button>
          </div>
        </main>
      </DashboardLayout>
    )
  }

  if (!hasSupervisor || !supervisor) {
    return (
      <DashboardLayout>
        <main className="flex-1 md:ml-0 overflow-hidden">
          <DashboardHeader
            title="My Supervisor"
            subtitle="You haven't been assigned a supervisor yet"
          />

          <div className="p-6 space-y-6 animate-fade-in">
            <Card className="border-2 border-dashed">
              <CardContent className="p-12 text-center">
                <Users size={64} className="mx-auto text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No Supervisor Assigned</h3>
                <p className="text-muted-foreground mb-6">
                  You haven't been assigned a supervisor yet. Submit a request to get started.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={() => setShowRequestForm(true)}>
                    Request a Supervisor
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/student/supervisors')}>
                    Browse Supervisors
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Request Form Modal */}
            {showRequestForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-background rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] flex flex-col animate-scale-in">
                  <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-xl font-semibold text-foreground">Request a Supervisor</h2>
                    <button
                      onClick={() => setShowRequestForm(false)}
                      className="p-1 hover:bg-secondary rounded transition-colors"
                    >
                      <span className="text-2xl">&times;</span>
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Research Interests *</label>
                      <textarea
                        className="w-full min-h-[100px] px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Describe your research interests, areas of focus, and any specific topics you're interested in..."
                        value={researchInterests}
                        onChange={(e) => setResearchInterests(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Additional Message (Optional)</label>
                      <textarea
                        className="w-full min-h-[100px] px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Any additional information you'd like to share with potential supervisors..."
                        value={requestMessage}
                        onChange={(e) => setRequestMessage(e.target.value)}
                      />
                    </div>
                    {requestError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{requestError}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                  <div className="flex gap-2 p-6 border-t border-border">
                    <Button variant="outline" onClick={() => setShowRequestForm(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button onClick={handleRequestSupervisor} disabled={requesting} className="flex-1">
                      {requesting ? 'Submitting...' : 'Submit Request'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* FAQs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    q: 'How do I request a supervisor?',
                    a: 'Click the "Request a Supervisor" button above and fill out the form with your research interests.',
                  },
                  {
                    q: 'Can I request a specific supervisor?',
                    a: 'Yes, you can browse available supervisors and request your preferred choice.',
                  },
                  {
                    q: 'How long does approval take?',
                    a: 'Supervisor assignments are typically processed within 3-5 business days.',
                  },
                ].map((faq, idx) => (
                  <div key={idx} className="pb-4 border-b last:border-b-0">
                    <p className="font-medium text-sm mb-2">{faq.q}</p>
                    <p className="text-sm text-muted-foreground">{faq.a}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </main>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <main className="flex-1 md:ml-0 overflow-hidden">
        <DashboardHeader
          title="My Supervisor"
          subtitle="Your assigned research supervisor"
        />

        <div className="p-6 space-y-6 animate-fade-in">
          {/* Supervisor Profile Card */}
          <Card className="border-l-4 border-primary overflow-hidden p-2">
            <CardHeader className="bg-secondary p-4">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex-1">
                  <CardTitle className="text-2xl capitalize">{supervisor.fullName}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {supervisor.department?.name} • {supervisor.specialization}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-primary">Assigned Since</p>
                  <p className="text-lg font-semibold">{formatDate(supervisor.assignedSince)}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div className="flex items-start gap-2">
                  <Mail size={18} className="text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Email</p>
                    <p className="font-medium break-all">{supervisor.email}</p>
                  </div>
                </div>
                {supervisor.phone && (
                  <div className="flex items-start gap-2">
                    <Phone size={18} className="text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Phone</p>
                      <p className="font-medium">{supervisor.phone}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <MapPin size={18} className="text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Office</p>
                    <p className="font-medium">{supervisor.office}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar size={18} className="text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Office Hours</p>
                    <p className="font-medium">{supervisor.officeHours}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-semibold mb-3">About</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{supervisor.bio}</p>
              </div>
            </CardContent>
          </Card>

          {/* Communication Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Communication</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {supervisor.lastMessageDate && (
                  <p className="text-sm text-muted-foreground">
                    Last message: {formatDate(supervisor.lastMessageDate)}
                  </p>
                )}
                <div className="flex gap-2 flex-wrap">
                  <Button className="flex-1 min-w-fit" onClick={() => setShowMessageModal(true)}>
                    <MessageSquare size={18} className="mr-2" />
                    Send Message
                  </Button>
                  <Button variant="outline" className="flex-1 min-w-fit" onClick={() => alert('Schedule meeting feature coming soon')}>
                    <Calendar size={18} className="mr-2" />
                    Schedule Meeting
                  </Button>
                  <Button variant="outline" onClick={() => setShowSupervisorModal(true)} size="sm">
                    <Eye size={18} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Feedback */}
          {supervisor.recentFeedback && supervisor.recentFeedback.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {supervisor.recentFeedback.map((item, idx) => (
                    <div key={item.id} className="pb-4 border-b last:border-b-0 animate-fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium text-sm">{item.topic}</p>
                        <span className="text-xs text-muted-foreground">{formatDate(item.date)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.feedback}</p>
                      {item.rating > 0 && (
                        <p className="text-xs text-primary mt-1">Rating: {item.rating}/100</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Change Supervisor */}
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-sm mb-1">Want to change your supervisor?</p>
                  <p className="text-sm text-muted-foreground">You can request a different supervisor with the department approval.</p>
                </div>
                <Button variant="outline" onClick={() => alert('Request supervisor change feature coming soon')}>
                  Request Change
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modals */}
        <ViewSupervisorModal
          isOpen={showSupervisorModal}
          onClose={() => setShowSupervisorModal(false)}
          onMessage={() => {
            setShowSupervisorModal(false)
            setShowMessageModal(true)
          }}
          supervisor={{
            id: supervisor.id,
            name: supervisor.fullName,
            email: supervisor.email,
            phone: supervisor.phone || undefined,
            office: supervisor.office,
            department: supervisor.department?.name,
            specialization: supervisor.specialization,
            bio: supervisor.bio,
            availability: supervisor.officeHours,
            students: supervisor.studentsSupervised,
            publications: supervisor.publications,
            yearsExperience: supervisor.yearsExperience
          }}
        />

        <MessageModal
          isOpen={showMessageModal}
          onClose={() => setShowMessageModal(false)}
          recipientName={supervisor.fullName}
          recipientId={supervisor.id}
          onSend={handleSendMessage}
        />
      </main>
    </DashboardLayout>
  )
}


