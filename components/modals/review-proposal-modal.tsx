// components/modals/review-proposal-modal.tsx
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileText, User, Calendar, Award, Download, File, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ReviewProposalModalProps {
  isOpen: boolean
  onClose: () => void
  proposal: {
    id: string
    title: string
    studentName: string
    studentId: string
    status: string
    score: number | null
    submittedDate: string | null
    latestFeedback?: string
    documentUrl: string,
    documentName: string, 
    documentSize: number, 

  }
  onUpdate: (proposalId: string, status: string, feedback?: string, rating?: number) => Promise<void>
}

export function ReviewProposalModal({ isOpen, onClose, proposal, onUpdate }: ReviewProposalModalProps) {
  const [status, setStatus] = useState(proposal.status)
  const [feedback, setFeedback] = useState(proposal.latestFeedback || '')
  const [rating, setRating] = useState(proposal.score?.toString() || '')
  const [updating, setUpdating] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const handleDownload = async () => {
    if (!proposal.documentUrl) {
      setDownloadError('No file available to download')
      return
    }

    setDownloading(true)
    setDownloadError(null)

    console.log (proposal, 'pro')

    try {
      // Fetch the file
      const response = await fetch(proposal.documentUrl)
      if (!response.ok) {
        throw new Error(`Failed to download: ${response.statusText}`)
      }

      // Get the blob
      const blob = await response.blob()
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = proposal.documentName || `proposal-${proposal.id}.pdf`
      document.body.appendChild(a)
      a.click()
      
      // Cleanup
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download error:', error)
      setDownloadError(error instanceof Error ? error.message : 'Failed to download file')
    } finally {
      setDownloading(false)
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }

  const handleSubmit = async () => {
    setUpdating(true)
    try {
      await onUpdate(
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Review Proposal</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[calc(90vh-120px)] pr-4">
          <div className="space-y-6 p-4">
            {/* Proposal Information */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{proposal.title}</h3>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Student</p>
                    <p className="font-medium flex items-center gap-1">
                      <User size={14} />
                      {proposal.studentName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Submitted</p>
                    <p className="font-medium flex items-center gap-1">
                      <Calendar size={14} />
                      {proposal.submittedDate || 'Not submitted'}
                    </p>
                  </div>
                </div>
              </div>

              {/* File Download Section */}
              {proposal.documentUrl && (
                <div className="space-y-2">
                  <Label>Proposal File</Label>
                  <div className="border rounded-lg p-4 bg-secondary/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <File className="h-8 w-8 text-primary" />
                        <div>
                          <p className="font-medium text-sm">
                            {proposal.documentName || 'Proposal Document'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(proposal.documentSize)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownload}
                        disabled={downloading}
                      >
                        {downloading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Downloading...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  {downloadError && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertDescription>{downloadError}</AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {/* Status Selection */}
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

              {/* Rating (Optional) */}
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

              {/* Feedback */}
              <div className="space-y-2">
                <Label>Feedback</Label>
                <Textarea
                  placeholder="Provide detailed feedback to the student..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={6}
                />
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={updating}>
            {updating ? 'Submitting...' : 'Submit Review'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}