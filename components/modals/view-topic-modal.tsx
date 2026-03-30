// components/modals/view-topic-modal.tsx
'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileText, Tag, BookOpen, TrendingUp, Users, Calendar, Clock, Award } from 'lucide-react'

interface ViewTopicModalProps {
  isOpen: boolean
  onClose: () => void
  topic: any
}

const formatStatus = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-100 text-green-700'
    case 'ARCHIVED':
      return 'bg-gray-100 text-gray-700'
    case 'INACTIVE':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

export function ViewTopicModal({ isOpen, onClose, topic }: ViewTopicModalProps) {
  if (!topic) return null

  const keywords = topic.keywords ? topic.keywords.split(',').map((k: string) => k.trim()) : []

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">{topic.title}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[calc(90vh-120px)] pr-4">
          <div className="space-y-6">
            {/* Status and Stats */}
            <div className="flex justify-between items-center">
              <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(topic.status)}`}>
                {formatStatus(topic.status)}
              </span>
              <div className="flex gap-4">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <TrendingUp size={14} />
                  <span>{topic.studentInterests} interested</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Award size={14} />
                  <span>{topic.difficulty}</span>
                </div>
              </div>
            </div>

            {/* Category */}
            <Card>
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <Tag size={18} />
                  Category
                </h4>
                <p className="text-sm">{topic.category}</p>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <FileText size={18} />
                  Description
                </h4>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{topic.description}</p>
              </CardContent>
            </Card>

            {/* Keywords */}
            {keywords.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <BookOpen size={18} />
                    Keywords
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {keywords.map((keyword: string, idx: number) => (
                      <span key={idx} className="px-2 py-1 bg-secondary text-foreground text-xs rounded">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Interested Students */}
            {topic.interests && topic.interests.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Users size={18} />
                    Interested Students ({topic.interests.length})
                  </h4>
                  <div className="space-y-2">
                    {topic.interests.map((interest: any) => (
                      <div key={interest.id} className="flex justify-between items-center p-3 bg-secondary rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{interest.studentName}</p>
                          <p className="text-xs text-muted-foreground">{interest.studentMatricNumber}</p>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar size={12} />
                          <span>{new Date(interest.interestedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Metadata */}
            <Card>
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <Clock size={18} />
                  Topic Information
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-medium">{new Date(topic.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Updated</p>
                    <p className="font-medium">{new Date(topic.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}