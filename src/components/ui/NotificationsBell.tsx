import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  XCircle,
  FileText,
  Inbox,
  Briefcase,
  Target,
  Sparkles,
  Calendar,
  MailOpen,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useMyNotifications, useMarkNotificationRead } from '../../api/hooks';
import type { NotificationItem } from '../../api/notifications';
import styles from './NotificationsBell.module.css';

export default function NotificationsBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data, isLoading, refetch } = useMyNotifications();
  const markReadMutation = useMarkNotificationRead();

  const items = data?.notifications || [];
  const unread = data?.unread || 0;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (!user) return null;

  const handleItemClick = (n: NotificationItem) => {
    if (!n.read_at) {
      markReadMutation.mutate(n.id);
    }

    // Direct routing based on template_key & role
    if (n.template_key === 'document_submitted') {
      navigate('/admin/verifications');
    } else if (n.template_key === 'document_approved' || n.template_key === 'document_rejected') {
      navigate('/vault');
    } else if (n.template_key === 'application_submitted') {
      navigate('/corporate/jobs');
    } else if (n.template_key === 'application_decided' || n.template_key === 'scout_received') {
      navigate('/jobs');
    } else if (n.template_key === 'career_proactive') {
      navigate('/career');
    } else if (n.template_key === 'session_scheduled') {
      navigate('/educator');
    }

    setOpen(false);
  };

  const getNotificationBody = (n: NotificationItem) => {
    if (n.payload_json) {
      try {
        const payload =
          typeof n.payload_json === 'string' ? JSON.parse(n.payload_json) : n.payload_json;
        if (payload.body) return payload.body;
        if (payload.message) return `Pesan: "${payload.message}"`;
        if (payload.notes) return `Catatan: ${payload.notes}`;
      } catch {
        // ignore parse error
      }
    }
    return null;
  };

  const renderTemplateIcon = (key: string) => {
    switch (key) {
      case 'document_approved':
        return <CheckCircle2 size={16} color="var(--color-success)" />;
      case 'document_rejected':
        return <XCircle size={16} color="var(--color-danger)" />;
      case 'document_submitted':
        return <FileText size={16} color="var(--color-primary)" />;
      case 'application_submitted':
        return <Inbox size={16} color="var(--color-role-corporate)" />;
      case 'application_decided':
        return <Briefcase size={16} color="var(--color-info)" />;
      case 'scout_received':
        return <Target size={16} color="var(--color-accent)" />;
      case 'career_proactive':
        return <Sparkles size={16} color="var(--color-warning)" />;
      case 'session_scheduled':
        return <Calendar size={16} color="var(--color-role-silver)" />;
      default:
        return <Bell size={16} color="var(--color-text-secondary)" />;
    }
  };

  return (
    <div className={styles.wrapper} ref={ref}>
      <button
        className={styles.button}
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) refetch();
        }}
        aria-label="Notifikasi"
      >
        <Bell size={20} />
        {unread > 0 && <span className={styles.badge}>{unread}</span>}
      </button>
      {open && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <span className={styles.dropdownTitle}>Pemberitahuan</span>
            {unread > 0 && <span className={styles.unreadCountBadge}>{unread} Baru</span>}
          </div>

          <div className={styles.list}>
            {isLoading ? (
              <div className={styles.empty}>Memuat notifikasi...</div>
            ) : items.length === 0 ? (
              <div className={styles.empty}>
                <MailOpen size={28} style={{ opacity: 0.5 }} />
                <p>Tidak ada notifikasi saat ini.</p>
              </div>
            ) : (
              items.map((n) => {
                const bodyText = getNotificationBody(n);
                const isUnread = !n.read_at;

                return (
                  <div
                    key={n.id}
                    className={[styles.item, isUnread ? styles.unread : '']
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => handleItemClick(n)}
                  >
                    <div className={styles.itemHeader}>
                      <span className={styles.itemIcon}>{renderTemplateIcon(n.template_key)}</span>
                      <strong className={styles.itemSubject}>{n.subject}</strong>
                      {isUnread && <span className={styles.unreadDot} />}
                    </div>

                    {bodyText && <p className={styles.itemBody}>{bodyText}</p>}

                    <div className={styles.meta}>
                      <span className={styles.channelBadge}>{n.channel.toUpperCase()}</span>
                      <span className={styles.timeText}>
                        {new Date(n.created_at).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
