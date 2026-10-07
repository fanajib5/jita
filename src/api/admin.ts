import { api } from './index';
import type { VaultDoc, DocStatus } from './documents';

export interface AdminStats {
  pending: number;
  approved?: number;
  active_jobs: number;
  totalStudents?: number;
  totalApplications?: number;
}

export const adminApi = {
  pendingDocs: () =>
    api
      .get<{
        documents: (VaultDoc & { user_name: string; user_email: string })[];
      }>('/api/admin/pending-documents')
      .then((r) => r.data.documents || []),
  decide: (id: number, action: 'approved' | 'rejected' | 'requested_changes', notes?: string) =>
    api
      .post<{ id: number; status: DocStatus }>(`/api/admin/documents/${id}/decide`, {
        action,
        notes,
      })
      .then((r) => r.data),
  stats: () =>
    api.get<any>('/api/admin/stats').then((r) => {
      const raw = r.data?.stats || r.data || {};
      return {
        pending: raw.pendingDocs ?? raw.pending ?? 0,
        approved: raw.approvedDocs ?? raw.approved ?? 0,
        active_jobs: raw.activeJobs ?? raw.active_jobs ?? 0,
        totalStudents: raw.totalStudents ?? 0,
        totalApplications: raw.totalApplications ?? 0,
      };
    }),
  batchDecide: (ids: number[], action: 'approved' | 'rejected') =>
    api
      .post<{ updated: number }>(`/api/admin/documents/batch-decide`, {
        ids,
        action,
      })
      .then((r) => r.data),
};
