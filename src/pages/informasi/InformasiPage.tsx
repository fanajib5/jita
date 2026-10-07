import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { usePosts } from '../../api/hooks';
import type { PostCategory } from '../../data/mockPosts';
import styles from './InformasiPage.module.css';

const CATEGORIES: { id: string; label: string; icon: string }[] = [
  { id: 'all', label: 'Semua Konten', icon: '🌐' },
  { id: 'announcement', label: 'Pengumuman', icon: '📢' },
  { id: 'article', label: 'Artikel & Insight', icon: '💡' },
  { id: 'event', label: 'Agenda & Event', icon: '📅' },
];

const SOURCES: { id: string; label: string }[] = [
  { id: 'all', label: 'Semua Sumber' },
  { id: 'ice_center', label: 'Pusat Es Kampus' },
  { id: 'corporate', label: 'Perusahaan Jepang' },
  { id: 'partner_educator', label: 'Mitra & Lembaga Bahasa' },
  { id: 'official', label: 'JITA Official' },
];

export default function InformasiPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { data, isLoading } = usePosts({
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    sourceType: selectedSource !== 'all' ? selectedSource : undefined,
    search: searchQuery.trim() || undefined,
  });

  const posts = useMemo(() => data?.posts || [], [data]);

  const getCategoryBadgeClass = (category: PostCategory) => {
    switch (category) {
      case 'announcement':
        return styles.badgeAnnouncement;
      case 'article':
        return styles.badgeArticle;
      case 'event':
        return styles.badgeEvent;
      default:
        return '';
    }
  };

  const getCategoryLabel = (category: PostCategory) => {
    switch (category) {
      case 'announcement':
        return 'Pengumuman';
      case 'article':
        return 'Artikel';
      case 'event':
        return 'Event / Agenda';
      default:
        return category;
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatEventDateTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Header Banner */}
        <header className={styles.header}>
          <div className={styles.headerTitleWrapper}>
            <div className={styles.headerTitleRow}>
              <h1 className={styles.title}>Pusat Informasi & Wawasan</h1>
              <span className={styles.kanjiBadge}>情報センター</span>
            </div>
            <p className={styles.subtitle}>
              Kumpulan pengumuman resmi seleksi Pusat Es Kampus, wawasan karir langsung dari
              perusahaan Jepang, serta agenda pelatihan dari mitra lembaga bahasa.
            </p>
          </div>
        </header>

        {/* Controls & Filter Bar */}
        <div className={styles.controlsBar}>
          <div className={styles.categoryTabs}>
            {CATEGORIES.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={[
                  styles.tabBtn,
                  selectedCategory === tab.id ? styles.tabBtnActive : '',
                ].join(' ')}
                onClick={() => setSelectedCategory(tab.id)}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className={styles.filterGroup}>
            <select
              aria-label="Filter Sumber"
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className={styles.sourceSelect}
            >
              {SOURCES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>

            <input
              type="text"
              aria-label="Cari Berita & Agenda"
              placeholder="Cari berita & agenda..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        {/* Content Section */}
        {isLoading ? (
          <div
            style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-secondary)' }}
          >
            Memuat informasi...
          </div>
        ) : posts.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateTitle}>Tidak Ada Konten Ditemukan</div>
            <p>Cobalah mengganti kata kunci pencarian atau memilih kategori yang berbeda.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {posts.map((post) => (
              <Link key={post.id} to={`/informasi/${post.slug || post.id}`} className={styles.card}>
                <div className={styles.cardTop}>
                  <div className={styles.cardMetaRow}>
                    <span
                      className={[styles.categoryBadge, getCategoryBadgeClass(post.category)].join(
                        ' '
                      )}
                    >
                      {getCategoryLabel(post.category)}
                    </span>
                    {Boolean(post.is_pinned) && (
                      <span className={styles.pinnedIndicator}>📌 Pinned</span>
                    )}
                  </div>

                  <span className={styles.sourceBadge}>{post.source_name}</span>

                  <h2 className={styles.cardTitle}>{post.title}</h2>
                  {post.title_jp && <div className={styles.cardTitleJp}>{post.title_jp}</div>}

                  {post.excerpt && <p className={styles.cardExcerpt}>{post.excerpt}</p>}

                  {post.category === 'event' && post.event_date && (
                    <div className={styles.eventScheduleBox}>
                      <div>
                        <strong>Waktu:</strong> {formatEventDateTime(post.event_date)}
                      </div>
                      {post.event_location && (
                        <div>
                          <strong>Lokasi:</strong> {post.event_location}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className={styles.cardFooter}>
                  <span>{formatDate(post.created_at)}</span>
                  <span className={styles.readMoreLink}>
                    {post.category === 'event' ? 'Lihat Agenda →' : 'Baca Selengkapnya →'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
