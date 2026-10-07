import { useState, type FormEvent, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useScoutCandidates, useJobs } from '../../api/hooks';
import { jobApi, type ScoutCandidate } from '../../api/jobs';
import { cvApi } from '../../api/cv';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import styles from './CorporateDashboard.module.css';

// ─── Helpers ────────────────────────────────────────────────────────────────

function jlptVariant(level?: string): 'accent' | 'info' | 'sakura' {
  if (level === 'N3' || level === 'N2' || level === 'N1') return 'accent';
  if (level === 'N4') return 'info';
  return 'sakura';
}

// ─── Interview Modal ─────────────────────────────────────────────────────────

interface InterviewForm {
  jobId: number;
  message: string;
}

interface InterviewModalProps {
  candidate: ScoutCandidate | null;
  jobs: any[];
  onClose: () => void;
}

function InterviewModal({ candidate, jobs, onClose }: InterviewModalProps) {
  const [form, setForm] = useState<InterviewForm>({
    jobId: jobs[0]?.id || 0,
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!candidate) return;
    if (!form.jobId) {
      setModalError('Pilih lowongan kerja terlebih dahulu');
      return;
    }
    setLoading(true);
    setModalError(null);
    try {
      await jobApi.scout(form.jobId, candidate.id, form.message || undefined);
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
              <label className={styles.formLabel}>Pilih Lowongan Perusahaan Anda</label>
              {jobs.length === 0 ? (
                <p style={{ color: 'var(--color-danger)', fontSize: '0.85rem' }}>
                  Belum ada lowongan aktif. Buat lowongan terlebih dahulu di Kelola Lowongan.
                </p>
              ) : (
                <select
                  className={styles.formInput}
                  value={form.jobId}
                  onChange={(e) => setForm((f) => ({ ...f, jobId: Number(e.target.value) }))}
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
              <label className={styles.formLabel}>Pesan / Tawaran</label>
              <textarea
                className={styles.formTextarea}
                rows={4}
                placeholder="Tulis pesan atau alasan Anda tertarik dengan kandidat ini..."
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              />
            </div>
          </form>
        </div>
      )}
    </Modal>
  );
}

// ─── Candidate Card ──────────────────────────────────────────────────────────

interface CandidateCardProps {
  candidate: ScoutCandidate;
  onRequestInterview: (c: ScoutCandidate) => void;
}

function CandidateCard({ candidate, onRequestInterview }: CandidateCardProps) {
  return (
    <Card className={styles.candidateCard} padding="md">
      <div className={styles.cardTop}>
        <Avatar name={candidate.name} size="md" role="student" />
        <div className={styles.candidateMeta}>
          <div className={styles.nameRow}>
            <span className={styles.candidateName}>{candidate.name}</span>
            {candidate.nameJp && <span className={styles.candidateNameJp}>{candidate.nameJp}</span>}
          </div>
          <span className={styles.candidateOrigin}>📍 {candidate.originCity || 'Indonesia'}</span>
        </div>
      </div>

      <div className={styles.candidateBio}>
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <Badge variant={jlptVariant(candidate.jlptLevel)} size="sm">
            JLPT {candidate.jlptLevel || 'N4'}
          </Badge>
          {candidate.matchScore != null && (
            <Badge
              variant={
                candidate.matchScore >= 80
                  ? 'sakura'
                  : candidate.matchScore >= 60
                    ? 'accent'
                    : 'default'
              }
              size="sm"
            >
              ⚡ Match {candidate.matchScore}%
            </Badge>
          )}
        </div>
        {candidate.bioId && (
          <p className={styles.bioText}>
            {candidate.bioId.slice(0, 110)}
            {candidate.bioId.length > 110 ? '…' : ''}
          </p>
        )}
      </div>

      {candidate.specialization.length > 0 && (
        <div className={styles.specRow}>
          {candidate.specialization.slice(0, 3).map((s, i) => (
            <span key={i} className={styles.specTag}>
              {s}
            </span>
          ))}
          {candidate.specialization.length > 3 && (
            <span className={styles.specTag}>+{candidate.specialization.length - 3}</span>
          )}
        </div>
      )}

      <div className={styles.cardFooter}>
        <span className={styles.certBadge}>🎖 Terverifikasi</span>
        <Button size="sm" variant="primary" onClick={() => onRequestInterview(candidate)}>
          Request Scout
        </Button>
      </div>
    </Card>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function CorporateDashboard() {
  const { user } = useAuth();
  const { data: rawCandidates = [], isLoading: loadingCandidates } = useScoutCandidates();
  const { data: jobsResponse } = useJobs();
  const jobs = jobsResponse?.jobs || [];

  // Filter state
  const [search, setSearch] = useState('');
  const [jlptFilter, setJlptFilter] = useState<'All' | 'N3' | 'N4' | 'N5'>('All');
  const [specFilter, setSpecFilter] = useState('');

  // Modal state
  const [interviewTarget, setInterviewTarget] = useState<ScoutCandidate | null>(null);

  // Rirekisho state
  const [rirekishoCandidateId, setRirekishoCandidateId] = useState<number | ''>('');

  // Filtered candidates
  const filtered = useMemo(() => {
    return rawCandidates.filter((c) => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (jlptFilter !== 'All' && c.jlptLevel !== jlptFilter) return false;
      if (
        specFilter &&
        !c.specialization?.some((s) => s.toLowerCase().includes(specFilter.toLowerCase()))
      )
        return false;
      return true;
    });
  }, [rawCandidates, search, jlptFilter, specFilter]);

  // Feedback banner state
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  async function handleGenerateRirekisho() {
    if (!rirekishoCandidateId) {
      setErrorBanner('Pilih kandidat terlebih dahulu.');
      return;
    }
    const cand = rawCandidates.find((c) => c.id === rirekishoCandidateId);
    if (!cand) return;
    setErrorBanner(null);
    try {
      await cvApi.triggerDownload(cand.id);
      setSuccessBanner(`Rirekisho untuk ${cand.name} berhasil diunduh.`);
    } catch (err: any) {
      setErrorBanner(err?.response?.data?.error || err.message || 'Gagal mengunduh Rirekisho');
    }
  }

  const activeJobs = useMemo(() => jobs.filter((j) => j.is_active === 1), [jobs]);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* ── Page Header ── */}
        <header className={styles.pageHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.headerTitleRow}>
              <h1 className={styles.pageTitle}>Portal Rekrutmen</h1>
              <span className={styles.kanjiBadge}>企業ポータル</span>
              <Badge variant="corporate" size="sm">
                Corporate
              </Badge>
            </div>
            <p className={styles.pageSubtitle}>
              {user?.company ?? 'Tanaka Manufacturing Co., Ltd.'} · {user?.name ?? 'Tanaka Hiroshi'}{' '}
              ({user?.title ?? 'HR Manager'})
            </p>
          </div>
          <div className={styles.headerActions}>
            <Link to="/corporate/jobs" className={styles.headerLink}>
              <Button variant="ghost" size="sm">
                Kelola Lowongan
              </Button>
            </Link>
            <Link to="/corporate/scout" className={styles.headerLink}>
              <Button variant="primary" size="sm">
                Scout Talent
              </Button>
            </Link>
          </div>
        </header>

        {/* ── Notification Banners ── */}
        {successBanner && (
          <div className={`${styles.alertBanner} ${styles.alertSuccess}`}>
            <span>✅</span>
            <span>{successBanner}</span>
            <Button
              variant="ghost"
              size="sm"
              style={{ marginLeft: 'auto', padding: '2px 8px', height: 'auto' }}
              onClick={() => setSuccessBanner(null)}
            >
              ✕
            </Button>
          </div>
        )}

        {errorBanner && (
          <div className={`${styles.alertBanner} ${styles.alertError}`}>
            <span>⚠️</span>
            <span>{errorBanner}</span>
            <Button
              variant="ghost"
              size="sm"
              style={{ marginLeft: 'auto', padding: '2px 8px', height: 'auto' }}
              onClick={() => setErrorBanner(null)}
            >
              ✕
            </Button>
          </div>
        )}

        {/* ── Stats Row ── */}
        <section className={styles.statsRow}>
          <StatCard
            label="Kandidat Terverifikasi"
            value={rawCandidates.length}
            icon="👥"
            accent="purple"
            sublabel="Siap direkrut & lolos verifikasi admin"
          />
          <StatCard
            label="Lowongan Aktif"
            value={activeJobs.length}
            icon="💼"
            accent="green"
            sublabel="Dipublikasikan di platform"
          />
          <StatCard
            label="Perusahaan Anda"
            value={user?.company ? 'Terdaftar' : 'Aktif'}
            icon="🏢"
            accent="blue"
            sublabel={user?.company || 'Corporate HR'}
          />
          <StatCard
            label="Standar CV"
            value="JIS S 5502"
            icon="📄"
            accent="gold"
            sublabel="Format resmi Jepang"
          />
        </section>

        {/* ── AI Smart Matching Banner ── */}
        <section className={styles.matchingBanner}>
          <Card accent className={styles.aiCard} padding="md">
            <div className={styles.aiCardInner}>
              <div className={styles.aiIcon}>🤖</div>
              <div className={styles.aiText}>
                <div className={styles.aiTitleRow}>
                  <h3 className={styles.aiTitle}>Smart Talent Matching & Scout</h3>
                  <Badge variant="accent" size="sm">
                    Aktif
                  </Badge>
                </div>
                <p className={styles.aiDesc}>
                  Platform JITA menyaring kandidat secara langsung dari basis data yang telah lolos
                  verifikasi profil, validasi KTP, dan sertifikasi bahasa oleh admin operasional.
                </p>
              </div>
              <div className={styles.aiActions}>
                <Link to="/corporate/scout" className={styles.headerLink}>
                  <Button variant="primary" size="sm">
                    Halaman Scout Lengkap
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </section>

        {/* ── Search & Filter Bar ── */}
        <section className={styles.filterBar}>
          <div className={styles.filterGroup}>
            <span className={styles.filterIcon}>🔍</span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Cari kandidat berdasarkan nama..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Level JLPT</label>
            <select
              className={styles.filterSelect}
              value={jlptFilter}
              onChange={(e) => setJlptFilter(e.target.value as typeof jlptFilter)}
            >
              <option value="All">Semua Level</option>
              <option value="N3">N3</option>
              <option value="N4">N4</option>
              <option value="N5">N5</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Spesialisasi</label>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Cari spesialisasi..."
              value={specFilter}
              onChange={(e) => setSpecFilter(e.target.value)}
            />
          </div>
        </section>

        {/* ── Candidate Grid ── */}
        <section className={styles.gridSection}>
          <div className={styles.gridHeader}>
            <h2 className={styles.gridTitle}>
              Kandidat
              <span className={styles.gridCount}>{filtered.length} ditemukan</span>
            </h2>
          </div>

          {loadingCandidates ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyText}>Memuat daftar talenta terverifikasi...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>🔎</span>
              <p className={styles.emptyText}>
                Tidak ada kandidat terverifikasi yang cocok dengan filter Anda.
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setJlptFilter('All');
                  setSpecFilter('');
                }}
              >
                Reset Filter
              </Button>
            </div>
          ) : (
            <div className={styles.grid}>
              {filtered.map((c) => (
                <CandidateCard key={c.id} candidate={c} onRequestInterview={setInterviewTarget} />
              ))}
            </div>
          )}
        </section>

        {/* ── Rirekisho Generator ── */}
        <section className={styles.rirekishoSection}>
          <Card accent className={styles.rirekishoCard} padding="lg">
            <div className={styles.rirekishoInner}>
              <div className={styles.rirekishoInfo}>
                <div className={styles.rirekishoIcon}>📄</div>
                <div>
                  <h3 className={styles.rirekishoTitle}>Generator Rirekisho Otomatis</h3>
                  <p className={styles.rirekishoJp}>履歴書自動生成</p>
                  <p className={styles.rirekishoDesc}>
                    Hasilkan CV resmi dalam format <strong>履歴書</strong> standar Jepang secara
                    otomatis dari data kandidat. Didukung mesin PDFKit + Font CJK siap cetak.
                  </p>
                  <ul className={styles.rirekishoFeatures}>
                    <li>✅ Format standar JIS S 5502 (A4 Jepang)</li>
                    <li>✅ Otomatis terisi dari data kandidat database JITA</li>
                    <li>✅ Ekspor langsung ke PDF resmi</li>
                  </ul>
                </div>
              </div>

              <div className={styles.rirekishoControls}>
                <label className={styles.filterLabel}>Pilih Kandidat Terverifikasi</label>
                <select
                  className={styles.filterSelect}
                  value={rirekishoCandidateId}
                  onChange={(e) =>
                    setRirekishoCandidateId(e.target.value ? Number(e.target.value) : '')
                  }
                >
                  <option value="">— Pilih kandidat —</option>
                  {rawCandidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} · JLPT {c.jlptLevel || 'N4'}
                    </option>
                  ))}
                </select>

                <Button
                  variant="primary"
                  size="md"
                  className={styles.rirekishoBtn}
                  onClick={handleGenerateRirekisho}
                  icon={<span>📥</span>}
                >
                  Generate & Unduh Rirekisho
                </Button>
              </div>
            </div>
          </Card>
        </section>

        {/* ── Interview Modal ── */}
        <InterviewModal
          candidate={interviewTarget}
          jobs={activeJobs}
          onClose={() => setInterviewTarget(null)}
        />
      </div>
    </div>
  );
}
