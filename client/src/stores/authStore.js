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

  // Update profile function
  updateProfile: async (name, email, systemPrompt) => {
    const { setLoading, setError, setUser } = get();

    setLoading(true);
    setError(null);

    try {
      const response = await api.put('/auth/profile', {
        name,
        email,
        systemPrompt,
      });

      const { user } = response.data.data;

      setUser(user);
      setLoading(false);
      toast.success('Profile updated successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update profile';
      setError(message);
      setLoading(false);
      toast.error(message);
      return { success: false, message };
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
      console.log('User authenticated:', user);

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
