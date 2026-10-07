import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  usePendingDocuments,
  useDecideDocument,
  useAdminStats,
  useBatchDecide,
} from '../../api/hooks';
import { PendingDocsTable } from '../../components/admin/PendingDocsTable';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import styles from './AdminVerificationsPage.module.css';

export default function AdminVerificationsPage() {
  const { user } = useAuth();
  const { data: docs = [], isLoading: loadingDocs, error: docsError } = usePendingDocuments();
  const { data: stats } = useAdminStats();
  const decideMutation = useDecideDocument();
  const batchDecideMutation = useBatchDecide();

  if (user && user.role !== 'admin') {
    return (
      <div className={styles.page}>
        <div className={styles.container}>Anda tidak punya akses ke halaman ini.</div>
      </div>
    );
  }
  if (!user) return null;

  const onDecide = (id: number, action: 'approved' | 'rejected') => {
    decideMutation.mutate(
      { id, action },
      {
        onError: (e: any) => {
          alert(e?.response?.data?.error || 'Gagal memproses dokumen');
        },
      }
    );
  };

  const batchApproveAll = () => {
    const pendingIds = docs.map((d: any) => d.id);
    if (pendingIds.length === 0) return;
    if (!confirm(`Setujui seluruh ${pendingIds.length} dokumen yang pending?`)) return;
    batchDecideMutation.mutate(
      { ids: pendingIds, action: 'approved' },
      {
        onSuccess: () => {
          alert('Seluruh dokumen berhasil disetujui.');
        },
        onError: (e: any) => {
          alert(e?.response?.data?.error || 'Gagal batch approve');
        },
      }
    );
  };

  const err = docsError
    ? (docsError as any)?.response?.data?.error || 'Gagal memuat dokumen'
    : null;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* ── Page Header ── */}
        <header className={styles.pageHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.headerTitleRow}>
              <h1 className={styles.pageTitle}>Verifikasi Dokumen & Operasional</h1>
              <span className={styles.kanjiBadge}>書類審査</span>
              <Badge variant="default" size="sm">
                Admin
              </Badge>
            </div>
            <p className={styles.pageSubtitle}>
              Review, validasi, dan verifikasi berkas kandidat (KTP, Sertifikat, Portofolio) untuk
              kelayakan penempatan kerja ke Jepang.
            </p>
          </div>
          <div className={styles.headerActions}>
            <Link to="/corporate/jobs" className={styles.headerLink}>
              <Button variant="ghost" size="sm">
                Kelola Lowongan →
              </Button>
            </Link>
            {docs.length > 0 && (
              <Button
                variant="success"
                size="sm"
                onClick={batchApproveAll}
                disabled={batchDecideMutation.isPending}
              >
                {batchDecideMutation.isPending ? 'Memproses...' : '✓ Setujui Semua Pending'}
              </Button>
            )}
          </div>
        </header>

        {/* ── Stats Row ── */}
        {stats && (
          <section className={styles.statsGrid}>
            <StatCard
              label="Menunggu Verifikasi"
              value={stats.pending}
              icon="⏳"
              accent="gold"
              sublabel="Dokumen kandidat perlu ditinjau"
            />
            <StatCard
              label="Dokumen Disetujui"
              value={stats.approved ?? 0}
              icon="✅"
              accent="green"
              sublabel="Terverifikasi memenuhi syarat"
            />
            <StatCard
              label="Lowongan Aktif"
              value={stats.active_jobs}
              icon="💼"
              accent="blue"
              sublabel="Terbuka untuk pelamar terverifikasi"
            />
          </section>
        )}

        {/* ── Document Table Card ── */}
        <Card padding="md">
          {loadingDocs ? (
            <div className={styles.loadingText}>Memuat dokumen verifikasi...</div>
          ) : err ? (
            <div className={styles.alertError}>
              <span>⚠️</span>
              <span>{err}</span>
            </div>
          ) : docs.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>🎉</span>
              <h3 className={styles.emptyTitle}>Semua Berkas Telah Terverifikasi</h3>
              <p className={styles.emptySubtitle}>
                Tidak ada dokumen kandidat yang menunggu antrean verifikasi saat ini.
              </p>
            </div>
          ) : (
            <PendingDocsTable
              data={docs as any}
              onDecide={onDecide}
              isDeciding={decideMutation.isPending}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
