import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';

// ---- Query Client ----
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// ---- Loading fallback ----
function PageLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-brand-primary border-t-transparent" />
        <p className="text-sm text-secondary-text">Loading...</p>
      </div>
    </div>
  );
}

// ---- Auth Pages (eager) ----
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { PendingApprovalPage } from '@/pages/auth/PendingApprovalPage';
import { MagicSetupPage } from '@/pages/auth/MagicSetupPage';

// ---- Protected Pages (lazy loaded) ----
// Shared / common pages
const DashboardPage = lazy(() => import('@/pages/shared/DashboardPage'));
const ProfilePage = lazy(() => import('@/pages/shared/ProfilePage'));
const NotificationsPage = lazy(() => import('@/pages/shared/NotificationsPage'));

// Magic / Admin pages
const UsersPage = lazy(() => import('@/pages/magic/UsersPage'));
const PendingRegistrationsPage = lazy(() => import('@/pages/magic/PendingRegistrationsPage'));
const SeasonsPage = lazy(() => import('@/pages/magic/SeasonsPage'));
const SettingsPage = lazy(() => import('@/pages/magic/SettingsPage'));

// President pages
const CommitteesPage = lazy(() => import('@/pages/president/CommitteesPage'));
const MembersPage = lazy(() => import('@/pages/president/MembersPage'));
const TasksOverviewPage = lazy(() => import('@/pages/president/TasksOverviewPage'));
const ArchivePage = lazy(() => import('@/pages/president/ArchivePage'));

// Leader pages
const CreateTaskPage = lazy(() => import('@/pages/leader/CreateTaskPage'));
const TasksPage = lazy(() => import('@/pages/leader/TasksPage'));
const SubmissionsPage = lazy(() => import('@/pages/leader/SubmissionsPage'));

// HR pages
const EvaluationQueuePage = lazy(() => import('@/pages/hr/EvaluationQueuePage'));
const PerformancePage = lazy(() => import('@/pages/hr/PerformancePage'));

// Member pages
const MyTasksPage = lazy(() => import('@/pages/member/MyTasksPage'));
const MyEvaluationsPage = lazy(() => import('@/pages/member/MyEvaluationsPage'));
const MyPerformancePage = lazy(() => import('@/pages/member/MyPerformancePage'));
const MyAttendancePage = lazy(() => import('@/pages/member/MyAttendancePage'));

// Shared feature pages
const EvaluationsPage = lazy(() => import('@/pages/shared/EvaluationsPage'));
const LeaderboardPage = lazy(() => import('@/pages/shared/LeaderboardPage'));
const AttendancePage = lazy(() => import('@/pages/shared/AttendancePage'));
const AnalyticsPage = lazy(() => import('@/pages/shared/AnalyticsPage'));
const ActivityLogPage = lazy(() => import('@/pages/shared/ActivityLogPage'));

