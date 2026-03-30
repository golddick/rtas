// store/student/topic/topicStore.ts
import { create } from 'zustand';

export interface Topic {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  keywords: string[];
  supervisor: {
    id: string;
    name: string;
    email: string;
    staffNumber?: string | null;
  };
  department: {
    id: string;
    name: string;
    code: string;
  };
  studentInterests: number;
  isInterested: boolean;
  status: string;
  createdAt: string;
}

interface TopicFilters {
  category: string;
  difficulty: string;
  search: string;
}

interface TopicState {
  topics: Topic[];
  filters: TopicFilters;
  availableCategories: string[];
  availableDifficulties: string[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  
  // Actions
  fetchTopics: () => Promise<void>;
  toggleInterest: (topicId: string) => Promise<boolean>;
  setFilters: (filters: Partial<TopicFilters>) => void;
  clearFilters: () => void;
  clearError: () => void;
  reset: () => void;
}

export const useTopicStore = create<TopicState>((set, get) => ({
  topics: [],
  filters: {
    category: 'All',
    difficulty: 'All',
    search: '',
  },
  availableCategories: ['All'],
  availableDifficulties: ['All', 'Beginner', 'Intermediate', 'Advanced'],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },

  fetchTopics: async () => {
    set({ loading: true, error: null });
    try {
      const { filters, pagination } = get();
      const params = new URLSearchParams();
      
      if (filters.category && filters.category !== 'All') {
        params.append('category', filters.category);
      }
      if (filters.difficulty && filters.difficulty !== 'All') {
        params.append('difficulty', filters.difficulty);
      }
      if (filters.search) {
        params.append('search', filters.search);
      }
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());

      const response = await fetch(`/api/student/topics?${params.toString()}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch topics');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch topics');
      }

      set({
        topics: result.data,
        availableCategories: result.filters?.categories || ['All'],
        pagination: result.pagination,
        loading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An error occurred',
        loading: false,
      });
    }
  },

  toggleInterest: async (topicId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/student/topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topicId }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to update interest');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to update interest');
      }

      // Update local state
      const updatedTopics = get().topics.map(topic =>
        topic.id === topicId
          ? {
              ...topic,
              isInterested: result.interested,
              studentInterests: result.interested
                ? topic.studentInterests + 1
                : topic.studentInterests - 1,
            }
          : topic
      );
      
      set({ topics: updatedTopics, loading: false });
      return result.interested;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An error occurred',
        loading: false,
      });
      return false;
    }
  },

  setFilters: (newFilters: Partial<TopicFilters>) => {
    set(state => ({
      filters: { ...state.filters, ...newFilters },
      pagination: { ...state.pagination, page: 1 }, // Reset to first page
    }));
    get().fetchTopics();
  },

  clearFilters: () => {
    set({
      filters: {
        category: 'All',
        difficulty: 'All',
        search: '',
      },
      pagination: { ...get().pagination, page: 1 },
    });
    get().fetchTopics();
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set({
      topics: [],
      filters: {
        category: 'All',
        difficulty: 'All',
        search: '',
      },
      loading: false,
      error: null,
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      },
    });
  },
}));