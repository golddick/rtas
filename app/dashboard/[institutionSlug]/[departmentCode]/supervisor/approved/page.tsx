// app/(dashboard)/supervisor/approved/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/card-component'
import { Button } from '@/components/ui/button'
import { 
  FileText, CheckCircle, Clock, Eye, Download, 
  ArchiveRestore, TrendingUp, Loader2, AlertCircle 
} from 'lucide-react'
import { ViewProposalModal } from '@/components/modals/view-proposal-modal'
import { DocumentViewer } from '@/components/document-viewer'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useSupervisorProposalStore } from '@/store/supervisor/proposals/supervisorProposalStore'

const formatStatus = (status: string) => {
  return status.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ')
}

export default function ApprovedPage() {
  const {
    proposals,
    loading,
    error,
    fetchProposals,
    clearError
  } = useSupervisorProposalStore()

  const [selectedProposal, setSelectedProposal] = useState<any>(null)
  const [managingTopic, setManagingTopic] = useState<any>(null)
  const [viewingDocument, setViewingDocument] = useState<any>(null)

  // Filter to only show approved proposals
  const approvedProposals = proposals.filter(p => p.status === 'APPROVED')

  useEffect(() => {
    // Fetch proposals with status filter for approved
    fetchProposals(1, 100)
  }, [])

  // Calculate statistics
  const totalApproved = approvedProposals.length
  const averageScore = totalApproved > 0 
    ? Math.round(approvedProposals.reduce((sum, p) => sum + (p.score || 0), 0) / totalApproved)
    : 0
  
  // Calculate average review time (days between submitted and approved)
  const averageReviewTime = totalApproved > 0
    ? Math.round(approvedProposals.reduce((sum, p) => {
        if (p.submittedDate && p.approvedDate) {
          const submitted = new Date(p.submittedDate)
          const approved = new Date(p.approvedDate)
          const days = Math.ceil((approved.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24))
          return sum + days
        }
        return sum
      }, 0) / totalApproved)
    : 0

  const handleViewProposal = (proposal: any) => {
    setSelectedProposal(proposal)
  }

  const handleViewDocument = (proposal: any) => {
    setViewingDocument(proposal)
  }

  const handleDownload = (documentUrl: string) => {
    if (documentUrl) {
      window.open(documentUrl, '_blank')
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
          title="Approved Proposals"
          subtitle="View all approved research proposals from your students"
        />

        <div className="p-6 space-y-6 animate-fade-in">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Approved Proposals ({totalApproved})
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              All research topics that have been approved
            </p>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="text-center animate-slide-up">
              <CardContent className="p-6">
                <div className="text-primary mb-2">
                  <CheckCircle size={24} className="mx-auto" />
                </div>
                <p className="text-sm text-muted-foreground mb-1">Total Approved</p>
                <p className="text-2xl font-bold">
                  {loading ? '...' : totalApproved}
                </p>
              </CardContent>
            </Card>
            <Card className="text-center animate-slide-up">
              <CardContent className="p-6">
                <div className="text-primary mb-2">
                  <TrendingUp size={24} className="mx-auto" />
                </div>
                <p className="text-sm text-muted-foreground mb-1">Average Score</p>
                <p className="text-2xl font-bold">
                  {loading ? '...' : `${averageScore}/100`}
                </p>
              </CardContent>
            </Card>
            <Card className="text-center animate-slide-up">
              <CardContent className="p-6">
                <div className="text-primary mb-2">
                  <Clock size={24} className="mx-auto" />
                </div>
                <p className="text-sm text-muted-foreground mb-1">Average Review Time</p>
                <p className="text-2xl font-bold">
                  {loading ? '...' : `${averageReviewTime} days`}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Loading State */}
          {loading && approvedProposals.length === 0 ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : approvedProposals.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <CheckCircle size={48} className="text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="font-semibold text-foreground mb-2">No Approved Proposals Yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Approved proposals will appear here once you review and approve them
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Approved Proposals List */}
              <div className="space-y-3">
                {approvedProposals.map((proposal, idx) => (
                  <Card 
                    key={proposal.id} 
                    className="hover:shadow-md transition-all duration-300 animate-slide-up"
                  >
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-base mb-2">{proposal.title}</CardTitle>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-muted-foreground">
                            <p>
                              <span className="font-medium">Student:</span> {proposal.studentName}
                            </p>
                            <p>
                              <span className="font-medium">Reviewed:</span> {proposal.reviewDate 
                                ? new Date(proposal.reviewDate).toLocaleDateString() 
                                : 'N/A'}
                            </p>
                            <p>
                              <span className="font-medium">Approved:</span> {proposal.approvedDate 
                                ? new Date(proposal.approvedDate).toLocaleDateString() 
                                : 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            {formatStatus(proposal.status)}
                          </div>
                          {proposal.score && (
                            <p className="text-lg font-bold text-primary mt-2">{proposal.score}/100</p>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleViewProposal(proposal)}
                        >
                          <Eye size={16} className="mr-1" />
                          View Details
                        </Button>
                        {proposal.documentUrl && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleViewDocument(proposal)}
                            >
                              <FileText size={16} className="mr-1" />
                              View Document
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleDownload(proposal.documentUrl!)}
                            >
                              <Download size={16} className="mr-1" />
                              Download
                            </Button>
                          </>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setManagingTopic(proposal)}
                        >
                          <ArchiveRestore size={16} className="mr-1" />
                          Manage
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {/* Archive Policy Note */}
          <Card className="bg-amber-50 border-amber-200">
            <CardHeader>
              <CardTitle className="text-base text-amber-900">Archive Policy</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-amber-800">
              <p>
                Approved topics are archived after 2 years of completion. 
                You can request to restore archived topics if needed.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* View Proposal Modal */}
        {selectedProposal && (
          <ViewProposalModal
            isOpen={!!selectedProposal}
            onClose={() => setSelectedProposal(null)}
            proposal={{
              ...selectedProposal,
              abstract: selectedProposal.description || 'No abstract available',
              studentName: selectedProposal.studentName,
              studentEmail: selectedProposal.studentEmail,
              studentMatricNumber: selectedProposal.studentMatricNumber,
              supervisorName: selectedProposal.supervisorName,
              supervisorEmail: selectedProposal.supervisorEmail,
              submittedDate: selectedProposal.submittedDate,
              status: selectedProposal.status,
              score: selectedProposal.score,
              documentUrl: selectedProposal.documentUrl,
              reviews: selectedProposal.reviews || []
            }}
            canUpdateStatus={false}
          />
        )}

        {/* Document Viewer Modal */}
        {viewingDocument && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-background rounded-lg shadow-lg max-w-5xl w-full max-h-[90vh] flex flex-col animate-scale-in">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{viewingDocument.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    Student: {viewingDocument.studentName}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(viewingDocument.documentUrl!)}
                  >
                    <Download size={16} className="mr-2" />
                    Download
                  </Button>
                  <button
                    onClick={() => setViewingDocument(null)}
                    className="p-1 hover:bg-secondary rounded transition-colors"
                  >
                    <span className="text-2xl">&times;</span>
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-hidden p-4">
                <iframe
                  src={viewingDocument.documentUrl}
                  className="w-full h-full border-0 rounded"
                  title={viewingDocument.title}
                />
              </div>
            </div>
          </div>
        )}

        {/* Topic Management Modal */}
        {managingTopic && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-background rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] flex flex-col animate-scale-in">
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-xl font-semibold text-foreground">
                  Manage Topic - {managingTopic.studentName}
                </h2>
                <button
                  onClick={() => setManagingTopic(null)}
                  className="p-1 hover:bg-secondary rounded transition-colors"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Research Topic</h3>
                  <p className="text-foreground">{managingTopic.title}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-secondary rounded-lg">
                    <p className="text-xs text-muted-foreground">Score</p>
                    <p className="font-semibold text-foreground">{managingTopic.score}/100</p>
                  </div>
                  <div className="p-3 bg-secondary rounded-lg">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="font-semibold text-green-600">
                      {formatStatus(managingTopic.status)}
                    </p>
                  </div>
                  <div className="p-3 bg-secondary rounded-lg">
                    <p className="text-xs text-muted-foreground">Submitted</p>
                    <p className="font-semibold text-foreground">
                      {new Date(managingTopic.submittedDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="p-3 bg-secondary rounded-lg">
                    <p className="text-xs text-muted-foreground">Approved</p>
                    <p className="font-semibold text-foreground">
                      {managingTopic.approvedDate 
                        ? new Date(managingTopic.approvedDate).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground">
                    {managingTopic.description || 'No description available'}
                  </p>
                </div>
                
                {managingTopic.reviews && managingTopic.reviews.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Reviews</h3>
                    <div className="space-y-2">
                      {managingTopic.reviews.map((review: any) => (
                        <div key={review.id} className="p-3 bg-secondary rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <p className="font-medium text-sm">{review.reviewerName}</p>
                            {review.rating > 0 && (
                              <span className="text-xs font-semibold text-primary">
                                Rating: {review.rating}/100
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{review.feedback}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2 p-6 border-t border-border">
                <Button 
                  className="flex-1"
                  onClick={() => {
                    // Add edit functionality if needed
                    alert('Edit topic functionality coming soon')
                  }}
                >
                  Edit Topic
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setManagingTopic(null)}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </DashboardLayout>
  )
}