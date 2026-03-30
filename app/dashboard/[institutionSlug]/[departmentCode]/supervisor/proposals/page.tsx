// app/(dashboard)/supervisor/proposals/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/card-component'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  FileText, CheckCircle, Clock, Eye, MessageCircle, X,
  Loader2, AlertCircle, Search, Filter, TrendingUp, Award, Download
} from 'lucide-react'
import { ViewProposalModal } from '@/components/modals/view-proposal-modal'
import { MessageModal } from '@/components/modals/message-modal'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useSupervisorProposalStore } from '@/store/supervisor/proposals/supervisorProposalStore'
import { useMessageStore } from '@/store/message/messageStore'
import { toast } from 'sonner'

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'High':
      return 'bg-red-100 text-red-700'
    case 'Medium':
      return 'bg-yellow-100 text-yellow-700'
    case 'Low':
      return 'bg-green-100 text-green-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

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
    case 'REJECTED':
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

export default function ProposalsPage() {
  const {
    proposals,
    selectedProposal,
    loading,
    error,
    pagination,
    filters,
    approvedIds,
    fetchProposals,
    setSelectedProposal,
    setFilters,
    updateProposalStatus,
    clearError
  } = useSupervisorProposalStore()

  const [searchInput, setSearchInput] = useState(filters.search)
  const [messageProposal, setMessageProposal] = useState<any>(null)
  const [viewingDocument, setViewingDocument] = useState<any>(null)
    const {
        loading: messageLoading ,
        error: messageError,
        sendMessage,
        clearError: messageClearError
      } = useMessageStore()

  useEffect(() => {
    fetchProposals()
  }, [])

  const handleStatusFilter = (status: string) => {
    setFilters({ status })
  }

  const handleSearch = () => {
    setFilters({ search: searchInput })
  }

  const handlePageChange = (newPage: number) => {
    fetchProposals(newPage, pagination.limit)
  }

  const handleViewProposal = (proposal: any) => {
    setSelectedProposal(proposal)
  }

  const handleUpdateStatus = async (proposalId: string, status: string, feedback?: string, rating?: number) => {
    await updateProposalStatus(proposalId, status, feedback, rating)
  }

  const handleDownloadDocument = (proposal: any) => {
    if (proposal.documentUrl) {
      window.open(proposal.documentUrl, '_blank')
    }
  }

    const handleSendMessage = async (message: string, subject: string ) => {
   
    console.log('Sending message:', { subject, message, recipient: messageProposal.studentId })
    
    const recipientName = messageProposal.studentName
    const recipientId = messageProposal.studentId || ''
    
      await sendMessage(
      recipientId,
      message.trim(), 
      subject ? subject : `Message From ${recipientName}`
    )

    toast.success('Message sent')
  }

  const pendingProposals = proposals.filter(p => !approvedIds.includes(p.id))
  const approvedCount = approvedIds.length

  console.log(proposals)

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
          title="Proposals to Review"
          subtitle="Review and provide feedback on student research proposals"
          onSearch={(query) => setFilters({ search: query })}
        />

        <div className="p-6 space-y-6 animate-fade-in">
          {/* Stats Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Proposals</p>
                    <p className="text-2xl font-bold">{proposals.length}</p>
                  </div>
                  <FileText size={32} className="text-primary/60" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Review</p>
                    <p className="text-2xl font-bold text-orange-600">{pendingProposals.length}</p>
                  </div>
                  <Clock size={32} className="text-orange-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Approved</p>
                    <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
                  </div>
                  <CheckCircle size={32} className="text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Completion Rate</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {proposals.length > 0 ? Math.round((approvedCount / proposals.length) * 100) : 0}%
                    </p>
                  </div>
                  <TrendingUp size={32} className="text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              {['all', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REVISION_REQUESTED', 'REJECTED'].map((status) => (
                <Button
                  key={status}
                  variant={filters.status === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusFilter(status)}
                  className="gap-1"
                >
                  {status === 'all' && <Filter size={16} />}
                  {formatStatus(status)}
                  {filters.status === status && loading && <Loader2 size={14} className="ml-2 animate-spin" />}
                </Button>
              ))}
            </div>
            
            <div className="flex gap-2">
              <Input
                placeholder="Search by title or student..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-64"
              />
              <Button onClick={handleSearch} size="sm">
                <Search size={16} />
              </Button>
            </div>
          </div>

          {/* Loading State */}
          {loading && proposals.length === 0 ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : pendingProposals.length === 0 && proposals.length > 0 ? (
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-base">All Proposals Reviewed! 🎉</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>Great work! You have successfully reviewed and approved all {approvedCount} proposal(s).</p>
              </CardContent>
            </Card>
          ) : pendingProposals.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No proposals found</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Proposals List */}
              <div className="space-y-3">
                {pendingProposals.map((proposal, idx) => (
                  <Card key={proposal.id} className="hover:shadow-md transition-all duration-300 animate-slide-up">
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-base mb-2">{proposal.title}</CardTitle>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                            <p className="text-muted-foreground">
                              <span className="font-medium">Student:</span> {proposal.studentName}
                            </p>
                            <p className="text-muted-foreground">
                              <span className="font-medium">Submitted:</span> {proposal.submittedDate}
                            </p>
                            <p className="text-muted-foreground">
                              <span className="font-medium">Pages:</span> {proposal.pages}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${getPriorityColor(proposal.priority)}`}>
                            {proposal.priority} Priority
                          </span>
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(proposal.status)}`}>
                            {formatStatus(proposal.status)}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={() => handleViewProposal(proposal)}>
                          <Eye size={16} className="mr-2" />
                          View & Review
                        </Button>
                        <Button variant="outline" onClick={() => setMessageProposal(proposal)}>
                          <MessageCircle size={16} className="mr-2" />
                          Send Feedback
                        </Button>
                        {proposal.documentUrl && (
                          <Button variant="outline" onClick={() => handleDownloadDocument(proposal)}>
                            <Download size={16} className="mr-2" />
                            Download
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

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

          {/* Review Tips */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Award size={18} />
                Review Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2 text-muted-foreground">
              <p>✓ Check research methodology is sound and feasible</p>
              <p>✓ Verify literature review is comprehensive and recent</p>
              <p>✓ Ensure contributions are clear and original</p>
              <p>✓ Provide constructive feedback for improvements</p>
              <p>✓ Rate the proposal based on quality and innovation</p>
            </CardContent>
          </Card>
        </div>

        {/* Modals */}
        {selectedProposal && (
          <ViewProposalModal
            isOpen={!!selectedProposal}
            onClose={() => setSelectedProposal(null)}
            proposal={selectedProposal || ''}
            onUpdateStatus={handleUpdateStatus}
            canUpdateStatus={true}
          />
        )}

        {messageProposal && (
          <MessageModal
            isOpen={!!messageProposal}
            onClose={() => setMessageProposal(null)}
            recipientName={messageProposal.studentName}
            recipientId={messageProposal.studentId}
            onSend={handleSendMessage}
          />
        )} 




      </main>
    </DashboardLayout>
  )
}