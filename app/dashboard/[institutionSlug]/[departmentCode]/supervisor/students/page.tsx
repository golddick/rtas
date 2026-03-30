// app/(dashboard)/supervisor/students/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/card-component'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Users, FileText, CheckCircle, Clock, 
  Mail, Eye, FileCheck, Grid, List, Loader2, 
  AlertCircle, Search, Filter
} from 'lucide-react'
import { ViewStudentModal } from '@/components/modals/view-student-modal'
import { MessageModal } from '@/components/modals/message-modal'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ReviewProposalModal } from '@/components/modals/review-proposal-modal'
import { useSupervisorStore } from '@/store/supervisor/student/studentStore'
import { useAuthStore } from '@/store/user/userStore'
import { useMessageStore } from '@/store/message/messageStore'

const getStatusColor = (status: string) => {
  switch (status) {
    case 'APPROVED':
      return 'bg-green-100 text-green-700'
    case 'UNDER_REVIEW':
      return 'bg-blue-100 text-blue-700'
    case 'REVISION_REQUESTED':
      return 'bg-orange-100 text-orange-700'
    case 'SUBMITTED':
      return 'bg-gray-100 text-gray-700'
    case 'No Proposal':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

const formatStatus = (status: string) => {
  if (status === 'No Proposal') return 'No Proposal'
  return status.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ')
}

export default function StudentsPage() {
  const {
    students,
    selectedStudent,
    loading,
    error,
    pagination,
    filters,
    fetchStudents,
    setSelectedStudent,
    setFilters,
    updateProposalStatus,
    clearError
  } = useSupervisorStore()

  const { user: supervisor } = useAuthStore() 

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [searchInput, setSearchInput] = useState(filters.search)
  const [messageStudent, setMessageStudent] = useState<any>(null)
  const [reviewingProposal, setReviewingProposal] = useState<any>(null)

      const {
    loading: messageLoading ,
    error: messageError,
    sendMessage,
    clearError: messageClearError
  } = useMessageStore()

  useEffect(() => {
    fetchStudents()
  }, [])

  console.log(students, 'st')

  const handleStatusFilter = (status: string) => {
    setFilters({ proposalStatus: status })
  }

  const handleSearch = () => {
    setFilters({ search: searchInput })
  }

  const handlePageChange = (newPage: number) => {
    fetchStudents(newPage, pagination.limit)
  }

  const handleViewStudent = (student: any) => {
    setSelectedStudent(student)
  }

  const handleReviewProposal = (student: any) => {
    if (student.proposal) {
      setReviewingProposal({
        ...student.proposal,
        studentName: student.fullName,
        studentId: student.id,

        documentUrl: student.proposal.documentUrl,
        documentName: student.proposal.documentName, 
        documentSize: student.proposal.documentSize, 

        // fileUrl: student.proposal.fileUrl || student.proposal.documentUrl,
        // fileName: student.proposal.fileName || `proposal_${student.proposal.title}.pdf`,
        // fileSize: student.proposal.fileSize,
      })
    }
  }

  const handleUpdateProposal = async (proposalId: string, status: string, feedback?: string, rating?: number) => {
    await updateProposalStatus(proposalId, status, feedback, rating)
    setReviewingProposal(null)
  }

  const handleSendMessage = async (message: string, subject: string, recipientId: string, recipientName: string) => {
    console.log('Sending message:', { 
      subject, 
      message, 
      recipientId,
      recipientName,
      from: supervisor?.id 
    })
    
    try {
  
       await sendMessage(
      recipientId,
      message.trim(), 
      subject ? subject : `Message From ${recipientName}`
    )
      
      // For now, just log success
      console.log('Message sent successfully')
    } catch (error) {
      console.error('Failed to send message:', error)
      throw error
    }
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
          </div>
        </main>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <main className="flex-1 md:ml-0 overflow-hidden">
        <DashboardHeader
          title="My Students"
          subtitle="Manage your assigned students and track their progress"
          onSearch={(query) => setFilters({ search: query })}
        />

        <div className="p-6 space-y-6 animate-fade-in">
          {/* Stats Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Students</p>
                    <p className="text-2xl font-bold">{students.length}</p>
                  </div>
                  <Users size={32} className="text-primary/60" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">With Proposals</p>
                    <p className="text-2xl font-bold">
                      {students.filter(s => s.proposal).length}
                    </p>
                  </div>
                  <FileText size={32} className="text-primary/60" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Approved</p>
                    <p className="text-2xl font-bold text-green-600">
                      {students.filter(s => s.proposalStatus === 'APPROVED').length}
                    </p>
                  </div>
                  <CheckCircle size={32} className="text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Review</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {students.filter(s => s.proposalStatus === 'SUBMITTED' || s.proposalStatus === 'UNDER_REVIEW').length}
                    </p>
                  </div>
                  <Clock size={32} className="text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              {['all', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REVISION_REQUESTED'].map((status) => (
                <Button
                  key={status}
                  variant={filters.proposalStatus === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusFilter(status)}
                  className="gap-1"
                >
                  {status === 'all' && <Filter size={16} />}
                  {formatStatus(status)}
                </Button>
              ))}
            </div>
            
            <div className="flex gap-2">
              <Input
                placeholder="Search by name or matric..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-64"
              />
              <Button onClick={handleSearch} size="sm">
                <Search size={16} />
              </Button>
            </div>

            {/* View Toggle */}
            <div className="flex gap-2 bg-secondary rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Grid size={18} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded transition-colors ${viewMode === 'table' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <List size={18} />
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && students.length === 0 ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : students.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No students found</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Grid View */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {students.map((student) => (
                    <Card key={student.id} className="hover:shadow-md transition-all duration-300">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base capitalize">{student.fullName}</CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">{student.studentId}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(student.proposalStatus)}`}>
                            {formatStatus(student.proposalStatus)}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2 text-sm">
                          <p><span className="text-muted-foreground">Email:</span> {student.email}</p>
                          <p><span className="text-muted-foreground">Assigned:</span> {student.joinDate}</p>
                          {student.program && (
                            <p><span className="text-muted-foreground">Program:</span> {student.program}</p>
                          )}
                        </div>

                        {/* Progress Bar */}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <p className="text-sm font-medium">Research Progress</p>
                            <span className="text-sm font-semibold text-primary">{student.progress}%</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${student.progress}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2 flex-wrap">
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => handleViewStudent(student)}>
                            <Eye size={16} className="mr-1" />
                            View
                          </Button>
                          {student.proposal && student.proposalStatus !== 'APPROVED' && (
                            <Button size="sm" className="flex-1" onClick={() => handleReviewProposal(student)}>
                              <FileCheck size={16} className="mr-1" />
                              Review
                            </Button>
                          )}
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => setMessageStudent(student)}>
                            <Mail size={16} className="mr-1" />
                            Message
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Table View */}
              {viewMode === 'table' && (
                <Card>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left px-6 py-4 font-semibold text-foreground">Name</th>
                          <th className="text-left px-6 py-4 font-semibold text-foreground">Student ID</th>
                          <th className="text-left px-6 py-4 font-semibold text-foreground">Email</th>
                          <th className="text-left px-6 py-4 font-semibold text-foreground">Status</th>
                          <th className="text-left px-6 py-4 font-semibold text-foreground">Progress</th>
                          <th className="text-left px-6 py-4 font-semibold text-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student) => (
                          <tr key={student.id} className="border-b border-border hover:bg-secondary transition-colors">
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-medium text-foreground capitalize">{student.fullName}</p>
                                <p className="text-xs text-muted-foreground">{student.joinDate}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-muted-foreground">{student.studentId}</td>
                            <td className="px-6 py-4 text-muted-foreground text-xs break-all">{student.email}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(student.proposalStatus)}`}>
                                {formatStatus(student.proposalStatus)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                                  <div className="bg-primary h-2 rounded-full" style={{ width: `${student.progress}%` }} />
                                </div>
                                <span className="text-xs font-semibold text-primary w-8">{student.progress}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleViewStudent(student)}>
                                  View
                                </Button>
                                {student.proposal && student.proposalStatus !== 'APPROVED' && (
                                  <Button size="sm" onClick={() => handleReviewProposal(student)}>
                                    Review
                                  </Button>
                                )}
                                <Button variant="outline" size="sm" onClick={() => setMessageStudent(student)}>
                                  Message
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1 || loading}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4 text-sm">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages || loading}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modals */}
        {selectedStudent && (
          <ViewStudentModal
            isOpen={!!selectedStudent}
            onClose={() => setSelectedStudent(null)}
            student={selectedStudent}
            onMessage={() => {
              setSelectedStudent(null)
              setMessageStudent(selectedStudent)
            }}
            onReview={() => {
              setSelectedStudent(null)
              if (selectedStudent.proposal) {
                handleReviewProposal(selectedStudent)
              }
            }}
          />
        )}

        {messageStudent && (
          <MessageModal
            isOpen={!!messageStudent}
            onClose={() => setMessageStudent(null)}
            recipientName={messageStudent.fullName}
            recipientId={messageStudent.id}
            onSend={(message, subject) => {
              handleSendMessage(
                message, 
                subject, 
                messageStudent.id, 
                messageStudent.fullName
              )
              setMessageStudent(null)
            }}
          />
        )}
 
        {reviewingProposal && (
          <ReviewProposalModal
            isOpen={!!reviewingProposal}
            onClose={() => setReviewingProposal(null)}
            proposal={reviewingProposal}
            onUpdate={handleUpdateProposal}
          />
        )}
      </main>
    </DashboardLayout>
  )
}