// app/(dashboard)/supervisor/topics/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/card-component'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  FileText, Plus, Edit, Trash2, Eye, TrendingUp, Grid, List,
  Loader2, AlertCircle, Search, Filter, Tag, BookOpen, Users
} from 'lucide-react'
import { UploadTopicModal } from '@/components/modals/upload-topic-modal'
import { EditTopicModal } from '@/components/modals/edit-topic-modal'
import { ViewTopicModal } from '@/components/modals/view-topic-modal'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useSupervisorTopicStore } from '@/store/supervisor/topic/supervisorTopicStore'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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

export default function TopicsPage() {
  const {
    topics,
    selectedTopic,
    loading,
    error,
    pagination,
    filters,
    fetchTopics,
    createTopic,
    updateTopic,
    deleteTopic,
    setSelectedTopic,
    setFilters,
    clearError
  } = useSupervisorTopicStore()

  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [searchInput, setSearchInput] = useState(filters.search)

  useEffect(() => {
    fetchTopics()
  }, [])

  const handleStatusFilter = (status: string) => {
    setFilters({ status })
  }

  const handleCategoryFilter = (category: string) => {
    setFilters({ category })
  }

  const handleSearch = () => {
    setFilters({ search: searchInput })
  }

  const handlePageChange = (newPage: number) => {
    fetchTopics(newPage, pagination.limit)
  }

  const handleUploadTopic = async (topicData: any) => {
    await createTopic(topicData)
  }

  const handleUpdateTopic = async (id: string, data: any) => {
    await updateTopic(id, data)
  }

  const handleDeleteTopic = async (id: string) => {
    if (confirm('Are you sure you want to delete this topic? This action cannot be undone.')) {
      await deleteTopic(id)
    }
  }

  const handleViewTopic = (topic: any) => {
    setSelectedTopic(topic)
    setShowViewModal(true)
  }

  const handleEditTopic = (topic: any) => {
    setSelectedTopic(topic)
    setShowEditModal(true)
  }

  // Get unique categories for filter
  const categories = [...new Set(topics.map(t => t.category))]

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

  return (
    <DashboardLayout>
      <main className="flex-1 md:ml-0 overflow-hidden">
        <DashboardHeader
          title="Research Topics"
          subtitle="Upload and manage research topics for your students"
          onSearch={(query) => setFilters({ search: query })}
        />

        <div className="p-6 space-y-6 animate-fade-in">
          {/* Header with Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-4xl font-bold text-primary">{topics.length}</p>
                  <p className="text-sm text-muted-foreground mt-2">Total Topics</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-4xl font-bold text-primary">
                    {topics.reduce((sum, t) => sum + t.studentInterests, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">Student Interests</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-4xl font-bold text-primary">
                    {topics.length > 0 
                      ? (topics.reduce((sum, t) => sum + t.studentInterests, 0) / topics.length).toFixed(1)
                      : '0'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">Avg. Interests</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={filters.status === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatusFilter('all')}
                className="gap-1"
              >
                <Filter size={14} />
                All Status
              </Button>
              <Button
                variant={filters.status === 'ACTIVE' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatusFilter('ACTIVE')}
              >
                Active
              </Button>
              <Button
                variant={filters.status === 'ARCHIVED' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatusFilter('ARCHIVED')}
              >
                Archived
              </Button>
              <Button
                variant={filters.status === 'INACTIVE' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatusFilter('INACTIVE')}
              >
                Inactive
              </Button>
            </div>

            <div className="flex gap-2">
              <Select value={filters.category} onValueChange={handleCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Input
                placeholder="Search topics..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-64"
              />
              <Button onClick={handleSearch} size="sm">
                <Search size={16} />
              </Button>
            </div>

            {/* Controls */}
            <div className="flex gap-2">
              <div className="flex gap-2 bg-secondary rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded transition-colors ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Grid size={18} />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded transition-colors ${viewMode === 'table' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <List size={18} />
                </button>
              </div>
              <Button className="gap-2" onClick={() => setShowUploadModal(true)}>
                <Plus size={18} />
                New Topic
              </Button>
            </div>
          </div>

          {/* Loading State */}
          {loading && topics.length === 0 ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : topics.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <TrendingUp size={48} className="text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="font-semibold text-foreground mb-2">No Topics Yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Upload your first research topic to get started</p>
                <Button onClick={() => setShowUploadModal(true)}>Upload Topic</Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Grid View */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {topics.map((topic) => (
                    <Card key={topic.id} className="hover:shadow-md transition-all duration-300">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base line-clamp-2 capitalize">{topic.title}</CardTitle>
                            <p className="text-xs text-muted-foreground mt-2">{topic.category}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(topic.status)}`}>
                              {formatStatus(topic.status)}
                            </span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                              {topic.studentInterests} interested
                            </span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-foreground line-clamp-3">{topic.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {topic.keywords.split(',').slice(0, 3).map((keyword, i) => (
                            <span key={i} className="px-2 py-1 bg-secondary text-foreground text-xs rounded">
                              {keyword.trim()}
                            </span>
                          ))}
                          {topic.keywords.split(',').length > 3 && (
                            <span className="px-2 py-1 bg-secondary text-foreground text-xs rounded">
                              +{topic.keywords.split(',').length - 3}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                          <span>Created: {new Date(topic.createdAt).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1">
                            <Tag size={12} />
                            {topic.difficulty}
                          </span>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => handleViewTopic(topic)}>
                            <Eye size={14} className="mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEditTopic(topic)}>
                            <Edit size={14} className="mr-1" />
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDeleteTopic(topic.id)} 
                            className="hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Table View */}
              {viewMode === 'table' && (
                <Card>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left px-6 py-4 font-semibold text-foreground">Title</th>
                          <th className="text-left px-6 py-4 font-semibold text-foreground">Category</th>
                          <th className="text-left px-6 py-4 font-semibold text-foreground">Difficulty</th>
                          <th className="text-left px-6 py-4 font-semibold text-foreground">Status</th>
                          <th className="text-left px-6 py-4 font-semibold text-foreground">Interested</th>
                          <th className="text-left px-6 py-4 font-semibold text-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topics.map((topic) => (
                          <tr key={topic.id} className="border-b border-border hover:bg-secondary transition-colors">
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-medium text-foreground capitalize">{topic.title}</p>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{topic.description}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-muted-foreground">{topic.category}</td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 bg-secondary text-foreground text-xs rounded">
                                {topic.difficulty}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(topic.status)}`}>
                                {formatStatus(topic.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                                {topic.studentInterests}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleViewTopic(topic)}>
                                  View
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleEditTopic(topic)}>
                                  Edit
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleDeleteTopic(topic.id)} className="hover:bg-red-50">
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1 || loading}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4 text-sm">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages || loading}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modals */}
        <UploadTopicModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onUpload={handleUploadTopic}
        />

        {selectedTopic && (
          <>
            <EditTopicModal
              isOpen={showEditModal}
              onClose={() => {
                setShowEditModal(false)
                setSelectedTopic(null)
              }}
              topic={selectedTopic}
              onUpdate={handleUpdateTopic}
            />
            <ViewTopicModal
              isOpen={showViewModal}
              onClose={() => {
                setShowViewModal(false)
                setSelectedTopic(null)
              }}
              topic={selectedTopic}
            />
          </>
        )}
      </main>
    </DashboardLayout>
  )
}