// store/student/dashboardStore.ts
import { create } from 'zustand';

export interface StudentDashboardData {
  user: {
    id: string;
    fullName: string;
    email: string;
    matricNumber?: string | null;
    program?: string | null;
  };
  institution: {
    id: string;
    name: string;
    slug: string;
  } | null;
  department: {
    id: string;
    name: string;
    code: string;
  } | null;
  supervisor: {
    id: string;
    fullName: string;
    email: string;
    staffNumber?: string | null;
    department?: string;
  } | null;
  currentProposal: {
    id: string;
    title: string;
    description: string;
    status: string;
    submittedAt: Date | null;
    createdAt: Date;
    score: number | null;
    feedback: string | null;
    documentUrl?: string | null;
  } | null;
  stats: {
    proposalStatus: string;
    daysSinceSubmission: number | null;
    unreadMessages: number;
    hasSupervisor: boolean;
  };
  recentActivities: Array<{
    type: string;
    message: string;
    date: Date;
  }>;
}

interface DashboardState {
  data: StudentDashboardData | null;
  loading: boolean;
  error: string | null;
  fetchDashboardData: () => Promise<void>;
  clearData: () => void;
}

export const useStudentDashboardStore = create<DashboardState>((set, get) => ({
  data: null,
  loading: false,
  error: null,

  fetchDashboardData: async () => {
    set({ loading: true, error: null });
    
    try {
      const response = await fetch(`/api/student/dashboard`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch dashboard data');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch dashboard data');
      }

      set({ 
        data: result.data,
        loading: false 
      });
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      set({ 
        error: error instanceof Error ? error.message : 'An error occurred',
        loading: false 
      });
    }
  },

  clearData: () => {
    set({ data: null, loading: false, error: null });
  },
}));