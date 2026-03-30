// store/student/projectPlanStore.ts
import { create } from 'zustand';

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  dueDate: string | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' ;
  completion: number;
  order: number;
  createdAt: string;
  updatedAt: string;
}


export interface ProjectPlan {
  id: string;
  title: string;
  description: string;
  startDate: string | null;
  endDate: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED' ;
  createdAt: string;
  updatedAt: string;
  studentId: string;
  proposalId: string;
  milestones: Milestone[];
  proposal?: {
    id: string;
    title: string;
    status: string;
    supervisor?: {
      fullName: string;
    } | null;
  };
}

interface ProjectPlanState {
  projectPlans: ProjectPlan[];
  currentPlan: ProjectPlan | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  
  // Actions
  fetchProjectPlans: (page?: number, limit?: number) => Promise<void>;
  fetchProjectPlanById: (id: string) => Promise<ProjectPlan | null>;
  createProjectPlan: (proposalId: string, duration:number ) => Promise<boolean>;
  updateProjectPlan: (id: string, data: Partial<ProjectPlan>) => Promise<boolean>;
  updateMilestone: (planId: string, milestoneId: string, data: Partial<Milestone>) => Promise<boolean>;
  deleteProjectPlan: (id: string) => Promise<boolean>;
  clearError: () => void;
  reset: () => void;
}

export const useProjectPlanStore = create<ProjectPlanState>((set, get) => ({
  projectPlans: [],
  currentPlan: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },

  fetchProjectPlans: async (page = 1, limit = 10) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/student/project-plans?page=${page}&limit=${limit}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch project plans');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch project plans');
      }

      set({
        projectPlans: result.data,
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

  fetchProjectPlanById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/student/project-plans/${id}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch project plan');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch project plan');
      }

      set({
        currentPlan: result.data,
        loading: false,
      });
      
      return result.data;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An error occurred',
        loading: false,
      });
      return null;
    }
  },

  createProjectPlan: async (proposalId: string, duration: number = 6 ) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/student/project-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ proposalId,duration }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to create project plan');
      }
 
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to create project plan');
      }

      // Refresh the list
      await get().fetchProjectPlans();
      
      set({ loading: false });
      return true;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An error occurred',
        loading: false,
      });
      return false;
    }
  },

  updateProjectPlan: async (id: string, data: Partial<ProjectPlan>) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/student/project-plans/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to update project plan');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to update project plan');
      }

      // Update local state
      const updatedPlans = get().projectPlans.map(plan =>
        plan.id === id ? { ...plan, ...result.data } : plan
      );
      
      set({
        projectPlans: updatedPlans,
        currentPlan: result.data,
        loading: false,
      });
      
      return true;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An error occurred',
        loading: false,
      });
      return false;
    }
  },

  updateMilestone: async (planId: string, milestoneId: string, data: Partial<Milestone>) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/student/project-plans/${planId}/milestones/${milestoneId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to update milestone');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to update milestone');
      }

      // Update local state
      const updatedPlans = get().projectPlans.map(plan => {
        if (plan.id === planId) {
          const updatedMilestones = plan.milestones.map(m =>
            m.id === milestoneId ? { ...m, ...result.data } : m
          );
          return { ...plan, milestones: updatedMilestones };
        }
        return plan;
      });
      
      set({
        projectPlans: updatedPlans,
        currentPlan: updatedPlans.find(p => p.id === planId) || null,
        loading: false,
      });
      
      return true;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An error occurred',
        loading: false,
      });
      return false;
    }
  },

  deleteProjectPlan: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/student/project-plans/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete project plan');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to delete project plan');
      }

      // Remove from local state
      const updatedPlans = get().projectPlans.filter(plan => plan.id !== id);
      
      set({
        projectPlans: updatedPlans,
        currentPlan: null,
        loading: false,
      });
      
      return true;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An error occurred',
        loading: false,
      });
      return false;
    }
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set({
      projectPlans: [],
      currentPlan: null,
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