import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types';
import { ROLE_DISPLAY } from '@/types';
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
  Award,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

function getNavItems(role: UserRole, t: (key: string) => string): NavItem[] {
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
        { label: t('nav.evaluationQueue'), path: '/evaluation-queue', icon: Award },
        { label: t('nav.submissions'), path: '/submissions', icon: FileText },
        { label: t('nav.performance'), path: '/performance', icon: Star },
        { label: t('nav.leaderboards'), path: '/leaderboards', icon: Trophy },
        { label: t('nav.attendance'), path: '/attendance', icon: CalendarCheck },
        { label: t('nav.analytics'), path: '/analytics', icon: BarChart3 },
      ];
    case 'member':
    default:
      return [
        { label: t('nav.dashboard'), path: '/dashboard', icon: LayoutDashboard },
        { label: t('nav.myTasks'), path: '/my-tasks', icon: ClipboardList },
        { label: t('nav.myEvaluations'), path: '/my-evaluations', icon: Star },
        { label: t('nav.myPerformance'), path: '/my-performance', icon: Trophy },
        { label: t('nav.leaderboard'), path: '/leaderboard', icon: Trophy },
        { label: t('nav.myAttendance'), path: '/my-attendance', icon: CalendarCheck },
      ];
  }
}

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  const { t, i18n } = useTranslation();
  const { userProfile } = useAuth();
  const isRTL = i18n.language === 'ar';

  const role = userProfile?.role || 'member';
  const navItems = getNavItems(role, t);

  return (
    <aside
      className={cn(
        'fixed top-0 z-40 flex h-screen flex-col border-[#18241C] bg-[#070B08] transition-all duration-300 shadow-2xl',
        isRTL ? 'right-0 border-l' : 'left-0 border-r',
        collapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      {/* Sidebar Header */}
      <div className="flex h-20 items-center justify-between px-4 border-b border-[#18241C]">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0E1610] border border-[#1A281D] shadow-[0_0_15px_rgba(44,238,85,0.25)]">
              <img src="/logo.png" alt="Logo" className="h-5 w-5 object-contain" />
            </div>
            <div>
              <p className="text-sm font-black text-white tracking-wider">MONSTERS</p>
              <p className="text-[10px] font-bold text-[#2CEE55] tracking-widest uppercase">
                {isRTL ? ROLE_DISPLAY[role]?.ar : ROLE_DISPLAY[role]?.en}
              </p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-[#0E1610] border border-[#1A281D]">
            <img src="/logo.png" alt="Logo" className="h-5 w-5 object-contain" />
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="hidden md:flex h-7 w-7 items-center justify-center rounded-lg border border-[#1A281D] bg-[#0C120E] text-secondary hover:text-[#2CEE55] hover:border-[#2CEE55] transition-colors"
        >
          {isRTL ? (
            collapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
          ) : (
            collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-200',
                  isActive
                    ? 'bg-[#2CEE55] text-black font-bold shadow-[0_0_20px_rgba(44,238,85,0.35)] scale-[1.02]'
                    : 'text-[#9AA69C] hover:bg-[#0E1711] hover:text-[#2CEE55] hover:border hover:border-[#1E3023]'
                )
              }
            >
              <Icon className="h-4.5 w-4.5 shrink-0 transition-transform group-hover:scale-110" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      {!collapsed && (
        <div className="p-4 border-t border-[#18241C] bg-[#080D0A]">
          <div className="flex items-center gap-2 text-xs text-[#2CEE55] font-semibold">
            <span className="h-2 w-2 rounded-full bg-[#2CEE55] shadow-[0_0_8px_#2CEE55] animate-pulse" />
            <span>Monsters MNU Portal</span>
          </div>
        </div>
      )}
    </aside>
  );
}
