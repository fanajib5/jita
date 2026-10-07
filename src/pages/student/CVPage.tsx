import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Download, Edit3 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cvApi } from '../../api/cv';
import { useMyDocuments } from '../../api/hooks';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import styles from './CVPage.module.css';

export default function CVPage() {
  const { user, refreshUser } = useAuth();
  const { data: docs = [] } = useMyDocuments();
  const [downloading, setDownloading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const approvedDocs = docs.filter((d) => d.verification_status === 'approved');
  const pendingDocs = docs.filter((d) => d.verification_status === 'pending');

  if (!user) return null;
  const p = user as any;
  const incomplete = !p.nameJp && !p.birthDate && (!p.education || p.education.length === 0);

  async function onDownload() {
    setErrorMsg(null);
    setDownloading(true);
    try {
      await refreshUser();
      await cvApi.triggerDownload();
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.error || e.message || 'Gagal mengunduh dokumen CV');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerTitleRow}>
              <h1 className={styles.title}>CV Generator (Rirekisho)</h1>
              <span className={styles.kanjiBadge}>履歴書作成</span>
            </div>
            <p className={styles.subtitle}>
              Generate kurikulum vitae format standar Jepang (JIS standard rirekisho) siap pakai
              untuk melamar ke perusahaan mitra.
            </p>
          </div>
        </header>

        {incomplete && (
          <div className={styles.warningBanner}>
            <div className={styles.warningContent}>
              <strong>Data profil Anda belum lengkap.</strong>
              <span>
                {' '}
                Lengkapi nama kanji, riwayat pendidikan, dan tanggal lahir agar CV terisi maksimal.
              </span>
            </div>
            <Link to="/profile">
              <Button variant="secondary" size="sm">
                Lengkapi Profil
              </Button>
            </Link>
          </div>
        )}

        {/* ── Kredensial & Vault Sync Status ── */}
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-full)',
                background:
                  approvedDocs.length > 0 ? 'rgba(39, 174, 96, 0.12)' : 'rgba(230, 126, 34, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: approvedDocs.length > 0 ? 'var(--color-success)' : 'var(--color-warning)',
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong style={{ fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>
                  Status Kredensial & Dokumen Pendukung
                </strong>
                <Badge variant={approvedDocs.length > 0 ? 'success' : 'warning'} size="sm">
                  {approvedDocs.length > 0 ? 'Kredensial Terverifikasi' : 'Belum Ada Dokumen Valid'}
                </Badge>
              </div>
              <p
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--color-text-secondary)',
                  margin: '2px 0 0',
                }}
              >
                {approvedDocs.length} berkas terverifikasi (
                {approvedDocs
                  .map((d) => d.title)
                  .slice(0, 2)
                  .join(', ')}
                {approvedDocs.length > 2 ? ` +${approvedDocs.length - 2}` : ''})
                {pendingDocs.length > 0 && ` • ${pendingDocs.length} berkas menunggu review admin`}
              </p>
            </div>
          </div>
          <Link to="/vault">
            <Button variant="secondary" size="sm">
              Kelola Dokumen Vault →
            </Button>
          </Link>
        </div>

        <Card
          title="Pratinjau Lembar Rirekisho"
          subtitle="Standar format rekrutmen perusahaan Jepang"
          padding="lg"
          headerAction={
            <div className={styles.headerActions}>
              <Link to="/profile">
                <Button variant="ghost" size="sm">
                  <Edit3 size={15} style={{ marginRight: '4px' }} />
                  Edit Profil
                </Button>
              </Link>
              <Button variant="primary" size="sm" disabled={downloading} onClick={onDownload}>
                <Download size={15} style={{ marginRight: '4px' }} />
                {downloading ? 'Memproses PDF...' : 'Unduh PDF (Rirekisho)'}
              </Button>
            </div>
          }
        >
          {errorMsg && <div className={styles.errorAlert}>{errorMsg}</div>}

          <div className={styles.sheetContainer}>
            <div className={styles.sheetHeader}>
              <div className={styles.sheetTitleBlock}>
                <span className={styles.sheetBadge}>JIS STANDARD FORMAT</span>
                <h2 className={styles.sheetCandidateName}>{p.nameJp || p.name}</h2>
                {p.nameJp && <div className={styles.sheetLatinName}>{p.name}</div>}
              </div>
              <div className={styles.sheetMetaChips}>
                {p.jlptLevel && (
                  <Badge variant="sakura" size="md">
                    JLPT {p.jlptLevel}
                  </Badge>
                )}
                {p.originCity && (
                  <Badge variant="default" size="md">
                    📍 {p.originCity}
                  </Badge>
                )}
              </div>
            </div>

            <div className={styles.contactBar}>
              <div className={styles.contactItem}>
                <span className={styles.contactLabel}>Email:</span> {p.email}
              </div>
              {p.phone && (
                <div className={styles.contactItem}>
                  <span className={styles.contactLabel}>Telepon:</span> {p.phone}
                </div>
              )}
              {p.birthDate && (
                <div className={styles.contactItem}>
                  <span className={styles.contactLabel}>Tanggal Lahir:</span> {p.birthDate}
                </div>
              )}
            </div>

            {p.specialization?.length > 0 && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Spesialisasi Kejuruan</h3>
                <div className={styles.tagList}>
                  {p.specialization.map((s: string, i: number) => (
                    <span key={i} className={styles.tag}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Riwayat Pendidikan (学歴)</h3>
              {p.education?.length > 0 ? (
                <div className={styles.tableList}>
                  {p.education.map((e: any, i: number) => (
                    <div key={i} className={styles.tableRow}>
                      <span className={styles.tableMain}>
                        {e.degree} — {e.institution}
                      </span>
                      <span className={styles.tableSub}>{e.year}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.emptyNote}>Belum ada riwayat pendidikan yang ditambahkan.</p>
              )}
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Pengalaman Kerja (職歴)</h3>
              {p.experience?.length > 0 ? (
                <div className={styles.tableList}>
                  {p.experience.map((x: any, i: number) => (
                    <div key={i} className={styles.tableRow}>
                      <span className={styles.tableMain}>
                        {x.title} <span className={styles.company}>@{x.company}</span>
                      </span>
                      <span className={styles.tableSub}>
                        {x.start} – {x.end || 'Sekarang'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.emptyNote}>Belum ada pengalaman kerja yang ditambahkan.</p>
              )}
            </div>

            {p.skills?.length > 0 && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Kompetensi & Keterampilan Tambahan</h3>
                <div className={styles.tagList}>
                  {p.skills.map((sk: string, i: number) => (
                    <span key={i} className={styles.skillBadge}>
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={styles.footerActions}>
            <Button variant="primary" disabled={downloading} onClick={onDownload}>
              {downloading ? 'Memproses PDF...' : '⬇ Unduh PDF (Rirekisho)'}
            </Button>
            <Link to="/profile">
              <Button variant="ghost">Edit Profil Lengkap</Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
