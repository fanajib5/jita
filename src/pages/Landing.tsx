import { Link } from 'react-router-dom';
import { ShieldCheck, GraduationCap, Award, Bot, TrendingUp, Users2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePosts } from '../api/hooks';
import { PLATFORM_STATS } from '../data/mockData';
import styles from './Landing.module.css';

const roles = [
  {
    icon: '🎓',
    label: 'Siswa / Kandidat',
    labelJp: '学生・候補者',
    desc: 'Akses kurikulum pra-migrasi, latih keahlian kultural, dan raih sertifikat JITA untuk karir di Jepang.',
    color: 'student',
  },
  {
    icon: '🏢',
    label: 'Perusahaan Jepang',
    labelJp: '日本企業',
    desc: 'Temukan talenta Indonesia tervalidasi melalui AI Smart Matching dan matriks kesiapan budaya.',
    color: 'corporate',
  },
  {
    icon: '📚',
    label: 'Edukator & Mentor',
    labelJp: '教育者・メンター',
    desc: 'Tutor bilingual dan Silver Jinzai membimbing siswa dari fondasi dasar hingga simulasi bisnis nyata.',
    color: 'educator',
  },
];

const features = [
  {
    icon: ShieldCheck,
    title: 'Identitas Independen',
    desc: 'Daftar langsung ke JITA atau hubungkan akun Pusat Es Kampus. Kontrol penuh atas data Anda.',
    color: 'var(--color-primary)',
  },
  {
    icon: GraduationCap,
    title: 'Kurikulum Berjenjang',
    desc: 'Dari fondasi Bahasa Jepang hingga simulasi negosiasi bisnis dengan eksekutif Jepang.',
    color: 'var(--color-role-student)',
  },
  {
    icon: Award,
    title: 'Kredensial JITA Resmi',
    desc: 'JITA menerbitkan sertifikat dan transkrip program resmi sebagai bukti kompetensi siap kerja.',
    color: 'var(--color-success)',
  },
  {
    icon: Bot,
    title: 'AI Smart Matching',
    desc: 'Sistem pencocokan cerdas menghubungkan kandidat dengan perusahaan Jepang yang paling sesuai.',
    color: 'var(--color-role-corporate)',
  },
  {
    icon: TrendingUp,
    title: 'Career Intelligence',
    desc: 'Panduan karir seumur hidup: notifikasi negosiasi kontrak, promosi, dan perpindahan kerja.',
    color: 'var(--color-warning)',
  },
  {
    icon: Users2,
    title: 'Jaringan Silver Jinzai',
    desc: 'Bimbing langsung oleh pensiunan dan eksekutif industri Jepang untuk tacit knowledge.',
    color: 'var(--color-role-silver)',
  },
];

