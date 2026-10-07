import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { CAREER_MILESTONES, type CareerMilestone } from '../../data/mockData';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import styles from './CareerTimeline.module.css';

const TYPE_CONFIG: Record<CareerMilestone['type'], { icon: string; label: string; color: string }> =
  {
    placement: { icon: '🛫', label: 'Penempatan', color: 'info' },
    promotion: { icon: '⬆️', label: 'Promosi', color: 'success' },
    contract_renewal: { icon: '📝', label: 'Perpanjangan Kontrak', color: 'warning' },
    transfer: { icon: '🔄', label: 'Transfer', color: 'default' },
    certification: { icon: '🏅', label: 'Sertifikasi', color: 'accent' },
    notification: { icon: '⚡', label: 'Rekomendasi JITA', color: 'danger' },
  };

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function monthsDiff(from: string, to: string) {
  const a = new Date(from);
  const b = new Date(to);
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

export default function CareerTimeline() {
  const { user } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const startDate = CAREER_MILESTONES[0]?.date ?? '';
  const totalMonths = monthsDiff(startDate, new Date().toISOString().slice(0, 10));

  const proactive = CAREER_MILESTONES.filter((m) => m.isProactive);
  const timeline = CAREER_MILESTONES.filter((m) => !m.isProactive);

  const [isConsultModalOpen, setIsConsultModalOpen] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('jita_dismissed_recommendations');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [consultForm, setConsultForm] = useState({
    topic: 'Negosiasi Perpanjangan Kontrak & Evaluasi Gaji',
    preferredDate: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
    preferredTime: '14:00',
    notes: '',
  });

  const handleOpenConsultModal = (m: CareerMilestone) => {
    setConsultForm((prev) => ({
      ...prev,
      topic: m.title.replace('⚡ ', '').trim(),
    }));
    setBookingSuccess(false);
    setIsConsultModalOpen(true);
  };

  const handleDismissReminder = (id: string) => {
    const next = [...dismissedIds, id];
    setDismissedIds(next);
    try {
      localStorage.setItem('jita_dismissed_recommendations', JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const handleRestoreReminder = (id: string) => {
    const next = dismissedIds.filter((item) => item !== id);
    setDismissedIds(next);
    try {
      localStorage.setItem('jita_dismissed_recommendations', JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const handleSubmitConsultation = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingSuccess(true);
    setTimeout(() => {
      setIsConsultModalOpen(false);
      setBookingSuccess(false);
    }, 2500);
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerTitleRow}>
              <h1 className={styles.title}>Lini Masa Karir</h1>
              <span className={styles.kanjiBadge}>キャリアタイムライン</span>
            </div>
            <p className={styles.subtitle}>
              Rekam jejak dan panduan karir jangka panjang alumni JITA di Jepang.
            </p>
          </div>
          <div className={styles.headerMeta}>
            <div className={styles.metaBadge}>
              <span className={styles.metaNum}>{totalMonths}</span>
              <span className={styles.metaLabel}>Bulan di Jepang</span>
            </div>
            <div className={styles.metaBadge}>
              <span className={styles.metaNum}>
                {user?.company ? user.company.split(' ')[0] : 'NSC'}
              </span>
              <span className={styles.metaLabel}>Perusahaan</span>
            </div>
            <div className={styles.metaBadge}>
              <span className={styles.metaNum}>SQE</span>
              <span className={styles.metaLabel}>Posisi</span>
            </div>
          </div>
        </header>

        {/* Proactive Notifications */}
        {proactive.map((m) => {
          const isDismissed = dismissedIds.includes(m.id);

          if (isDismissed) {
            return (
              <div key={m.id} className={styles.dismissedBanner}>
                <span>
                  🔔 Pengingat untuk <strong>{m.title}</strong> ditunda selama 7 hari.
                </span>
                <Button variant="ghost" size="sm" onClick={() => handleRestoreReminder(m.id)}>
                  Tampilkan Kembali
                </Button>
              </div>
            );
          }

          return (
            <div key={m.id} className={styles.proactiveBanner}>
              <div className={styles.proactiveHeader}>
                <span className={styles.proactiveIcon}>⚡</span>
                <div className={styles.proactiveHeaderContent}>
                  <div className={styles.proactiveTitleRow}>
                    <strong className={styles.proactiveTitle}>{m.title}</strong>
                    <Badge variant="warning" size="sm">
                      Rekomendasi Karir
                    </Badge>
                  </div>
                  <p className={styles.proactiveDesc}>{m.description}</p>
                </div>
              </div>
              {m.proactiveMessage && (
                <div className={styles.proactiveInsight}>
                  <span className={styles.insightIcon}>📊</span>
                  <p>{m.proactiveMessage}</p>
                </div>
              )}
              <div className={styles.proactiveActions}>
                <Button variant="primary" size="sm" onClick={() => handleOpenConsultModal(m)}>
                  Jadwalkan Konsultasi
                </Button>
                <Button variant="secondary" size="sm" onClick={() => handleDismissReminder(m.id)}>
                  Ingatkan Nanti
                </Button>
              </div>
            </div>
          );
        })}

        {/* Consultation Modal Dialog */}
        {isConsultModalOpen && (
          <div className={styles.modalBackdrop} onClick={() => setIsConsultModalOpen(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <div className={styles.modalTitleRow}>
                  <h2>Jadwalkan Konsultasi Karir</h2>
                  <span className={styles.modalJp}>キャリア相談予約</span>
                </div>
                <button
                  type="button"
                  className={styles.modalCloseBtn}
                  onClick={() => setIsConsultModalOpen(false)}
                  aria-label="Tutup modal"
                >
                  ✕
                </button>
              </div>

              {bookingSuccess ? (
                <div className={styles.modalSuccessState}>
                  <div className={styles.modalSuccessIcon}>🎉</div>
                  <h3>Jadwal Berhasil Diajukan!</h3>
                  <p>
                    Permintaan konsultasi mengenai <strong>{consultForm.topic}</strong> pada{' '}
                    <strong>
                      {formatDate(consultForm.preferredDate)} pukul {consultForm.preferredTime} JST
                    </strong>{' '}
                    telah diteruskan ke Konsultan Karir JITA. Tim kami akan segera mengirimkan
                    tautan sesi pertemuan.
                  </p>
                </div>
              ) : (
                <form className={styles.modalForm} onSubmit={handleSubmitConsultation}>
                  <div className={styles.modalField}>
                    <label>Fokus Topik Konsultasi</label>
                    <input
                      type="text"
                      value={consultForm.topic}
                      onChange={(e) => setConsultForm((f) => ({ ...f, topic: e.target.value }))}
                      required
                    />
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 'var(--space-3)',
                    }}
                  >
                    <div className={styles.modalField}>
                      <label>Tanggal yang Diinginkan</label>
                      <input
                        type="date"
                        value={consultForm.preferredDate}
                        onChange={(e) =>
                          setConsultForm((f) => ({ ...f, preferredDate: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div className={styles.modalField}>
                      <label>Waktu Pertemuan (JST)</label>
                      <select
                        value={consultForm.preferredTime}
                        onChange={(e) =>
                          setConsultForm((f) => ({ ...f, preferredTime: e.target.value }))
                        }
                      >
                        <option value="10:00">10:00 - 11:00 JST</option>
                        <option value="14:00">14:00 - 15:00 JST</option>
                        <option value="16:00">16:00 - 17:00 JST</option>
                        <option value="19:00">19:00 - 20:00 JST (Malam)</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.modalField}>
                    <label>Catatan Tambahan / Pertanyaan Spesifik</label>
                    <textarea
                      placeholder="cth. Ingin membandingkan standar kenaikan gaji alumni lain di Kansai sebelum berbicara dengan manajer..."
                      value={consultForm.notes}
                      onChange={(e) => setConsultForm((f) => ({ ...f, notes: e.target.value }))}
                    />
                  </div>

                  <div className={styles.modalActions}>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsConsultModalOpen(false)}
                    >
                      Batal
                    </Button>
                    <Button type="submit" variant="primary" size="sm">
                      Kirim Permintaan Konsultasi
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        <div className={styles.layout}>
          {/* Timeline */}
          <div className={styles.timelineCol}>
            <h2 className={styles.sectionTitle}>Lini Masa Karir</h2>
            <div className={styles.timeline}>
              {timeline.map((milestone, idx) => {
                const cfg = TYPE_CONFIG[milestone.type];
                const isExpanded = expandedId === milestone.id;
                const isLast = idx === timeline.length - 1;

                return (
                  <div key={milestone.id} className={styles.timelineItem}>
                    {/* Connector */}
                    {!isLast && <div className={styles.connector} />}

                    {/* Node */}
                    <div
                      className={[
                        styles.node,
                        milestone.type === 'notification' ? styles.nodeAlert : '',
                      ].join(' ')}
                    >
                      <span className={styles.nodeIcon}>{cfg.icon}</span>
                    </div>

                    {/* Content */}
                    <div
                      className={[styles.milestoneCard, isExpanded ? styles.expanded : ''].join(
                        ' '
                      )}
                      onClick={() => setExpandedId(isExpanded ? null : milestone.id)}
                    >
                      <div className={styles.milestoneHeader}>
                        <div className={styles.milestoneLeft}>
                          <Badge variant={cfg.color as any}>{cfg.label}</Badge>
                          <span className={styles.milestoneDate}>{formatDate(milestone.date)}</span>
                        </div>
                        {milestone.salaryChange && (
                          <span className={styles.salaryBadge}>{milestone.salaryChange}</span>
                        )}
                      </div>
                      <h3 className={styles.milestoneTitle}>{milestone.title}</h3>
                      {milestone.titleJp && (
                        <p className={styles.milestoneJp}>{milestone.titleJp}</p>
                      )}
                      <div className={styles.milestoneMeta}>
                        <span>🏢 {milestone.company}</span>
                        <span>📍 {milestone.location}</span>
                      </div>
                      {isExpanded && (
                        <p className={styles.milestoneDesc}>{milestone.description}</p>
                      )}
                      <button className={styles.expandBtn}>
                        {isExpanded ? '▲ Sembunyikan' : '▼ Detail'}
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Future placeholder */}
              <div className={styles.timelineItem}>
                <div className={[styles.node, styles.nodeFuture].join(' ')}>
                  <span>?</span>
                </div>
                <div className={[styles.milestoneCard, styles.futureCard].join(' ')}>
                  <p className={styles.futureText}>Milestone berikutnya akan muncul di sini...</p>
                  <p className={styles.futureHint}>
                    JITA secara aktif memantau perkembangan karir Anda.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className={styles.sidebar}>
            {/* Career Stats */}
            <Card title="Statistik Karir" subtitle="キャリア概要" padding="md">
              <div className={styles.careerStats}>
                {[
                  { label: 'Total Bulan Kerja', value: `${totalMonths}`, unit: 'bulan' },
                  { label: 'Promosi', value: '1', unit: 'kali' },
                  { label: 'Sertifikasi', value: '2', unit: 'total' },
                  { label: 'Perusahaan', value: '1', unit: '' },
                ].map((s) => (
                  <div key={s.label} className={styles.careerStat}>
                    <span className={styles.careerStatVal}>
                      {s.value} <span className={styles.careerStatUnit}>{s.unit}</span>
                    </span>
                    <span className={styles.careerStatLabel}>{s.label}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Next Steps */}
            <Card title="Langkah Strategis" subtitle="Rekomendasi JITA Intelligence" padding="md">
              <div className={styles.nextSteps}>
                {[
                  {
                    icon: '📋',
                    title: 'Negosiasi Kontrak',
                    desc: 'Bulan 15–18 adalah waktu optimal. Anda saat ini di bulan 15.',
                    urgency: 'danger' as const,
                  },
                  {
                    icon: '📜',
                    title: 'Sertifikasi JQHA',
                    desc: 'Tingkatkan nilai pasar Anda dengan sertifikasi Quality Engineer Jepang.',
                    urgency: 'warning' as const,
                  },
                  {
                    icon: '🌐',
                    title: 'Eksplorasi N2',
                    desc: 'Mencapai N2 membuka peluang promosi ke level manajerial.',
                    urgency: 'info' as const,
                  },
                ].map((s) => (
                  <div key={s.title} className={styles.nextStep}>
                    <span className={styles.nextStepIcon}>{s.icon}</span>
                    <div>
                      <span className={styles.nextStepTitle}>{s.title}</span>
                      <p className={styles.nextStepDesc}>{s.desc}</p>
                    </div>
                    <Badge variant={s.urgency} size="sm">
                      {s.urgency === 'danger'
                        ? 'Segera'
                        : s.urgency === 'warning'
                          ? 'Penting'
                          : 'Disarankan'}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>

            {/* Industry Benchmark */}
            <Card title="Benchmark Industri" subtitle="vs. Rata-rata Alumni JITA" padding="md">
              <div className={styles.benchmarks}>
                {[
                  { label: 'Gaji vs. Median Alumni', value: '+8%', positive: true },
                  { label: 'Kecepatan Promosi', value: '-2 bln', positive: true },
                  { label: 'Skor Adaptasi Kultural', value: '88/100', positive: true },
                ].map((b) => (
                  <div key={b.label} className={styles.benchmark}>
                    <span className={styles.benchmarkLabel}>{b.label}</span>
                    <span
                      className={[
                        styles.benchmarkValue,
                        b.positive ? styles.positive : styles.negative,
                      ].join(' ')}
                    >
                      {b.value}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
