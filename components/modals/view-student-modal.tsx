// components/modals/view-student-modal.tsx
'use client'

import { Button } from '@/components/ui/button'
import { Student } from '@/store/supervisor/student/studentStore'
import { X, Mail, Phone, BookOpen, TrendingUp, MessageSquare, Calendar, Award, FileText } from 'lucide-react'

interface ViewStudentModalProps {
  isOpen: boolean
  onClose: () => void
  onMessage?: () => void
  onReview?: () => void
  student: Student
}

const formatStatus = (status: string) => {
  if (status === 'No Proposal') return 'No Proposal'
  return status.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ')
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
    case 'No Proposal':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

export function ViewStudentModal({ isOpen, onClose, onMessage, onReview, student }: ViewStudentModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-background rounded-xl border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border p-6 flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-foreground mb-2 capitalize">{student.fullName}</h2>
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">{student.studentId}</p>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(student.proposalStatus)}`}>
                {formatStatus(student.proposalStatus)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Contact Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Mail size={16} />
              Contact Information
            </h3>
            {student.email && (
              <div className="flex items-center gap-3 text-sm text-muted-foreground pl-6">
                <Mail size={14} className="text-primary" />
                <a href={`mailto:${student.email}`} className="hover:text-primary transition-colors">
                  {student.email}
                </a>
              </div>
            )}
            {student.phone && (
              <div className="flex items-center gap-3 text-sm text-muted-foreground pl-6">
                <Phone size={14} className="text-primary" />
                {student.phone}
              </div>
            )}
          </div>

          {/* Academic Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <BookOpen size={16} />
              Academic Information
            </h3>
            <div className="bg-secondary rounded-lg p-4 space-y-3">
              {student.department && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Department</p>
                  <p className="font-semibold text-foreground">{student.department.name}</p>
                </div>
              )}
              {student.program && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Program</p>
                  <p className="font-semibold text-foreground">{student.program}</p>
                </div>
              )}
              {student.matricNumber && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Matriculation Number</p>
                  <p className="font-semibold text-foreground">{student.matricNumber}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Assigned Since</p>
                <p className="font-semibold text-foreground">{student.joinDate}</p>
              </div>
            </div>
          </div>

          {/* Proposal Information */}
          {student.proposal && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <FileText size={16} />
                Current Proposal
              </h3>
              <div className="bg-secondary rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Title</p>
                  <p className="font-semibold text-foreground">{student.proposal.title}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full inline-block ${getStatusColor(student.proposal.status)}`}>
                    {formatStatus(student.proposal.status)}
                  </span>
                </div>
                {student.proposal.score && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Score</p>
                    <p className="font-semibold text-foreground flex items-center gap-1">
                      <Award size={14} className="text-primary" />
                      {student.proposal.score}/100
                    </p>
                  </div>
                )}
                {student.proposal.submittedDate && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Submitted</p>
                    <p className="font-semibold text-foreground flex items-center gap-1">
                      <Calendar size={14} />
                      {student.proposal.submittedDate}
                    </p>
                  </div>
                )}
                {student.proposal.latestFeedback && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Latest Feedback</p>
                    <p className="text-sm text-muted-foreground italic">{student.proposal.latestFeedback}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Progress Tracking */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <TrendingUp size={16} />
              Research Progress
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Overall Progress</span>
                <span className="text-sm font-semibold text-primary">{student.progress}%</span>
              </div>
              <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${student.progress}%` }}
                />
              </div>
            </div>

            {/* Milestones if available */}
            {student.projectPlan && student.projectPlan.milestones.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-foreground mb-2">Project Milestones</p>
                <div className="space-y-2">
                  {student.projectPlan.milestones.map((milestone) => (
                    <div key={milestone.id} className="bg-secondary rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-foreground">{milestone.title}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          milestone.status === 'COMPLETED' 
                            ? 'bg-green-100 text-green-700'
                            : milestone.status === 'IN_PROGRESS'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {milestone.status.replace('_', ' ')}
                        </span>
                      </div>
                      {milestone.dueDate && (
                        <p className="text-xs text-muted-foreground">
                          Due: {new Date(milestone.dueDate).toLocaleDateString()}
                        </p>
                      )}
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span>Completion</span>
                          <span>{milestone.completion}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${milestone.completion}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-background border-t border-border p-6 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {onMessage && (
            <Button onClick={onMessage} className="gap-2">
              <MessageSquare size={16} />
              Send Message
            </Button>
          )}
          {onReview && student.proposal && student.proposalStatus !== 'APPROVED' && (
            <Button onClick={onReview} variant="default" className="gap-2">
              <FileText size={16} />
              Review Proposal
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}