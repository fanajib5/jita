import { api } from './index';

export interface CourseModule {
  id: number;
  title: string;
  title_jp?: string;
  content?: string | null;
  sort_order: number;
  duration_minutes: number;
}

export interface Course {
  id: number;
  title: string;
  title_jp?: string;
  description?: string;
  content?: string | null;
  phase: number;
  educator_id?: number | null;
  is_active?: number;
  modules: CourseModule[];
}

export interface CourseProgress {
  id: number;
  course_id?: number;
  title: string;
  phase: number;
  progress_pct: number;
  status: 'enrolled' | 'in_progress' | 'completed' | 'dropped';
  started_at: string | null;
  completed_at: string | null;
}

export interface CoursePayload {
  title: string;
  title_jp?: string;
  description?: string;
  content?: string | null;
  phase: number;
  educator_id?: number | null;
  is_active?: number;
}

export interface CourseModulePayload {
  title: string;
  title_jp?: string;
  content?: string | null;
  duration_minutes?: number;
  sort_order?: number;
}

export const courseApi = {
  list: () => api.get<{ courses: Course[] }>('/api/courses').then((r) => r.data.courses),
  detail: (id: number) =>
    api.get<{ course: Course }>(`/api/courses/${id}`).then((r) => r.data.course),
  create: (payload: CoursePayload) =>
    api.post<{ course: Course }>('/api/courses', payload).then((r) => r.data.course),
  update: (id: number, payload: Partial<CoursePayload>) =>
    api.put<{ course: Course }>(`/api/courses/${id}`, payload).then((r) => r.data.course),
  remove: (id: number) => api.delete(`/api/courses/${id}`).then((r) => r.data),

  enroll: (id: number) => api.post(`/api/courses/${id}/enroll`).then((r) => r.data),
  myProgress: () =>
    api
      .get<{ progress: CourseProgress[] }>('/api/courses/me/progress')
      .then((r) => r.data.progress),
  updateProgress: (id: number, progress_pct: number) =>
    api.put(`/api/courses/${id}/progress`, { progress_pct }).then((r) => r.data),

  // Module CRUD
  listModules: (courseId: number) =>
    api
      .get<{ modules: CourseModule[] }>(`/api/courses/${courseId}/modules`)
      .then((r) => r.data.modules),
  createModule: (courseId: number, payload: CourseModulePayload) =>
    api
      .post<{ module: CourseModule }>(`/api/courses/${courseId}/modules`, payload)
      .then((r) => r.data.module),
  updateModule: (courseId: number, moduleId: number, payload: Partial<CourseModulePayload>) =>
    api
      .put<{ module: CourseModule }>(`/api/courses/${courseId}/modules/${moduleId}`, payload)
      .then((r) => r.data.module),
  deleteModule: (courseId: number, moduleId: number) =>
    api.delete(`/api/courses/${courseId}/modules/${moduleId}`).then((r) => r.data),
};
