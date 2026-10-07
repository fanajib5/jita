import { api } from './index';

export type NotifStatus = 'queued' | 'sent' | 'failed' | 'skipped';

export interface NotificationItem {
  id: number;
  channel: 'email' | 'webhook' | 'in_app';
  template_key: string;
  subject: string;
  payload_json?: any;
  status: NotifStatus;
  read_at: string | null;
  created_at: string;
}

export const notificationApi = {
  mine: () =>
    api
      .get<{ notifications: NotificationItem[]; unread: number }>('/api/notifications/mine')
      .then((r) => r.data),
  markRead: (id: number) => api.post(`/api/notifications/${id}/read`).then((r) => r.data),
};
