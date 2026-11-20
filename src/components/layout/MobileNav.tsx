import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_DISPLAY } from '@/types';
import type { UserRole } from '@/types';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Building2,
  ClipboardList,
  FileText,
  Star,
  Trophy,
  CalendarCheck,
  BarChart3,
  Activity,
  Settings,
  Archive,
  PlusCircle,
  ClipboardCheck,
  Sparkles,
  LogOut,
  X,
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

function getMobileNavItems(role: UserRole, t: (key: string) => string): NavItem[] {
  switch (role) {
    case 'magic':
      return [
        { label: t('nav.dashboard'), path: '/dashboard', icon: LayoutDashboard },
        { label: t('nav.users'), path: '/users', icon: Users },
        { label: t('nav.pendingRegistrations'), path: '/pending-registrations', icon: UserCheck },
        { label: t('nav.committees'), path: '/committees', icon: Building2 },
        { label: t('nav.tasks'), path: '/tasks', icon: ClipboardList },
        { label: t('nav.submissions'), path: '/submissions', icon: FileText },
        { label: t('nav.evaluations'), path: '/evaluations', icon: Star },
        { label: t('nav.attendance'), path: '/attendance', icon: CalendarCheck },
        { label: t('nav.seasons'), path: '/seasons', icon: Sparkles },
        { label: t('nav.leaderboards'), path: '/leaderboards', icon: Trophy },
        { label: t('nav.analytics'), path: '/analytics', icon: BarChart3 },
        { label: t('nav.activityLog'), path: '/activity-log', icon: Activity },
        { label: t('nav.settings'), path: '/settings', icon: Settings },
      ];
    case 'president':
    case 'vice_president':
      return [
        { label: t('nav.dashboard'), path: '/dashboard', icon: LayoutDashboard },
        { label: t('nav.committees'), path: '/committees', icon: Building2 },
        { label: t('nav.members'), path: '/members', icon: Users },
        { label: t('nav.overview'), path: '/tasks-overview', icon: ClipboardList },
        { label: t('nav.evaluations'), path: '/evaluations', icon: Star },
        { label: t('nav.leaderboards'), path: '/leaderboards', icon: Trophy },
        { label: t('nav.attendance'), path: '/attendance', icon: CalendarCheck },
        { label: t('nav.analytics'), path: '/analytics', icon: BarChart3 },
        { label: t('nav.activityLog'), path: '/activity-log', icon: Activity },
        { label: t('nav.archive'), path: '/archive', icon: Archive },
      ];
    case 'leader':
      return [
        { label: t('nav.dashboard'), path: '/dashboard', icon: LayoutDashboard },
        { label: t('nav.members'), path: '/members', icon: Users },
        { label: t('nav.createTask'), path: '/create-task', icon: PlusCircle },
        { label: t('nav.tasks'), path: '/tasks', icon: ClipboardList },
        { label: t('nav.submissions'), path: '/submissions', icon: FileText },
        { label: t('nav.leaderboard'), path: '/leaderboard', icon: Trophy },
        { label: t('nav.attendance'), path: '/attendance', icon: CalendarCheck },
        { label: t('nav.analytics'), path: '/analytics', icon: BarChart3 },
      ];
    case 'hr_leader':
    case 'hr_member':
      return [
        { label: t('nav.dashboard'), path: '/dashboard', icon: LayoutDashboard },
        { label: t('nav.evaluationQueue'), path: '/evaluation-queue', icon: ClipboardCheck },
        { label: t('nav.submissions'), path: '/submissions', icon: FileText },
        { label: t('nav.performance'), path: '/performance', icon: Star },
        { label: t('nav.leaderboards'), path: '/leaderboards', icon: Trophy },
        { label: t('nav.attendance'), path: '/attendance', icon: CalendarCheck },
        { label: t('nav.analytics'), path: '/analytics', icon: BarChart3 },
      ];
    case 'member':
      return [
        { label: t('nav.dashboard'), path: '/dashboard', icon: LayoutDashboard },
        { label: t('nav.myTasks'), path: '/my-tasks', icon: ClipboardList },
        { label: t('nav.myEvaluations'), path: '/my-evaluations', icon: Star },
        { label: t('nav.myPerformance'), path: '/my-performance', icon: BarChart3 },
        { label: t('nav.leaderboard'), path: '/leaderboard', icon: Trophy },
        { label: t('nav.myAttendance'), path: '/my-attendance', icon: CalendarCheck },
      ];
    default:
      return [];
  }
}

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  const { t, i18n } = useTranslation();
  const { userProfile, logout } = useAuth();
  const location = useLocation();
  const isRTL = i18n.language === 'ar';

  const navItems = userProfile ? getMobileNavItems(userProfile.role, t) : [];

  const roleDisplay = userProfile
    ? isRTL
      ? ROLE_DISPLAY[userProfile.role].ar
      : ROLE_DISPLAY[userProfile.role].en
    : '';

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed top-0 bottom-0 z-50 w-72 bg-sidebar flex flex-col shadow-2xl md:hidden transition-transform duration-300',
          isRTL ? 'right-0' : 'left-0'
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar px-4">
          <div className="flex items-center gap-3">
            <img
              src="/src/assets/logo.png"
              alt="Monsters"
              className="h-9 w-9 rounded-lg"
            />
            <span className="text-lg font-bold text-primary-text">
              {t('app.name')}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-secondary-text hover:text-primary-text transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                location.pathname === item.path ||
                (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-brand-primary/15 text-brand-primary'
                        : 'text-secondary-text hover:bg-elevated hover:text-primary-text'
                    )}
                  >
                    <item.icon
                      className={cn(
                        'h-5 w-5 flex-shrink-0',
                        isActive ? 'text-brand-primary' : 'text-secondary-text'
                      )}
                    />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User info */}
        {userProfile && (
          <div className="border-t border-sidebar p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/20 text-brand-primary text-sm font-semibold uppercase">
                {userProfile.fullName?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-primary-text">
                  {userProfile.fullName}
                </p>
                <p className="truncate text-xs text-secondary-text">
                  {roleDisplay}
                </p>
              </div>
            </div>
            <button
              onClick={async () => {
                onClose();
                await logout();
              }}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/30 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              {t('auth.logout')}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default MobileNav;
