// components/modals/upload-topic-modal.tsx
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface UploadTopicModalProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (topic: any) => void
  editingTopic?: any
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

export function UploadTopicModal({ isOpen, onClose, onUpload, editingTopic }: UploadTopicModalProps) {
  const [title, setTitle] = useState(editingTopic?.title || '')
  const [description, setDescription] = useState(editingTopic?.description || '')
  const [category, setCategory] = useState(editingTopic?.category || '')
  const [keywords, setKeywords] = useState(editingTopic?.keywords || '')
  const [difficulty, setDifficulty] = useState(editingTopic?.difficulty || 'Intermediate')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

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
      await onUpload({
        title: title.trim(),
        description: description.trim(),
        category,
        keywords: keywords.trim(),
        difficulty
      })
      
      // Reset form
      setTitle('')
      setDescription('')
      setCategory('')
      setKeywords('')
      setDifficulty('Intermediate')
      setError('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload topic')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {editingTopic ? 'Edit Research Topic' : 'Upload New Research Topic'}
          </DialogTitle>
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
              placeholder="Enter keywords separated by commas (e.g., AI, Machine Learning, Healthcare)"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Separate keywords with commas to help students find this topic
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (editingTopic ? 'Updating...' : 'Uploading...') : (editingTopic ? 'Update Topic' : 'Upload Topic')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}