import { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  useCalendarEvents,
  useCourses,
  useUpdateCourse,
  useCreateModule,
  useDeleteModule,
  useUpdateModule,
} from '../../api/hooks';
import type { Course, CourseModule } from '../../api/courses';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { RichEditor } from '../../components/ui/RichEditor';
import styles from './EducatorPortal.module.css';

type EducatorMode = 'bilingual' | 'silver';
type PortalTab = 'sessions' | 'content';

export default function EducatorPortal() {
  const { user } = useAuth();
  const isSilver = user?.role === 'educator_silver';
  const isAdmin = user?.role === 'admin';
  const [mode, setMode] = useState<EducatorMode>(isSilver ? 'silver' : 'bilingual');
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<PortalTab>('sessions');

  const { data: calendarEvents = [] } = useCalendarEvents();
  const { data: courses = [] } = useCourses();

  // Courses that belong to this educator (or all if admin)
  const myCourses = useMemo(() => {
    if (isAdmin) return courses;
    return courses.filter((c) => c.educator_id === user?.id);
  }, [courses, user, isAdmin]);

  // Filter events based on educator mode
  const scheduled = useMemo(() => {
    const now = new Date().toISOString();
    return calendarEvents.filter((e) => {
      const matchMode = mode === 'silver' ? e.type === 'partner_meeting' : e.type === 'class';
      return matchMode && (e.start_at >= now || e.start_at.slice(0, 10) >= now.slice(0, 10));
    });
  }, [calendarEvents, mode]);

  const completedSessions = useMemo(() => {
    const now = new Date().toISOString();
    return calendarEvents.filter((e) => {
      const matchMode = mode === 'silver' ? e.type === 'partner_meeting' : e.type === 'class';
      return matchMode && e.start_at < now && e.start_at.slice(0, 10) < now.slice(0, 10);
    });
  }, [calendarEvents, mode]);

  const isSilverMode = mode === 'silver';

  const handleStartSession = (session: any) => {
    setActiveSession(session);
  };

  const handleFinishSession = () => {
    setActiveSession(null);
  };

  return (
    <div className={styles.page} data-mode={isSilverMode ? 'silver' : undefined}>
      <div className={styles.container}>
        {/* Header */}
        <header
          className={[styles.header, isSilverMode ? styles.headerSilver : '']
            .filter(Boolean)
            .join(' ')}
        >
          <div className={styles.headerLeft}>
            <Avatar
              name={user?.name ?? 'M'}
              size={isSilverMode ? 'lg' : 'md'}
              role={isSilverMode ? 'silver' : 'educator'}
            />
            <div className={styles.headerMeta}>
              <div className={styles.headerTitleRow}>
                <h1 className={styles.title}>Portal Edukator & Mentor</h1>
                <span
                  className={[styles.kanjiBadge, isSilverMode ? styles.kanjiBadgeSilver : '']
                    .filter(Boolean)
                    .join(' ')}
                >
                  {isSilverMode ? 'シルバー人材' : '教育・指導'}
                </span>
                <Badge variant={isSilverMode ? 'silver' : 'educator'} size="sm">
                  {isSilverMode ? 'Silver Jinzai' : 'Educator'}
                </Badge>
              </div>
              <p className={styles.subtitle}>
                {user?.name ?? 'Instruktur'} {user?.nameJp ? `(${user.nameJp})` : ''} ·{' '}
                {user?.title ??
                  (isSilverMode ? 'Senior Industry Mentor' : 'Instruktur Bahasa Jepang')}
              </p>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className={styles.modeToggle}>
            <span className={styles.modeLabel}>Mode Antarmuka:</span>
            <div className={styles.toggleBtns}>
              <button
                className={[styles.toggleBtn, mode === 'bilingual' ? styles.toggleActive : ''].join(
                  ' '
                )}
                onClick={() => setMode('bilingual')}
              >
                📚 Bilingual
              </button>
              <button
                className={[
                  styles.toggleBtn,
                  styles.silverToggle,
                  mode === 'silver' ? styles.toggleActiveSilver : '',
                ].join(' ')}
                onClick={() => setMode('silver')}
              >
                👴 Silver Jinzai
              </button>
            </div>
          </div>
        </header>

        {/* Mode Banner */}
        <div className={styles.modeBanner}>
          {isSilverMode ? (
            <div className={styles.silverBanner}>
              <span className={styles.silverBannerIcon}>🗾</span>
              <div>
                <strong>Mode Silver Jinzai / Eksekutif</strong>
                <p>Antarmuka dioptimalkan untuk aksesibilitas. Font lebih besar, kontras tinggi.</p>
              </div>
              <Badge variant="silver">シルバー人材モード</Badge>
            </div>
          ) : (
            <div className={styles.bilingualBanner}>
              <span>📚</span>
              <div>
                <strong>Mode Pendidik Bilingual</strong>
                <p>
                  Kelola modul dan penilaian siswa dengan instruksi dwibahasa (Indonesia–Jepang).
                </p>
              </div>
              <Badge variant="educator">バイリンガルモード</Badge>
            </div>
          )}
        </div>

        {/* Active Session Notification / Banner */}
        {activeSession && (
          <div className={styles.activeBanner}>
            <div className={styles.activeBannerHeader}>
              <div className={styles.activeBannerTitleGroup}>
                <span className={styles.liveIndicator}>
                  <span className={styles.pulseDot} />
                  Live / Sedang Berlangsung
                </span>
                <h3 className={styles.activeBannerTitle}>{activeSession.title}</h3>
              </div>
              <div className={styles.activeBannerActions}>
                <Button variant="danger" size="sm" onClick={handleFinishSession}>
                  Selesaikan Sesi
                </Button>
              </div>
            </div>

            <div className={styles.activeBannerBody}>
              {activeSession.title_jp && (
                <p className={styles.sessionJp}>{activeSession.title_jp}</p>
              )}
              <div className={styles.activeSessionDetails}>
                <span>📅 {activeSession.start_at?.slice(0, 10)}</span>
                <span>⏰ {activeSession.start_at?.slice(11, 16)} WIB</span>
                <span>⏱ Ruang Virtual Aktif (Audio/Video Ready)</span>
              </div>

              {/* Note regarding Option 1 */}
              <div className={styles.roadmapNote}>
                <div className={styles.roadmapNoteTitle}>
                  <span>💡</span>
                  <strong>Catatan Integrasi Penuh (Opsi 1 — Ruang Simulasi Interaktif)</strong>
                </div>
                <p>
                  Pada implementasi tahap berikutnya (Opsi 1), penekanan tombol ini akan langsung
                  membuka
                  <strong> Modal Ruang Simulasi Interaktif</strong> yang terintegrasi dengan tautan
                  video conference (Google Meet / Zoom / WebRTC), lembar panduan role-play dwibahasa
                  (skenario etika & negosiasi), serta formulir live rubric penilaian{' '}
                  <em>Tacit Knowledge</em> peserta secara <em>real-time</em>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ---- TAB NAVIGATION ---- */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1.5rem',
            borderBottom: '1px solid var(--color-border)',
            paddingBottom: '0.5rem',
          }}
        >
          <button
            onClick={() => setActiveTab('sessions')}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '6px 6px 0 0',
              border: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === 'sessions' ? 700 : 400,
              background: activeTab === 'sessions' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'sessions' ? '#fff' : 'var(--color-text-secondary)',
              transition: 'all 0.2s',
            }}
          >
            📅 Sesi & Jadwal
          </button>
          <button
            onClick={() => setActiveTab('content')}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '6px 6px 0 0',
              border: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === 'content' ? 700 : 400,
              background: activeTab === 'content' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'content' ? '#fff' : 'var(--color-text-secondary)',
              transition: 'all 0.2s',
            }}
          >
            📚 Kelola Konten
            {myCourses.length > 0 && (
              <span
                style={{
                  marginLeft: '0.4rem',
                  background: 'var(--color-accent)',
                  color: '#fff',
                  borderRadius: '999px',
                  padding: '0 0.4rem',
                  fontSize: '0.75rem',
                }}
              >
                {myCourses.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'sessions' && (
          <div className={styles.grid}>
            {/* ---- MAIN COLUMN ---- */}
            <div className={styles.mainCol}>
              <Card
                title={isSilverMode ? '予定セッション — Sesi Terjadwal' : 'Sesi Mendatang'}
                subtitle={`${scheduled.length} sesi dijadwalkan`}
              >
                {scheduled.length === 0 ? (
                  <p className={styles.emptyText}>
                    Tidak ada sesi mendatang yang terdaftar di kalender.
                  </p>
                ) : (
                  <div className={styles.sessionList}>
                    {scheduled.map((session) => (
                      <SessionCard
                        key={session.id}
                        session={session}
                        mode={mode}
                        isActive={activeSession?.id === session.id}
                        onStart={handleStartSession}
                        onFinish={handleFinishSession}
                      />
                    ))}
                  </div>
                )}
              </Card>

              <Card
                title={isSilverMode ? '完了セッション — Riwayat' : 'Riwayat Sesi'}
                subtitle={`${completedSessions.length} sesi selesai`}
              >
                {completedSessions.length === 0 ? (
                  <p className={styles.emptyText}>Belum ada riwayat sesi lampau.</p>
                ) : (
                  <div className={styles.sessionList}>
                    {completedSessions.map((session) => (
                      <SessionCard
                        key={session.id}
                        session={session}
                        completed
                        mode={mode}
                        isActive={false}
                      />
                    ))}
                  </div>
                )}
              </Card>

              {/* Simulation Room (Silver only) */}
              {isSilverMode && (
                <Card
                  title="ロールプレイ室 — Ruang Simulasi"
                  subtitle="交渉・礼儀のシミュレーション"
                  accent
                >
                  <div className={styles.simScenarios}>
                    {[
                      {
                        icon: '🤝',
                        title: 'Negosiasi Kontrak Kerja',
                        jp: '雇用契約交渉',
                        level: 'Lanjutan',
                      },
                      {
                        icon: '📋',
                        title: 'Presentasi Proyek ke Eksekutif',
                        jp: '役員へのプロジェクト発表',
                        level: 'Menengah',
                      },
                      {
                        icon: '🍺',
                        title: 'Nomikai — Etika Acara Sosial',
                        jp: '飲み会の礼儀',
                        level: 'Dasar',
                      },
                      {
                        icon: '📞',
                        title: 'Keigo Telepon Bisnis',
                        jp: 'ビジネス電話の敬語',
                        level: 'Menengah',
                      },
                    ].map((s) => (
                      <div key={s.title} className={styles.simCard}>
                        <span className={styles.simIcon}>{s.icon}</span>
                        <div className={styles.simInfo}>
                          <span className={styles.simTitle}>{s.title}</span>
                          <span className={styles.simJp}>{s.jp}</span>
                        </div>
                        <Badge variant="silver">{s.level}</Badge>
                        <Button variant="secondary" size="sm">
                          Mulai
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* ---- SIDEBAR ---- */}
            <div className={styles.sideCol}>
              {!isSilverMode && (
                <Card title="Kurikulum Binaan" subtitle="Modul pembelajaran aktif">
                  <div className={styles.studentList}>
                    {courses.slice(0, 3).map((c) => (
                      <div key={c.id} className={styles.studentCard}>
                        <div className={styles.studentTop}>
                          <span className={styles.studentName}>{c.title}</span>
                          <Badge variant="accent">Fase {c.phase}</Badge>
                        </div>
                        <p className={styles.studentModule}>{c.title_jp || 'JITA Course'}</p>
                        <div className={styles.studentBars}>
                          <div>
                            <span>Sub-materi ({c.modules?.length || 0})</span>
                            <ProgressBar value={100} variant="accent" size="sm" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {isSilverMode && (
                <Card title="メモ — Catatan Sesi" subtitle="Tacit Knowledge Log">
                  <div className={styles.notesList}>
                    <div className={styles.noteItem}>
                      <span className={styles.noteDate}>2026-07-10</span>
                      <span className={styles.noteStudent}>Siti Nurhaliza</span>
                      <p className={styles.noteText}>
                        Pemahaman nomikai sangat baik. Perlu latihan lebih pada aisatsu formal saat
                        bertemu klien baru.
                      </p>
                    </div>
                    <div className={styles.noteItem}>
                      <span className={styles.noteDate}>2026-07-08</span>
                      <span className={styles.noteStudent}>Ahmad Fauzi</span>
                      <p className={styles.noteText}>
                        Keigo sudah baik. Latihan ringi-sho perlu ditingkatkan.
                      </p>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" fullWidth>
                    Tambah Catatan Baru
                  </Button>
                </Card>
              )}

              <Card title="Statistik Ringkas">
                <div className={styles.quickStats}>
                  {[
                    { label: 'Total Sesi', value: `${calendarEvents.length}` },
                    { label: 'Sesi Mendatang', value: `${scheduled.length}` },
                    { label: 'Sesi Selesai', value: `${completedSessions.length}` },
                    { label: 'Kursus Tersedia', value: `${courses.length}` },
                  ].map((s) => (
                    <div key={s.label} className={styles.quickStatItem}>
                      <span className={styles.quickStatValue}>{s.value}</span>
                      <span className={styles.quickStatLabel}>{s.label}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'content' && <ContentManager courses={myCourses} isAdmin={!!isAdmin} />}
      </div>
    </div>
  );
}

function SessionCard({
  session,
  completed = false,
  mode,
  isActive = false,
  onStart,
  onFinish,
}: {
  session: any;
  completed?: boolean;
  mode: EducatorMode;
  isActive?: boolean;
  onStart?: (session: any) => void;
  onFinish?: () => void;
}) {
  return (
    <div
      className={[
        styles.sessionCard,
        completed ? styles.sessionCompleted : '',
        isActive ? styles.sessionCardActive : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.sessionMeta}>
        <Badge variant={mode === 'silver' ? 'silver' : 'educator'}>
          {mode === 'silver' ? 'Silver Jinzai' : 'Bilingual'}
        </Badge>
        {isActive ? (
          <Badge variant="danger">Sedang Berlangsung</Badge>
        ) : (
          <Badge variant={completed ? 'success' : 'warning'}>
            {completed ? 'Selesai' : 'Terjadwal'}
          </Badge>
        )}
      </div>
      <h4 className={styles.sessionTitle}>{session.title}</h4>
      {session.title_jp && <p className={styles.sessionJp}>{session.title_jp}</p>}
      {session.description && <p className={styles.sessionTopic}>{session.description}</p>}
      <div className={styles.sessionDetails}>
        <span>📅 {session.start_at?.slice(0, 10)}</span>
        <span>⏰ {session.start_at?.slice(11, 16)} WIB</span>
        <span>⏱ 60 menit</span>
      </div>
      {!completed && (
        <div className={styles.sessionActions}>
          {isActive ? (
            <Button variant="danger" size="sm" onClick={onFinish}>
              Selesaikan Sesi
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={() => onStart && onStart(session)}>
              Mulai Sesi
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ── ContentManager: Tab "Kelola Konten" ──────────────────────────────────────

function ContentManager({ courses, isAdmin }: { courses: Course[]; isAdmin: boolean }) {
  if (courses.length === 0) {
    return (
      <Card title="Kelola Konten Pelatihan">
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</p>
          {isAdmin
            ? 'Belum ada course yang tersedia.'
            : 'Tidak ada course yang di-assign ke Anda. Hubungi admin.'}
        </div>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
          📚 Konten Pelatihan{isAdmin ? ' (Semua Kursus)' : ' (Kursus Anda)'}
        </h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
          {courses.length} kursus
        </span>
      </div>
      {courses.map((course) => (
        <CourseContentCard key={course.id} course={course} />
      ))}
    </div>
  );
}

function CourseContentCard({ course }: { course: Course }) {
  const updateCourseMutation = useUpdateCourse();
  const createModuleMutation = useCreateModule();
  const updateModuleMutation = useUpdateModule();
  const deleteModuleMutation = useDeleteModule();

  const [editingCourse, setEditingCourse] = useState(false);
  const [courseForm, setCourseForm] = useState({
    title: course.title,
    title_jp: course.title_jp || '',
    description: course.description || '',
    content: course.content || '',
  });
  const [showAddModule, setShowAddModule] = useState(false);
  const [newModule, setNewModule] = useState({
    title: '',
    title_jp: '',
    duration_minutes: 60,
    content: '',
  });
  const [editingModuleId, setEditingModuleId] = useState<number | null>(null);
  const [moduleEditForm, setModuleEditForm] = useState<{
    title: string;
    title_jp: string;
    duration_minutes: number;
    content: string;
  }>({ title: '', title_jp: '', duration_minutes: 60, content: '' });

  const handleSaveCourse = () => {
    updateCourseMutation.mutate(
      { id: course.id, ...courseForm },
      { onSuccess: () => setEditingCourse(false) }
    );
  };

  const handleAddModule = () => {
    if (!newModule.title.trim()) return;
    createModuleMutation.mutate(
      { courseId: course.id, ...newModule },
      {
        onSuccess: () => {
          setNewModule({ title: '', title_jp: '', duration_minutes: 60, content: '' });
          setShowAddModule(false);
        },
      }
    );
  };

  const handleStartEditModule = (m: CourseModule) => {
    setEditingModuleId(m.id);
    setModuleEditForm({
      title: m.title,
      title_jp: m.title_jp || '',
      duration_minutes: m.duration_minutes,
      content: m.content || '',
    });
  };

  const handleSaveModule = (moduleId: number) => {
    updateModuleMutation.mutate(
      { courseId: course.id, moduleId, ...moduleEditForm },
      { onSuccess: () => setEditingModuleId(null) }
    );
  };

  const handleDeleteModule = (moduleId: number) => {
    if (!window.confirm('Hapus modul ini?')) return;
    deleteModuleMutation.mutate({ courseId: course.id, moduleId });
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.4rem 0.6rem',
    borderRadius: '6px',
    border: '1px solid var(--color-border)',
    background: 'var(--color-surface)',
    color: 'var(--color-text-primary)',
    fontSize: '0.875rem',
    boxSizing: 'border-box',
  };

  return (
    <Card
      title={`Fase ${course.phase} — ${course.title}`}
      subtitle={course.title_jp || ''}
      headerAction={<Badge variant="accent">Fase {course.phase}</Badge>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {editingCourse ? (
          <div
            style={{
              background: 'var(--color-surface-elevated, rgba(0,0,0,0.04))',
              borderRadius: '8px',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <label
              style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}
            >
              Judul
            </label>
            <input
              style={inputStyle}
              value={courseForm.title}
              onChange={(e) => setCourseForm((p) => ({ ...p, title: e.target.value }))}
            />
            <label
              style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}
            >
              Judul (Jepang)
            </label>
            <input
              style={inputStyle}
              value={courseForm.title_jp}
              onChange={(e) => setCourseForm((p) => ({ ...p, title_jp: e.target.value }))}
            />
            <label
              style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}
            >
              Deskripsi Singkat
            </label>
            <textarea
              style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }}
              value={courseForm.description}
              onChange={(e) => setCourseForm((p) => ({ ...p, description: e.target.value }))}
            />
            <label
              style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}
            >
              Detail Konten & Silabus Kursus (WYSIWYG Editor)
            </label>
            <RichEditor
              value={courseForm.content}
              onChange={(html) => setCourseForm((p) => ({ ...p, content: html }))}
              placeholder="Tulis silabus lengkap atau pengantar kursus di sini..."
              minHeight="140px"
            />
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                justifyContent: 'flex-end',
                marginTop: '0.5rem',
              }}
            >
              <Button size="sm" variant="ghost" onClick={() => setEditingCourse(false)}>
                Batal
              </Button>
              <Button
                size="sm"
                variant="primary"
                disabled={updateCourseMutation.isPending}
                onClick={handleSaveCourse}
              >
                {updateCourseMutation.isPending ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: '0.875rem',
                  color: 'var(--color-text-secondary)',
                  flex: 1,
                }}
              >
                {course.description || <em>Belum ada deskripsi.</em>}
              </p>
              <Button size="sm" variant="ghost" onClick={() => setEditingCourse(true)}>
                ✏️ Edit Kursus
              </Button>
            </div>
            {course.content && (
              <div
                style={{
                  marginTop: '0.25rem',
                  padding: '0.75rem',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                }}
              >
                <RichEditor value={course.content} readOnly minHeight="auto" />
              </div>
            )}
          </div>
        )}

        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem',
            }}
          >
            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
              Modul ({course.modules?.length || 0})
            </span>
            <Button size="sm" variant="secondary" onClick={() => setShowAddModule((v) => !v)}>
              {showAddModule ? '✕ Batal' : '+ Tambah Modul'}
            </Button>
          </div>

          {showAddModule && (
            <div
              style={{
                background: 'var(--color-surface-elevated, rgba(0,0,0,0.04))',
                borderRadius: '8px',
                padding: '0.75rem',
                marginBottom: '0.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <input
                style={inputStyle}
                placeholder="Judul modul (wajib)"
                value={newModule.title}
                onChange={(e) => setNewModule((p) => ({ ...p, title: e.target.value }))}
              />
              <input
                style={inputStyle}
                placeholder="Judul modul (Jepang, opsional)"
                value={newModule.title_jp}
                onChange={(e) => setNewModule((p) => ({ ...p, title_jp: e.target.value }))}
              />
              <label
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--color-text-secondary)',
                }}
              >
                Materi / Konten Modul (WYSIWYG Editor)
              </label>
              <RichEditor
                value={newModule.content}
                onChange={(html) => setNewModule((p) => ({ ...p, content: html }))}
                placeholder="Tulis ringkasan materi, instruksi, atau referensi modul..."
                minHeight="120px"
              />
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <label
                  style={{
                    fontSize: '0.8rem',
                    whiteSpace: 'nowrap',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  Durasi (menit):
                </label>
                <input
                  style={{ ...inputStyle, width: '80px' }}
                  type="number"
                  min={1}
                  value={newModule.duration_minutes}
                  onChange={(e) =>
                    setNewModule((p) => ({ ...p, duration_minutes: Number(e.target.value) }))
                  }
                />
                <Button
                  size="sm"
                  variant="primary"
                  disabled={createModuleMutation.isPending || !newModule.title.trim()}
                  onClick={handleAddModule}
                >
                  {createModuleMutation.isPending ? 'Menambah...' : 'Tambah Modul'}
                </Button>
              </div>
            </div>
          )}

          {(course.modules?.length || 0) === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)', margin: 0 }}>
              Belum ada modul. Klik &quot;+ Tambah Modul&quot; untuk mulai.
            </p>
          ) : (
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
              }}
            >
              {course.modules?.map((m, idx) => (
                <li
                  key={m.id}
                  style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    padding: '0.5rem 0.75rem',
                    display: 'flex',
                    flexDirection: editingModuleId === m.id ? 'column' : 'row',
                    gap: '0.4rem',
                    alignItems: editingModuleId === m.id ? 'stretch' : 'center',
                  }}
                >
                  {editingModuleId === m.id ? (
                    <>
                      <input
                        style={inputStyle}
                        placeholder="Judul modul"
                        value={moduleEditForm.title}
                        onChange={(e) =>
                          setModuleEditForm((p) => ({ ...p, title: e.target.value }))
                        }
                      />
                      <input
                        style={inputStyle}
                        placeholder="Judul Jepang"
                        value={moduleEditForm.title_jp}
                        onChange={(e) =>
                          setModuleEditForm((p) => ({ ...p, title_jp: e.target.value }))
                        }
                      />
                      <label
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        Materi / Konten Modul (WYSIWYG Editor)
                      </label>
                      <RichEditor
                        value={moduleEditForm.content}
                        onChange={(html) => setModuleEditForm((p) => ({ ...p, content: html }))}
                        placeholder="Edit isi materi modul di sini..."
                        minHeight="120px"
                      />
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <label
                          style={{
                            fontSize: '0.8rem',
                            whiteSpace: 'nowrap',
                            color: 'var(--color-text-secondary)',
                          }}
                        >
                          Durasi:
                        </label>
                        <input
                          style={{ ...inputStyle, width: '80px' }}
                          type="number"
                          min={1}
                          value={moduleEditForm.duration_minutes}
                          onChange={(e) =>
                            setModuleEditForm((p) => ({
                              ...p,
                              duration_minutes: Number(e.target.value),
                            }))
                          }
                        />
                        <Button size="sm" variant="ghost" onClick={() => setEditingModuleId(null)}>
                          Batal
                        </Button>
                        <Button
                          size="sm"
                          variant="primary"
                          disabled={updateModuleMutation.isPending}
                          onClick={() => handleSaveModule(m.id)}
                        >
                          {updateModuleMutation.isPending ? '...' : 'Simpan'}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--color-text-tertiary)',
                          width: '1.5rem',
                          flexShrink: 0,
                        }}
                      >
                        {idx + 1}.
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 500,
                            fontSize: '0.875rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {m.title}
                        </div>
                        {m.title_jp && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                            {m.title_jp}
                          </div>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--color-text-secondary)',
                          flexShrink: 0,
                        }}
                      >
                        {m.duration_minutes} min
                      </span>
                      <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                        <button
                          onClick={() => handleStartEditModule(m)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            padding: '0.1rem 0.3rem',
                            borderRadius: '4px',
                          }}
                          title="Edit modul"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteModule(m.id)}
                          disabled={deleteModuleMutation.isPending}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            padding: '0.1rem 0.3rem',
                            borderRadius: '4px',
                            color: 'var(--color-danger, #e53e3e)',
                          }}
                          title="Hapus modul"
                        >
                          🗑
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}
