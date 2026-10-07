import { api } from './index';
import type { User } from '../contexts/AuthContext';

export interface ProfilePayload {
  nameJp?: string;
  birthDate?: string;
  originCity?: string;
  phone?: string;
  jlptLevel?: 'N1' | 'N2' | 'N3' | 'N4' | 'N5';
  specialization?: string[];
  bioId?: string;
  bioJp?: string;
  education?: { degree: string; institution: string; year: string }[];
  experience?: {
    title: string;
    company: string;
    start: string;
    end?: string;
    description?: string;
  }[];
  skills?: string[];
}

export const userApi = {
  me: async (): Promise<User> => {
    const { data } = await api.get('/api/users/me');
    return data.user || data;
  },
  update: async (payload: ProfilePayload): Promise<User> => {
    const { data } = await api.put('/api/users/me', payload);
    return data.user || data;
  },
  listCandidates: async () => {
    const { data } = await api.get('/api/users/candidates');
    return data.candidates as Array<{
      id: number;
      name: string;
      nameJp?: string;
      originCity?: string;
      jlptLevel?: string;
      specialization: string[];
      profileVerified: boolean;
    }>;
  },
};
