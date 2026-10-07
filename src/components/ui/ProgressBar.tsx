import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  value: number; // 0–100
  label?: string;
  showValue?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export function ProgressBar({
  value,
  label,
  showValue = true,
  variant = 'default',
  size = 'md',
  animated = true,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={styles.wrapper}>
      {(label || showValue) && (
        <div className={styles.meta}>
          {label && <span className={styles.label}>{label}</span>}
          {showValue && <span className={styles.value}>{clamped}%</span>}
        </div>
      )}
      <div className={[styles.track, styles[size]].join(' ')}>
        <div
          className={[styles.fill, styles[variant], animated ? styles.animated : ''].join(' ')}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
