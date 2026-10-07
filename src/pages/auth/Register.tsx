import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterFormData, useRegisterMutation } from '../../api/hooks';
import { Eye, EyeOff } from 'lucide-react';
import styles from './Register.module.css';

export default function Register() {
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const registerMutation = useRegisterMutation();

  const onSubmit = (data: RegisterFormData) => {
    setErrorMsg('');
    registerMutation.mutate(data, {
      onSuccess: () => {
        navigate('/student');
      },
      onError: (err: any) => {
        setErrorMsg(
          err.response?.data?.error?.message ||
            err.response?.data?.error ||
            'Gagal mendaftar, periksa kembali data Anda.'
        );
      },
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <Link to="/" className={styles.logoLink} aria-label="Beranda JITA">
              <img
                src={`${import.meta.env.BASE_URL}logo.png`}
                alt="JITA Logo"
                className={styles.logoImg}
              />
            </Link>
            <h1 className={styles.title}>Buat Akun JITA</h1>
            <p className={styles.subtitle}>日本産業訓練アカデミー · Registrasi Siswa</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
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

            <div className={styles.field}>
              <label className={styles.label} htmlFor="name">
                Nama Lengkap
              </label>
              <input
                id="name"
                type="text"
                {...register('name')}
                placeholder="cth. Budi Santoso"
                className={styles.input}
                autoComplete="name"
              />
              {errors.name && (
                <span style={{ color: 'var(--color-danger)', fontSize: '0.8rem' }}>
                  {errors.name.message}
                </span>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="reg-email">
                Alamat Email
              </label>
              <input
                id="reg-email"
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

            <div className={styles.field}>
              <label className={styles.label} htmlFor="reg-password">
                Password
              </label>
              <div className={styles.passwordWrapper}>
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="Minimal 6 karakter"
                  className={`${styles.input} ${styles.passwordInput}`}
                  autoComplete="new-password"
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

            <button
              type="submit"
              disabled={registerMutation.isPending}
              className={styles.submitBtn}
            >
              {registerMutation.isPending ? (
                <>
                  <span className={styles.spinner} /> Mendaftarkan...
                </>
              ) : (
                'Daftar Akun Baru'
              )}
            </button>

            {/* Divider SSO */}
            <div className={styles.ssoDivider}>
              <span>atau daftar cepat</span>
            </div>

            <button
              type="button"
              className={styles.ssoBtn}
              onClick={() => {
                window.location.href =
                  'https://pusates.kampusmus.id/id/login-user/?redirect_to=https%3A%2F%2Fpusates.kampusmus.id%2Fwp-admin%2Fadmin-post.php%3Faction%3Dice_sso_jita';
              }}
            >
              🎓 Daftar via SSO Pusat Es
            </button>
          </form>

          <div className={styles.footer}>
            <span>Sudah punya akun?</span>
            <Link to="/login" className={styles.footerLink}>
              Masuk di sini
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
