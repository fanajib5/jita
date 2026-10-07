import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import type { ProfilePayload } from '../../api/user';
import styles from './ProfilePage.module.css';

const JLPT = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState<ProfilePayload>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  // Quick inputs
  const [newSpec, setNewSpec] = useState('');
  const [newSkill, setNewSkill] = useState('');

  // Education inputs
  const [eduDegree, setEduDegree] = useState('');
  const [eduInst, setEduInst] = useState('');
  const [eduYear, setEduYear] = useState('');

  // Experience inputs
  const [expTitle, setExpTitle] = useState('');
  const [expCompany, setExpCompany] = useState('');
  const [expStart, setExpStart] = useState('');
  const [expEnd, setExpEnd] = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        nameJp: user.nameJp,
        birthDate: user.birthDate,
        originCity: user.originCity,
        phone: user.phone,
        jlptLevel: user.jlptLevel,
        specialization: user.specialization ?? [],
        bioId: user.bioId,
        bioJp: user.bioJp,
        education: user.education ?? [],
        experience: user.experience ?? [],
        skills: user.skills ?? [],
      });
    }
  }, [user]);

  function setField<K extends keyof ProfilePayload>(key: K, val: ProfilePayload[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function addToList(key: 'specialization' | 'skills', value: string) {
    const v = value.trim();
    if (!v) return;
    setForm((f) => ({ ...f, [key]: [...((f[key] as string[]) ?? []), v] }));
  }

  function removeFromList(key: 'specialization' | 'skills', idx: number) {
    setForm((f) => ({
      ...f,
      [key]: (f[key] as string[]).filter((_, i) => i !== idx),
    }));
  }

  function addEducation() {
    if (!eduDegree.trim() || !eduInst.trim()) return;
    const item = {
      degree: eduDegree.trim(),
      institution: eduInst.trim(),
      year: eduYear.trim() || String(new Date().getFullYear()),
    };
    setForm((f) => ({
      ...f,
      education: [...(f.education ?? []), item],
    }));
    setEduDegree('');
    setEduInst('');
    setEduYear('');
  }

  function removeEducation(idx: number) {
    setForm((f) => ({
      ...f,
      education: (f.education ?? []).filter((_, i) => i !== idx),
    }));
  }

  function addExperience() {
    if (!expTitle.trim() || !expCompany.trim()) return;
    const item = {
      title: expTitle.trim(),
      company: expCompany.trim(),
      start: expStart.trim() || String(new Date().getFullYear()),
      end: expEnd.trim() || 'Sekarang',
    };
    setForm((f) => ({
      ...f,
      experience: [...(f.experience ?? []), item],
    }));
    setExpTitle('');
    setExpCompany('');
    setExpStart('');
    setExpEnd('');
  }

  function removeExperience(idx: number) {
    setForm((f) => ({
      ...f,
      experience: (f.experience ?? []).filter((_, i) => i !== idx),
    }));
  }

  async function onSave() {
    setSaving(true);
    setMsg(null);
    try {
      await updateProfile(form);
      setMsg({ kind: 'ok', text: 'Profil dan kredensial CV berhasil diperbarui!' });
    } catch (e: any) {
      setMsg({
        kind: 'err',
        text: e?.response?.data?.error || 'Gagal menyimpan perubahan profil',
      });
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerProfile}>
            <Avatar name={user.name} size="lg" role={user.role as any} />
            <div className={styles.headerInfo}>
              <div className={styles.headerTitleRow}>
                <h1 className={styles.title}>{user.name}</h1>
                {user.nameJp && <span className={styles.kanjiBadge}>{user.nameJp}</span>}
                <Badge variant={user.profileVerified ? 'success' : 'warning'} size="sm">
                  {user.profileVerified ? '✓ Terverifikasi' : 'Belum Diverifikasi'}
                </Badge>
              </div>
              <p className={styles.subtitle}>
                {user.email} · Role: {user.role.toUpperCase()}
              </p>
            </div>
          </div>

          <div className={styles.headerActions}>
            <Link to="/cv">
              <Button variant="secondary" size="sm">
                📄 Lihat CV (Rirekisho)
              </Button>
            </Link>
            <Link to="/vault">
              <Button variant="ghost" size="sm">
                🔒 Vault Dokumen
              </Button>
            </Link>
          </div>
        </header>

        {msg && (
          <div className={msg.kind === 'ok' ? styles.alertSuccess : styles.alertError}>
            {msg.text}
          </div>
        )}

        {/* 1. Data Diri & Kontak */}
        <Card title="Data Diri & Identitas" subtitle="Informasi Pribadi & Kontak" padding="lg">
          <div className={styles.grid}>
            <div className={styles.field}>
              <label>Nama Lengkap (Sesuai KTP)</label>
              <input value={user.name} disabled className={styles.disabledInput} />
            </div>
            <div className={styles.field}>
              <label>Nama Bahasa Jepang (Katakana / Kanji)</label>
              <input
                value={form.nameJp ?? ''}
                placeholder="cth. ブディ・サントソ atau 健一"
                onChange={(e) => setField('nameJp', e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label>Tanggal Lahir</label>
              <input
                type="date"
                value={form.birthDate ? form.birthDate.substring(0, 10) : ''}
                onChange={(e) => setField('birthDate', e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label>Asal Kota / Domisili</label>
              <input
                value={form.originCity ?? ''}
                placeholder="cth. Yogyakarta"
                onChange={(e) => setField('originCity', e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label>Nomor Telepon / WhatsApp</label>
              <input
                value={form.phone ?? ''}
                placeholder="cth. +62 812-3456-7890"
                onChange={(e) => setField('phone', e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label>Tingkat Kemampuan JLPT</label>
              <select
                value={form.jlptLevel ?? ''}
                onChange={(e) =>
                  setField('jlptLevel', e.target.value as ProfilePayload['jlptLevel'])
                }
              >
                <option value="">— Belum Ujian JLPT —</option>
                {JLPT.map((l) => (
                  <option key={l} value={l}>
                    JLPT {l}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* 2. Riwayat Pendidikan & Pengalaman */}
        <Card
          title="Riwayat Pendidikan & Pengalaman"
          subtitle="Data untuk pengisian otomatis lembar Rirekisho"
          padding="lg"
        >
          {/* Pendidikan */}
          <div className={styles.subSection}>
            <h3 className={styles.subSectionTitle}>Riwayat Pendidikan (学歴)</h3>
            <div className={styles.inlineForm}>
              <input
                value={eduDegree}
                placeholder="Jenjang / Jurusan (cth. S1 Teknik Informatika)"
                onChange={(e) => setEduDegree(e.target.value)}
              />
              <input
                value={eduInst}
                placeholder="Nama Institusi / Universitas"
                onChange={(e) => setEduInst(e.target.value)}
              />
              <input
                value={eduYear}
                placeholder="Tahun Lulus (cth. 2024)"
                style={{ maxWidth: '140px' }}
                onChange={(e) => setEduYear(e.target.value)}
              />
              <Button size="sm" variant="secondary" onClick={addEducation}>
                + Tambah
              </Button>
            </div>

            <div className={styles.itemsList}>
              {(form.education ?? []).length === 0 ? (
                <p className={styles.emptyText}>Belum ada riwayat pendidikan.</p>
              ) : (
                (form.education ?? []).map((e, idx) => (
                  <div key={idx} className={styles.itemRow}>
                    <div className={styles.itemText}>
                      <strong>{e.degree}</strong> — {e.institution}
                      <span className={styles.itemSub}>{e.year}</span>
                    </div>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => removeEducation(idx)}
                      title="Hapus"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={styles.divider} />

          {/* Pengalaman */}
          <div className={styles.subSection}>
            <h3 className={styles.subSectionTitle}>Pengalaman Kerja / Magang (職歴)</h3>
            <div className={styles.inlineForm}>
              <input
                value={expTitle}
                placeholder="Posisi (cth. Fullstack Intern)"
                onChange={(e) => setExpTitle(e.target.value)}
              />
              <input
                value={expCompany}
                placeholder="Nama Perusahaan"
                onChange={(e) => setExpCompany(e.target.value)}
              />
              <input
                value={expStart}
                placeholder="Mulai (2023)"
                style={{ maxWidth: '110px' }}
                onChange={(e) => setExpStart(e.target.value)}
              />
              <input
                value={expEnd}
                placeholder="Selesai (2024)"
                style={{ maxWidth: '110px' }}
                onChange={(e) => setExpEnd(e.target.value)}
              />
              <Button size="sm" variant="secondary" onClick={addExperience}>
                + Tambah
              </Button>
            </div>

            <div className={styles.itemsList}>
              {(form.experience ?? []).length === 0 ? (
                <p className={styles.emptyText}>Belum ada pengalaman kerja.</p>
              ) : (
                (form.experience ?? []).map((x, idx) => (
                  <div key={idx} className={styles.itemRow}>
                    <div className={styles.itemText}>
                      <strong>{x.title}</strong> @ {x.company}
                      <span className={styles.itemSub}>
                        {x.start} – {x.end || 'Sekarang'}
                      </span>
                    </div>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => removeExperience(idx)}
                      title="Hapus"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>

        {/* 3. Keahlian & Bio */}
        <Card
          title="Keahlian & Profil Singkat"
          subtitle="Spesialisasi dan Deskripsi Diri"
          padding="lg"
        >
          <div className={styles.field}>
            <label>Spesialisasi Kejuruan</label>
            <div className={styles.inlineRow}>
              <input
                value={newSpec}
                onChange={(e) => setNewSpec(e.target.value)}
                placeholder="cth. IT Software Engineering / Manufaktur"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addToList('specialization', newSpec);
                    setNewSpec('');
                  }
                }}
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  addToList('specialization', newSpec);
                  setNewSpec('');
                }}
              >
                Tambah
              </Button>
            </div>
            <div className={styles.tagList}>
              {(form.specialization ?? []).map((s, i) => (
                <span key={i} className={styles.tag}>
                  {s}
                  <button
                    aria-label={`Hapus ${s}`}
                    onClick={() => removeFromList('specialization', i)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label>Keahlian Teknis (Skills)</label>
            <div className={styles.inlineRow}>
              <input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="cth. React, TypeScript, Docker, Kaizen"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addToList('skills', newSkill);
                    setNewSkill('');
                  }
                }}
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  addToList('skills', newSkill);
                  setNewSkill('');
                }}
              >
                Tambah
              </Button>
            </div>
            <div className={styles.tagList}>
              {(form.skills ?? []).map((s, i) => (
                <span key={i} className={styles.tag}>
                  {s}
                  <button aria-label={`Hapus ${s}`} onClick={() => removeFromList('skills', i)}>
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className={styles.grid}>
            <div className={styles.field}>
              <label>Bio Singkat (Bahasa Indonesia)</label>
              <textarea
                value={form.bioId ?? ''}
                placeholder="Deskripsikan latar belakang, motivasi bekerja di Jepang, dan keunggulan Anda..."
                rows={4}
                onChange={(e) => setField('bioId', e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label>Bio Singkat (Bahasa Jepang - 自己紹介)</label>
              <textarea
                value={form.bioJp ?? ''}
                placeholder="初めまして。日本でITエンジニアとして活躍したいと考えております..."
                rows={4}
                onChange={(e) => setField('bioJp', e.target.value)}
              />
            </div>
          </div>

          <div className={styles.actions}>
            <Button variant="primary" onClick={onSave} disabled={saving}>
              {saving ? 'Menyimpan Perubahan...' : 'Simpan Semua Perubahan'}
            </Button>
            <Link to="/cv">
              <Button variant="ghost">Buka CV Builder</Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
