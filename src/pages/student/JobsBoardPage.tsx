import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useJobs, useMyApplications, useApplyJob } from '../../api/hooks';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { CheckCircle2, Star, CheckCircle, XCircle, Send, GraduationCap, Users } from 'lucide-react';
import styles from './JobsBoardPage.module.css';

const JLPT = ['', 'N5', 'N4', 'N3', 'N2', 'N1'];

export default function JobsBoardPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState({
    specialization: '',
    minJlpt: '',
    location: '',
  });

  const [page, setPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState(filter);
  const [alertMsg, setAlertMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  // TanStack Query Hooks with pagination support
  const {
    data: jobsResponse,
    isLoading: loadingJobs,
    error: jobsError,
  } = useJobs({
    specialization: activeFilter.specialization || undefined,
    minJlpt: activeFilter.minJlpt || undefined,
    location: activeFilter.location || undefined,
    page,
    limit: 6,
  });

  const jobs = jobsResponse?.jobs || [];
  const pagination = jobsResponse?.pagination;

  const { data: myApps = [] } = useMyApplications();
  const applyMutation = useApplyJob();

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPage(1);
    setActiveFilter(filter);
  };

  const handleReset = () => {
    const empty = { specialization: '', minJlpt: '', location: '' };
    setFilter(empty);
    setPage(1);
    setActiveFilter(empty);
  };

  const onApply = (id: number, jobTitle: string) => {
    if (!confirm(`Kirimkan berkas CV & lamaran Anda untuk lowongan "${jobTitle}"?`)) return;
    setAlertMsg(null);
    applyMutation.mutate(
      { jobId: id },
      {
        onSuccess: () => {
          setAlertMsg({
            kind: 'ok',
            text: `Lamaran untuk "${jobTitle}" berhasil dikirim ke perusahaan!`,
          });
        },
        onError: (e: any) => {
          setAlertMsg({
            kind: 'err',
            text:
              e?.response?.data?.error?.message ||
              e?.response?.data?.error ||
              'Gagal mengirim lamaran.',
          });
        },
      }
    );
  };

  const errorMessage = jobsError
    ? (jobsError as any)?.response?.data?.error?.message || 'Gagal memuat daftar lowongan.'
    : null;

  const isFiltering = Boolean(
    activeFilter.specialization || activeFilter.minJlpt || activeFilter.location
  );

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerTitleRow}>
              <h1 className={styles.title}>Bursa Lowongan Kerja</h1>
              <span className={styles.kanjiBadge}>募集情報</span>
            </div>
            <p className={styles.subtitle}>
              Peluang karir dan penempatan kerja di Jepang dari jaringan mitra perusahaan resmi
              JITA.
            </p>
          </div>
        </header>

        {alertMsg && (
          <div className={alertMsg.kind === 'ok' ? styles.alertSuccess : styles.alertError}>
            {alertMsg.text}
          </div>
        )}

        {/* Filter & Toolbar */}
        <form className={styles.toolbar} onSubmit={handleSearch}>
          <div className={styles.searchGroup}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              placeholder="Posisi / spesialisasi (cth. CNC, Manufaktur, IT)..."
              value={filter.specialization}
              onChange={(e) => setFilter((f) => ({ ...f, specialization: e.target.value }))}
            />
          </div>

          <div className={styles.searchGroup}>
            <span className={styles.searchIcon}>🎌</span>
            <select
              value={filter.minJlpt}
              onChange={(e) => setFilter((f) => ({ ...f, minJlpt: e.target.value }))}
            >
              <option value="">Semua Level JLPT</option>
              {JLPT.filter(Boolean).map((l) => (
                <option key={l} value={l}>
                  Minimal JLPT {l}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.searchGroup}>
            <span className={styles.searchIcon}>📍</span>
            <input
              placeholder="Prefektur / Kota (cth. Tokyo)..."
              value={filter.location}
              onChange={(e) => setFilter((f) => ({ ...f, location: e.target.value }))}
            />
          </div>

          <div className={styles.toolbarButtons}>
            <Button variant="primary" size="md" type="submit">
              Cari Lowongan
            </Button>
            {isFiltering && (
              <Button variant="ghost" size="md" type="button" onClick={handleReset}>
                Reset
              </Button>
            )}
          </div>
        </form>

        {/* List Lowongan */}
        <div className={styles.listSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Daftar Lowongan Tersedia</h2>
            <Badge variant="info" size="sm">
              {jobs.length} Lowongan
            </Badge>
          </div>

          {loadingJobs ? (
            <div className={styles.loadingBox}>Memuat daftar lowongan...</div>
          ) : errorMessage ? (
            <div className={styles.errorBox}>{errorMessage}</div>
          ) : jobs.length === 0 ? (
            <div className={styles.emptyBox}>
              <span className={styles.emptyIcon}>📂</span>
              <h3>Tidak ada lowongan yang sesuai</h3>
              <p>Coba sesuaikan kata kunci pencarian atau bersihkan filter di atas.</p>
              {isFiltering && (
                <Button variant="secondary" size="sm" onClick={handleReset}>
                  Tampilkan Semua Lowongan
                </Button>
              )}
            </div>
          ) : (
            <div className={styles.gridList}>
              {jobs.map((j) => {
                const application = (myApps || []).find(
                  (x: any) => x.job_id === j.id && x.type === 'apply'
                );
                const isApplied = !!application;
                return (
                  <div key={j.id} className={styles.jobCard}>
                    <div className={styles.cardMain}>
                      <div className={styles.cardHeader}>
                        <div>
                          <h3 className={styles.jobTitle}>
                            {j.title}
                            {j.title_jp && <span className={styles.titleJp}> / {j.title_jp}</span>}
                          </h3>
                          <div className={styles.companyRow}>
                            <span className={styles.companyName}>{j.company_name}</span>
                            {j.company_name_jp && (
                              <span className={styles.companyJp}>({j.company_name_jp})</span>
                            )}
                          </div>
                        </div>

                        {isApplied && (
                          <Badge variant="success" size="md">
                            ✓ Lamaran Terkirim
                          </Badge>
                        )}
                      </div>

                      <div className={styles.metaRow}>
                        <span className={styles.metaItem}>📍 {j.location || 'Seluruh Jepang'}</span>
                        <span className={styles.metaDot}>·</span>
                        <span className={styles.metaItem}>
                          💼 {j.employment_type || 'Full-time'}
                        </span>
                        {j.salary_range && (
                          <>
                            <span className={styles.metaDot}>·</span>
                            <span className={styles.salaryText}>💴 {j.salary_range}</span>
                          </>
                        )}
                      </div>

                      <div className={styles.badgesRow}>
                        {j.target_audience === 'graduated' && (
                          <Badge variant="warning" size="sm">
                            <GraduationCap size={12} style={{ marginRight: '4px' }} />
                            Khusus Lulusan / Graduated
                          </Badge>
                        )}
                        {j.target_audience === 'student' && (
                          <Badge variant="info" size="sm">
                            <Users size={12} style={{ marginRight: '4px' }} />
                            Khusus Siswa / Magang
                          </Badge>
                        )}
                        {j.matchScore != null && (
                          <Badge
                            variant={
                              j.matchScore >= 80
                                ? 'success'
                                : j.matchScore >= 60
                                  ? 'accent'
                                  : 'default'
                            }
                            size="sm"
                          >
                            ⚡ Match {j.matchScore}%
                          </Badge>
                        )}
                        {j.min_jlpt && (
                          <Badge variant="sakura" size="sm">
                            JLPT ≥ {j.min_jlpt}
                          </Badge>
                        )}
                        {j.specialization &&
                          j.specialization.split(',').map((s, i) => (
                            <span key={i} className={styles.specChip}>
                              {s.trim()}
                            </span>
                          ))}
                      </div>
                    </div>

                    <div className={styles.cardAction}>
                      {isApplied ? (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-end',
                            gap: '4px',
                          }}
                        >
                          <Badge
                            variant={
                              application?.status === 'accepted'
                                ? 'success'
                                : application?.status === 'shortlisted'
                                  ? 'warning'
                                  : application?.status === 'rejected'
                                    ? 'danger'
                                    : 'default'
                            }
                            size="sm"
                          >
                            <span
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              {application?.status === 'accepted' ? (
                                <>
                                  <CheckCircle size={13} /> Diterima
                                </>
                              ) : application?.status === 'shortlisted' ? (
                                <>
                                  <Star size={13} /> Shortlisted
                                </>
                              ) : application?.status === 'rejected' ? (
                                <>
                                  <XCircle size={13} /> Tidak Lolos
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 size={13} /> Lamaran Terkirim
                                </>
                              )}
                            </span>
                          </Badge>
                          <span
                            style={{ fontSize: '0.725rem', color: 'var(--color-text-tertiary)' }}
                          >
                            Sudah Dilamar
                          </span>
                        </div>
                      ) : user?.role === 'student' && j.target_audience === 'graduated' ? (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-end',
                            gap: '4px',
                          }}
                        >
                          <Button variant="ghost" size="md" disabled style={{ opacity: 0.65, cursor: 'not-allowed' }}>
                            Khusus Lulusan
                          </Button>
                          <span style={{ fontSize: '0.72rem', color: 'var(--color-warning)' }}>
                            Siswa aktif belum dapat mendaftar
                          </span>
                        </div>
                      ) : user?.role === 'alumni' && j.target_audience === 'student' ? (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-end',
                            gap: '4px',
                          }}
                        >
                          <Button variant="ghost" size="md" disabled style={{ opacity: 0.65, cursor: 'not-allowed' }}>
                            Khusus Siswa
                          </Button>
                          <span style={{ fontSize: '0.72rem', color: 'var(--color-text-tertiary)' }}>
                            Khusus program magang siswa aktif
                          </span>
                        </div>
                      ) : (
                        <Button
                          variant="primary"
                          size="md"
                          disabled={applyMutation.isPending}
                          onClick={() => onApply(j.id, j.title)}
                        >
                          <Send size={14} style={{ marginRight: '6px' }} />
                          {applyMutation.isPending ? 'Mengirim...' : 'Lamar Sekarang'}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className={styles.pagination}>
              <div className={styles.paginationInfo}>
                Menampilkan <strong>{jobs.length}</strong> dari <strong>{pagination.total}</strong>{' '}
                lowongan
              </div>
              <div className={styles.paginationControls}>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1 || loadingJobs}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  ← Sebelumnya
                </Button>

                <div className={styles.pageNumbers}>
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((num) => (
                    <button
                      key={num}
                      className={[styles.pageBtn, num === page ? styles.pageBtnActive : ''].join(
                        ' '
                      )}
                      disabled={loadingJobs}
                      onClick={() => setPage(num)}
                    >
                      {num}
                    </button>
                  ))}
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= pagination.totalPages || loadingJobs}
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                >
                  Berikutnya →
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
