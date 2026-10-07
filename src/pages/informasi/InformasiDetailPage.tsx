import { useParams, Link } from 'react-router-dom';
import { usePost } from '../../api/hooks';
import type { PostCategory } from '../../data/mockPosts';
import styles from './InformasiDetailPage.module.css';

export default function InformasiDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading, error } = usePost(slug || '');

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
        return '📢 Pengumuman';
      case 'article':
        return '💡 Artikel & Insight';
      case 'event':
        return '📅 Agenda & Event';
      default:
        return category;
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
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

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div
            style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-secondary)' }}
          >
            Memuat konten...
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <Link to="/informasi" className={styles.backLink}>
            ← Kembali ke Pusat Informasi
          </Link>
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <h2 style={{ color: 'var(--color-primary)' }}>Konten Tidak Ditemukan</h2>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Artikel atau pengumuman yang Anda cari tidak tersedia.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link to="/informasi" className={styles.backLink}>
          ← Kembali ke Pusat Informasi
        </Link>

        <article className={styles.articleCard}>
          <header className={styles.headerMeta}>
            <div className={styles.tagsRow}>
              <span
                className={[styles.categoryBadge, getCategoryBadgeClass(post.category)].join(' ')}
              >
                {getCategoryLabel(post.category)}
              </span>
              <span className={styles.sourceBadge}>Sumber: {post.source_name}</span>
            </div>

            <h1 className={styles.title}>{post.title}</h1>
            {post.title_jp && <div className={styles.titleJp}>{post.title_jp}</div>}

            <div className={styles.publishInfo}>
              {post.author_name && <span>Ditulis oleh: {post.author_name}</span>}
              <span>•</span>
              <span>Diterbitkan: {formatDate(post.created_at)}</span>
              {Boolean(post.views_count) && (
                <>
                  <span>•</span>
                  <span>{post.views_count} pembaca</span>
                </>
              )}
            </div>
          </header>

          {/* Special Box for Events */}
          {post.category === 'event' && post.event_date && (
            <div className={styles.eventAlertBox}>
              <h2 className={styles.eventAlertTitle}>Informasi Pelaksanaan Agenda</h2>
              <div className={styles.eventDetailRow}>
                <strong>Waktu:</strong>
                <span>{formatEventDateTime(post.event_date)}</span>
              </div>
              {post.event_location && (
                <div className={styles.eventDetailRow}>
                  <strong>Lokasi / Platform:</strong>
                  <span>{post.event_location}</span>
                </div>
              )}
              {post.external_link && (
                <a
                  href={post.external_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.actionButton}
                >
                  Daftar / Akses Link Agenda ↗
                </a>
              )}
            </div>
          )}

          {/* Post Content */}
          <div className={styles.contentBody} dangerouslySetInnerHTML={{ __html: post.content }} />

          <footer className={styles.footerSection}>
            <div className={styles.sourceFooter}>
              Dipublikasikan oleh <strong>{post.source_name}</strong> untuk ekosistem JITA.
            </div>

            {post.external_link && post.category !== 'event' && (
              <a
                href={post.external_link}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.backLink}
              >
                Kunjungi Tautan Sumber ↗
              </a>
            )}
          </footer>
        </article>
      </div>
    </div>
  );
}
