'use client'
// app/dashboard/[institutionSlug]/[departmentCode]/student/proposals/edit/[proposalId]/page.tsx
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/card-component'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ChevronLeft, ChevronRight, CheckCircle, FileText, Loader2, AlertCircle, Upload, Trash2, Eye } from 'lucide-react'
import { useStudentProposalStore } from '@/store/student/propsal/studentProposalStore'
import { uploadFile } from '@/lib/file/upload'
import Link from 'next/link'

const steps = [
  { number: 1, title: 'Basic Information', description: 'Update your research title and description' },
  { number: 2, title: 'Upload Document', description: 'Update your proposal document' },
]

export default function EditProposalPage() {
  const router = useRouter()
  const params = useParams()
  const institutionSlug = params.institutionSlug as string
  const departmentCode = params.departmentCode as string
  const proposalId = params.proposalId as string
  
  const { proposals, updateProposal, fetchProposals, loading: storeLoading } = useStudentProposalStore()
  
  const [currentStep, setCurrentStep] = useState(1)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [documentUrl, setDocumentUrl] = useState<string | null>(null)
  const [originalDocumentUrl, setOriginalDocumentUrl] = useState<string | null>(null)
  const [originalDocumentName, setOriginalDocumentName] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [proposalNotFound, setProposalNotFound] = useState(false)

  // Fetch proposals if not loaded
  useEffect(() => {
    const loadProposals = async () => {
      try {
        if (proposals.length === 0) {
          await fetchProposals(1, 50) // Fetch more proposals to ensure we get the one we need
        }
        setLoading(false)
      } catch (err) {
        console.error('Failed to fetch proposals:', err)
        setError('Failed to load proposals')
        setLoading(false)
      }
    }
    loadProposals()
  }, [fetchProposals, proposals.length])

  // Find and populate proposal data
  useEffect(() => {
    if (!loading && proposals.length > 0) {
      console.log('Looking for proposal with ID:', proposalId)
      console.log('Available proposals:', proposals.map(p => ({ id: p.id, title: p.title })))
      
      const proposal = proposals.find(p => p.id === proposalId)
      
      if (proposal) {
        console.log('Found proposal:', proposal)
        setTitle(proposal.title)
        setDescription(proposal.description)
        setDocumentUrl(proposal.documentUrl || null)
        setOriginalDocumentUrl(proposal.documentUrl || null)
        setOriginalDocumentName(proposal.documentName || null)
      } else {
        console.error('Proposal not found with ID:', proposalId)
        setProposalNotFound(true)
        setError('Proposal not found')
      }
    }
  }, [loading, proposals, proposalId])

  const canProceed = () => {
    if (currentStep === 1) return title.trim() && description.trim()
    if (currentStep === 2) return true // Document is optional for edit
    return true
  }

  const hasChanges = () => {
    const proposal = proposals.find(p => p.id === proposalId)
    if (!proposal) return false
    
    return (
      title !== proposal.title ||
      description !== proposal.description ||
      documentUrl !== proposal.documentUrl
    )
  }

  const handleFileUpload = async (file: File) => {
    setUploading(true)
    setError('')
    
    try {
      const result = await uploadFile(file, {
        folder: 'proposals',
        filename: `proposal_${Date.now()}`,
        description: title || 'Research Proposal'
      })
      
      if (result.success && result.data) {
        setDocumentUrl(result.data.url)
        setDocumentFile(file)
      } else {
        setError(result.error || 'Failed to upload document')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveDocument = () => {
    setDocumentUrl(null)
    setDocumentFile(null)
  }

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      setError('Please fill in all required fields')
      return
    }
    
    setSubmitting(true)
    setError('')
    
    try {
      const updateData: {
        title: string
        description: string
        documentUrl?: string | null
        documentName?: string | null
        documentSize?: number | null
      } = {
        title: title.trim(),
        description: description.trim(),
      }
      
      // Only include documentUrl if it has changed
      if (documentUrl !== originalDocumentUrl) {
        updateData.documentUrl = documentUrl
        if (documentFile) {
          updateData.documentName = documentFile.name
          updateData.documentSize = documentFile.size
        } else if (!documentUrl && originalDocumentUrl) {
          // Document was removed
          updateData.documentName = null
          updateData.documentSize = null
        }
      }
      
      const success = await updateProposal(proposalId, updateData)
      
      if (success) {
        router.push(`/dashboard/${institutionSlug}/${departmentCode}/student/proposals`)
      } else {
        setError('Failed to update proposal. Please try again.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setSubmitting(false)
    }
  }

  // Show loading state
  if (loading || storeLoading) {
    return (
      <DashboardLayout>
        <main className="flex-1 md:ml-0 overflow-hidden">
          <div className="p-6 flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading proposal...</p>
          </div>
        </main>
      </DashboardLayout>
    )
  }

  // Show not found state
  if (proposalNotFound) {
    return (
      <DashboardLayout>
        <main className="flex-1 md:ml-0 overflow-hidden">
          <div className="p-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Proposal not found or you don't have permission to edit it.
                <br />
                <br />
                Proposal ID: {proposalId}
                <br />
                Available proposals: {proposals.length}
              </AlertDescription>
            </Alert>
            <Button
              className="mt-4"
              onClick={() => router.push(`/dashboard/${institutionSlug}/${departmentCode}/student/proposals`)}
            >
              Back to Proposals
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
          title="Edit Proposal"
          subtitle="Update your research proposal"
        />

        <div className="p-6 space-y-6 animate-fade-in">
          {/* Progress Steps */}
          <div className="w-full">
            <div className="flex items-center justify-between mb-8 w-full">
              {steps.map((step, idx) => (
                <div key={step.number} className="flex-1">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-full font-semibold flex items-center justify-center transition-all flex-shrink-0 ${
                        currentStep === step.number ? 'bg-primary text-white ring-4 ring-primary ring-opacity-20' :
                        currentStep > step.number ? 'bg-green-100 text-green-700' :
                        'bg-secondary text-muted-foreground'
                      }`}
                    >
                      {currentStep > step.number ? <CheckCircle size={20} /> : step.number}
                    </div>
                    {idx < steps.length - 1 && (
                      <div className={`flex-1 h-1 ${currentStep > step.number ? 'bg-green-100' : 'bg-secondary'}`} />
                    )}
                  </div>
                  <div className="mt-3 text-center">
                    <p className="text-sm font-semibold text-foreground">{step.title}</p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Form Content */}
          <Card>
            <CardHeader>
              <CardTitle>{steps[currentStep - 1].title}</CardTitle>
              <CardDescription>{steps[currentStep - 1].description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="space-y-2">
                    <Label htmlFor="title">Research Title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., AI-Powered Educational Analytics Platform"
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Provide a detailed description of your research..."
                      rows={8}
                      className="w-full"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Upload Document */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="space-y-2">
                    <Label>Proposal Document</Label>
                    
                    {/* Current Document Display */}
                    {documentUrl && !documentFile && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <FileText size={18} className="text-blue-700" />
                            </div>
                            <div>
                              <p className="font-medium text-blue-900">Current Document</p>
                              <p className="text-xs text-blue-800">
                                {originalDocumentName || 'Your existing proposal document'}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Link
                              href={documentUrl}
                              target="_blank"
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                            >
                              <Eye size={14} />
                              View
                            </Link>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleRemoveDocument}
                              className="gap-1"
                            >
                              <Trash2 size={14} />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Upload New Document */}
                    <div className="border-2 border-dashed border-primary rounded-lg p-8 text-center hover:bg-blue-50/50 transition-colors w-full">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleFileUpload(file)
                        }}
                        className="hidden"
                        id="document-upload"
                      />
                      <label htmlFor="document-upload" className="cursor-pointer block w-full">
                        <div className="flex flex-col items-center gap-2">
                          {uploading ? (
                            <>
                              <Loader2 size={40} className="animate-spin text-primary" />
                              <p className="text-sm text-muted-foreground">Uploading...</p>
                            </>
                          ) : (
                            <>
                              <div className="p-3 bg-primary/10 rounded-lg">
                                <Upload size={24} className="text-primary" />
                              </div>
                              <p className="font-medium text-foreground">
                                {documentFile ? documentFile.name : 'Upload a new document (optional)'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Click to select a new file (PDF, DOC, DOCX)
                              </p>
                            </>
                          )}
                        </div>
                      </label>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      Maximum file size: 100MB. Accepted formats: PDF, Word Document
                    </p>
                  </div>

                  {/* Newly Uploaded Document Preview */}
                  {documentFile && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <FileText size={18} className="text-green-700" />
                          </div>
                          <div>
                            <p className="font-medium text-green-900">{documentFile.name}</p>
                            <p className="text-xs text-green-800">{(documentFile.size / 1024).toFixed(2)} KB</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleRemoveDocument}
                          className="gap-1"
                        >
                          <Trash2 size={14} />
                          Remove
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Info Message */}
                  {!documentUrl && !documentFile && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-sm text-amber-800">
                        You don't have a document uploaded. You can upload one now or keep it empty.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between gap-4 w-full">
            <Button
              variant="outline"
              disabled={currentStep === 1}
              onClick={() => setCurrentStep(currentStep - 1)}
              className="gap-2"
            >
              <ChevronLeft size={16} />
              Previous
            </Button>

            <div className="text-sm text-muted-foreground">
              Step {currentStep} of {steps.length}
            </div>

            {currentStep < steps.length ? (
              <Button
                disabled={!canProceed()}
                onClick={() => setCurrentStep(currentStep + 1)}
                className="gap-2"
              >
                Next
                <ChevronRight size={16} />
              </Button>
            ) : (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || uploading || !hasChanges()}
                  className="gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Update Proposal
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Change Summary */}
          {hasChanges() && currentStep === 2 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 font-medium">Changes to be saved:</p>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                {title !== proposals.find(p => p.id === proposalId)?.title && (
                  <li>• Title has been modified</li>
                )}
                {description !== proposals.find(p => p.id === proposalId)?.description && (
                  <li>• Description has been modified</li>
                )}
                {documentUrl !== proposals.find(p => p.id === proposalId)?.documentUrl && (
                  <li>• Document has been {documentUrl ? 'updated' : 'removed'}</li>
                )}
              </ul>
            </div>
          )}
        </div>
      </main>
    </DashboardLayout>
  )
}