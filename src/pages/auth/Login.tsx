import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../contexts/AuthContext';
import { loginSchema, type LoginFormData, useLoginMutation } from '../../api/hooks';
import { Eye, EyeOff } from 'lucide-react';
import styles from './Login.module.css';

export default function Login() {
  const [searchParams] = useSearchParams();
  const [errorMsg, setErrorMsg] = useState('');
  const [noticeMsg, setNoticeMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (searchParams.get('session_expired')) {
      setNoticeMsg('Sesi Anda telah berakhir. Silakan masuk kembali untuk melanjutkan.');
    }
  }, [searchParams]);

  // Jika sudah terotentikasi dan tidak sedang loading, arahkan langsung ke dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      switch (user.role) {
        case 'student':
          navigate('/student', { replace: true });
          break;
        case 'corporate':
          navigate('/corporate', { replace: true });
          break;
        case 'educator_bilingual':
        case 'educator_silver':
          navigate('/educator', { replace: true });
          break;
        case 'alumni':
          navigate('/career', { replace: true });
          break;
        case 'admin':
          navigate('/admin/verifications', { replace: true });
          break;
        default:
          navigate('/student', { replace: true });
          break;
      }
    }
  }, [isAuthenticated, isLoading, user, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useLoginMutation();

  const onSubmit = (data: LoginFormData) => {
    setErrorMsg('');
    loginMutation.mutate(data, {
      onSuccess: (res) => {
        const loggedInUser = res.user;
        switch (loggedInUser?.role) {
          case 'student':
            navigate('/student');
            break;
          case 'corporate':
            navigate('/corporate');
            break;
          case 'educator_bilingual':
          case 'educator_silver':
            navigate('/educator');
            break;
          case 'alumni':
            navigate('/career');
            break;
          case 'admin':
            navigate('/admin/verifications');
            break;
          default:
            navigate('/student');
            break;
        }
      },
      onError: (err: any) => {
        setErrorMsg(
          err.response?.data?.error?.message ||
            err.response?.data?.error ||
            'Email atau password salah.'
        );
      },
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.card}>
          {/* Header */}
          <div className={styles.header}>
            <Link to="/" className={styles.logoLink} aria-label="Beranda JITA">
              <img
                src={`${import.meta.env.BASE_URL}logo.png`}
                alt="JITA Logo"
                className={styles.logoImg}
              />
            </Link>
            <h1 className={styles.title}>Masuk ke Platform</h1>
            <p className={styles.subtitle}>日本産業訓練アカデミー · Portal Akses</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            {noticeMsg && (
              <div
                style={{
                  color: 'var(--color-warning)',
                  marginBottom: '0.75rem',
                  padding: '0.75rem 1rem',
                  background: 'var(--color-warning-soft)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                  border: '1px solid var(--color-warning)',
                }}
              >
                ⚠️ {noticeMsg}
              </div>
            )}

            {errorMsg && (
              <div
                className={styles.errorAlert}
                style={{
                  color: 'var(--color-error)',
                  marginBottom: '0.75rem',
                  padding: '0.75rem 1rem',
                  background: 'var(--color-error-soft)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                }}
              >
                {errorMsg}
              </div>
            )}

            {/* Email */}
            <div className={styles.field}>
              <label className={styles.label} htmlFor="email">
                Alamat Email
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                placeholder="nama@email.com"
                className={styles.input}
                autoComplete="email"
              />
              {errors.email && (
                <span style={{ color: 'var(--color-danger)', fontSize: '0.8rem' }}>
                  {errors.email.message}
                </span>
              )}
            </div>

            {/* Password */}
            <div className={styles.field}>
              <label className={styles.label} htmlFor="password">
                Password
              </label>
              <div className={styles.passwordWrapper}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="••••••••"
                  className={`${styles.input} ${styles.passwordInput}`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className={styles.passwordToggleBtn}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <span style={{ color: 'var(--color-danger)', fontSize: '0.8rem' }}>
                  {errors.password.message}
                </span>
              )}
            </div>

            <button type="submit" disabled={loginMutation.isPending} className={styles.submitBtn}>
              {loginMutation.isPending ? (
                <>
                  <span className={styles.spinner} /> Masuk...
                </>
              ) : (
                'Masuk'
              )}
            </button>

            {/* Divider SSO */}
            <div className={styles.ssoDivider}>
              <span>atau</span>
            </div>

            <button
              type="button"
              className={styles.ssoBtn}
              onClick={() => {
                window.location.href =
                  'https://pusates.kampusmus.id/id/login-user/?redirect_to=https%3A%2F%2Fpusates.kampusmus.id%2Fwp-admin%2Fadmin-post.php%3Faction%3Dice_sso_jita';
              }}
            >
              🎓 Masuk via SSO Pusat Es
            </button>
          </form>

          <div className={styles.footer}>
            <span>Belum punya akun?</span>
            <Link to="/register" className={styles.footerLink}>
              Daftar sekarang
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
