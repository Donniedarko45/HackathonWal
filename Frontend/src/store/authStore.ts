import { create } from 'zustand';
import { authApi } from '../services/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasCheckedAuth: boolean; // Flag to track if we've already checked auth
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    email: string;
    name: string;
    password: string;
    role?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  hasCheckedAuth: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await authApi.login(email, password);
      const { user } = response.data;
      set({ 
        user, 
        isAuthenticated: true, 
        isLoading: false,
        hasCheckedAuth: true
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (userData) => {
    set({ isLoading: true });
    try {
      const response = await authApi.register(userData);
      const { user } = response.data;
      set({ 
        user, 
        isAuthenticated: true, 
        isLoading: false,
        hasCheckedAuth: true
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
      set({ 
        user: null, 
        isAuthenticated: false,
        hasCheckedAuth: false // Reset auth check flag
      });
    } catch (error) {
      // Even if logout fails on backend, clear local state
      set({ 
        user: null, 
        isAuthenticated: false,
        hasCheckedAuth: false // Reset auth check flag
      });
    }
  },

    getCurrentUser: async () => {
    const state = useAuthStore.getState();
    
    // If we've already checked auth or currently loading, don't check again
    if (state.hasCheckedAuth || state.isLoading) {
      return;
    }

    // If already authenticated, don't make another call
    if (state.isAuthenticated && state.user) {
      return;
    }
    
    set({ isLoading: true });
    
    try {
      const response = await authApi.getCurrentUser();
      const { user } = response.data;
      
      set({ 
        user, 
        isAuthenticated: true, 
        isLoading: false,
        hasCheckedAuth: true
      });
    } catch (error) {
      // Silent fail for 401 (unauthenticated) - this is expected
      set({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false,
        hasCheckedAuth: true // Mark as checked even if failed
      });
      
      // Don't throw the error - let the app continue
      return Promise.resolve();
    }
  },

  setUser: (user: User | null) => {
    set({ 
      user, 
      isAuthenticated: !!user,
      hasCheckedAuth: true
    });
  },
})); 