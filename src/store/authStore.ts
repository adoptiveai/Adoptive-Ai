'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { agentClient } from '@/services/agentClient';
import { useChatStore } from './chatStore';

export interface AuthUser {
  id?: string;
  email: string;
  username?: string;
  can_view_documents?: boolean;  // Whether user has view_doc permission
  role?: {
    id: number;
    name: string;
  } | null;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  _hasHydrated: boolean;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, username: string, password: string) => Promise<void>;
  clearError: () => void;
  checkAuth: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  setHasHydrated: (state: boolean) => void;
}

type AuthStore = AuthState & AuthActions;

const API_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000';

const loginRequest = async (email: string, password: string) => {
  const res = await fetch(`${API_URL}/api/auth/jwt/create/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(JSON.stringify(data) || 'Login failed');
  }
  return res.json();
};

const registerRequest = async (email: string, username: string, password: string) => {
  const res = await fetch(`${API_URL}/api/auth/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, username, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    let errorMessage = 'Registration failed';
    if (typeof data === 'object') {
      const errors = Object.values(data).flat();
      if (errors.length > 0) errorMessage = String(errors[0]);
    }
    throw new Error(errorMessage);
  }
  return res.json();
};

const getUserRequest = async (token: string) => {
  const res = await fetch(`${API_URL}/api/auth/me/`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  });
  if (!res.ok) {
    throw new Error('Failed to fetch user');
  }
  return res.json();
};


export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      _hasHydrated: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const data = await loginRequest(email, password);
          // data should contain access and refresh tokens
          const { access, refresh } = data;

          // Get user details
          const userData = await getUserRequest(access);

          // Set token for agent calls
          agentClient.setAuthToken(access);

          // Map Django's UUID to the frontend's ID field
          const userWithUuid = {
            ...userData,
            id: userData.uuid,   // Use UUID as the primary ID
            djangoId: userData.id // Keep original ID just in case
          };

          set({
            accessToken: access,
            refreshToken: refresh,
            user: userWithUuid,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: () => {
        agentClient.clearAuthToken();
        const chatStore = useChatStore.getState();
        chatStore.reset();
        chatStore.setConversations([]);
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, error: null });
      },

      register: async (email: string, username: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          await registerRequest(email, username, password);
          // After registration, we can either auto-login or ask user to login.
          // For now, let's just finish loading and let the UI handle redirection to login
          set({ isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Registration failed',
            isLoading: false,
          });
          throw error;
        }
      },

      clearError: () => set({ error: null }),

      checkAuth: async () => {
        // Verify if token is valid, refresh if needed (basic implementation)
        const { accessToken } = get();
        if (!accessToken) {
          set({ isAuthenticated: false, user: null });
          return;
        }
        try {
          // Set token to ensure client knows about it if checking auth on reload
          agentClient.setAuthToken(accessToken);
          // Try fetching user to verify token
          const userData = await getUserRequest(accessToken);

          const userWithUuid = {
            ...userData,
            id: userData.uuid,
            djangoId: userData.id
          };
          set({ user: userWithUuid, isAuthenticated: true });
        } catch {
          // If failed, logout (or implement refresh logic here)
          agentClient.clearAuthToken();
          set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
        }
      },

      setUser: (user: AuthUser | null) => set({ user }),
      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        if (state?.accessToken) {
          agentClient.setAuthToken(state.accessToken);
        }
      },
    }
  )
);
