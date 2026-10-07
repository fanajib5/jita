import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { jobApi } from '../../api/jobs';
import { cvApi } from '../../api/cv';
import { useJobs, useCompanies, jobKeys } from '../../api/hooks';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { FileText, Users, Check, X, Clock, MailOpen } from 'lucide-react';
import styles from './CorporateJobsPage.module.css';

const EMPTY_FORM = {
  companyId: 0,
  title: '',
  titleJp: '',
  description: '',
  requirements: '',
  specialization: '',
  minJlpt: '',
  location: '',
  employmentType: 'fulltime',
  targetAudience: 'all' as 'all' | 'student' | 'graduated',
  salaryRange: '',
};

export default function CorporateJobsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: companies = [], error: companiesError } = useCompanies();
  const { data: jobsResponse, isLoading: loadingJobs, error: jobsError } = useJobs();
  const jobs = jobsResponse?.jobs || [];

  const [form, setForm] = useState<typeof EMPTY_FORM>(EMPTY_FORM);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newCompany, setNewCompany] = useState({
    name: '',
    nameJp: '',
    industry: '',
  });
  const [showNewCo, setShowNewCo] = useState(false);
  const [posting, setPosting] = useState(false);

  // Applicants Modal State
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [jobApplicants, setJobApplicants] = useState<any[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [updatingAppId, setUpdatingAppId] = useState<number | null>(null);

  // Default company selection once companies load
  const activeCompanyId = form.companyId || companies[0]?.id || 0;

  async function openApplicantsModal(job: any) {
    setSelectedJob(job);
    setLoadingApplicants(true);
    try {
      const data = await jobApi.applicationsForJob(job.id);
      setJobApplicants(data.applications || []);
    } catch (e: any) {
      setErr(e?.response?.data?.error || 'Gagal memuat daftar pelamar.');
    } finally {
      setLoadingApplicants(false);
    }
  }

  async function handleDecideApplication(appId: number, status: string) {
    setUpdatingAppId(appId);
    try {
      await jobApi.decideApplication(appId, status);
      setSuccess(
        `Status lamaran berhasil diperbarui menjadi "${status}". Notifikasi telah dikirimkan ke kandidat.`
      );
      // Update local state
      setJobApplicants((prev) => prev.map((a) => (a.id === appId ? { ...a, status } : a)));
    } catch (e: any) {
      setErr(e?.response?.data?.error || 'Gagal memperbarui status lamaran.');
    } finally {
      setUpdatingAppId(null);
    }
  }

  async function onCreateCompany() {
    if (!newCompany.name) {
      setErr('Nama perusahaan wajib diisi.');
      return;
    }
    setErr(null);
    try {
      const c = await jobApi.createCompany(newCompany);
      setNewCompany({ name: '', nameJp: '', industry: '' });
      setShowNewCo(false);
      setSuccess(`Perusahaan "${c.name}" berhasil didaftarkan.`);
      await queryClient.invalidateQueries({ queryKey: jobKeys.companies() });
      setForm((f) => ({ ...f, companyId: c.id }));
    } catch (e: any) {
      setErr(e?.response?.data?.error || 'Gagal mendaftarkan perusahaan.');
    }
  }

  async function onPost() {
    const targetCompanyId = form.companyId || activeCompanyId;
    if (!targetCompanyId || !form.title) {
      setErr('Pilih perusahaan dan isi judul lowongan.');
      return;
    }
    setPosting(true);
    setErr(null);
    try {
      await jobApi.createJob({
        ...form,
        companyId: targetCompanyId,
        specialization: form.specialization || undefined,
      });
      setSuccess(`Lowongan "${form.title}" berhasil dipublikasikan.`);
      setForm(EMPTY_FORM);
      await queryClient.invalidateQueries({ queryKey: jobKeys.all });
    } catch (e: any) {
      setErr(e?.response?.data?.error || 'Gagal memposting lowongan.');
    } finally {
      setPosting(false);
    }
  }

  async function onClose(id: number, title: string) {
    if (!confirm(`Tutup lowongan "${title}"? Pelamar tidak dapat mendaftar lagi.`)) return;
    setErr(null);
    try {
      await jobApi.closeJob(id);
      setSuccess(`Lowongan "${title}" berhasil ditutup.`);
      await queryClient.invalidateQueries({ queryKey: jobKeys.all });
    } catch (e: any) {
      setErr(e?.response?.data?.error || 'Gagal menutup lowongan.');
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* ── Page Header ── */}
        <header className={styles.pageHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.headerTitleRow}>
              <h1 className={styles.pageTitle}>Kelola Lowongan</h1>
              <span className={styles.kanjiBadge}>求人管理</span>
              <Badge variant="corporate" size="sm">
                Corporate
              </Badge>
            </div>
            <p className={styles.pageSubtitle}>
              Publikasikan posisi karir kerja di Jepang untuk para talenta dan lulusan terverifikasi
              JITA.
            </p>
          </div>
          <div className={styles.headerActions}>
            {user?.role === 'admin' ? (
              <Link to="/admin/verifications" className={styles.headerLink}>
                <Button variant="ghost" size="sm">
                  ← Verifikasi Dokumen
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/corporate" className={styles.headerLink}>
                  <Button variant="ghost" size="sm">
                    ← Dashboard Corporate
                  </Button>
                </Link>
                <Link to="/corporate/scout" className={styles.headerLink}>
                  <Button variant="primary" size="sm">
                    Scout Talent
                  </Button>
                </Link>
              </>
            )}
          </div>
        </header>

        {/* ── Feedback Banners ── */}
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

        {(err || companiesError || jobsError) && (
          <div className={`${styles.alertBanner} ${styles.alertError}`}>
            <span>⚠️</span>
            <span>
              {err ||
                (companiesError as any)?.response?.data?.error ||
                (jobsError as any)?.response?.data?.error ||
                'Gagal memuat data.'}
            </span>
            <Button
              variant="ghost"
              size="sm"
              style={{ marginLeft: 'auto', padding: '2px 8px', height: 'auto' }}
              onClick={() => setErr(null)}
            >
              ✕
            </Button>
          </div>
        )}

        {/* ── Post Job Card ── */}
        <Card title="Posting Lowongan Baru" subtitle="新規求人登録" padding="lg">
          <div className={styles.formGrid}>
            <div className={`${styles.field} ${styles.full}`}>
              <label>Perusahaan Pengiklan</label>
              <div className={styles.companyRow}>
                <select
                  className={styles.select}
                  value={activeCompanyId}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      companyId: Number(e.target.value),
                    }))
                  }
                >
                  <option value={0}>— Pilih Perusahaan —</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.name_jp ? ` (${c.name_jp})` : ''}
                    </option>
                  ))}
                </select>
                <Button variant="ghost" size="sm" onClick={() => setShowNewCo((s) => !s)}>
                  {showNewCo ? 'Tutup Form' : '+ Tambah Perusahaan'}
                </Button>
              </div>

              {showNewCo && (
                <div className={styles.newCompanyBox}>
                  <input
                    className={styles.input}
                    placeholder="Nama Perusahaan (EN)"
                    value={newCompany.name}
                    onChange={(e) => setNewCompany((c) => ({ ...c, name: e.target.value }))}
                  />
                  <input
                    className={styles.input}
                    placeholder="Nama (JP, misal: 株式会社田中)"
                    value={newCompany.nameJp}
                    onChange={(e) => setNewCompany((c) => ({ ...c, nameJp: e.target.value }))}
                  />
                  <input
                    className={styles.input}
                    placeholder="Bidang Industri"
                    value={newCompany.industry}
                    onChange={(e) => setNewCompany((c) => ({ ...c, industry: e.target.value }))}
                  />
                  <Button size="sm" variant="primary" onClick={onCreateCompany}>
                    Simpan
                  </Button>
                </div>
              )}
            </div>

            <div className={styles.field}>
              <label>Judul Lowongan (EN / ID)</label>
              <input
                className={styles.input}
                placeholder="Contoh: CNC Machine Operator"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div className={styles.field}>
              <label>Judul Lowongan (JP)</label>
              <input
                className={styles.input}
                placeholder="Contoh: マシニングセンタオペレーター"
                value={form.titleJp}
                onChange={(e) => setForm((f) => ({ ...f, titleJp: e.target.value }))}
              />
            </div>

            <div className={styles.field}>
              <label>Lokasi Kerja (Prefektur / Kota)</label>
              <input
                className={styles.input}
                placeholder="Contoh: Aichi / Nagoya"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              />
            </div>

            <div className={styles.field}>
              <label>Syarat Minimum JLPT</label>
              <select
                className={styles.select}
                value={form.minJlpt}
                onChange={(e) => setForm((f) => ({ ...f, minJlpt: e.target.value }))}
              >
                <option value="">Tidak disyaratkan</option>
                {['N5', 'N4', 'N3', 'N2', 'N1'].map((l) => (
                  <option key={l} value={l}>
                    JLPT {l}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label>Tipe Kontrak Kerja</label>
              <select
                className={styles.select}
                value={form.employmentType}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    employmentType: e.target.value as any,
                  }))
                }
              >
                <option value="fulltime">Fulltime (正社員)</option>
                <option value="contract">Contract (契約社員 / 技能実習)</option>
                <option value="internship">Internship (インターン)</option>
              </select>
            </div>

            <div className={styles.field}>
              <label>Target Pelamar</label>
              <select
                className={styles.select}
                value={form.targetAudience}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    targetAudience: e.target.value as any,
                  }))
                }
              >
                <option value="all">Semua Kandidat (Siswa & Lulusan)</option>
                <option value="student">Khusus Siswa / Magang (Student Only)</option>
                <option value="graduated">Khusus Lulusan (Graduated / Alumni)</option>
              </select>
            </div>

            <div className={styles.field}>
              <label>Rentang Gaji Bulanan</label>
              <input
                className={styles.input}
                value={form.salaryRange}
                onChange={(e) => setForm((f) => ({ ...f, salaryRange: e.target.value }))}
                placeholder="Contoh: ¥220,000–300,000 / bulan"
              />
            </div>

            <div className={`${styles.field} ${styles.full}`}>
              <label>Spesialisasi / Kategori (Pisahkan Koma)</label>
              <input
                className={styles.input}
                value={form.specialization}
                onChange={(e) => setForm((f) => ({ ...f, specialization: e.target.value }))}
                placeholder="Manufaktur, Permesinan, Otomotif"
              />
            </div>

            <div className={`${styles.field} ${styles.full}`}>
              <label>Deskripsi Pekerjaan</label>
              <textarea
                className={styles.textarea}
                rows={3}
                placeholder="Jelaskan peran kerja, tanggung jawab, dan jam kerja..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className={`${styles.field} ${styles.full}`}>
              <label>Persyaratan Kualifikasi</label>
              <textarea
                className={styles.textarea}
                rows={3}
                placeholder="Jelaskan syarat pengalaman, sertifikasi SSW/Tokutei Ginou, atau kriteria fisik..."
                value={form.requirements}
                onChange={(e) => setForm((f) => ({ ...f, requirements: e.target.value }))}
              />
            </div>
          </div>

          <div className={styles.formActions}>
            <Button variant="primary" onClick={onPost} disabled={posting}>
              {posting ? 'Mempublikasikan...' : 'Posting Lowongan'}
            </Button>
          </div>
        </Card>

        {/* ── Jobs Table Card ── */}
        <Card
          title="Daftar Lowongan Perusahaan"
          subtitle={`Total ${jobs.length} lowongan terdaftar`}
          padding="md"
        >
          {loadingJobs ? (
            <div className={styles.emptyState}>
              <p>Memuat daftar lowongan perusahaan...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>💼</span>
              <p>Belum ada lowongan yang dipublikasikan oleh perusahaan Anda.</p>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Posisi & Judul</th>
                    <th>Perusahaan</th>
                    <th>JLPT</th>
                    <th>Lokasi</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((j) => (
                    <tr key={j.id}>
                      <td>
                        <div className={styles.jobTitle}>{j.title}</div>
                        {j.title_jp && <div className={styles.jobTitleJp}>{j.title_jp}</div>}
                      </td>
                      <td>{j.company_name}</td>
                      <td>
                        {j.min_jlpt ? (
                          <Badge variant="accent" size="sm">
                            {j.min_jlpt}
                          </Badge>
                        ) : (
                          <span style={{ color: 'var(--color-text-tertiary)' }}>—</span>
                        )}
                      </td>
                      <td>{j.location || '—'}</td>
                      <td>
                        <Badge variant={j.is_active ? 'success' : 'default'} size="sm">
                          {j.is_active ? 'Aktif' : 'Tutup'}
                        </Badge>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openApplicantsModal(j)}
                          >
                            <Users size={14} style={{ marginRight: '4px' }} />
                            Pelamar
                          </Button>
                          {j.is_active ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onClose(j.id, j.title)}
                            >
                              Tutup
                            </Button>
                          ) : (
                            <span
                              style={{ color: 'var(--color-text-tertiary)', fontSize: '0.8rem' }}
                            >
                              Selesai
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* ── Modal Pelamar & Review ── */}
        <Modal
          isOpen={!!selectedJob}
          onClose={() => setSelectedJob(null)}
          title={`Daftar Pelamar: ${selectedJob?.title || ''}`}
          titleJp={selectedJob?.title_jp || undefined}
          size="lg"
        >
          {loadingApplicants ? (
            <div
              style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}
            >
              Memuat data pelamar...
            </div>
          ) : jobApplicants.length === 0 ? (
            <div
              style={{
                padding: '32px 16px',
                textAlign: 'center',
                color: 'var(--color-text-secondary)',
              }}
            >
              <MailOpen size={36} style={{ opacity: 0.4, marginBottom: '8px' }} />
              <p>Belum ada pelamar untuk posisi lowongan ini.</p>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                maxHeight: '500px',
                overflowY: 'auto',
                paddingRight: '4px',
              }}
            >
              {jobApplicants.map((app) => (
                <div
                  key={app.id}
                  style={{
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '1rem', color: 'var(--color-text-primary)' }}>
                        {app.candidate_name}
                      </strong>
                      <div
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--color-text-secondary)',
                          marginTop: '2px',
                        }}
                      >
                        {app.candidate_email} • {app.origin_city || 'Indonesia'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {app.jlpt_level && (
                        <Badge variant="accent" size="sm">
                          {app.jlpt_level}
                        </Badge>
                      )}
                      <Badge
                        variant={
                          app.status === 'accepted'
                            ? 'success'
                            : app.status === 'shortlisted'
                              ? 'warning'
                              : app.status === 'rejected'
                                ? 'danger'
                                : 'default'
                        }
                        size="sm"
                      >
                        {app.status === 'submitted'
                          ? 'Menunggu Review'
                          : app.status === 'shortlisted'
                            ? 'Shortlisted'
                            : app.status === 'accepted'
                              ? 'Diterima'
                              : app.status === 'rejected'
                                ? 'Ditolak'
                                : app.status}
                      </Badge>
                    </div>
                  </div>

                  {app.message && (
                    <div
                      style={{
                        fontSize: '0.85rem',
                        color: 'var(--color-text-secondary)',
                        background: 'var(--color-surface)',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        borderLeft: '3px solid var(--color-role-corporate)',
                      }}
                    >
                      "{app.message}"
                    </div>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '4px',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                      Melamar: {new Date(app.created_at).toLocaleDateString('id-ID')}
                    </span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => cvApi.triggerDownload(app.user_id)}
                      >
                        <FileText size={14} style={{ marginRight: '4px' }} />
                        Unduh CV (履歴書)
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={updatingAppId === app.id || app.status === 'shortlisted'}
                        onClick={() => handleDecideApplication(app.id, 'shortlisted')}
                      >
                        <Clock size={14} style={{ marginRight: '4px' }} />
                        Shortlist
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={updatingAppId === app.id || app.status === 'accepted'}
                        onClick={() => handleDecideApplication(app.id, 'accepted')}
                      >
                        <Check size={14} style={{ marginRight: '4px' }} />
                        Terima
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={updatingAppId === app.id || app.status === 'rejected'}
                        onClick={() => handleDecideApplication(app.id, 'rejected')}
                      >
                        <X size={14} style={{ marginRight: '4px' }} />
                        Tolak
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
