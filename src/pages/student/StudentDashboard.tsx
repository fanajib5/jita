import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  useCourses,
  useMyCourseProgress,
  useMyDocuments,
  useCalendarEvents,
} from '../../api/hooks';
import { documentApi } from '../../api/documents';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { StatCard } from '../../components/ui/StatCard';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import styles from './StudentDashboard.module.css';

// ── helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso?: string | null): string {
  if (!iso || iso === '—') return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function daysUntil(iso: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(iso);
  target.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((target.getTime() - now.getTime()) / 86_400_000));
}

function credentialIcon(type: string): string {
  switch (type) {
    case 'certificate':
      return '📜';
    case 'badge':
      return '🏅';
    case 'transcript':
      return '📋';
    case 'ktp':
      return '🪪';
    default:
      return '📄';
  }
}

function credentialStatusVariant(status: string): 'success' | 'warning' | 'danger' {
  switch (status) {
    case 'approved':
    case 'valid':
      return 'success';
    case 'pending':
      return 'warning';
    case 'rejected':
    case 'expired':
      return 'danger';
    default:
      return 'warning';
  }
}

function credentialStatusLabel(status: string): string {
  switch (status) {
    case 'approved':
    case 'valid':
      return 'Valid';
    case 'pending':
      return 'Pending';
    case 'rejected':
      return 'Ditolak';
    case 'expired':
      return 'Expired';
    default:
      return status;
  }
}

function moduleStatusVariant(status: string): 'success' | 'accent' | 'default' {
  switch (status) {
    case 'completed':
      return 'success';
    case 'in_progress':
      return 'accent';
    default:
      return 'default';
  }
}

function moduleStatusLabel(status: string): string {
  switch (status) {
    case 'completed':
      return 'Selesai';
    case 'in_progress':
      return 'Berlangsung';
    default:
      return 'Tersedia';
  }
}

function sessionTypeBadge(type: string): 'info' | 'silver' {
  return type === 'partner_meeting' ? 'silver' : 'info';
}

function sessionTypeLabel(type: string): string {
  switch (type) {
    case 'partner_meeting':
      return 'Mitra / Silver';
    case 'class':
      return 'Kelas Pelatihan';
    case 'event':
      return 'Workshop / Event';
    case 'deadline':
      return 'Batas Waktu';
    default:
      return 'Sesi';
  }
}

// ── component ────────────────────────────────────────────────────────────────

