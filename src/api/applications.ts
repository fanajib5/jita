import { api } from './index';

export type AppType = 'apply' | 'scout';
export type AppStatus = 'submitted' | 'shortlisted' | 'rejected' | 'accepted' | 'withdrawn';

export interface Application {
  id: number;
  job_id: number;
  user_id: number;
  type: AppType;
  status: AppStatus;
  message?: string;
  created_at: string;
  decided_at?: string;
  job_title?: string;
  company_name?: string;
  user_name?: string;
  user_email?: string;
  jlpt_level?: string;
  specialization?: string;
  origin_city?: string;
}

export const applicationApi = {
  apply: (jobId: number, message?: string) =>
    api.post(`/api/jobs/${jobId}/apply`, { message }).then((r) => r.data),
  mine: () =>
    api
      .get<{ applications: Application[] }>('/api/applications/mine')
      .then((r) => r.data.applications),
  decide: (appId: number, status: Exclude<AppStatus, 'submitted' | 'withdrawn'>) =>
    api.post(`/api/applications/${appId}/decide`, { status }).then((r) => r.data),
};