export default function Landing() {
  const { isAuthenticated, user } = useAuth();
  const { data: postsData } = usePosts({ limit: 3 });

  const getStartedPath = () => {
    if (!isAuthenticated) return '/login';
    switch (user?.role) {
      case 'student':
        return '/student';
      case 'corporate':
        return '/corporate';
      case 'educator_bilingual':
      case 'educator_silver':
        return '/educator';
      case 'alumni':
        return '/career';
      default:
        return '/login';
    }
  };

  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <span className={styles.heroBadgeDot} />
            Platform Resmi Persiapan Karir Industri Jepang
          </div>
          <h1 className={styles.heroTitle}>
            Japan Industry
            <br />
            <span className={styles.heroAccent}>Training Academy</span>
          </h1>
          <p className={styles.heroTitleJp}>日本産業訓練アカデミー</p>
          <p className={styles.heroDesc}>
            Ekosistem pra-migrasi terintegrasi yang mempersiapkan talenta Indonesia untuk bekerja
            dan berkembang di industri Jepang — dari fondasi bahasa hingga penempatan kerja resmi.
          </p>
          <div className={styles.heroCta}>
            <Link to={getStartedPath()} className={styles.ctaPrimary}>
              {isAuthenticated ? 'Buka Dashboard' : 'Mulai Sekarang'}
            </Link>
            {!isAuthenticated && (
              <Link to="/register" className={styles.ctaSecondary}>
                Pelajari Lebih Lanjut
              </Link>
            )}
          </div>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.heroCard}>
            <div className={styles.heroCardHeader}>
              <span className={styles.heroCardDot} style={{ background: '#c0392b' }} />
              <span className={styles.heroCardDot} style={{ background: '#e67e22' }} />
              <span className={styles.heroCardDot} style={{ background: '#27ae60' }} />
              <img
                src={`${import.meta.env.BASE_URL}logo.png`}
                alt="JITA"
                style={{ height: '20px', marginLeft: '6px', objectFit: 'contain' }}
              />
              <span className={styles.heroCardTitle}>JITA Platform</span>
            </div>
            <div className={styles.heroCardBody}>
              <div className={styles.heroStat}>
                <span className={styles.heroStatNum}>{PLATFORM_STATS.placementRate}%</span>
                <span className={styles.heroStatLabel}>Tingkat Penempatan</span>
              </div>
              <div className={styles.heroStatDivider} />
              <div className={styles.heroStat}>
                <span className={styles.heroStatNum}>
                  {PLATFORM_STATS.totalAlumni.toLocaleString()}
                </span>
                <span className={styles.heroStatLabel}>Alumni Aktif</span>
              </div>
              <div className={styles.heroStatDivider} />
              <div className={styles.heroStat}>
                <span className={styles.heroStatNum}>{PLATFORM_STATS.partnerCompanies}</span>
                <span className={styles.heroStatLabel}>Perusahaan Mitra</span>
              </div>
            </div>
            <div className={styles.heroProgress}>
              <div className={styles.heroProgressLabel}>
                <span>Kurikulum Aktif</span>
                <span>Fase 2 / 4</span>
              </div>
              <div className={styles.heroProgressTrack}>
                <div className={styles.heroProgressFill} style={{ width: '50%' }} />
              </div>
            </div>
          </div>
          <div className={styles.heroBg}>
            <span>日</span>
            <span>本</span>
            <span>産</span>
            <span>業</span>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className={styles.divider}>
        <span className={styles.dividerLine} />
        <span className={styles.dividerText}>Untuk Siapa?</span>
        <span className={styles.dividerLine} />
      </div>

      {/* Roles */}
      <section className={styles.roles}>
        <div className={styles.container}>
          <div className={styles.rolesGrid}>
            {roles.map((role) => (
              <div key={role.label} className={[styles.roleCard, styles[role.color]].join(' ')}>
                <span className={styles.roleIcon}>{role.icon}</span>
                <div>
                  <h3 className={styles.roleLabel}>{role.label}</h3>
                  <p className={styles.roleLabelJp}>{role.labelJp}</p>
                </div>
                <p className={styles.roleDesc}>{role.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className={styles.stats}>
        <div className={styles.container}>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statNum}>{PLATFORM_STATS.totalAlumni.toLocaleString()}+</span>
              <span className={styles.statLabel}>Alumni Tersertifikasi</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNum}>{PLATFORM_STATS.placementRate}%</span>
              <span className={styles.statLabel}>Tingkat Penempatan Kerja</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNum}>{PLATFORM_STATS.partnerCompanies}</span>
              <span className={styles.statLabel}>Perusahaan Jepang Mitra</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNum}>{PLATFORM_STATS.avgTimeToPlacement}</span>
              <span className={styles.statLabel}>Bulan Rata-rata ke Penempatan</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={styles.features}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Ekosistem Terintegrasi</h2>
            <p className={styles.sectionDesc}>
              Setiap komponen dirancang untuk membawa Anda dari nol hingga siap bekerja di Jepang.
            </p>
          </div>
          <div className={styles.featuresGrid}>
            {features.map((f) => {
              const IconComp = f.icon;
              return (
                <div key={f.title} className={styles.featureCard}>
                  <div className={styles.featureIconBox} style={{ color: f.color }}>
                    <IconComp size={24} />
                  </div>
                  <h3 className={styles.featureTitle}>{f.title}</h3>
                  <p className={styles.featureDesc}>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* News & Agenda Hub Section */}
      <section className={styles.newsSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div className={styles.newsBadge}>
              <span>📢 お知らせ • NEWS & INSIGHTS</span>
            </div>
            <h2 className={styles.sectionTitle}>Pusat Informasi & Agenda</h2>
            <p className={styles.sectionDesc}>
              Update pendaftaran Pusat Es Kampus, wawasan rekrutmen dari perusahaan Jepang, dan
              agenda pelatihan bahasa.
            </p>
          </div>

          <div className={styles.newsGrid}>
            {(postsData?.posts || []).slice(0, 3).map((post) => (
              <Link
                key={post.id}
                to={`/informasi/${post.slug || post.id}`}
                className={styles.newsCard}
              >
                <div className={styles.newsCardHeader}>
                  <span
                    className={styles.newsCategoryBadge}
                    style={{
                      background:
                        post.category === 'announcement'
                          ? '#fef2f2'
                          : post.category === 'event'
                            ? '#f0fdf4'
                            : '#eff6ff',
                      color:
                        post.category === 'announcement'
                          ? 'var(--color-accent)'
                          : post.category === 'event'
                            ? '#166534'
                            : 'var(--color-primary)',
                    }}
                  >
                    {post.category === 'announcement'
                      ? 'Pengumuman'
                      : post.category === 'event'
                        ? 'Agenda & Event'
                        : 'Artikel'}
                  </span>
                  <span className={styles.newsSource}>{post.source_name}</span>
                </div>

                <h3 className={styles.newsCardTitle}>{post.title}</h3>
                {post.excerpt && <p className={styles.newsCardExcerpt}>{post.excerpt}</p>}

                <div className={styles.newsCardDate}>
                  <span>
                    {new Date(post.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                    Lihat Detail →
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className={styles.newsActionRow}>
            <Link to="/informasi" className={styles.viewAllBtn}>
              Lihat Semua Informasi & Agenda →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <div className={styles.ctaBox}>
            <h2 className={styles.ctaTitle}>Siap Memulai Perjalanan Karir Anda?</h2>
            <p className={styles.ctaDesc}>
              Bergabunglah dengan para alumni JITA yang kini berkarir di industri-industri terkemuka
              Jepang.
            </p>
            <Link to="/register" className={styles.ctaPrimaryLarge}>
              Daftar Gratis Sekarang
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerContent}>
            <div>
              <img
                src={`${import.meta.env.BASE_URL}logo.png`}
                alt="JITA Logo"
                style={{ height: '40px', marginBottom: '0.5rem' }}
              />
              <p className={styles.footerDesc}>
                Japan Industry Training Academy — Membangun Jembatan Talenta Indonesia-Jepang.
              </p>
            </div>
            <div className={styles.footerLinks}>
              <span className={styles.footerLinkLabel}>Integrasi</span>
              <span className={styles.footerLink}>Pusat Es Kampus (Opsional)</span>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <span>© 2026 JITA. All rights reserved.</span>
            <span>日本産業訓練アカデミー</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
