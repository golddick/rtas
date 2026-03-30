// app/dashboard/[institutionSlug]/[departmentCode]/student/topics/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/card-component'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  BookOpen, 
  Filter, 
  Heart, 
  Loader2, 
  X,
  ChevronLeft,
  ChevronRight,
  User,
  Tag,
  Star,
  AlertCircle
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { useTopicStore } from '@/store/student/topic/topicStore'

const difficultyColors = {
  Beginner: 'bg-green-100 text-green-700',
  Intermediate: 'bg-blue-100 text-blue-700',
  Advanced: 'bg-purple-100 text-purple-700',
}

export default function TopicBankPage() {
  const params = useParams()
  const institutionSlug = params.institutionSlug as string
  const departmentCode = params.departmentCode as string
  
  const {
    topics,
    filters,
    availableCategories,
    availableDifficulties,
    loading,
    error,
    pagination,
    fetchTopics,
    toggleInterest,
    setFilters,
    clearFilters,
    clearError,
  } = useTopicStore()

  const [searchInput, setSearchInput] = useState(filters.search)

  useEffect(() => {
    fetchTopics()
  }, [])

  const handleSearch = () => {
    setFilters({ search: searchInput })
  }

  const handleCategoryChange = (category: string) => {
    setFilters({ category })
  }

  const handleDifficultyChange = (difficulty: string) => {
    setFilters({ difficulty })
  }

  const handlePageChange = (newPage: number) => {
    fetchTopics()
  }

  const handleToggleInterest = async (topicId: string) => {
    await toggleInterest(topicId)
  }

  if (loading && topics.length === 0) {
    return (
      <DashboardLayout>
        <main className="flex-1 md:ml-0 overflow-hidden">
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading research topics...</p>
          </div>
        </main>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <main className="flex-1 md:ml-0 overflow-hidden">
        <DashboardHeader
          title="Research Topic Bank"
          subtitle="Browse and select research topics from your department's supervisors"
        />

        <div className="p-6 space-y-6 animate-fade-in">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
              <Button variant="outline" size="sm" className="ml-4" onClick={clearError}>
                Dismiss
              </Button>
            </Alert>
          )}

          {/* Search and Filter Section */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  placeholder="Search topics by title, description, or keywords..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 pr-24"
                />
                {searchInput && (
                  <button
                    onClick={() => {
                      setSearchInput('')
                      setFilters({ search: '' })
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[150px]">
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {availableCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 min-w-[150px]">
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Difficulty</label>
                  <select
                    value={filters.difficulty}
                    onChange={(e) => handleDifficultyChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {availableDifficulties.map(diff => (
                      <option key={diff} value={diff}>{diff}</option>
                    ))}
                  </select>
                </div>
                {(filters.category !== 'All' || filters.difficulty !== 'All' || filters.search) && (
                  <div className="flex items-end">
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                      <X size={14} />
                      Clear Filters
                    </Button>
                  </div>
                )}
              </div>

            </CardContent>
          </Card>

          {/* Topics Grid */}
          {topics.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="font-semibold text-foreground mb-2">No topics found</h3>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search or filters to find more topics
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {topics.map((topic) => (
                <Card key={topic.id} className="hover:shadow-md transition-all duration-300 flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-lg capitalize">{topic.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <User size={14} className="text-muted-foreground" />
                          <p className="text-xs text-muted-foreground capitalize">
                            {topic.supervisor.name}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggleInterest(topic.id)}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                        disabled={loading}
                      >
                        <Heart
                          size={18}
                          className={topic.isInterested ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}
                        />
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {topic.description}
                    </p>

                    {/* Keywords */}
                    {topic.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {topic.keywords.slice(0, 5).map((keyword, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            <Tag size={10} className="mr-1" />
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="p-2 bg-secondary rounded-lg">
                        <p className="text-xs text-muted-foreground">Difficulty</p>
                        <span className={`inline-block px-2 py-0.5 text-xs rounded-full mt-1 ${difficultyColors[topic.difficulty as keyof typeof difficultyColors] || 'bg-gray-100'}`}>
                          {topic.difficulty}
                        </span>
                      </div>
                      <div className="p-2 bg-secondary rounded-lg">
                        <p className="text-xs text-muted-foreground">Interested</p>
                        <p className="font-semibold text-foreground text-sm mt-1">
                          {topic.studentInterests} student{topic.studentInterests !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="p-2 bg-secondary rounded-lg">
                        <p className="text-xs text-muted-foreground">Category</p>
                        <p className="font-semibold text-foreground text-sm mt-1 truncate">
                          {topic.category}
                        </p>
                      </div>
                    </div>

                  </CardContent>
                </Card>
              ))}
            </div>
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
                <ChevronLeft size={16} />
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
                <ChevronRight size={16} />
              </Button>
            </div>
          )}
        </div>
      </main>
    </DashboardLayout>
  )
}


