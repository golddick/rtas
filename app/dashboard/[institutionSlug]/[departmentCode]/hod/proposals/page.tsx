// app/(dashboard)/proposals/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/card-component'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Filter, Search, Eye, Download, Loader2, AlertCircle } from 'lucide-react'
import { ViewProposalModal } from '@/components/modals/view-proposal-modal'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useProposalStore } from '@/store/hod/proposal/proposalStore'

const getStatusColor = (status: string) => {
  switch (status) {
    case 'APPROVED':
      return 'bg-green-100 text-green-700'
    case 'SUBMITTED':
      return 'bg-gray-100 text-gray-700'
    case 'UNDER_REVIEW':
      return 'bg-blue-100 text-blue-700'
    case 'REVISION_NEEDED':
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
  const {
    proposals,
    selectedProposal,
    loading,
    error,
    pagination,
    filters,
    fetchProposals,
    setSelectedProposal,
    setFilters,
    updateProposalStatus,
    clearError
  } = useProposalStore()

  const [searchInput, setSearchInput] = useState(filters.search)

  useEffect(() => {
    fetchProposals()
  }, [fetchProposals])

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

  const handleUpdateStatus = async (proposalId: string, status: string, score?: number) => {
    await updateProposalStatus(proposalId, status, score)
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
          title="Department Proposals"
          subtitle="Review and manage research proposals in your department"
        />

        <div className="p-6 space-y-6 animate-fade-in">
          {/* Filter and Search Section */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              {['All', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REVISION_NEEDED', 'REJECTED'].map((status) => (
                <Button
                  key={status}
                  variant={filters.status === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusFilter(status)}
                  className="gap-1"
                >
                  {status === 'All' && <Filter size={16} />}
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

          {/* Proposals Table */}
          {loading && proposals.length === 0 ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : proposals.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No proposals found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {proposals.map((proposal, idx) => (
                <Card key={proposal.id} className="hover:shadow-md transition-all duration-300 animate-slide-up" >
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-base mb-2">{proposal.title}</CardTitle>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          <p className="text-muted-foreground">
                            <span className="font-medium">Student:</span> {proposal.studentName}
                          </p>
                          <p className="text-muted-foreground">
                            <span className="font-medium">Supervisor:</span> {proposal.supervisorName}
                          </p>
                          <p className="text-muted-foreground">
                            <span className="font-medium">Submitted:</span> {proposal.submittedDate}
                          </p>
                          {proposal.studentMatricNumber && (
                            <p className="text-muted-foreground">
                              <span className="font-medium">Matric No:</span> {proposal.studentMatricNumber}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(proposal.status)}`}>
                          {formatStatus(proposal.status)}
                        </span>
                        {proposal.score && (
                          <span className="text-sm font-semibold text-primary">{proposal.score}/100</span>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewProposal(proposal)}>
                        <Eye size={16} />
                        View Details
                      </Button>
                      {proposal.documentUrl && (
                        <Button variant="outline" size="sm" onClick={() => window.open(proposal.documentUrl, '_blank')}>
                          <Download size={16} />
                          Download
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
        </div>

        {/* View Proposal Modal */}
        {selectedProposal && (
          <ViewProposalModal
            isOpen={!!selectedProposal}
            onClose={() => setSelectedProposal(null)}
            proposal={selectedProposal}
            onUpdateStatus={handleUpdateStatus}
            canUpdateStatus={true}
          />
        )}
      </main>
    </DashboardLayout>
  )
}