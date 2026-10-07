import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { UserRole } from '../../data/mockData';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        style={{
          padding: '4rem',
          textAlign: 'center',
          color: 'var(--color-text-secondary)',
        }}
      >
        Memuat sesi...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    // Sesi tidak ada/tidak valid -> langsung redirect ke halaman login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Role tidak cocok -> redirect ke dashboard masing-masing role
    switch (user.role) {
      case 'student':
        return <Navigate to="/student" replace />;
      case 'corporate':
        return <Navigate to="/corporate" replace />;
      case 'educator_bilingual':
      case 'educator_silver':
        return <Navigate to="/educator" replace />;
      case 'alumni':
        return <Navigate to="/career" replace />;
      case 'admin':
        return <Navigate to="/admin/verifications" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return children;
}
