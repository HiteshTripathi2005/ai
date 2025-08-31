import { create } from 'zustand';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useChatStore } from './chatStore';

export const useAuthStore = create((set, get) => ({
  // Auth state
  user: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
  isAuthChecked: false,

  // Actions
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setAuthChecked: (isAuthChecked) => set({ isAuthChecked }),

  // Login function
  login: async (email, password) => {
    const { setLoading, setError, setUser, setAuthenticated } = get();

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });

      const { user } = response.data.data;

      setUser(user);
      setAuthenticated(true);

      setLoading(false);
      toast.success('Login successful! Welcome back.');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      setError(message);
      setLoading(false);
      toast.error(message);
      return { success: false, message };
    }
  },

  // Register function
  register: async (name, email, password) => {
    const { setLoading, setError, setUser, setAuthenticated } = get();

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/auth/register', {
        name,
        email,
        password,
      });

      const { user } = response.data.data;

      setUser(user);
      setAuthenticated(true);

      setLoading(false);
      toast.success('Account created successfully! Welcome aboard.');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      setError(message);
      setLoading(false);
      toast.error(message);
      return { success: false, message };
    }
  },

  // Logout function
  logout: async () => {
    try {
      await api.post('/auth/logout');
      set({
        user: null,
        isAuthenticated: false,
        error: null,
      });
      // Clear chat data
      useChatStore.getState().clearAll();
      toast.success('Logged out successfully.');
    } catch (error) {
      const message = error.response?.data?.message || 'Logout failed';
      setError(message);
      toast.error(message);
      set({
        user: null,
        isAuthenticated: false,
        error: null,
      });
      // Clear chat data even on error
      useChatStore.getState().clearAll();
    }
  },

  getMe: async () => {
    const { setUser, setAuthenticated, setError, setLoading, setAuthChecked } = get();

    try {
      setLoading(true);
      const response = await api.get('/auth/me');
      const { user } = response.data.data;

      setUser(user);
      setAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch user';
      setError(message);
      setLoading(false);
      return { success: false, message };
    } finally{
      setLoading(false);
      setAuthChecked(true);
      console.log('Loading state reset');
    }
  }
}));
