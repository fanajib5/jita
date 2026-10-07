import React from 'react';
import styles from './Badge.module.css';

type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'accent'
  | 'sakura'
  | 'student'
  | 'corporate'
  | 'educator'
  | 'silver';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
  size?: 'sm' | 'md';
}

export function Badge({ children, variant = 'default', dot = false, size = 'md' }: BadgeProps) {
  const classes = [styles.badge, styles[variant], styles[size]].join(' ');
  return (
    <span className={classes}>
      {dot && <span className={styles.dot} />}
      {children}
    </span>
  );
}
