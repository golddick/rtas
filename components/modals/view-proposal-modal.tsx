// components/modals/view-proposal-modal.tsx
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, User, Mail, Calendar, Award, BookOpen, MessageSquare, Download, Eye } from 'lucide-react'
import { DocumentViewer } from '@/components/document-viewer'

interface ProposalReview {
  id: string
  feedback: string
  rating: number
  status: string
  reviewerName: string
  reviewerEmail: string
  reviewerRole: string
  createdAt: Date
  updatedAt: Date
}

interface ViewProposalModalProps {
  isOpen: boolean
  onClose: () => void
  proposal: {
    id: string
    title: string
    description?: string | null
    abstract: string
    studentName: string
    studentEmail?: string | null
    studentMatricNumber?: string | null
    studentPhone?: string | null
    supervisorName: string
    supervisorEmail?: string | null
    supervisorStaffNumber?: string | null
    supervisorPhone?: string | null
    submittedDate: string
    status: string
    score: number | null
    documentUrl?: string | null
    department?: {
      id: string
      name: string
      code: string
      faculty?: string
    } | null
    reviews?: ProposalReview[] | null
    reviewDate?: Date | null
    approvedDate?: Date | null
    createdAt?: Date | null
    updatedAt?: Date | null
  }
  onUpdateStatus?: (proposalId: string, status: string, feedback?: string, rating?: number) => Promise<void>
  canUpdateStatus?: boolean
}

