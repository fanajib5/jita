import { useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { useCalendarEvents } from '../../api/hooks';
import type { CalendarEvent } from '../../api/calendar';
import { Card } from '../../components/ui/Card';
import styles from './CalendarPage.module.css';

const TYPE_COLORS: Record<string, string> = {
  class: '#3b82f6',
  partner_meeting: '#10b981',
  event: '#f59e0b',
  deadline: '#ef4444',
};

export default function CalendarPage() {
  const { data: events = [], isLoading: loading, error: calendarError } = useCalendarEvents();
  const err = calendarError
    ? (calendarError as any)?.response?.data?.error || 'Gagal memuat kalender'
    : null;

  const fcEvents = useMemo(
    () =>
      events.map((e) => ({
        id: String(e.id),
        title: e.title_jp ? `${e.title} / ${e.title_jp}` : e.title,
        start: e.start_at,
        end: e.end_at,
        backgroundColor: TYPE_COLORS[e.type] || '#6b7280',
        borderColor: TYPE_COLORS[e.type] || '#6b7280',
        extendedProps: { ...e },
      })),
    [events]
  );

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerTitleRow}>
              <h1 className={styles.title}>Kalender Kegiatan & Kuliah</h1>
              <span className={styles.kanjiBadge}>行事予定表</span>
            </div>
            <p className={styles.subtitle}>
              Jadwal sesi kelas interaktif, evaluasi pembelajaran, wawancara partner perusahaan
              Jepang, dan batas akhir pendaftaran.
            </p>
          </div>
        </header>
        <Card padding="md">
          {loading && <p>Memuat kalender...</p>}
          {err && <p style={{ color: 'var(--color-danger)' }}>{err}</p>}
          {!loading && !err && (
            <div className={styles.calendar}>
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,listWeek',
                }}
                buttonText={{
                  today: 'Hari Ini',
                  month: 'Bulan',
                  week: 'Pekan',
                  list: 'Daftar',
                }}
                noEventsContent="Tidak ada agenda kegiatan pada pekan ini."
                locale="id"
                firstDay={1}
                height="auto"
                events={fcEvents}
                eventClick={(info) => {
                  const e = info.event.extendedProps as CalendarEvent;
                  alert(
                    `${e.title}\n${e.description || ''}\n${new Date(e.start_at).toLocaleString('id-ID')}`
                  );
                }}
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
