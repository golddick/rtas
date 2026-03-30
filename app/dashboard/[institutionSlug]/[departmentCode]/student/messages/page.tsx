// app/(dashboard)/messages/page.tsx
'use client'

import { useEffect, useState, useRef } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/card-component'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  MessageSquare, Send, Archive, Trash2, Loader2, 
  AlertCircle, Search, X
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useUser } from '@/store/user/userStore'
import { useMessageStore } from '@/store/message/messageStore'

const formatDate = (date: Date) => {
  const now = new Date()
  const diffMs = now.getTime() - new Date(date).getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hours ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  
  return new Date(date).toLocaleDateString()
}

export default function MessagesPage() {
  const user = useUser()
  const {
    conversations,
    currentConversation,
    loading,
    error,
    sending,
    fetchConversations,
    sendMessage,
    archiveConversation,
    deleteConversation,
    setCurrentConversation,
    clearError
  } = useMessageStore()

  const [newMessage, setNewMessage] = useState('')
  const [messageSubject, setMessageSubject] = useState('')
  const [showSubject, setShowSubject] = useState(false)
  const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('active')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentConversation?.messages])

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return
    
    const recipientId = currentConversation?.otherParticipant?.id
    if (!recipientId) return
    
    const success = await sendMessage(
      recipientId,
      newMessage.trim(),
      showSubject ? messageSubject : 'New Conversation'
    )
    
    if (success) {
      setNewMessage('')
      setMessageSubject('')
      setShowSubject(false)
    }
  }

  const filteredConversations = conversations.filter(conv => {
    if (filter === 'active') return conv.status === 'ACTIVE'
    if (filter === 'archived') return conv.status === 'ARCHIVED'
    return true
  })

  if (error) {
    return (
      <DashboardLayout>
        <main className="flex-1 md:ml-0 overflow-hidden">
          <div className="p-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={clearError} className="mt-4" variant="outline">
              Dismiss
            </Button>
          </div>
        </main>
      </DashboardLayout>
    )
  }

  const otherParticipant = currentConversation?.otherParticipant

  return (
    <DashboardLayout>
      <main className="flex-1 md:ml-0 overflow-hidden">
        <DashboardHeader
          title="Messages"
          subtitle="Communicate with your supervisor and department"
        />

        <div className="p-6 space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Conversations List */}
            <div className="lg:col-span-1">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">
                  Conversations ({filteredConversations.length})
                </h3>
                <div className="flex gap-1">
                  <Button
                    variant={filter === 'active' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('active')}
                  >
                    Active
                  </Button>
                  <Button
                    variant={filter === 'archived' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('archived')}
                  >
                    Archived
                  </Button>
                </div>
              </div>
              
              {loading && conversations.length === 0 ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <MessageSquare size={48} className="mx-auto text-muted-foreground mb-3 opacity-50" />
                    <p className="text-muted-foreground">No conversations found</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {filteredConversations.map((conv, idx) => (
                    <Card
                      key={conv.id}
                      className={`cursor-pointer hover:bg-secondary transition-colors animate-slide-up ${
                        currentConversation?.id === conv.id ? 'border-primary border-2' : ''
                      } ${conv.unread ? 'border-l-4 border-l-primary' : ''}`}
                      onClick={() => setCurrentConversation(conv.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                            {conv.avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm truncate capitalize ${conv.unread ? 'font-bold text-foreground' : 'text-foreground'}`}>
                              {conv.name}
                            </p>
                            <p className="text-xs text-muted-foreground">{conv.role}</p>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {conv.lastMessage}
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <p className="text-xs text-muted-foreground">
                            {formatDate(conv.timestamp)}
                          </p>
                          {conv.unreadCount > 0 && (
                            <span className="bg-primary text-white text-xs rounded-full px-2 py-0.5">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Chat Area */}
            <div className="lg:col-span-2">
              {currentConversation && otherParticipant ? (
                <Card className="h-full flex flex-col animate-slide-left">
                  <CardHeader className="border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 capitalize rounded-full bg-primary text-white flex items-center justify-center font-bold">
                          {otherParticipant.fullName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <CardTitle className="text-base capitalize">{otherParticipant.fullName}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {otherParticipant.role === 'SUPERVISOR' ? 'Supervisor' : 'Student'}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => archiveConversation(currentConversation.id)}
                        >
                          <Archive size={16} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this conversation?')) {
                              deleteConversation(currentConversation.id)
                            }
                          }}
                          className="hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[calc(100vh-300px)]">
                    {currentConversation.messages.map((msg, idx) => (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${msg.isOwn ? 'justify-end' : ''} animate-fade-in`}
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        {!msg.isOwn && (
                          <div className="w-8 h-8 rounded-full capitalize bg-primary text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {otherParticipant.fullName.split(' ').map(n => n[0]).join('')}
                          </div>
                        )}
                        <div
                          className={`max-w-xs lg:max-w-md p-3 rounded-lg ${
                            msg.isOwn
                              ? 'bg-primary text-white'
                              : 'bg-secondary'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <div className="flex items-center justify-end gap-1 mt-1">
                            <span className={`text-xs ${msg.isOwn ? 'opacity-75' : 'text-muted-foreground'}`}>
                              {formatDate(msg.createdAt)}
                            </span>
                            {msg.isOwn && msg.isRead && (
                              <span className="text-xs opacity-75">✓✓</span>
                            )}
                          </div>
                        </div>
                        {msg.isOwn && (
                          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {user?.fullName?.split(' ').map(n => n[0]).join('') || 'U'}
                          </div>
                        )}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </CardContent>

                  <div className="border-t p-4">
                    {showSubject && (
                      <div className="mb-3 flex gap-2">
                        <Input
                          placeholder="Subject (optional)"
                          value={messageSubject}
                          onChange={(e) => setMessageSubject(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowSubject(false)}
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <textarea
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSendMessage()
                          }
                        }}
                        className="flex-1 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none"
                        rows={2}
                      />
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowSubject(!showSubject)}
                        >
                          <MessageSquare size={16} />
                        </Button>
                        <Button
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim() || sending}
                        >
                          {sending ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            <Send size={18} />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="h-full flex items-center justify-center min-h-[500px]">
                  <CardContent className="text-center">
                    <MessageSquare size={64} className="mx-auto text-muted-foreground mb-4 opacity-50" />
                    <p className="text-muted-foreground">Select a conversation to start messaging</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </DashboardLayout>
  )
}











