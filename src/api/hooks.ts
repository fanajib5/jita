import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './index';
import { useAuth } from '../contexts/AuthContext';
import {
  courseApi,
  type Course,
  type CourseProgress,
  type CoursePayload,
  type CourseModulePayload,
} from './courses';
import { calendarApi, type CalendarEvent } from './calendar';
import { documentApi, type VaultDoc } from './documents';
import { adminApi, type AdminStats } from './admin';
import { jobApi, type Job, type Company, type ScoutCandidate, type JobsResponse } from './jobs';
import { applicationApi, type Application as JobApplication } from './applications';
import { notificationApi, type NotificationItem } from './notifications';
import { userApi, type ProfilePayload } from './user';
import { postsApi, type Post, type PostsResponse, type CreatePostPayload } from './posts';
import { z } from 'zod';

// --- Auth Schemas & Mutations ---
export const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});
export const registerSchema = z.object({
  name: z.string().min(1, 'Nama lengkap wajib diisi'),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  iceUuid: z.string().optional(),
});
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;

export function useLoginMutation() {
  const queryClient = useQueryClient();
  const { login } = useAuth();
  return useMutation({
    mutationFn: async (credentials: LoginFormData) => {
      const response = await api.post('/api/auth/login', credentials);
      return response.data;
    },
    onSuccess: (data) => {
      if (data?.user) login(data.user);
      queryClient.invalidateQueries();
    },
  });
}

export function useRegisterMutation() {
  const queryClient = useQueryClient();
  const { login } = useAuth();
  return useMutation({
    mutationFn: async (payload: RegisterFormData) => {
      const response = await api.post('/api/auth/register', payload);
      return response.data;
    },
    onSuccess: (data) => {
      if (data?.user) login(data.user);
      queryClient.invalidateQueries();
    },
  });
}

// --- Courses Hooks ---
export const courseKeys = {
  all: ['courses'] as const,
  list: () => [...courseKeys.all, 'list'] as const,
  detail: (id: number) => [...courseKeys.all, 'detail', id] as const,
  myProgress: () => [...courseKeys.all, 'my-progress'] as const,
};

export function useCourses() {
  return useQuery<Course[]>({
    queryKey: courseKeys.list(),
    queryFn: () => courseApi.list(),
  });
}

export function useCourseDetail(id: number) {
  return useQuery<Course>({
    queryKey: courseKeys.detail(id),
    queryFn: () => courseApi.detail(id),
    enabled: !!id,
  });
}

export function useMyCourseProgress() {
  return useQuery<CourseProgress[]>({
    queryKey: courseKeys.myProgress(),
    queryFn: () => courseApi.myProgress(),
  });
}

export function useEnrollCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: number) => courseApi.enroll(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.myProgress() });
      queryClient.invalidateQueries({ queryKey: courseKeys.list() });
    },
  });
}

export function useUpdateCourseProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, progressPct }: { courseId: number; progressPct: number }) =>
      courseApi.updateProgress(courseId, progressPct),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.myProgress() });
    },
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CoursePayload) => courseApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.list() });
    },
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: number } & Partial<CoursePayload>) =>
      courseApi.update(id, payload),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: courseKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: courseKeys.list() });
    },
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => courseApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.list() });
    },
  });
}

// Course module keys
export const moduleKeys = {
  list: (courseId: number) => ['course-modules', courseId] as const,
};

export function useCourseModules(courseId: number) {
  return useQuery({
    queryKey: moduleKeys.list(courseId),
    queryFn: () => courseApi.listModules(courseId),
    enabled: !!courseId,
  });
}

export function useCreateModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, ...payload }: { courseId: number } & CourseModulePayload) =>
      courseApi.createModule(courseId, payload),
    onSuccess: (_data, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: moduleKeys.list(courseId) });
      queryClient.invalidateQueries({ queryKey: courseKeys.list() });
      queryClient.invalidateQueries({ queryKey: courseKeys.detail(courseId) });
    },
  });
}

export function useUpdateModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      moduleId,
      ...payload
    }: { courseId: number; moduleId: number } & Partial<CourseModulePayload>) =>
      courseApi.updateModule(courseId, moduleId, payload),
    onSuccess: (_data, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: moduleKeys.list(courseId) });
      queryClient.invalidateQueries({ queryKey: courseKeys.list() });
    },
  });
}

export function useDeleteModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, moduleId }: { courseId: number; moduleId: number }) =>
      courseApi.deleteModule(courseId, moduleId),
    onSuccess: (_data, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: moduleKeys.list(courseId) });
      queryClient.invalidateQueries({ queryKey: courseKeys.list() });
      queryClient.invalidateQueries({ queryKey: courseKeys.detail(courseId) });
    },
  });
}

// --- Calendar Hooks ---
export const calendarKeys = {
  all: ['calendar'] as const,
  events: (params?: { from?: string; to?: string; type?: string }) =>
    [...calendarKeys.all, 'events', params] as const,
};

export function useCalendarEvents(params?: { from?: string; to?: string; type?: string }) {
  return useQuery<CalendarEvent[]>({
    queryKey: calendarKeys.events(params),
    queryFn: () => calendarApi.list(params),
  });
}

export function useCreateCalendarEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (event: Omit<CalendarEvent, 'id'>) => calendarApi.create(event),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.all });
    },
  });
}

export function useDeleteCalendarEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => calendarApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.all });
    },
  });
}

