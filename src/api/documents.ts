import { api, API_BASE } from './index';

export type DocType = 'ktp' | 'certificate' | 'portfolio' | 'transcript';
export type DocStatus = 'pending' | 'approved' | 'rejected';

export interface VaultDoc {
  id: number;
  user_id: number;
  type: DocType;
  title: string;
  file_path: string;
  file_mime: string;
  file_size_bytes: number;
  issued_by?: string;
  issued_date?: string;
  verification_status: DocStatus;
  verification_notes?: string;
  verified_by?: number;
  verified_at?: string;
  created_at: string;
}

export const documentApi = {
  mine: () =>
    api.get<{ documents: VaultDoc[] }>('/api/documents/mine').then((r) => r.data.documents),
  upload: (form: FormData) =>
    api
      .post<{ document: { id: number } }>('/api/documents/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data.document),
  remove: (id: number) => api.delete(`/api/documents/${id}`).then((r) => r.data),
  fileUrl: (id: number) => `${API_BASE}/api/documents/file/${id}`,
};
