import styles from './Avatar.module.css';

interface AvatarProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  role?: 'student' | 'corporate' | 'educator' | 'silver' | 'alumni';
  src?: string;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export function Avatar({ name, size = 'md', role, src }: AvatarProps) {
  const classes = [styles.avatar, styles[size], role ? styles[role] : ''].filter(Boolean).join(' ');

  if (src) {
    return <img src={src} alt={name} className={classes} />;
  }

  return (
    <div className={classes} title={name}>
      {getInitials(name)}
    </div>
  );
}