// ---- Role groups ----
const ADMIN_ROLES = ['magic'] as const;
const MANAGEMENT_ROLES = ['magic', 'president', 'vice_president'] as const;
const LEADERSHIP_ROLES = ['magic', 'president', 'vice_president', 'leader'] as const;
const HR_ROLES = ['magic', 'hr_leader', 'hr_member'] as const;
const ALL_ROLES = ['magic', 'president', 'vice_president', 'leader', 'hr_leader', 'hr_member', 'member'] as const;

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/pending-approval" element={<PendingApprovalPage />} />
              <Route path="/magic-setup" element={<MagicSetupPage />} />

              {/* Protected routes with layout */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                {/* Dashboard - all roles */}
                <Route
                  path="/dashboard"
                  element={
                    <Suspense fallback={<PageLoading />}>
                      <DashboardPage />
                    </Suspense>
                  }
                />

                {/* Profile - all roles */}
                <Route
                  path="/profile"
                  element={
                    <Suspense fallback={<PageLoading />}>
                      <ProfilePage />
                    </Suspense>
                  }
                />

                {/* Notifications - all roles */}
                <Route
                  path="/notifications"
                  element={
                    <Suspense fallback={<PageLoading />}>
                      <NotificationsPage />
                    </Suspense>
                  }
                />

                {/* Magic/Admin only */}
                <Route
                  path="/users"
                  element={
                    <ProtectedRoute allowedRoles={[...ADMIN_ROLES]}>
                      <Suspense fallback={<PageLoading />}>
                        <UsersPage />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/pending-registrations"
                  element={
                    <ProtectedRoute allowedRoles={[...ADMIN_ROLES]}>
                      <Suspense fallback={<PageLoading />}>
                        <PendingRegistrationsPage />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/seasons"
                  element={
                    <ProtectedRoute allowedRoles={[...ADMIN_ROLES]}>
                      <Suspense fallback={<PageLoading />}>
                        <SeasonsPage />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute allowedRoles={[...ADMIN_ROLES]}>
                      <Suspense fallback={<PageLoading />}>
                        <SettingsPage />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />

                {/* Management (magic, president, VP) */}
                <Route
                  path="/committees"
                  element={
                    <ProtectedRoute allowedRoles={[...MANAGEMENT_ROLES]}>
                      <Suspense fallback={<PageLoading />}>
                        <CommitteesPage />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/members"
                  element={
                    <ProtectedRoute allowedRoles={[...LEADERSHIP_ROLES]}>
                      <Suspense fallback={<PageLoading />}>
                        <MembersPage />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tasks-overview"
                  element={
                    <ProtectedRoute allowedRoles={[...MANAGEMENT_ROLES]}>
                      <Suspense fallback={<PageLoading />}>
                        <TasksOverviewPage />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/archive"
                  element={
                    <ProtectedRoute allowedRoles={[...MANAGEMENT_ROLES]}>
                      <Suspense fallback={<PageLoading />}>
                        <ArchivePage />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />

                {/* Leader routes */}
                <Route
                  path="/create-task"
                  element={
                    <ProtectedRoute allowedRoles={[...LEADERSHIP_ROLES]}>
                      <Suspense fallback={<PageLoading />}>
                        <CreateTaskPage />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tasks"
                  element={
                    <ProtectedRoute allowedRoles={['magic', 'leader']}>
                      <Suspense fallback={<PageLoading />}>
                        <TasksPage />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/submissions"
                  element={
                    <ProtectedRoute allowedRoles={['magic', 'leader', 'hr_leader', 'hr_member']}>
                      <Suspense fallback={<PageLoading />}>
                        <SubmissionsPage />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />

                {/* HR routes */}
                <Route
                  path="/evaluation-queue"
                  element={
                    <ProtectedRoute allowedRoles={[...HR_ROLES]}>
                      <Suspense fallback={<PageLoading />}>
                        <EvaluationQueuePage />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/performance"
                  element={
                    <ProtectedRoute allowedRoles={[...HR_ROLES]}>
                      <Suspense fallback={<PageLoading />}>
                        <PerformancePage />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />

                {/* Member routes */}
                <Route
                  path="/my-tasks"
                  element={
                    <ProtectedRoute allowedRoles={['member']}>
                      <Suspense fallback={<PageLoading />}>
                        <MyTasksPage />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-evaluations"
                  element={
                    <ProtectedRoute allowedRoles={['member']}>
                      <Suspense fallback={<PageLoading />}>
                        <MyEvaluationsPage />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-performance"
                  element={
                    <ProtectedRoute allowedRoles={['member']}>
                      <Suspense fallback={<PageLoading />}>
                        <MyPerformancePage />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-attendance"
                  element={
                    <ProtectedRoute allowedRoles={['member']}>
                      <Suspense fallback={<PageLoading />}>
                        <MyAttendancePage />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />

                {/* Shared feature routes - multiple roles */}
                <Route
                  path="/evaluations"
                  element={
                    <ProtectedRoute allowedRoles={['magic', 'president', 'vice_president']}>
                      <Suspense fallback={<PageLoading />}>
                        <EvaluationsPage />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/leaderboard"
                  element={
                    <Suspense fallback={<PageLoading />}>
                      <LeaderboardPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/leaderboards"
                  element={
                    <Suspense fallback={<PageLoading />}>
                      <LeaderboardPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/attendance"
                  element={
                    <ProtectedRoute allowedRoles={['magic', 'president', 'vice_president', 'leader', 'hr_leader', 'hr_member']}>
                      <Suspense fallback={<PageLoading />}>
                        <AttendancePage />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/analytics"
                  element={
                    <ProtectedRoute allowedRoles={[...ALL_ROLES].filter(r => r !== 'member')}>
                      <Suspense fallback={<PageLoading />}>
                        <AnalyticsPage />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/activity-log"
                  element={
                    <ProtectedRoute allowedRoles={['magic', 'president', 'vice_president']}>
                      <Suspense fallback={<PageLoading />}>
                        <ActivityLogPage />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* Catch-all redirect */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