export default function StudentDashboard() {
  const { user } = useAuth();
  const { data: documents = [] } = useMyDocuments();
  const { data: courses = [] } = useCourses();
  const { data: courseProgress = [] } = useMyCourseProgress();
  const { data: calendarEvents = [] } = useCalendarEvents();

  const validDocs = useMemo(
    () => documents.filter((c) => c.verification_status === 'approved').length,
    [documents]
  );

  const upcomingSessions = useMemo(() => {
    const now = new Date().toISOString();
    return calendarEvents
      .filter((e) => {
        if (!e.start_at || typeof e.start_at !== 'string') return false;
        return e.start_at >= now || e.start_at.slice(0, 10) >= now.slice(0, 10);
      })
      .slice(0, 2);
  }, [calendarEvents]);

  const nextSession = upcomingSessions[0];
  const daysToNext = nextSession ? daysUntil(nextSession.start_at) : null;

  // Track progress computation
  const overallProgress = useMemo(() => {
    if (courses.length === 0) return 0;
    const progressSum = courses.reduce((acc, c) => {
      const p = courseProgress.find((cp) => (cp.course_id ?? cp.id) === c.id);
      return acc + (p?.progress_pct ?? 0);
    }, 0);
    return Math.round(progressSum / courses.length);
  }, [courses, courseProgress]);

  const completedCount = useMemo(
    () => courseProgress.filter((cp) => cp.status === 'completed').length,
    [courseProgress]
  );

  const jitaId = user?.id ?? '1';
  const displayName = user?.name ?? 'Siswa JITA';

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* ── 1. PAGE HEADER ── */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <Avatar name={displayName} size="lg" role="student" />
            <div className={styles.headerMeta}>
              <p className={styles.headerGreeting}>おはようございます — Selamat Datang,</p>
              <h1 className={styles.headerName}>{displayName}</h1>
              {user?.title && <p className={styles.headerTitle}>{user.title}</p>}
              <div className={styles.headerBadges}>
                <Badge variant="student" size="sm">
                  JITA ID: {jitaId.toString().padStart(4, '0').toUpperCase()}
                </Badge>
                <Badge variant={user?.iceUuid ? 'success' : 'warning'} dot size="sm">
                  Pusat Es: {user?.iceUuid ? 'Tersinkronisasi' : 'Tidak Tersinkronisasi'}
                </Badge>
              </div>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Link to="/profile" style={{ textDecoration: 'none' }}>
              <Button variant="secondary" size="sm" icon={<span>✎</span>} iconPosition="left">
                Edit Profil
              </Button>
            </Link>
            <Link to="/calendar" style={{ textDecoration: 'none' }}>
              <Button variant="ghost" size="sm" icon={<span>📅</span>} iconPosition="left">
                Kalender
              </Button>
            </Link>
            <Link to="/student/courses" style={{ textDecoration: 'none' }}>
              <Button variant="ghost" size="sm" icon={<span>📚</span>} iconPosition="left">
                Modul
              </Button>
            </Link>
          </div>
          <div className={styles.headerKanjiWatermark}>
            <div className={styles.headerKanji}>学習</div>
            <p className={styles.headerKanjiLabel}>Dasbor Pembelajaran</p>
          </div>
        </header>

        {/* ── 1B. QUICK ACTIONS (Pilar 3: CV & Jobs) ── */}
        <section className={styles.quickActionsGrid}>
          <Link to="/cv" className={styles.quickActionCard}>
            <div className={styles.quickActionLeft}>
              <span className={styles.quickActionIcon}>📄</span>
              <div className={styles.quickActionMeta}>
                <h3 className={styles.quickActionTitle}>CV Builder Standar Jepang (履歴書)</h3>
                <p className={styles.quickActionDesc}>
                  Generate dan unduh Curriculum Vitae format resmi Jepang (PDF) otomatis.
                </p>
              </div>
            </div>
            <span className={styles.quickActionArrow}>→</span>
          </Link>

          <Link to="/jobs" className={styles.quickActionCard}>
            <div className={styles.quickActionLeft}>
              <span className={styles.quickActionIcon}>💼</span>
              <div className={styles.quickActionMeta}>
                <h3 className={styles.quickActionTitle}>Bursa Lowongan Kerja Industri</h3>
                <p className={styles.quickActionDesc}>
                  Eksplorasi posisi karir dari mitra industri Jepang & lacak status lamaran Anda.
                </p>
              </div>
            </div>
            <span className={styles.quickActionArrow}>→</span>
          </Link>
        </section>

        {/* ── 2. STATS ROW ── */}
        <section className={styles.statsRow}>
          <StatCard
            label="Progres Keseluruhan"
            value={overallProgress}
            unit="%"
            icon="📊"
            sublabel={`${completedCount} dari ${courses.length || 4} modul`}
            accent="red"
            trend={{ value: `${overallProgress}% tercapai`, positive: overallProgress > 0 }}
          />
          <StatCard
            label="Modul Selesai"
            value={completedCount}
            unit={`/ ${courses.length || 4}`}
            icon="✅"
            sublabel={`${courseProgress.filter((p) => p.status === 'in_progress').length} berlangsung`}
            accent="green"
          />
          <StatCard
            label="Dokumen di Vault"
            value={validDocs}
            unit="dokumen"
            icon="🔐"
            sublabel={`Total ${documents.length} dokumen`}
            accent="blue"
          />
          <StatCard
            label="Hari ke Sesi Berikutnya"
            value={daysToNext !== null ? daysToNext : '—'}
            unit={daysToNext !== null ? 'hari' : ''}
            icon="📅"
            sublabel={nextSession ? nextSession.title : 'Belum ada sesi'}
            accent="gold"
          />
        </section>

        {/* ── 3 & 4 — two-column layout ── */}
        <div className={styles.mainGrid}>
          {/* ── 3. CURRICULUM TRACK ── */}
          <section className={styles.curriculumSection}>
            <Card title="Jalur Kurikulum" subtitle="カリキュラムトラック" padding="lg">
              {courses.length === 0 ? (
                <p className={styles.emptyState}>Belum ada kursus aktif.</p>
              ) : (
                <ol className={styles.stepper}>
                  {courses.map((mod, idx) => {
                    const isLast = idx === courses.length - 1;
                    const cp = courseProgress.find((p) => (p.course_id ?? p.id) === mod.id);
                    const isCompleted = cp?.status === 'completed';
                    const isInProgress = cp?.status === 'in_progress';
                    const isLocked = !cp;
                    const progress = cp?.progress_pct ?? 0;

                    return (
                      <li
                        key={mod.id}
                        className={[
                          styles.stepItem,
                          isCompleted ? styles.stepCompleted : '',
                          isInProgress ? styles.stepInProgress : '',
                          isLocked ? styles.stepLocked : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        {/* connector line */}
                        {!isLast && <div className={styles.stepConnector} />}

                        {/* phase circle */}
                        <div className={styles.stepCircle}>
                          {isCompleted ? (
                            <span className={styles.checkIcon}>✓</span>
                          ) : (
                            <span className={styles.phaseNumber}>{mod.phase || idx + 1}</span>
                          )}
                        </div>

                        {/* content */}
                        <div className={styles.stepContent}>
                          <div className={styles.stepHeader}>
                            <div className={styles.stepTitles}>
                              <span className={styles.stepPhaseLabel}>
                                Fase {mod.phase || idx + 1}
                              </span>
                              <h3 className={styles.stepTitle}>{mod.title}</h3>
                              {mod.title_jp && <p className={styles.stepTitleJp}>{mod.title_jp}</p>}
                            </div>
                            <Badge
                              variant={moduleStatusVariant(
                                isCompleted ? 'completed' : isInProgress ? 'in_progress' : 'default'
                              )}
                              size="sm"
                            >
                              {moduleStatusLabel(
                                isCompleted ? 'completed' : isInProgress ? 'in_progress' : 'default'
                              )}
                            </Badge>
                          </div>

                          <ProgressBar
                            value={progress}
                            variant={isCompleted ? 'success' : 'accent'}
                            size="sm"
                            showValue
                          />

                          <p className={styles.stepSessions}>
                            {mod.modules?.length
                              ? `${mod.modules.length} sub-modul materi`
                              : `${progress}% selesai`}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </Card>
          </section>

          {/* ── right column ── */}
          <div className={styles.rightColumn}>
            {/* ── 4. DOCUMENT VAULT ── */}
            <section>
              <Card
                title="Document Vault"
                subtitle="Kredensial JITA Resmi"
                padding="lg"
                headerAction={
                  <Badge variant="info" size="sm">
                    {documents.length} Dokumen
                  </Badge>
                }
              >
                {documents.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1rem' }}>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                      Belum ada dokumen yang diunggah ke vault.
                    </p>
                    <Link to="/vault">
                      <Button size="sm" variant="secondary">
                        Unggah Dokumen
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <ul className={styles.credentialList}>
                    {documents.slice(0, 4).map((cred) => (
                      <li key={cred.id} className={styles.credentialRow}>
                        <span className={styles.credentialIcon}>{credentialIcon(cred.type)}</span>
                        <div className={styles.credentialMeta}>
                          <p className={styles.credentialTitle}>{cred.title}</p>
                          <p className={styles.credentialDate}>
                            Diterbitkan: {formatDate(cred.issued_date || cred.created_at)}
                          </p>
                        </div>
                        <div className={styles.credentialActions}>
                          <Badge
                            variant={credentialStatusVariant(cred.verification_status)}
                            dot
                            size="sm"
                          >
                            {credentialStatusLabel(cred.verification_status)}
                          </Badge>
                          <a
                            href={documentApi.fileUrl(cred.id)}
                            target="_blank"
                            rel="noreferrer"
                            style={{ textDecoration: 'none' }}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<span>⬇</span>}
                              iconPosition="left"
                            >
                              Unduh
                            </Button>
                          </a>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </section>

            {/* ── 5. UPCOMING SESSIONS ── */}
            <section>
              <Card
                title="Sesi Mendatang"
                subtitle="セッション予定"
                padding="lg"
                headerAction={
                  <Badge variant="accent" size="sm" dot>
                    {upcomingSessions.length} Terjadwal
                  </Badge>
                }
              >
                {upcomingSessions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1rem' }}>
                    <p className={styles.emptyState}>Tidak ada sesi terjadwal saat ini.</p>
                    <Link to="/calendar">
                      <Button size="sm" variant="ghost">
                        Lihat Kalender Lengkap
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <ul className={styles.sessionList}>
                    {upcomingSessions.map((sess) => (
                      <li key={sess.id} className={styles.sessionCard}>
                        <div className={styles.sessionTop}>
                          <div className={styles.sessionBadges}>
                            <Badge variant={sessionTypeBadge(sess.type)} size="sm">
                              {sessionTypeLabel(sess.type)}
                            </Badge>
                          </div>
                          <span className={styles.userId}>
                            JITA ID: {(user?.id ?? '1').toString().padStart(4, '0').toUpperCase()}
                          </span>
                        </div>
                        <h4 className={styles.sessionTitle}>{sess.title}</h4>
                        {sess.title_jp && <p className={styles.sessionTitleJp}>{sess.title_jp}</p>}
                        <div className={styles.sessionDateRow}>
                          <span className={styles.sessionDateIcon}>📅</span>
                          <span>{formatDate(sess.start_at)}</span>
                          <span className={styles.sessionTimeSep}>·</span>
                          <span className={styles.sessionTimeIcon}>🕐</span>
                          <span>
                            {typeof sess.start_at === 'string' && sess.start_at.length >= 16
                              ? sess.start_at.slice(11, 16)
                              : '09:00'}{' '}
                            WIB
                          </span>
                        </div>
                        {sess.description && (
                          <p className={styles.sessionTopic}>{sess.description}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </section>

            {/* ── 6. es CENTER SYNC PANEL ── */}
            <section>
              <Card accent padding="md">
                <div className={styles.icePanel}>
                  <div className={styles.icePanelLeft}>
                    <span className={styles.icePanelIcon}>🧊</span>
                  </div>
                  <div className={styles.icePanelBody}>
                    <div className={styles.icePanelTitleRow}>
                      <h3 className={styles.icePanelTitle}>Pusat Es Sync</h3>
                      <Badge variant={user?.iceUuid ? 'success' : 'warning'} dot size="sm">
                        {user?.iceUuid ? 'Tersinkronisasi' : 'Tidak Tersinkronisasi'}
                      </Badge>
                    </div>
                    <p className={styles.icePanelDesc}>
                      {user?.iceUuid
                        ? `Akun Anda terhubung dengan ID Pusat Es: ${user.iceUuid}. Profil dan kredensial disinkronkan secara aman.`
                        : 'Hubungkan akun JITA Anda dengan Pusat Es Kampus untuk sinkronisasi otomatis data kurikulum, kredensial, dan rekam jejak pelatihan.'}
                    </p>
                    {!user?.iceUuid && (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<span>🔗</span>}
                        iconPosition="left"
                        onClick={() => {
                          window.location.href =
                            'https://pusates.kampusmus.id/id/login-user/?redirect_to=https%3A%2F%2Fpusates.kampusmus.id%2Fwp-admin%2Fadmin-post.php%3Faction%3Dice_sso_jita';
                        }}
                      >
                        Hubungkan Pusat Es
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </section>
          </div>
          {/* end rightColumn */}
        </div>
        {/* end mainGrid */}
      </div>
      {/* end container */}
    </div>
  );
}
