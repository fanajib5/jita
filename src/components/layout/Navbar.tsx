import { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import NotificationsBell from '../ui/NotificationsBell';
import styles from './Navbar.module.css';
import type { UserRole } from '../../data/mockData';
import {
  User,
  FolderLock,
  FileText,
  Building2,
  Briefcase,
  Search,
  ShieldCheck,
  LogOut,
} from 'lucide-react';

const ROLE_LABELS: Record<UserRole, string> = {
  student: 'Siswa',
  corporate: 'Corporate HR',
  educator_bilingual: 'Educator — Bilingual',
  educator_silver: 'Silver Jinzai',
  alumni: 'Alumni',
  admin: 'Admin',
};

const ROLE_COLORS: Record<UserRole, string> = {
  student: 'student',
  corporate: 'corporate',
  educator_bilingual: 'educator',
  educator_silver: 'silver',
  alumni: 'alumni',
  admin: 'admin',
};

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  // Close mobile nav on route change / outside click
  useEffect(() => {
    if (mobileNavOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileNavOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMenuOpen(false);
    setMobileNavOpen(false);
  };

  const getNavLinks = () => {
    if (!user) return [{ to: '/informasi', label: 'Informasi' }];
    switch (user.role) {
      case 'student':
        return [
          { to: '/student', label: 'Dashboard' },
          { to: '/student/courses', label: 'Modul' },
          { to: '/vault', label: 'Vault Dokumen' },
          { to: '/cv', label: 'CV Builder' },
          { to: '/jobs', label: 'Lowongan' },
          { to: '/career', label: 'Timeline' },
          { to: '/informasi', label: 'Informasi' },
        ];
      case 'corporate':
        return [
          { to: '/corporate', label: 'Portal Rekrutmen' },
          { to: '/corporate/jobs', label: 'Kelola Lowongan' },
          { to: '/corporate/scout', label: 'Scout Talent' },
          { to: '/informasi', label: 'Informasi' },
        ];
      case 'educator_bilingual':
      case 'educator_silver':
        return [
          { to: '/educator', label: 'Portal Edukator' },
          { to: '/calendar', label: 'Kalender' },
          { to: '/informasi', label: 'Informasi' },
        ];
      case 'alumni':
        return [
          { to: '/career', label: 'Lini Masa Karir' },
          { to: '/jobs', label: 'Bursa Lowongan' },
          { to: '/cv', label: 'CV Builder' },
          { to: '/vault', label: 'Vault Dokumen' },
          { to: '/informasi', label: 'Informasi' },
        ];
      case 'admin':
        return [
          { to: '/admin/verifications', label: 'Verifikasi Dokumen' },
          { to: '/corporate/jobs', label: 'Kelola Lowongan' },
          { to: '/informasi', label: 'Informasi' },
        ];
      default:
        return [{ to: '/informasi', label: 'Informasi' }];
    }
  };

  const navLinks = getNavLinks();

  return (
    <header className={styles.navbar}>
      <div className={styles.inner}>
        {/* Logo */}
        <NavLink to="/" className={styles.logo} onClick={() => setMobileNavOpen(false)}>
          <img
            src={`${import.meta.env.BASE_URL}logo.png`}
            alt="JITA Logo"
            style={{ height: '36px', objectFit: 'contain' }}
          />
        </NavLink>

        {/* Desktop Nav links */}
        {isAuthenticated && (
          <nav className={styles.nav}>
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end
                className={({ isActive }) =>
                  [styles.navLink, isActive ? styles.active : ''].join(' ')
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        )}

        {/* Right side */}
        <div className={styles.right}>
          {isAuthenticated && user && <NotificationsBell />}
          {isAuthenticated && user ? (
            <div className={styles.userMenu} ref={menuRef}>
              <button
                className={styles.userBtn}
                onClick={() => setMenuOpen(!menuOpen)}
                aria-expanded={menuOpen}
                aria-haspopup="true"
              >
                <Avatar name={user.name} size="sm" role={ROLE_COLORS[user.role] as any} />
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{user.name}</span>
                  <span className={[styles.userRole, styles[ROLE_COLORS[user.role]]].join(' ')}>
                    {ROLE_LABELS[user.role]}
                  </span>
                </div>
                <span className={styles.chevron}>{menuOpen ? '▲' : '▼'}</span>
              </button>

              {menuOpen && (
                <div className={styles.dropdown}>
                  <div className={styles.dropdownHeader}>
                    <div className={styles.dropdownUserRow}>
                      <Avatar name={user.name} size="md" role={ROLE_COLORS[user.role] as any} />
                      <div className={styles.dropdownUserMeta}>
                        <span className={styles.dropdownName}>{user.name}</span>
                        {user.nameJp && (
                          <span className={styles.dropdownNameJp}>{user.nameJp}</span>
                        )}
                        <span className={styles.dropdownEmail}>{user.email}</span>
                      </div>
                    </div>

                    <div className={styles.dropdownBadges}>
                      <span
                        className={[styles.userRoleBadge, styles[ROLE_COLORS[user.role]]].join(' ')}
                      >
                        {ROLE_LABELS[user.role]}
                      </span>
                      {user.role === 'student' && (
                        <Badge variant={user.profileVerified ? 'success' : 'warning'} size="sm">
                          {user.profileVerified ? '✓ Terverifikasi' : 'Belum Diverifikasi'}
                        </Badge>
                      )}
                      {user.company && (
                        <span className={styles.dropdownCompanyBadge}>{user.company}</span>
                      )}
                    </div>
                  </div>

                  <div className={styles.dropdownDivider} />

                  <div className={styles.dropdownNav}>
                    {(user.role === 'student' || user.role === 'alumni') && (
                      <>
                        <Link
                          to="/profile"
                          className={styles.dropdownLink}
                          onClick={() => setMenuOpen(false)}
                        >
                          <User className={styles.dropdownIcon} size={16} />
                          <div className={styles.dropdownLinkText}>
                            <strong>Profil Saya</strong>
                            <small>Data diri, JLPT & riwayat</small>
                          </div>
                        </Link>
                        <Link
                          to="/vault"
                          className={styles.dropdownLink}
                          onClick={() => setMenuOpen(false)}
                        >
                          <FolderLock className={styles.dropdownIcon} size={16} />
                          <div className={styles.dropdownLinkText}>
                            <strong>Document Vault</strong>
                            <small>KTP, sertifikat & berkas</small>
                          </div>
                        </Link>
                        <Link
                          to="/cv"
                          className={styles.dropdownLink}
                          onClick={() => setMenuOpen(false)}
                        >
                          <FileText className={styles.dropdownIcon} size={16} />
                          <div className={styles.dropdownLinkText}>
                            <strong>CV Generator</strong>
                            <small>Rirekisho format JIS Jepang</small>
                          </div>
                        </Link>
                        <Link
                          to="/jobs"
                          className={styles.dropdownLink}
                          onClick={() => setMenuOpen(false)}
                        >
                          <Briefcase className={styles.dropdownIcon} size={16} />
                          <div className={styles.dropdownLinkText}>
                            <strong>Bursa Lowongan</strong>
                            <small>Karir kerja di Jepang</small>
                          </div>
                        </Link>
                      </>
                    )}

                    {user.role === 'corporate' && (
                      <>
                        <Link
                          to="/corporate"
                          className={styles.dropdownLink}
                          onClick={() => setMenuOpen(false)}
                        >
                          <Building2 className={styles.dropdownIcon} size={16} />
                          <div className={styles.dropdownLinkText}>
                            <strong>Portal Rekrutmen</strong>
                          </div>
                        </Link>
                        <Link
                          to="/corporate/jobs"
                          className={styles.dropdownLink}
                          onClick={() => setMenuOpen(false)}
                        >
                          <Briefcase className={styles.dropdownIcon} size={16} />
                          <div className={styles.dropdownLinkText}>
                            <strong>Kelola Lowongan</strong>
                          </div>
                        </Link>
                        <Link
                          to="/corporate/scout"
                          className={styles.dropdownLink}
                          onClick={() => setMenuOpen(false)}
                        >
                          <Search className={styles.dropdownIcon} size={16} />
                          <div className={styles.dropdownLinkText}>
                            <strong>Scout Talent</strong>
                          </div>
                        </Link>
                      </>
                    )}

                    {user.role === 'admin' && (
                      <Link
                        to="/admin/verifications"
                        className={styles.dropdownLink}
                        onClick={() => setMenuOpen(false)}
                      >
                        <ShieldCheck className={styles.dropdownIcon} size={16} />
                        <div className={styles.dropdownLinkText}>
                          <strong>Verifikasi Dokumen</strong>
                        </div>
                      </Link>
                    )}
                  </div>

                  <div className={styles.dropdownDivider} />

                  <button className={styles.dropdownItem} onClick={handleLogout}>
                    <LogOut className={styles.dropdownIcon} size={16} />
                    <span>Keluar dari Akun</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.authLinks}>
              <NavLink to="/login" className={styles.loginLink}>
                Masuk
              </NavLink>
              <NavLink to="/register" className={styles.registerBtn}>
                Daftar
              </NavLink>
            </div>
          )}

          {/* Hamburger button — mobile only */}
          {isAuthenticated && navLinks.length > 0 && (
            <button
              className={styles.hamburger}
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              aria-expanded={mobileNavOpen}
              aria-label={mobileNavOpen ? 'Tutup menu' : 'Buka menu'}
            >
              <span className={styles.hamburgerBar} />
              <span className={styles.hamburgerBar} />
              <span className={styles.hamburgerBar} />
            </button>
          )}
        </div>
      </div>

      {/* Mobile nav overlay & drawer — only when authenticated */}
      {isAuthenticated && navLinks.length > 0 && (
        <>
          {mobileNavOpen && (
            <div
              className={styles.mobileOverlay}
              onClick={() => setMobileNavOpen(false)}
              aria-hidden="true"
            />
          )}

          <nav
            className={[styles.mobileNav, mobileNavOpen ? styles.mobileNavOpen : ''].join(' ')}
            aria-label="Mobile navigation"
          >
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end
                className={({ isActive }) =>
                  [styles.mobileNavLink, isActive ? styles.mobileNavLinkActive : ''].join(' ')
                }
                onClick={() => setMobileNavOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
            <div className={styles.mobileNavDivider} />
            <button className={styles.mobileNavLogout} onClick={handleLogout}>
              <LogOut size={16} />
              Keluar dari Akun
            </button>
          </nav>
        </>
      )}
    </header>
  );
}
