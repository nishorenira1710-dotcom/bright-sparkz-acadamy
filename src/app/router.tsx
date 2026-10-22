import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AppLayout } from '../components/layout/AppLayout';
import { LoadingSpinner } from '../components/feedback/LoadingSpinner';

// Public Pages
import { LoginPage } from '../features/auth/LoginPage';
import { ForgotPasswordPage } from '../features/auth/ForgotPasswordPage';
import { UnauthorizedPage } from '../features/auth/UnauthorizedPage';

// Admin Pages
import { AdminDashboardPage } from '../features/dashboard/AdminDashboardPage';
import { StudentListPage } from '../features/students/StudentListPage';
import { StudentFormPage } from '../features/students/StudentFormPage';
import { StudentDetailPage } from '../features/students/StudentDetailPage';
import { ParentManagementPage } from '../features/parents/ParentManagementPage';
import { BatchesPage } from '../features/batches/BatchesPage';
import { SessionsPage } from '../features/sessions/SessionsPage';
import { AttendancePage } from '../features/attendance/AttendancePage';
import { FeeManagementPage } from '../features/fees/FeeManagementPage';
import { PaymentListPage } from '../features/payments/PaymentListPage';
import { ReceiptsPage } from '../features/receipts/ReceiptsPage';
import { AnnouncementsPage } from '../features/announcements/AnnouncementsPage';
import { NotificationsPage } from '../features/notifications/NotificationsPage';
import { ReportsPage } from '../features/reports/ReportsPage';
import { StudentExitPage } from '../features/student-exit/StudentExitPage';
import { AuditLogsPage } from '../features/audit-logs/AuditLogsPage';
import { SettingsPage } from '../features/settings/SettingsPage';

// Parent Pages
import { ParentDashboardPage } from '../features/parent/ParentDashboardPage';
import { ParentChildrenPage } from '../features/parent/ParentChildrenPage';
import { ParentAttendancePage } from '../features/parent/ParentAttendancePage';
import { ParentFeesPage } from '../features/parent/ParentFeesPage';
import { ParentPaymentsPage } from '../features/parent/ParentPaymentsPage';
import { ParentReceiptsPage } from '../features/parent/ParentReceiptsPage';
import { ParentAnnouncementsPage } from '../features/parent/ParentAnnouncementsPage';
import { ParentNotificationsPage } from '../features/parent/ParentNotificationsPage';
import { ParentProfilePage } from '../features/parent/ParentProfilePage';

import { FirebaseSetupRequired } from '../components/feedback/FirebaseSetupRequired';

interface ProtectedRouteProps {
  requiredRole?: 'ADMIN' | 'PARENT';
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRole, children }) => {
  const { currentUser, role, loading, isConfigured } = useAuth();
  const location = useLocation();

  if (!isConfigured) {
    return <FirebaseSetupRequired />;
  }

  if (loading) {
    return <LoadingSpinner fullScreen message="Authenticating session..." />;
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

const RootRedirect: React.FC = () => {
  const { currentUser, role, loading, isConfigured } = useAuth();

  if (!isConfigured) {
    return <FirebaseSetupRequired />;
  }

  if (loading) {
    return <LoadingSpinner fullScreen message="Launching Bright Sparkz Academy..." />;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (role === 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Navigate to="/parent/dashboard" replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Protected Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="students" element={<StudentListPage />} />
        <Route path="students/new" element={<StudentFormPage />} />
        <Route path="students/:studentId" element={<StudentDetailPage />} />
        <Route path="parents" element={<ParentManagementPage />} />
        <Route path="batches" element={<BatchesPage />} />
        <Route path="sessions" element={<SessionsPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="fees" element={<FeeManagementPage />} />
        <Route path="payments" element={<PaymentListPage />} />
        <Route path="receipts" element={<ReceiptsPage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="student-exit" element={<StudentExitPage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Protected Parent Routes */}
      <Route
        path="/parent"
        element={
          <ProtectedRoute requiredRole="PARENT">
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/parent/dashboard" replace />} />
        <Route path="dashboard" element={<ParentDashboardPage />} />
        <Route path="children" element={<ParentChildrenPage />} />
        <Route path="children/:studentId" element={<ParentChildrenPage />} />
        <Route path="attendance" element={<ParentAttendancePage />} />
        <Route path="fees" element={<ParentFeesPage />} />
        <Route path="payments" element={<ParentPaymentsPage />} />
        <Route path="receipts" element={<ParentReceiptsPage />} />
        <Route path="announcements" element={<ParentAnnouncementsPage />} />
        <Route path="notifications" element={<ParentNotificationsPage />} />
        <Route path="profile" element={<ParentProfilePage />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
