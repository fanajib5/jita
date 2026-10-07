import { useState, useMemo, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useJobs, useScoutCandidates } from '../../api/hooks';
import { jobApi, type ScoutCandidate, type Job } from '../../api/jobs';
import { cvApi } from '../../api/cv';
import { FileText, UserCheck } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/Modal';
import styles from './ScoutPage.module.css';

const JLPT = ['', 'N5', 'N4', 'N3', 'N2', 'N1'];

function jlptVariant(level?: string): 'accent' | 'info' | 'sakura' {
  if (level === 'N3' || level === 'N2' || level === 'N1') return 'accent';
  if (level === 'N4') return 'info';
  return 'sakura';
}

interface ScoutModalProps {
  candidate: ScoutCandidate | null;
  jobs: Job[];
  onClose: () => void;
  onSuccess: (candidateName: string) => void;
}

function ScoutModal({ candidate, jobs, onClose, onSuccess }: ScoutModalProps) {
  const [jobId, setJobId] = useState<number>(jobs[0]?.id || 0);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!candidate) return;
    if (!jobId) {
      setModalError('Pilih lowongan kerja aktif terlebih dahulu.');
      return;
    }
    setLoading(true);
    setModalError(null);
    try {
      await jobApi.scout(jobId, candidate.id, message || undefined);
      onSuccess(candidate.name);
      onClose();
    } catch (err: any) {
      setModalError(
        err?.response?.data?.error?.message || err?.response?.data?.error || 'Gagal mengirim scout.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      isOpen={!!candidate}
      onClose={onClose}
      title="Request Interview / Scout"
      titleJp="面接リクエスト"
      size="md"
      footer={
        <div className={styles.modalFooter}>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Mengirim...' : 'Kirim Undangan'}
          </Button>
        </div>
      }
    >
      {candidate && (
        <div className={styles.modalBody}>
          {modalError && (
            <div className={`${styles.alertBanner} ${styles.alertError}`}>
              <span>⚠️</span>
              <span>{modalError}</span>
            </div>
          )}

          <div className={styles.modalCandidate}>
            <Avatar name={candidate.name} size="md" role="student" />
            <div>
              <p className={styles.modalCandidateName}>{candidate.name}</p>
              {candidate.nameJp && <p className={styles.modalCandidateSub}>{candidate.nameJp}</p>}
              <p className={styles.modalCandidateSub}>
                {candidate.originCity || 'Indonesia'} · JLPT {candidate.jlptLevel || 'N4'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className={styles.modalForm}>
            <div className={styles.formRow}>
              <label className={styles.formLabel}>Pilih Posisi Lowongan</label>
              {jobs.length === 0 ? (
                <p style={{ color: 'var(--color-danger)', fontSize: '0.85rem' }}>
                  Belum ada lowongan aktif. Silakan buat lowongan di menu Kelola Lowongan terlebih
                  dahulu.
                </p>
              ) : (
                <select
                  className={styles.formInput}
                  value={jobId}
                  onChange={(e) => setJobId(Number(e.target.value))}
                  required
                >
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title} {j.company_name ? `(${j.company_name})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className={styles.formRow}>
              <label className={styles.formLabel}>Pesan Penawaran Karir</label>
              <textarea
                className={styles.formTextarea}
                rows={4}
                placeholder="Tulis alasan ketertarikan Anda atau penawaran kerja khusus..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
          </form>
        </div>
      )}
    </Modal>
  );
}

export default function ScoutPage() {
  const [filter, setFilter] = useState({ specialization: '', minJlpt: '', jobId: '' });
  const [appliedFilter, setAppliedFilter] = useState({
    specialization: '',
    minJlpt: '',
    jobId: '',
  });
  const [selectedCandidate, setSelectedCandidate] = useState<ScoutCandidate | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: jobsResponse, isLoading: loadingJobs } = useJobs();
  const rawJobs = jobsResponse?.jobs || [];
  const activeJobs = useMemo(() => rawJobs.filter((j) => j.is_active === 1), [rawJobs]);

  // TanStack Query Hooks
  const {
    data: candidates = [],
    isLoading: loadingCandidates,
    error: candidatesError,
  } = useScoutCandidates({
    specialization: appliedFilter.specialization || undefined,
    minJlpt: appliedFilter.minJlpt || undefined,
    jobId: appliedFilter.jobId ? Number(appliedFilter.jobId) : undefined,
  });

  function handleFilterSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setAppliedFilter(filter);
  }

  function handleFilterReset() {
    const empty = { specialization: '', minJlpt: '', jobId: '' };
    setFilter(empty);
    setAppliedFilter(empty);
  }

  function handleOpenScout(cand: ScoutCandidate) {
    if (activeJobs.length === 0) {
      alert(
        'Perusahaan Anda belum memiliki lowongan aktif. Silakan buat lowongan terlebih dahulu di halaman Kelola Lowongan.'
      );
      return;
    }
    setSelectedCandidate(cand);
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* ── Page Header ── */}
        <header className={styles.pageHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.headerTitleRow}>
              <h1 className={styles.pageTitle}>Scout Kandidat</h1>
              <span className={styles.kanjiBadge}>スカウト</span>
              <Badge variant="corporate" size="sm">
                Corporate
              </Badge>
            </div>
            <p className={styles.pageSubtitle}>
              Saring dan undang langsung talenta terverifikasi (profil valid, KTP, dan kelulusan
              resmi admin JITA).
            </p>
          </div>
          <div className={styles.headerActions}>
            <Link to="/corporate" className={styles.headerLink}>
              <Button variant="ghost" size="sm">
                ← Dashboard Corporate
              </Button>
            </Link>
            <Link to="/corporate/jobs" className={styles.headerLink}>
              <Button variant="ghost" size="sm">
                Kelola Lowongan
              </Button>
            </Link>
          </div>
        </header>

        {/* ── Feedback Banner ── */}
        {success && (
          <div className={`${styles.alertBanner} ${styles.alertSuccess}`}>
            <span>✅</span>
            <span>{success}</span>
            <Button
              variant="ghost"
              size="sm"
              style={{ marginLeft: 'auto', padding: '2px 8px', height: 'auto' }}
              onClick={() => setSuccess(null)}
            >
              ✕
            </Button>
          </div>
        )}

        {candidatesError && (
          <div className={`${styles.alertBanner} ${styles.alertError}`}>
            <span>⚠️</span>
            <span>
              {(candidatesError as any)?.response?.data?.error ||
                'Gagal memuat daftar kandidat scout.'}
            </span>
          </div>
        )}

        {/* ── Filter Toolbar ── */}
        <form onSubmit={handleFilterSubmit} className={styles.toolbar}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Bidang Spesialisasi</label>
            <input
              className={styles.input}
              placeholder="Contoh: Manufaktur, QC, Otomotif..."
              value={filter.specialization}
              onChange={(e) => setFilter((f) => ({ ...f, specialization: e.target.value }))}
            />
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Level JLPT</label>
            <select
              className={styles.select}
              value={filter.minJlpt}
              onChange={(e) => setFilter((f) => ({ ...f, minJlpt: e.target.value }))}
            >
              {JLPT.map((l) => (
                <option key={l} value={l}>
                  {l ? `JLPT ${l} atau lebih tinggi` : 'Semua Level JLPT'}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>🎯 Cocokkan dengan Lowongan</label>
            <select
              className={styles.select}
              value={filter.jobId}
              onChange={(e) => setFilter((f) => ({ ...f, jobId: e.target.value }))}
            >
              <option value="">-- Tanpa Lowongan Spesifik --</option>
              {activeJobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} {j.min_jlpt ? `(≥ ${j.min_jlpt})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button type="submit" variant="primary">
              Terapkan Filter
            </Button>
            {(filter.specialization || filter.minJlpt || filter.jobId) && (
              <Button type="button" variant="ghost" onClick={handleFilterReset}>
                Reset
              </Button>
            )}
          </div>
        </form>

        {/* ── Candidate Grid ── */}
        {loadingCandidates ? (
          <div className={styles.emptyState}>
            <p>Memuat daftar kandidat terverifikasi...</p>
          </div>
        ) : candidates.length === 0 ? (
          <Card padding="lg">
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>🔍</span>
              <p>Tidak ada kandidat terverifikasi yang cocok dengan kriteria pencarian Anda.</p>
              <Button variant="ghost" size="sm" onClick={handleFilterReset}>
                Reset Filter
              </Button>
            </div>
          </Card>
        ) : (
          <div className={styles.grid}>
            {candidates.map((c) => (
              <Card key={c.id} className={styles.candidateCard} padding="md">
                <div className={styles.cardTop}>
                  <Avatar name={c.name} size="md" role="student" />
                  <div className={styles.candidateMeta}>
                    <div className={styles.nameRow}>
                      <span className={styles.candidateName}>{c.name}</span>
                      {c.nameJp && <span className={styles.candidateNameJp}>{c.nameJp}</span>}
                    </div>
                    <span className={styles.candidateOrigin}>📍 {c.originCity || 'Indonesia'}</span>
                  </div>
                </div>

                <div className={styles.candidateBio}>
                  <div
                    style={{
                      display: 'flex',
                      gap: '0.4rem',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                    }}
                  >
                    <Badge variant={jlptVariant(c.jlptLevel)} size="sm">
                      JLPT {c.jlptLevel || 'N4'}
                    </Badge>
                    {c.matchScore != null && (
                      <Badge
                        variant={
                          c.matchScore >= 80 ? 'sakura' : c.matchScore >= 60 ? 'accent' : 'default'
                        }
                        size="sm"
                      >
                        ⚡ Match {c.matchScore}%
                      </Badge>
                    )}
                  </div>
                  {c.bioId && (
                    <p className={styles.bioText}>
                      {c.bioId.slice(0, 110)}
                      {c.bioId.length > 110 ? '…' : ''}
                    </p>
                  )}
                </div>

                {c.specialization.length > 0 && (
                  <div className={styles.specRow}>
                    {c.specialization.slice(0, 3).map((s, i) => (
                      <span key={i} className={styles.specTag}>
                        {s}
                      </span>
                    ))}
                    {c.specialization.length > 3 && (
                      <span className={styles.specTag}>+{c.specialization.length - 3}</span>
                    )}
                  </div>
                )}

                <div className={styles.cardFooter}>
                  <Button size="sm" variant="ghost" onClick={() => cvApi.triggerDownload(c.id)}>
                    <FileText size={14} style={{ marginRight: '4px' }} />
                    Unduh CV
                  </Button>
                  <Button size="sm" variant="primary" onClick={() => handleOpenScout(c)}>
                    <UserCheck size={14} style={{ marginRight: '4px' }} />
                    Request Scout
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* ── Active Jobs Tip ── */}
        {!loadingJobs && activeJobs.length === 0 && (
          <Card padding="md">
            <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '0.9rem' }}>
              💡 <strong>Tips:</strong> Perusahaan Anda belum memiliki lowongan aktif.{' '}
              <Link
                to="/corporate/jobs"
                style={{ color: 'var(--color-role-corporate)', fontWeight: 600 }}
              >
                Posting lowongan kerja terlebih dahulu di sini
              </Link>{' '}
              sebelum mengirimkan undangan scout kepada para kandidat.
            </p>
          </Card>
        )}

        {/* ── Scout Modal Dialog ── */}
        <ScoutModal
          candidate={selectedCandidate}
          jobs={activeJobs}
          onClose={() => setSelectedCandidate(null)}
          onSuccess={(candidateName) =>
            setSuccess(`Undangan scout berhasil dikirimkan ke ${candidateName}!`)
          }
        />
      </div>
    </div>
  );
}