const formatStatus = (status: string) => {
  return status.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ')
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'APPROVED':
      return 'bg-green-100 text-green-700'
    case 'SUBMITTED':
      return 'bg-gray-100 text-gray-700'
    case 'UNDER_REVIEW':
      return 'bg-blue-100 text-blue-700'
    case 'REVISION_REQUESTED':
      return 'bg-orange-100 text-orange-700'
    case 'REJECTED':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

export function ViewProposalModal({ 
  isOpen, 
  onClose, 
  proposal, 
  onUpdateStatus, 
  canUpdateStatus = false 
}: ViewProposalModalProps) {
  const [status, setStatus] = useState(proposal.status)
  const [feedback, setFeedback] = useState('')
  const [rating, setRating] = useState(proposal.score?.toString() || '')
  const [updating, setUpdating] = useState(false)
  const [activeTab, setActiveTab] = useState('details')

  const handleUpdate = async () => {
    if (!onUpdateStatus) return
    
    setUpdating(true)
    try {
      await onUpdateStatus(
        proposal.id,
        status,
        feedback || undefined,
        rating ? parseInt(rating) : undefined
      )
      onClose()
    } catch (error) {
      console.error('Failed to update proposal:', error)
    } finally {
      setUpdating(false)
    }
  }

  const handleDownload = () => {
    if (proposal.documentUrl) {
      window.open(proposal.documentUrl, '_blank')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Proposal Details</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">
              <FileText size={16} className="mr-2" />
              Details
            </TabsTrigger>
            <TabsTrigger value="document">
              <Eye size={16} className="mr-2" />
              Document
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="mt-4">
            <ScrollArea className="h-[calc(90vh-180px)] pr-4">
              <div className="space-y-6">
                {/* Proposal Title and Status */}
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{proposal.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(proposal.status)}`}>
                        {formatStatus(proposal.status)}
                      </span>
                      {proposal.score && (
                        <span className="text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                          Score: {proposal.score}/100
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Student Information */}
                <Card>
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <User size={18} />
                      Student Information
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Full Name</p>
                        <p className="font-medium capitalize">{proposal.studentName}</p>
                      </div>
                      {proposal.studentMatricNumber && (
                        <div>
                          <p className="text-muted-foreground">Matriculation Number</p>
                          <p className="font-medium">{proposal.studentMatricNumber}</p>
                        </div>
                      )}
                      {proposal.studentEmail && (
                        <div>
                          <p className="text-muted-foreground">Email</p>
                          <p className="font-medium flex items-center gap-1">
                            <Mail size={14} />
                            {proposal.studentEmail}
                          </p>
                        </div>
                      )}
                      {proposal.studentPhone && (
                        <div>
                          <p className="text-muted-foreground">Phone</p>
                          <p className="font-medium">{proposal.studentPhone}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Supervisor Information */}
                <Card>
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <BookOpen size={18} />
                      Supervisor Information
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Full Name</p>
                        <p className="font-medium capitalize">{proposal.supervisorName}</p>
                      </div>
                      {proposal.supervisorEmail && (
                        <div>
                          <p className="text-muted-foreground">Email</p>
                          <p className="font-medium flex items-center gap-1">
                            <Mail size={14} />
                            {proposal.supervisorEmail}
                          </p>
                        </div>
                      )}
                      {proposal.supervisorStaffNumber && (
                        <div>
                          <p className="text-muted-foreground">Staff Number</p>
                          <p className="font-medium">{proposal.supervisorStaffNumber}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Description */}
                <Card>
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <FileText size={18} />
                      Description
                    </h4>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      { proposal.description || 'No description provided'}
                    </p>
                  </CardContent>
                </Card>

                {/* Submission Details */}
                <Card>
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <Calendar size={18} />
                      Submission Details
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Submitted Date</p>
                        <p className="font-medium">{proposal.submittedDate}</p>
                      </div>
                      {proposal.department && (
                        <div>
                          <p className="text-muted-foreground">Department</p>
                          <p className="font-medium">{proposal.department.name}</p>
                        </div>
                      )}
                      {proposal.reviewDate && (
                        <div>
                          <p className="text-muted-foreground">Review Date</p>
                          <p className="font-medium">{new Date(proposal.reviewDate).toLocaleDateString()}</p>
                        </div>
                      )}
                      {proposal.approvedDate && (
                        <div>
                          <p className="text-muted-foreground">Approved Date</p>
                          <p className="font-medium">{new Date(proposal.approvedDate).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Reviews Section */}
                {proposal.reviews && proposal.reviews.length > 0 && (
                  <Card>
                    <CardContent className="pt-6">
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <MessageSquare size={18} />
                        Previous Reviews
                      </h4>
                      <div className="space-y-4">
                        {proposal.reviews.map((review) => (
                          <div key={review.id} className="border-l-4 border-primary/30 pl-4 py-2">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-medium">{review.reviewerName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {review.reviewerRole} • {new Date(review.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              {review.rating > 0 && (
                                <span className="text-sm font-semibold bg-primary/10 px-2 py-1 rounded">
                                  {review.rating}/100
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">{review.feedback}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Status Update Section */}
                {canUpdateStatus && onUpdateStatus && (
                  <Card>
                    <CardContent className="pt-6">
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <Award size={18} />
                        Review & Update Status
                      </h4>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Decision</Label>
                          <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                              <SelectItem value="APPROVED">Approve</SelectItem>
                              <SelectItem value="REVISION_REQUESTED">Request Revision</SelectItem>
                              <SelectItem value="REJECTED">Reject</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Rating (Optional)</Label>
                          <Input
                            type="number"
                            placeholder="Enter score (0-100)"
                            value={rating}
                            onChange={(e) => setRating(e.target.value)}
                            min="0"
                            max="100"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Feedback</Label>
                          <textarea
                            className="w-full min-h-[100px] px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Provide detailed feedback to the student..."
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                          />
                        </div>

                        <Button onClick={handleUpdate} disabled={updating} className="w-full">
                          {updating ? 'Submitting...' : 'Submit Review'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="document" className="mt-4">
            <div className="h-[calc(90vh-180px)]">
              {proposal.documentUrl ? (
                <>
                  <DocumentViewer
                    title={proposal.title}
                    documentUrl={proposal.documentUrl}
                    fileName={`${proposal.studentName.replace(/\s+/g, '_')}_proposal.pdf`}
                    fileType="pdf"
                  />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <FileText size={64} className="text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No document available for this proposal</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

      </DialogContent>
    </Dialog>
  )
}