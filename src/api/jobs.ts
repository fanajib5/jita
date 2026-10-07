import { api } from './index';

export interface Company {
  id: number;
  name: string;
  name_jp?: string;
  industry?: string;
  website?: string;
  description?: string;
  contact_email?: string;
}
export interface Job {
  id: number;
  company_id: number;
  company_name?: string;
  company_name_jp?: string;
  title: string;
  title_jp?: string;
  description?: string;
  requirements?: string;
  specialization?: string;
  min_jlpt?: string;
  location?: string;
  employment_type: 'fulltime' | 'contract' | 'internship';
  target_audience?: 'all' | 'student' | 'graduated';
  salary_range?: string;
  is_active: 0 | 1;
  created_at: string;
  matchScore?: number;
}
export interface ScoutCandidate {
  id: number;
  name: string;
  nameJp?: string;
  jlptLevel?: string;
  specialization: string[];
  originCity?: string;
  bioId?: string;
  bioJp?: string;
  matchScore?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface JobsResponse {
  jobs: Job[];
  pagination?: PaginationMeta;
}

export interface CreateJobPayload {
  companyId?: number;
  company_id?: number;
  title: string;
  titleJp?: string;
  title_jp?: string;
  description: string;
  requirements: string;
  specialization?: string;
  minJlpt?: string;
  min_jlpt?: string;
  location?: string;
  employmentType?: string;
  employment_type?: string;
  targetAudience?: 'all' | 'student' | 'graduated';
  target_audience?: 'all' | 'student' | 'graduated';
  salaryRange?: string;
  salary_range?: string;
}

export const jobApi = {
  listCompanies: () =>
    api.get<{ companies: Company[] }>('/api/jobs/companies').then((r) => r.data.companies),
  createCompany: (c: Partial<Company>) =>
    api
      .post<{ company?: Company; id?: number; name?: string }>('/api/jobs/companies', c)
      .then((r) => r.data.company || (r.data as Company)),

  listJobs: (
    params: {
      specialization?: string;
      minJlpt?: string;
      location?: string;
      page?: number;
      limit?: number;
    } = {}
  ) => api.get<JobsResponse>('/api/jobs', { params }).then((r) => r.data),
  getJob: (id: number) => api.get<{ job: Job }>(`/api/jobs/${id}`).then((r) => r.data.job),
  createJob: (j: CreateJobPayload) =>
    api.post<{ job: Job }>('/api/jobs', j).then((r) => r.data.job),
  updateJob: (id: number, j: Partial<Job>) =>
    api.put<{ job: Job }>(`/api/jobs/${id}`, j).then((r) => r.data.job),
  closeJob: (id: number) => api.post(`/api/jobs/${id}/close`).then((r) => r.data),
  applicationsForJob: (id: number) =>
    api.get<{ applications: any[] }>(`/api/jobs/${id}/applications`).then((r) => r.data),
  decideApplication: (id: number, status: string, message?: string) =>
    api.post(`/api/applications/${id}/decide`, { status, message }).then((r) => r.data),

  scoutCandidates: (params: { specialization?: string; minJlpt?: string } = {}) =>
    api
      .get<{ candidates: ScoutCandidate[] }>('/api/jobs/scout-candidates', {
        params,
      })
      .then((r) => r.data.candidates),
  scout: (jobId: number, userId: number, message?: string) =>
    api.post(`/api/jobs/${jobId}/scout`, { candidateId: userId, message }).then((r) => r.data),
};
