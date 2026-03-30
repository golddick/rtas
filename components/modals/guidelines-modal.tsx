'use client'

import { Button } from '@/components/ui/button'
import { X, CheckCircle } from 'lucide-react'

interface GuidelinesModalProps {
  isOpen: boolean
  onClose: () => void
}

export function GuidelinesModal({ isOpen, onClose }: GuidelinesModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-background rounded-xl border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Proposal Guidelines</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Section 1 */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">General Requirements</h3>
            <ul className="space-y-2">
              {[
                'Proposal must be between 15-30 pages',
                'Use clear, professional academic language',
                'Include a comprehensive abstract (150-250 words)',
                'Provide clear research objectives and goals',
                'Document all sources and citations properly'
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <CheckCircle size={16} className="text-green-600 min-w-fit mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Section 2 */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Formatting Standards</h3>
            <ul className="space-y-2">
              {[
                'Font: Arial or Times New Roman, 12pt',
                'Line spacing: 1.5 or double spacing',
                'Margins: 1 inch on all sides',
                'Include page numbers and headers',
                'Use consistent formatting for headings'
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <CheckCircle size={16} className="text-green-600 min-w-fit mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Section 3 */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Required Sections</h3>
            <ul className="space-y-2">
              {[
                'Abstract and Introduction',
                'Literature Review',
                'Research Methodology',
                'Expected Outcomes and Impact',
                'Timeline and Milestones',
                'References and Bibliography'
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <CheckCircle size={16} className="text-green-600 min-w-fit mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> All proposals must be submitted as PDF files. Ensure your supervisor reviews the guidelines before submission to avoid revisions.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-background border-t border-border p-6 flex items-center justify-end">
          <Button onClick={onClose}>Got it, thanks</Button>
        </div>
      </div>
    </div>
  )
}
