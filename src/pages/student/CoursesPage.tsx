import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useCourses,
  useMyCourseProgress,
  useEnrollCourse,
  useUpdateCourseProgress,
} from '../../api/hooks';
import type { CourseModule } from '../../api/courses';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { Modal } from '../../components/ui/Modal';
import { RichEditor } from '../../components/ui/RichEditor';
import styles from './CoursesPage.module.css';

const PHASE_ICONS: Record<number, string> = {
  1: '🎌',
  2: '🏢',
  3: '🤝',
  4: '🎓',
};

function statusLabel(status?: string, isLocked?: boolean): string {
  if (isLocked) return 'Terkunci (Selesaikan Fase Sebelumnya)';
  switch (status) {
    case 'completed':
      return 'Selesai';
    case 'in_progress':
      return 'Sedang Berjalan';
    case 'enrolled':
      return 'Terdaftar';
    default:
      return 'Tersedia';
  }
}

function statusVariant(
  status?: string,
  isLocked?: boolean
): 'success' | 'accent' | 'info' | 'default' {
  if (isLocked) return 'default';
  switch (status) {
    case 'completed':
      return 'success';
    case 'in_progress':
      return 'accent';
    case 'enrolled':
      return 'info';
    default:
      return 'default';
  }
}

export default function CoursesPage() {
  const { data: courses = [], isLoading: loadingCourses, error: courseError } = useCourses();
  const { data: progress = [], isLoading: loadingProgress } = useMyCourseProgress();
  const enrollMutation = useEnrollCourse();
  const updateProgressMutation = useUpdateCourseProgress();

  const [selectedModuleForModal, setSelectedModuleForModal] = useState<CourseModule | null>(null);

  // Local checklist cache per module id: Record<courseId, Set<moduleId>>
  const [checkedModules, setCheckedModules] = useState<Record<number, number[]>>(() => {
    try {
      const saved = localStorage.getItem('jita_course_modules');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const loading = loadingCourses || loadingProgress;

  // Compute metrics
  const completedCount = useMemo(
    () => progress.filter((p) => p.status === 'completed').length,
    [progress]
  );

  const inProgressCount = useMemo(
    () => progress.filter((p) => p.status === 'in_progress' || p.status === 'enrolled').length,
    [progress]
  );

  const avgProgress = useMemo(() => {
    if (courses.length === 0) return 0;
    const total = courses.reduce((acc, c) => {
      const p = progress.find((cp) => (cp.course_id ?? cp.id) === c.id);
      return acc + (p?.progress_pct ?? 0);
    }, 0);
    return Math.round(total / courses.length);
  }, [courses, progress]);

  // Sequential sorting: sorted by phase
  const sortedCourses = useMemo(() => [...courses].sort((a, b) => a.phase - b.phase), [courses]);

  function getCoursePct(courseId: number) {
    return progress.find((p) => (p.course_id ?? p.id) === courseId)?.progress_pct ?? 0;
  }

  function getCourseStatus(courseId: number) {
    return progress.find((p) => (p.course_id ?? p.id) === courseId)?.status;
  }

  // Check if course is locked based on sequential phases
  function isCourseLocked(phase: number): boolean {
    if (phase <= 1) return false;
    // previous phase must be completed
    const prevCourse = sortedCourses.find((c) => c.phase === phase - 1);
    if (!prevCourse) return false;
    const prevProgress = progress.find((p) => (p.course_id ?? p.id) === prevCourse.id);
    return prevProgress?.status !== 'completed';
  }

  const handleEnroll = (courseId: number) => {
    enrollMutation.mutate(courseId);
  };

  // Toggle module completion and auto-calculate course progress percentage
  const handleToggleModule = (courseId: number, moduleId: number, totalModules: number) => {
    const currentList = checkedModules[courseId] || [];
    const isChecked = currentList.includes(moduleId);
    const updatedList = isChecked
      ? currentList.filter((id) => id !== moduleId)
      : [...currentList, moduleId];

    const nextState = { ...checkedModules, [courseId]: updatedList };
    setCheckedModules(nextState);
    try {
      localStorage.setItem('jita_course_modules', JSON.stringify(nextState));
    } catch {
      // ignore
    }

    // Auto compute pct
    const pct = Math.round((updatedList.length / totalModules) * 100);
    updateProgressMutation.mutate({ courseId, progressPct: pct });
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.loadingBox}>Memuat kurikulum pelatihan...</div>
        </div>
      </div>
    );
  }

  if (courseError) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.errorBox}>Gagal memuat data kurikulum pelatihan.</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* ── 1. Page Header ── */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerTitleRow}>
              <h1 className={styles.title}>Kurikulum & Modul Kursus</h1>
              <span className={styles.kanjiBadge}>カリキュラム</span>
            </div>
            <p className={styles.subtitle}>
              Struktur pelatihan vokasi terstandarisasi industri Jepang. Selesaikan setiap materi
              secara bertahap untuk membuka fase berikutnya dan klaim sertifikat resmi di Document
              Vault.
            </p>
          </div>
        </header>

        {/* ── 2. Stat Summary Cards ── */}
        <section className={styles.statsRow}>
          <StatCard
            label="Progres Rata-rata"
            value={avgProgress}
            unit="%"
            icon="📊"
            sublabel={`${completedCount} dari ${courses.length} modul selesai`}
            accent="red"
            trend={{ value: `${avgProgress}% tercapai`, positive: avgProgress > 0 }}
          />
          <StatCard
            label="Modul Selesai"
            value={completedCount}
            unit={`/ ${courses.length}`}
            icon="✅"
            sublabel="Tahapan kelulusan tervalidasi"
            accent="green"
          />
          <StatCard
            label="Dalam Proses Belajar"
            value={inProgressCount}
            unit="kursus"
            icon="📖"
            sublabel="Sedang aktif diikuti"
            accent="blue"
          />
        </section>

        {/* ── 3. Courses Grid ── */}
        <div className={styles.grid}>
          {sortedCourses.map((c) => {
            const pct = getCoursePct(c.id);
            const status = getCourseStatus(c.id);
            const isCompleted = status === 'completed';
            const isLocked = isCourseLocked(c.phase);
            const icon = PHASE_ICONS[c.phase] || '📚';
            // Use modules from API; empty array if not yet loaded
            const modules = c.modules || [];
            const completedModuleIds = checkedModules[c.id] || [];

            return (
              <div key={c.id} className={isLocked ? styles.lockedCard : undefined}>
                <Card
                  title={`${icon} Fase ${c.phase} — ${c.title}`}
                  subtitle={c.title_jp}
                  padding="lg"
                  headerAction={
                    <Badge variant={statusVariant(status, isLocked)} size="sm">
                      {isLocked ? '🔒 Terkunci' : statusLabel(status)}
                    </Badge>
                  }
                >
                  <div className={styles.cardInner}>
                    {c.description && <p className={styles.courseDesc}>{c.description}</p>}

                    {/* Locked notification */}
                    {isLocked && (
                      <div className={styles.lockedBanner}>
                        <span>🔒</span>
                        <span>
                          Modul ini terkunci. Tuntaskan 100% <strong>Fase {c.phase - 1}</strong>{' '}
                          untuk membuka materi fase ini.
                        </span>
                      </div>
                    )}

                    {/* Progress Bar */}
                    <div className={styles.progressSection}>
                      <div className={styles.progressMeta}>
                        <span>Progres Belajar</span>
                        <strong>{isLocked ? '0%' : `${pct}%`}</strong>
                      </div>
                      <ProgressBar
                        value={isLocked ? 0 : pct}
                        variant={isCompleted ? 'success' : 'accent'}
                        size="sm"
                      />
                    </div>

                    {/* Interactive Sub-modules list */}
                    {modules.length > 0 && (
                      <div className={styles.modulesContainer}>
                        <div className={styles.modulesHeader}>
                          <span>Silabus Materi ({modules.length} Sesi):</span>
                          <span>
                            {completedModuleIds.length}/{modules.length} Selesai
                          </span>
                        </div>

                        <ul className={styles.moduleList}>
                          {modules.map((m) => {
                            const isModuleDone = isCompleted || completedModuleIds.includes(m.id);

                            return (
                              <li key={m.id} className={styles.moduleItem}>
                                <input
                                  type="checkbox"
                                  id={`module-${c.id}-${m.id}`}
                                  className={styles.moduleCheckbox}
                                  checked={isModuleDone}
                                  disabled={isLocked || !status || isCompleted}
                                  onChange={() => handleToggleModule(c.id, m.id, modules.length)}
                                />
                                <label
                                  htmlFor={`module-${c.id}-${m.id}`}
                                  className={styles.moduleBody}
                                  style={{ cursor: isLocked || !status ? 'default' : 'pointer' }}
                                >
                                  <div className={styles.moduleTitleRow}>
                                    <span
                                      className={[
                                        styles.moduleTitle,
                                        isModuleDone ? styles.moduleTitleCompleted : '',
                                      ]
                                        .filter(Boolean)
                                        .join(' ')}
                                    >
                                      {m.title}
                                    </span>
                                    <span className={styles.moduleTitleJp}>{m.title_jp}</span>
                                  </div>
                                  <div
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                  >
                                    <span className={styles.moduleDuration}>
                                      {m.duration_minutes} min
                                    </span>
                                    {m.content && (
                                      <button
                                        type="button"
                                        style={{
                                          background: 'none',
                                          border: '1px solid var(--color-border)',
                                          borderRadius: '4px',
                                          padding: '2px 6px',
                                          fontSize: '0.7rem',
                                          cursor: 'pointer',
                                          color: 'var(--color-accent)',
                                        }}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setSelectedModuleForModal(m);
                                        }}
                                        title="Buka konten materi"
                                      >
                                        📖 Baca
                                      </button>
                                    )}
                                  </div>
                                </label>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}

                    {/* Empty state when no modules yet */}
                    {modules.length === 0 && !isLocked && (
                      <div className={styles.modulesContainer}>
                        <p
                          style={{
                            fontSize: '0.85rem',
                            color: 'var(--color-text-tertiary)',
                            margin: 0,
                          }}
                        >
                          Materi belum tersedia. Hubungi educator untuk informasi lebih lanjut.
                        </p>
                      </div>
                    )}

                    {/* Completion Reward & Vault Link */}
                    {isCompleted && (
                      <div className={styles.vaultCompletionBox}>
                        <div className={styles.vaultCompletionTop}>
                          <div className={styles.vaultBadgeIcon} aria-hidden="true">
                            🎖️
                          </div>
                          <div className={styles.vaultCompletionDetails}>
                            <div className={styles.vaultCompletionTitleRow}>
                              <span className={styles.vaultCompletionTitle}>
                                Fase {c.phase} Dituntaskan
                              </span>
                              <span className={styles.vaultCompletionJp}>履修完了</span>
                            </div>
                            <p className={styles.vaultCompletionText}>
                              Seluruh materi telah selesai. Dokumen & sertifikat kompetensi Anda
                              tersimpan di Vault.
                            </p>
                          </div>
                        </div>
                        <div className={styles.vaultCompletionAction}>
                          <Link to="/vault" style={{ textDecoration: 'none' }}>
                            <Button
                              size="sm"
                              variant="secondary"
                              icon={<span>🔐</span>}
                              iconPosition="left"
                            >
                              Buka Vault
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )}

                    {/* Actions Footer */}
                    <div className={styles.actions}>
                      <div>
                        {isLocked ? (
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>
                            Fase sebelumnya belum selesai
                          </span>
                        ) : !status ? (
                          <Button
                            size="sm"
                            variant="primary"
                            disabled={enrollMutation.isPending}
                            onClick={() => handleEnroll(c.id)}
                          >
                            {enrollMutation.isPending ? 'Mendaftar...' : 'Mulai Belajar Fase Ini'}
                          </Button>
                        ) : isCompleted ? (
                          <span
                            style={{
                              fontSize: '0.8rem',
                              color: 'var(--color-success)',
                              fontWeight: 600,
                            }}
                          >
                            ✓ Modul Telah Dituntaskan
                          </span>
                        ) : (
                          <span
                            style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}
                          >
                            Centang materi di atas untuk menambah progres
                          </span>
                        )}
                      </div>

                      {status && !isCompleted && !isLocked && (
                        <Link to="/calendar" style={{ textDecoration: 'none' }}>
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={<span>📅</span>}
                            iconPosition="left"
                          >
                            Jadwal Sesi
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>

        {/* Modal Materi Modul */}
        <Modal
          isOpen={!!selectedModuleForModal}
          onClose={() => setSelectedModuleForModal(null)}
          title={selectedModuleForModal?.title || 'Materi Modul'}
          titleJp={selectedModuleForModal?.title_jp}
          size="lg"
          footer={
            <Button variant="secondary" onClick={() => setSelectedModuleForModal(null)}>
              Tutup
            </Button>
          }
        >
          <div style={{ padding: '0.5rem 0' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1rem',
                fontSize: '0.85rem',
                color: 'var(--color-text-secondary)',
              }}
            >
              <span>⏱ Durasi: {selectedModuleForModal?.duration_minutes} menit</span>
            </div>
            <RichEditor
              value={
                selectedModuleForModal?.content ||
                '<p><em>Belum ada catatan materi rinci untuk modul ini. Silakan ikuti instruksi sesi langsung.</em></p>'
              }
              readOnly
              minHeight="auto"
            />
          </div>
        </Modal>
      </div>
    </div>
  );
}