// --- Documents Hooks ---
export const docKeys = {
  all: ['documents'] as const,
  mine: () => [...docKeys.all, 'mine'] as const,
  pending: () => [...docKeys.all, 'pending'] as const,
};

export function useMyDocuments() {
  return useQuery<VaultDoc[]>({
    queryKey: docKeys.mine(),
    queryFn: () => documentApi.mine(),
  });
}

export function usePendingDocuments() {
  return useQuery<any[]>({
    queryKey: docKeys.pending(),
    queryFn: () => adminApi.pendingDocs(),
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => documentApi.upload(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: docKeys.mine() });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => documentApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: docKeys.mine() });
    },
  });
}

export function useDecideDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      action,
      notes,
    }: {
      id: number;
      action: 'approved' | 'rejected' | 'requested_changes';
      notes?: string;
    }) => adminApi.decide(id, action, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: docKeys.pending() });
    },
  });
}

// --- Admin Hooks ---
export const adminKeys = {
  all: ['admin'] as const,
  stats: () => [...adminKeys.all, 'stats'] as const,
};

export function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: adminKeys.stats(),
    queryFn: () => adminApi.stats(),
  });
}

export function useBatchDecide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, action }: { ids: number[]; action: 'approved' | 'rejected' }) =>
      adminApi.batchDecide(ids, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: docKeys.pending() });
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
    },
  });
}

// --- Jobs & Marketplace Hooks ---
export const jobKeys = {
  all: ['jobs'] as const,
  lists: () => [...jobKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...jobKeys.lists(), filters] as const,
  details: () => [...jobKeys.all, 'detail'] as const,
  detail: (id: number) => [...jobKeys.details(), id] as const,
  companies: () => ['companies'] as const,
  myApplications: () => ['my-applications'] as const,
  scoutCandidates: (filters?: any) => ['scout-candidates', filters] as const,
};

export function useJobs(filters: Record<string, any> = {}) {
  return useQuery<JobsResponse>({
    queryKey: jobKeys.list(filters),
    queryFn: () => jobApi.listJobs(filters),
  });
}

export function useJob(id: number) {
  return useQuery<Job>({
    queryKey: jobKeys.detail(id),
    queryFn: () => jobApi.getJob(id),
    enabled: !!id,
  });
}

export function useCompanies() {
  return useQuery<Company[]>({
    queryKey: jobKeys.companies(),
    queryFn: () => jobApi.listCompanies(),
  });
}

export function useMyApplications() {
  return useQuery<JobApplication[]>({
    queryKey: jobKeys.myApplications(),
    queryFn: () => applicationApi.mine() as any,
  });
}

export function useScoutCandidates(filters: Record<string, any> = {}) {
  return useQuery<ScoutCandidate[]>({
    queryKey: jobKeys.scoutCandidates(filters),
    queryFn: () => jobApi.scoutCandidates(filters),
  });
}

export function useApplyJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, message }: { jobId: number; message?: string }) =>
      applicationApi.apply(jobId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.myApplications() });
    },
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => jobApi.createJob(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
    },
  });
}

export function useCloseJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => jobApi.closeJob(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
    },
  });
}

// --- Profile Hooks ---
export const profileKeys = {
  me: ['user', 'me'] as const,
};

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: profileKeys.me,
    queryFn: () => userApi.me(),
    initialData: user || undefined,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { login } = useAuth();
  return useMutation({
    mutationFn: (payload: ProfilePayload) => userApi.update(payload),
    onSuccess: (updated) => {
      login(updated);
      queryClient.setQueryData(profileKeys.me, updated);
      queryClient.invalidateQueries({ queryKey: profileKeys.me });
    },
  });
}

// --- Notification Hooks ---
export const notificationKeys = {
  all: ['notifications'] as const,
  mine: () => [...notificationKeys.all, 'mine'] as const,
};

export function useMyNotifications() {
  const { user } = useAuth();
  return useQuery<{ notifications: NotificationItem[]; unread: number }>({
    queryKey: notificationKeys.mine(),
    queryFn: () => notificationApi.mine(),
    enabled: !!user,
    staleTime: 0, // Selalu anggap stale agar polling efektif
    refetchInterval: 1000 * 30, // Auto-poll setiap 30 detik
    refetchIntervalInBackground: false, // Hentikan polling saat tab tidak aktif
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => notificationApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.mine() });
    },
  });
}

// --- Information Posts Hooks (Unified Hub) ---
export const postsKeys = {
  all: ['posts'] as const,
  list: (params?: {
    category?: string;
    sourceType?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => [...postsKeys.all, 'list', params] as const,
  detail: (slugOrId: string | number) => [...postsKeys.all, 'detail', String(slugOrId)] as const,
};

export function usePosts(params?: {
  category?: string;
  sourceType?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery<PostsResponse>({
    queryKey: postsKeys.list(params),
    queryFn: () => postsApi.listPosts(params),
    staleTime: 1000 * 60 * 5, // 5 menit
  });
}

export function usePost(slugOrId: string | number) {
  return useQuery<Post>({
    queryKey: postsKeys.detail(slugOrId),
    queryFn: () => postsApi.getPost(slugOrId),
    enabled: !!slugOrId,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePostPayload) => postsApi.createPost(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postsKeys.all });
    },
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<CreatePostPayload> }) =>
      postsApi.updatePost(id, payload),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: postsKeys.all });
      queryClient.invalidateQueries({ queryKey: postsKeys.detail(vars.id) });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => postsApi.deletePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postsKeys.all });
    },
  });
}
