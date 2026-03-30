'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, Send } from 'lucide-react'
import { useMessageStore } from '@/store/message/messageStore'

interface MessageModalProps {
  isOpen: boolean
  onClose: () => void
  recipientName: string
  recipientId: string
  onSend?: (message: string, subject: string) => void
}

export function MessageModal({ isOpen, onClose, recipientName, recipientId, onSend }: MessageModalProps) {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      alert('Please fill in both subject and message')
      return
    }

    setIsSending(true)
    onSend?.(message, subject)
    setSubject('')
    setMessage('')
    setIsSending(false)
    onClose()
  }

  if (!isOpen) return null

  console.log(recipientId, 'cl rep ')

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-background rounded-xl border border-border w-full max-w-lg animate-scale-in">
        {/* Header */}
        <div className="border-b border-border p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Send Message</h2>
            <p className="text-sm text-muted-foreground mt-1">To: {recipientName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Subject */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Feedback on your proposal"
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          {/* Message */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              rows={6}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Character count */}
          <div className="text-xs text-muted-foreground text-right">
            {message.length} characters
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border p-6 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || !subject.trim() || !message.trim()}
            className="gap-2"
          >
            { isSending ? 'Sending...' : <>
              <Send size={16} />
              Send Message
            </>}
          </Button>
        </div>
      </div>
    </div>
  )
}
