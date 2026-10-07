import { api } from './index';

export interface CalendarEvent {
  id: number;
  title: string;
  title_jp?: string;
  description?: string;
  start_at: string;
  end_at: string;
  type: 'class' | 'partner_meeting' | 'event' | 'deadline';
  visibility: 'student' | 'alumni' | 'corporate' | 'all';
}

export const calendarApi = {
  list: (params: { from?: string; to?: string; type?: string } = {}) =>
    api.get<{ events: CalendarEvent[] }>('/api/calendar', { params }).then((r) => r.data.events),
  create: (e: Omit<CalendarEvent, 'id'>) =>
    api.post<{ event: CalendarEvent }>('/api/calendar/events', e).then((r) => r.data.event),
  remove: (id: number) => api.delete(`/api/calendar/events/${id}`).then((r) => r.data),
};
