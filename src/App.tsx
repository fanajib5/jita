import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProviders } from './app/providers';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

// Pages
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Lazy import for dashboards (improves performance)
const StudentDashboard = React.lazy(() => import('./pages/student/StudentDashboard'));
const CorporateDashboard = React.lazy(() => import('./pages/corporate/CorporateDashboard'));
const EducatorPortal = React.lazy(() => import('./pages/educator/EducatorPortal'));
const CareerTimeline = React.lazy(() => import('./pages/career/CareerTimeline'));
const ProfilePage = React.lazy(() => import('./pages/student/ProfilePage'));
const CalendarPage = React.lazy(() => import('./pages/student/CalendarPage'));
const CoursesPage = React.lazy(() => import('./pages/student/CoursesPage'));
const VaultPage = React.lazy(() => import('./pages/student/VaultPage'));
const AdminVerificationsPage = React.lazy(() => import('./pages/admin/AdminVerificationsPage'));
const JobsBoardPage = React.lazy(() => import('./pages/student/JobsBoardPage'));
const CVPage = React.lazy(() => import('./pages/student/CVPage'));
const CorporateJobsPage = React.lazy(() => import('./pages/corporate/CorporateJobsPage'));
const ScoutPage = React.lazy(() => import('./pages/corporate/ScoutPage'));
const InformasiPage = React.lazy(() => import('./pages/informasi/InformasiPage'));
const InformasiDetailPage = React.lazy(() => import('./pages/informasi/InformasiDetailPage'));

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppProviders>
        <Layout>
          <React.Suspense
            fallback={
              <div
                style={{
                  padding: '4rem',
                  textAlign: 'center',
                  color: 'var(--color-text-secondary)',
                }}
              >
                Memuat...
              </div>
            }
          >
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/informasi" element={<InformasiPage />} />
              <Route path="/informasi/:slug" element={<InformasiDetailPage />} />

              {/* Protected Student Routes */}
              <Route
                path="/student"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              {/* General Talent & Career Routes (Accessible by Students & Alumni) */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute allowedRoles={['student', 'alumni']}>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route path="/student/profile" element={<Navigate to="/profile" replace />} />

              <Route
                path="/calendar"
                element={
                  <ProtectedRoute
                    allowedRoles={['student', 'alumni', 'educator_bilingual', 'educator_silver']}
                  >
                    <CalendarPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/student/calendar" element={<Navigate to="/calendar" replace />} />

              <Route
                path="/student/courses"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <CoursesPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/vault"
                element={
                  <ProtectedRoute allowedRoles={['student', 'alumni']}>
                    <VaultPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/student/vault" element={<Navigate to="/vault" replace />} />

              <Route
                path="/jobs"
                element={
                  <ProtectedRoute allowedRoles={['student', 'alumni', 'admin']}>
                    <JobsBoardPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/student/jobs" element={<Navigate to="/jobs" replace />} />

              <Route
                path="/cv"
                element={
                  <ProtectedRoute allowedRoles={['student', 'alumni']}>
                    <CVPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/student/cv" element={<Navigate to="/cv" replace />} />

              {/* Protected Career & Alumni */}
              <Route
                path="/career"
                element={
                  <ProtectedRoute allowedRoles={['student', 'alumni']}>
                    <CareerTimeline />
                  </ProtectedRoute>
                }
              />

              {/* Protected Corporate Routes */}
              <Route
                path="/corporate"
                element={
                  <ProtectedRoute allowedRoles={['corporate']}>
                    <CorporateDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/corporate/jobs"
                element={
                  <ProtectedRoute allowedRoles={['corporate', 'admin']}>
                    <CorporateJobsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/corporate/scout"
                element={
                  <ProtectedRoute allowedRoles={['corporate']}>
                    <ScoutPage />
                  </ProtectedRoute>
                }
              />

              {/* Protected Educator Routes */}
              <Route
                path="/educator"
                element={
                  <ProtectedRoute allowedRoles={['educator_bilingual', 'educator_silver']}>
                    <EducatorPortal />
                  </ProtectedRoute>
                }
              />

              {/* Protected Admin Routes */}
              <Route
                path="/admin/verifications"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminVerificationsPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </React.Suspense>
        </Layout>
      </AppProviders>
    </BrowserRouter>
  );
}

export default App;
