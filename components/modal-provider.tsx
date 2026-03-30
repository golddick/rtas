'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/card-component'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface Modal {
  id: string
  title: string
  content: React.ReactNode
  actions?: Array<{ label: string; onClick: () => void; variant?: 'default' | 'outline' }>
}

interface ModalContextType {
  openModal: (modal: Modal) => void
  closeModal: (id: string) => void
  clearAllModals: () => void
}

export const ModalProvider = ({ children }: { children: React.ReactNode }) => {
  const [modals, setModals] = useState<Modal[]>([])

  const openModal = (modal: Modal) => {
    setModals([...modals, modal])
  }

  const closeModal = (id: string) => {
    setModals(modals.filter(m => m.id !== id))
  }

  const clearAllModals = () => {
    setModals([])
  }

  return (
    <>
      {children}
      <div className="fixed inset-0 z-40 pointer-events-none">
        {modals.map((modal, idx) => (
          <div key={modal.id} className="pointer-events-auto" style={{ zIndex: 50 + idx }}>
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 animate-fade-in">
              <Card className="w-full max-w-md animate-scale-in">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle>{modal.title}</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => closeModal(modal.id)}>
                    <X size={16} />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {modal.content}
                  {modal.actions && (
                    <div className="flex gap-2 pt-4">
                      {modal.actions.map((action, idx) => (
                        <Button
                          key={idx}
                          variant={action.variant || 'default'}
                          className="flex-1"
                          onClick={() => {
                            action.onClick()
                            closeModal(modal.id)
                          }}
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

// Modal templates
export function CreateProposalModal() {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Proposal Title</label>
        <input type="text" placeholder="Enter proposal title" className="w-full px-4 py-2 border border-border rounded-lg" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Research Area</label>
        <select className="w-full px-4 py-2 border border-border rounded-lg">
          <option>Machine Learning</option>
          <option>Cloud Computing</option>
          <option>Cybersecurity</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <textarea placeholder="Brief description" rows={4} className="w-full px-4 py-2 border border-border rounded-lg"></textarea>
      </div>
    </div>
  )
}

export function RequestSupervisorModal() {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Preferred Supervisor</label>
        <select className="w-full px-4 py-2 border border-border rounded-lg">
          <option>-- Select Supervisor --</option>
          <option>Dr. Ahmed Hassan</option>
          <option>Prof. Sarah Smith</option>
          <option>Dr. Michael Chen</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Why this supervisor?</label>
        <textarea placeholder="Explain your choice" rows={4} className="w-full px-4 py-2 border border-border rounded-lg"></textarea>
      </div>
    </div>
  )
}

export function SendMessageModal({ recipientName }: { recipientName: string }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Sending message to: <span className="font-medium">{recipientName}</span></p>
      <div>
        <label className="block text-sm font-medium mb-2">Message</label>
        <textarea placeholder="Type your message..." rows={4} className="w-full px-4 py-2 border border-border rounded-lg"></textarea>
      </div>
    </div>
  )
}

export function ConfirmActionModal({ action, description }: { action: string; description: string }) {
  return (
    <div className="space-y-4">
      <p className="text-sm">{description}</p>
      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-xs text-yellow-700">This action cannot be undone.</p>
      </div>
    </div>
  )
}
