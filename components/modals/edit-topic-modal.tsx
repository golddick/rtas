// components/modals/edit-topic-modal.tsx
'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface EditTopicModalProps {
  isOpen: boolean
  onClose: () => void
  topic: any
  onUpdate: (id: string, data: any) => Promise<void>
}

const categories = [
  'Computer Science',
  'Engineering',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Medicine',
  'Business',
  'Economics',
  'Social Sciences',
  'Humanities',
  'Other'
]

const difficultyLevels = [
  'Beginner',
  'Intermediate',
  'Advanced',
  'Expert'
]

const statusOptions = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ARCHIVED', label: 'Archived' },
  { value: 'INACTIVE', label: 'Inactive' }
]

export function EditTopicModal({ isOpen, onClose, topic, onUpdate }: EditTopicModalProps) {
  const [title, setTitle] = useState(topic?.title || '')
  const [description, setDescription] = useState(topic?.description || '')
  const [category, setCategory] = useState(topic?.category || '')
  const [keywords, setKeywords] = useState(topic?.keywords || '')
  const [difficulty, setDifficulty] = useState(topic?.difficulty || 'Intermediate')
  const [status, setStatus] = useState(topic?.status || 'ACTIVE')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (topic) {
      setTitle(topic.title || '')
      setDescription(topic.description || '')
      setCategory(topic.category || '')
      setKeywords(topic.keywords || '')
      setDifficulty(topic.difficulty || 'Intermediate')
      setStatus(topic.status || 'ACTIVE')
    }
  }, [topic])

  const handleSubmit = async () => {
    setError('')
    
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    
    if (!description.trim()) {
      setError('Description is required')
      return
    }
    
    if (!category) {
      setError('Category is required')
      return
    }
    
    setSubmitting(true)
    
    try {
      await onUpdate(topic.id, {
        title: title.trim(),
        description: description.trim(),
        category,
        keywords: keywords.trim(),
        difficulty,
        status
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update topic')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Edit Research Topic</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="title">Topic Title *</Label>
            <Input
              id="title"
              placeholder="Enter a clear and concise title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe the research topic, its objectives, and expected outcomes"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  {difficultyLevels.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="keywords">Keywords</Label>
            <Input
              id="keywords"
              placeholder="Enter keywords separated by commas"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Updating...' : 'Update Topic'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}