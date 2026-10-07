import { createContext, useContext, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/index';
import { userApi, type ProfilePayload } from '../api/user';
import { type UserRole } from '../data/mockData';

export interface User {
  id: string | number;
  name: string;
  nameJp?: string;
  email: string;
  role: UserRole;
  avatar?: string;
  iceUuid?: string;
  company?: string;
  title?: string;
  birthDate?: string;
  originCity?: string;
  phone?: string;
  jlptLevel?: ProfilePayload['jlptLevel'];
  specialization?: string[];
  education?: ProfilePayload['education'];
  experience?: ProfilePayload['experience'];
  skills?: string[];
  bioId?: string;
  bioJp?: string;
  profileVerified?: boolean;
  updatedAt?: string;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (payload: ProfilePayload) => Promise<User>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const authKeys = {
  me: ['user', 'me'] as const,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: user = null, isLoading } = useQuery<User | null>({
    queryKey: authKeys.me,
    queryFn: async () => {
      try {
        return await userApi.me();
      } catch {
        return null;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 menit cache
    retry: false,
  });

  const refreshUser = async () => {
    await queryClient.invalidateQueries({ queryKey: authKeys.me });
  };

  const login = (userData: User) => {
    queryClient.setQueryData(authKeys.me, userData);
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (e) {
      console.error(e);
    }
    queryClient.setQueryData(authKeys.me, null);
    queryClient.clear();
  };

  const updateProfile = async (payload: ProfilePayload) => {
    const fresh = await userApi.update(payload);
    queryClient.setQueryData(authKeys.me, fresh);
    return fresh;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
