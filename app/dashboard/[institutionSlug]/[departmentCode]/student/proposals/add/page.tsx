// app/dashboard/[institutionSlug]/[departmentCode]/student/proposals/add/page.tsx
'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/card-component'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ChevronLeft, ChevronRight, CheckCircle, FileText, Loader2, AlertCircle, Upload } from 'lucide-react'
import { useStudentProposalStore } from '@/store/student/propsal/studentProposalStore'
import { uploadFile } from '@/lib/file/upload'

const steps = [
  { number: 1, title: 'Basic Information', description: 'Title and description of your research' },
  { number: 2, title: 'Upload Document', description: 'Submit your proposal document' },
]

export default function AddProposalPage() {
  const router = useRouter()
  const params = useParams()
  const institutionSlug = params.institutionSlug as string
  const departmentCode = params.departmentCode as string
  
  const { createProposal } = useStudentProposalStore()
  
  const [currentStep, setCurrentStep] = useState(1)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [documentUrl, setDocumentUrl] = useState<string | null>(null)
  const [documentName, setDocumentName] = useState<string | null>(null)
  const [documentSize, setDocumentSize] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const canProceed = () => {
    if (currentStep === 1) return title.trim() && description.trim()
    if (currentStep === 2) return documentFile !== null || documentUrl !== null
    return true
  }

  const handleFileUpload = async (file: File) => {
    setUploading(true)
    setError('')
    
    try {
      const result = await uploadFile(file, {
        folder: 'Research Topic proposals',
        filename: file.name,
        description: title || 'Research Proposal'
      })
      
      if (result.success && result.data) {
        setDocumentUrl(result.data.url)
        setDocumentName(result.data.name)
        setDocumentSize(result.data.size)
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

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      setError('Please fill in all required fields')
      return
    }
    
    if (!documentUrl) {
      setError('Please upload your proposal document')
      return
    }
    
    setSubmitting(true)
    setError('')
    
    try {
      const success = await createProposal({
        title: title.trim(),
        description: description.trim(),
        documentUrl,
        documentName, 
        documentSize
      })
      
      if (success) {
        router.push(`/dashboard/${institutionSlug}/${departmentCode}/student/proposals`)
      } else {
        setError('Failed to submit proposal. Please try again.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <main className="flex-1 md:ml-0 overflow-hidden">
        <DashboardHeader
          title="Submit New Proposal"
          subtitle="Follow the steps to submit your research proposal"
        />

        <div className="p-6 space-y-6 animate-fade-in">
          {/* Progress Steps - Full Width */}
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
                    <Label>Proposal Document *</Label>
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
                                {documentFile ? documentFile.name : 'Drag and drop your document here'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                or click to select (PDF, DOC, DOCX)
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

                  {documentFile && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 w-full">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <FileText size={18} className="text-green-700" />
                        </div>
                        <div>
                          <p className="font-medium text-green-900">{documentFile.name}</p>
                          <p className="text-xs text-green-800">{(documentFile.size / 1024).toFixed(2)} KB</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation Buttons - Full Width */}
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
              <Button
                onClick={handleSubmit}
                disabled={submitting || uploading || !documentUrl}
                className="gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Submit Proposal
                  </>
                )}
              </Button>
            )}
          </div>

        </div>
      </main>
    </DashboardLayout>
  )
}