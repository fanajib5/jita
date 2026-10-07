import { useRef, useState, useMemo } from 'react';
import { type DocType, type DocStatus, type VaultDoc } from '../../api/documents';
import { useMyDocuments, useUploadDocument, useDeleteDocument } from '../../api/hooks';
import { documentApi } from '../../api/documents';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import styles from './VaultPage.module.css';

const TYPE_LABEL: Record<DocType, string> = {
  ktp: 'KTP',
  certificate: 'Sertifikat',
  portfolio: 'Portfolio',
  transcript: 'Transkrip',
};

const STATUS_CONFIG: Record<
  DocStatus,
  { label: string; variant: 'success' | 'warning' | 'danger' | 'default'; icon: string }
> = {
  approved: { label: 'Terverifikasi', variant: 'success', icon: '✅' },
  pending: { label: 'Menunggu Verifikasi', variant: 'warning', icon: '⏳' },
  rejected: { label: 'Ditolak (Perlu Revisi)', variant: 'danger', icon: '❌' },
};

const TYPE_PRIORITY: Record<DocType, number> = {
  ktp: 1,
  certificate: 2,
  transcript: 3,
  portfolio: 4,
};

export default function VaultPage() {
  const { data: docs = [], isLoading: loading, error } = useMyDocuments();
  const uploadMutation = useUploadDocument();
  const deleteMutation = useDeleteDocument();

  const [err, setErr] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [form, setForm] = useState<{
    type: DocType;
    title: string;
    issuedBy: string;
    issuedDate: string;
  }>({
    type: 'ktp',
    title: '',
    issuedBy: '',
    issuedDate: '',
  });
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'all' | DocType>('all');
  const [sortBy, setSortBy] = useState<'smart' | 'newest' | 'oldest'>('smart');

  // Count per type for tabs
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: docs.length };
    for (const d of docs) {
      counts[d.type] = (counts[d.type] || 0) + 1;
    }
    return counts;
  }, [docs]);

  // Filtered & Sorted documents
  const displayDocs = useMemo(() => {
    let filtered =
      activeTab === 'all' ? [...docs] : docs.filter((d: { type: string }) => d.type === activeTab);

    if (sortBy === 'newest') {
      return filtered.sort((a: { id: number }, b: { id: number }) => b.id - a.id);
    }

    if (sortBy === 'oldest') {
      return filtered.sort((a: { id: number }, b: { id: number }) => a.id - b.id);
    }

    // Smart Sort:
    // 1. Rejected (needs attention) first
    // 2. Type priority: KTP (1) -> Certificate (2) -> Transcript (3) -> Portfolio (4)
    // 3. Newest first within same group
    return filtered.sort((a, b) => {
      // 1. Rejected documents first
      const isARejected = a.verification_status === 'rejected';
      const isBRejected = b.verification_status === 'rejected';
      if (isARejected && !isBRejected) return -1;
      if (!isARejected && isBRejected) return 1;

      // 2. Category priority
      const priorityA = TYPE_PRIORITY[a.type] ?? 99;
      const priorityB = TYPE_PRIORITY[b.type] ?? 99;
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // 3. Newest first
      return b.id - a.id;
    });
  }, [docs, activeTab, sortBy]);

  async function onUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setErr('Pilih file berkas terlebih dahulu');
      setSuccessMsg(null);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErr('Ukuran file terlalu besar (maksimal 10 MB)');
      setSuccessMsg(null);
      return;
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setErr('Format file tidak didukung. Harap unggah file PDF, JPG, PNG, atau WEBP.');
      setSuccessMsg(null);
      return;
    }
    if (!form.title.trim()) {
      setErr('Judul dokumen wajib diisi');
      setSuccessMsg(null);
      return;
    }
    setErr(null);
    setSuccessMsg(null);

    const fd = new FormData();
    fd.append('type', form.type);
    fd.append('title', form.title.trim());
    if (form.issuedBy) fd.append('issuedBy', form.issuedBy.trim());
    if (form.issuedDate) fd.append('issuedDate', form.issuedDate);
    fd.append('file', file);

    uploadMutation.mutate(fd, {
      onSuccess: () => {
        if (fileRef.current) fileRef.current.value = '';
        setForm((f) => ({ ...f, title: '', issuedBy: '', issuedDate: '' }));
        setSuccessMsg('Dokumen berhasil diunggah ke Vault dan siap diverifikasi.');
      },
      onError: (e: any) => {
        setErr(e?.response?.data?.error?.message || e?.response?.data?.error || 'Upload gagal');
      },
    });
  }

  function onRevise(doc: VaultDoc) {
    setForm({
      type: doc.type,
      title: `${doc.title} (Revisi)`,
      issuedBy: doc.issued_by || '',
      issuedDate: doc.issued_date ? doc.issued_date.slice(0, 10) : '',
    });
    setSuccessMsg(null);
    setErr(null);
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
    fileRef.current?.focus();
  }

  function onDelete(id: number) {
    if (!confirm('Hapus dokumen ini?')) return;
    deleteMutation.mutate(id, {
      onError: (e: any) => {
        setErr(e?.response?.data?.error?.message || e?.response?.data?.error || 'Gagal menghapus');
      },
    });
  }

  const errorMessage = err || (error ? 'Gagal memuat daftar dokumen' : null);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerTitleRow}>
              <h1 className={styles.title}>Document Vault</h1>
              <span className={styles.kanjiBadge}>書類金庫</span>
            </div>
            <p className={styles.subtitle}>
              Kelola berkas identitas KTP, sertifikat kelulusan JLPT, transkrip nilai, dan
              portofolio kompetensi pelatihan Anda secara aman.
            </p>
          </div>
        </header>

        <div ref={formRef}>
          <Card title="Unggah Dokumen Baru" subtitle="Formulir Kredensial" padding="lg">
            <div className={styles.uploadForm}>
              <div className={styles.field}>
                <label>Jenis Dokumen</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as DocType }))}
                >
                  <option value="ktp">KTP (Identitas)</option>
                  <option value="certificate">Sertifikat Kelulusan / JLPT</option>
                  <option value="portfolio">Portofolio Proyek</option>
                  <option value="transcript">Transkrip Nilai</option>
                </select>
              </div>
              <div className={styles.field}>
                <label>Judul Dokumen</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="cth. KTP Budi Santoso atau Sertifikat JLPT N3"
                />
              </div>
              <div className={styles.field}>
                <label>Penerbit (Institusi / Otoritas)</label>
                <input
                  value={form.issuedBy}
                  onChange={(e) => setForm((f) => ({ ...f, issuedBy: e.target.value }))}
                  placeholder="cth. Japan Foundation / Disdukcapil"
                />
              </div>
              <div className={styles.field}>
                <label>Tanggal Penerbitan</label>
                <input
                  type="date"
                  value={form.issuedDate}
                  onChange={(e) => setForm((f) => ({ ...f, issuedDate: e.target.value }))}
                />
              </div>
              <div className={`${styles.field} ${styles.full}`}>
                <label>File Berkas</label>
                <div className={styles.fileInputWrapper}>
                  <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" />
                  <p className={styles.fileHint}>
                    Mendukung format PDF, JPG, PNG, WEBP (Maksimal 10 MB)
                  </p>
                </div>
              </div>
            </div>
            {successMsg && (
              <p style={{ color: 'var(--color-success)', marginTop: '1rem', fontSize: '0.875rem' }}>
                ✅ {successMsg}
              </p>
            )}
            {errorMessage && (
              <p style={{ color: 'var(--color-danger)', marginTop: '1rem', fontSize: '0.875rem' }}>
                {errorMessage}
              </p>
            )}
            <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="primary" disabled={uploadMutation.isPending} onClick={onUpload}>
                {uploadMutation.isPending ? 'Mengunggah Berkas...' : 'Unggah ke Vault'}
              </Button>
            </div>
          </Card>
        </div>

        <Card
          title="Daftar Dokumen Tersimpan"
          subtitle="Status Verifikasi Dokumen"
          padding="lg"
          headerAction={
            docs.length > 0 ? (
              <Badge variant="info" size="sm">
                {docs.length} Dokumen
              </Badge>
            ) : undefined
          }
        >
          {loading ? (
            <p>Memuat dokumen...</p>
          ) : docs.length === 0 ? (
            <div className={styles.empty}>Belum ada dokumen yang diupload.</div>
          ) : (
            <>
              {/* Filter & Sort Controls Toolbar */}
              <div className={styles.controlsBar}>
                <div className={styles.filterTabs}>
                  <button
                    type="button"
                    className={[styles.filterTab, activeTab === 'all' ? styles.filterTabActive : '']
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => setActiveTab('all')}
                  >
                    Semua
                    <span className={styles.filterBadgeCount}>{tabCounts.all || 0}</span>
                  </button>
                  {(['ktp', 'certificate', 'transcript', 'portfolio'] as DocType[]).map((type) => {
                    const count = tabCounts[type] || 0;
                    if (count === 0 && activeTab !== type) return null;
                    return (
                      <button
                        key={type}
                        type="button"
                        className={[
                          styles.filterTab,
                          activeTab === type ? styles.filterTabActive : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        onClick={() => setActiveTab(type)}
                      >
                        {TYPE_LABEL[type]}
                        <span className={styles.filterBadgeCount}>{count}</span>
                      </button>
                    );
                  })}
                </div>

                <div className={styles.sortWrapper}>
                  <span>Urutkan:</span>
                  <select
                    className={styles.sortSelect}
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                  >
                    <option value="smart">Prioritas Status & Kategori</option>
                    <option value="newest">Paling Baru Diunggah</option>
                    <option value="oldest">Paling Lama Diunggah</option>
                  </select>
                </div>
              </div>

              {displayDocs.length === 0 ? (
                <div className={styles.empty}>
                  Tidak ada dokumen pada kategori{' '}
                  <strong>{activeTab !== 'all' ? TYPE_LABEL[activeTab] : ''}</strong>.
                </div>
              ) : (
                <div className={styles.scrollableDocsArea}>
                  <div className={styles.grid}>
                    {displayDocs.map((d) => {
                      const statusCfg = STATUS_CONFIG[d.verification_status] || {
                        label: d.verification_status,
                        variant: 'default',
                        icon: '📄',
                      };
                      const isRejected = d.verification_status === 'rejected';

                      return (
                        <div
                          key={d.id}
                          className={[styles.docCard, isRejected ? styles.docCardRejected : '']
                            .filter(Boolean)
                            .join(' ')}
                        >
                          <div className={styles.docHeader}>
                            <span className={styles.docType}>{TYPE_LABEL[d.type] || d.type}</span>
                            <Badge variant={statusCfg.variant} size="sm">
                              {statusCfg.icon} {statusCfg.label}
                            </Badge>
                          </div>
                          <h3 className={styles.docTitle}>{d.title}</h3>
                          <p className={styles.docMeta}>
                            {(d.file_size_bytes / 1024).toFixed(0)} KB ·{' '}
                            {new Date(d.created_at).toLocaleDateString('id-ID')}
                          </p>
                          {d.issued_by && <p className={styles.docMeta}>Penerbit: {d.issued_by}</p>}
                          {d.issued_date && (
                            <p className={styles.docMeta}>
                              Tgl Terbit: {new Date(d.issued_date).toLocaleDateString('id-ID')}
                            </p>
                          )}
                          {d.verification_notes && (
                            <p className={styles.notes}>
                              <strong>Catatan Admin:</strong> {d.verification_notes}
                            </p>
                          )}
                          <div className={styles.actions}>
                            <a href={documentApi.fileUrl(d.id)} target="_blank" rel="noreferrer">
                              <Button variant="secondary" size="sm">
                                Lihat Dokumen ↗
                              </Button>
                            </a>
                            {isRejected && (
                              <Button variant="primary" size="sm" onClick={() => onRevise(d)}>
                                Unggah Revisi ↺
                              </Button>
                            )}
                            {d.verification_status === 'pending' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={deleteMutation.isPending}
                                onClick={() => onDelete(d.id)}
                              >
                                Hapus
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
