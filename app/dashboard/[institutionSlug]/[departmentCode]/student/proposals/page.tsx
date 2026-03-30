
// app/dashboard/[institutionSlug]/[departmentCode]/student/proposals/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/card-component'
import { Button } from '@/components/ui/button'
import { Eye, Download, Plus, Loader2, AlertCircle } from 'lucide-react'
import { ViewProposalModal } from '@/components/modals/view-proposal-modal'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useStudentProposalStore } from '@/store/student/propsal/studentProposalStore'

const getStatusColor = (status: string) => {
  switch (status) {
    case 'APPROVED':
      return 'bg-green-100 text-green-700'
    case 'SUBMITTED':
      return 'bg-blue-100 text-blue-700'
    case 'UNDER_REVIEW':
      return 'bg-yellow-100 text-yellow-700'
    case 'REVISION_REQUESTED':
      return 'bg-orange-100 text-orange-700'
    case 'REJECTED':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

const formatStatus = (status: string) => {
  return status.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ')
}

export default function ProposalsPage() {
  const params = useParams()
  const router = useRouter()
  const institutionSlug = params.institutionSlug as string
  const departmentCode = params.departmentCode as string
  
  const {
    proposals,
    loading,
    error,
    fetchProposals,
    deleteProposal,
    clearError
  } = useStudentProposalStore()

  const [selectedProposal, setSelectedProposal] = useState<any>(null)

  useEffect(() => {
    fetchProposals()
  }, [])

  const handleViewProposal = (proposal: any) => {
    setSelectedProposal(proposal)
  }

  const handleDeleteProposal = async (id: string) => {
    if (confirm('Are you sure you want to delete this proposal? This action cannot be undone.')) {
      await deleteProposal(id)
    }
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
          title="My Proposals"
          subtitle="Manage and track your research proposals"
        />

        <div className="p-6 space-y-6 animate-fade-in">
          {/* Header with Add Button */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">My Proposals ({proposals.length})</h2>
              <p className="text-sm text-muted-foreground mt-1">Submit and track your research proposals</p>
            </div>
            <Link href={`/dashboard/${institutionSlug}/${departmentCode}/student/proposals/add`}>
              <Button className="w-full sm:w-auto gap-2 animate-scale-in">
                <Plus size={18} />
                New Proposal
              </Button>
            </Link>
          </div>

          {/* Loading State */}
          {loading && proposals.length === 0 ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : proposals.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No proposals yet. Create your first proposal!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {proposals.map((proposal, idx) => (
                <Card key={proposal.id} className="overflow-hidden hover:shadow-md transition-all duration-300 animate-slide-up">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{proposal.title}</CardTitle>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground mt-2">
                          <p>Submitted: {proposal.submittedDate}</p>
                          {proposal.supervisorName && (
                            <p>Supervisor: {proposal.supervisorName}</p>
                          )}
                        </div>
                      </div>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(proposal.status)} whitespace-nowrap`}>
                        {formatStatus(proposal.status)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {proposal.feedback && (
                      <div className="p-4 bg-secondary rounded-lg">
                        <p className="text-sm font-medium mb-2">Latest Feedback:</p>
                        <p className="text-sm text-muted-foreground">{proposal.feedback}</p>
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewProposal(proposal)}>
                        <Eye size={16} className="mr-1" />
                        View
                      </Button>
                      {proposal.documentUrl && (
                        <Button variant="outline" size="sm" onClick={() => handleDownload(proposal.documentUrl!)}>
                          <Download size={16} className="mr-1" />
                          Download
                        </Button>
                      )}
                      {(proposal.status === 'SUBMITTED' || proposal.status === 'REVISION_REQUESTED') && (
                        <>
                          <Link href={`/dashboard/${institutionSlug}/${departmentCode}/student/proposals/edit/${proposal.id}`}>
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                          </Link>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDeleteProposal(proposal.id)}
                            className="hover:bg-red-50"
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </div>

                    {proposal.score && (
                      <div className="pt-2 border-t">
                        <p className="text-sm font-medium text-primary">Score: {proposal.score}/100</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Help Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
              Reach out to your assigned supervisor
              </p>
              <div className="flex gap-2 flex-wrap">
                <Link href={`/dashboard/${institutionSlug}/${departmentCode}/student/supervisor`}>
                  <Button variant="outline" size="sm">
                    Contact Supervisor
                  </Button>
                </Link>
              </div>
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
              abstract: selectedProposal.description,
              studentName: 'You',
              supervisorName: selectedProposal.supervisorName || 'Not Assigned',
              objectives: [],
              methodology: '',
              timeline: ''
            }}
          />
        )}
      </main>
    </DashboardLayout>
  )
}