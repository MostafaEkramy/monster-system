import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Bell,
  Sun,
  Moon,
  Languages,
  Search,
  User,
  Settings,
  LogOut,
  Menu,
  ChevronDown,
} from 'lucide-react';

interface TopBarProps {
  onMenuClick: () => void;
  sidebarCollapsed: boolean;
}

export function TopBar({ onMenuClick, sidebarCollapsed }: TopBarProps) {
  const { t, i18n } = useTranslation();
  const { userProfile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isRTL = i18n.language === 'ar';

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Derive page title from path
  function getPageTitle(): string {
    const path = location.pathname;
    const segment = path.split('/').filter(Boolean)[0] || 'dashboard';
    const titleMap: Record<string, string> = {
      dashboard: t('nav.dashboard'),
      users: t('nav.users'),
      'pending-registrations': t('nav.pendingRegistrations'),
      committees: t('nav.committees'),
      tasks: t('nav.tasks'),
      'my-tasks': t('nav.myTasks'),
      'create-task': t('nav.createTask'),
      'tasks-overview': t('nav.overview'),
      submissions: t('nav.submissions'),
      evaluations: t('nav.evaluations'),
      'evaluation-queue': t('nav.evaluationQueue'),
      leaderboard: t('nav.leaderboard'),
      leaderboards: t('nav.leaderboards'),
      attendance: t('nav.attendance'),
      'my-attendance': t('nav.myAttendance'),
      seasons: t('nav.seasons'),
      analytics: t('nav.analytics'),
      'activity-log': t('nav.activityLog'),
      settings: t('nav.settings'),
      profile: t('nav.profile'),
      members: t('nav.members'),
      performance: t('nav.performance'),
      'my-performance': t('nav.myPerformance'),
      'my-evaluations': t('nav.myEvaluations'),
      archive: t('nav.archive'),
      notifications: t('nav.notifications'),
    };
    return titleMap[segment] || segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
  };

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-sidebar bg-card/80 backdrop-blur-md px-4 md:px-6">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="text-secondary-text hover:text-primary-text transition-colors md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Page title */}
      <h1 className="text-lg font-semibold text-primary-text truncate">
        {getPageTitle()}
      </h1>

      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Search toggle */}
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-secondary-text hover:bg-elevated hover:text-primary-text transition-colors"
          title={t('common.search')}
        >
          <Search className="h-4.5 w-4.5" />
        </button>

        {/* Notifications */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-secondary-text hover:bg-elevated hover:text-primary-text transition-colors"
          title={t('nav.notifications')}
        >
          <Bell className="h-4.5 w-4.5" />
          {/* Unread badge - placeholder count */}
          <span className="absolute top-1 end-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-primary px-1 text-[10px] font-bold text-black">
            3
          </span>
        </button>

        {/* Language toggle */}
        <button
          onClick={toggleLanguage}
          className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-secondary-text hover:bg-elevated hover:text-primary-text transition-colors text-sm font-medium"
          title={t('common.language')}
        >
          <Languages className="h-4 w-4" />
          <span className="hidden sm:inline">{i18n.language === 'en' ? 'AR' : 'EN'}</span>
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-secondary-text hover:bg-elevated hover:text-primary-text transition-colors"
          title={theme === 'dark' ? t('common.lightMode') : t('common.darkMode')}
        >
          {theme === 'dark' ? (
            <Sun className="h-4.5 w-4.5" />
          ) : (
            <Moon className="h-4.5 w-4.5" />
          )}
        </button>

        {/* User menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-elevated transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary/20 text-brand-primary text-sm font-semibold uppercase">
              {userProfile?.fullName?.charAt(0) || 'U'}
            </div>
            <span className="hidden md:inline text-sm font-medium text-primary-text max-w-[120px] truncate">
              {userProfile?.fullName}
            </span>
            <ChevronDown className="hidden md:block h-3.5 w-3.5 text-secondary-text" />
          </button>

          {userMenuOpen && (
            <div
              className={cn(
                'absolute top-full mt-2 w-56 rounded-xl border border-sidebar bg-card shadow-xl py-1.5 z-50',
                isRTL ? 'left-0' : 'right-0'
              )}
            >
              <div className="px-4 py-2.5 border-b border-sidebar">
                <p className="text-sm font-medium text-primary-text truncate">
                  {userProfile?.fullName}
                </p>
                <p className="text-xs text-secondary-text truncate">
                  {userProfile?.email}
                </p>
              </div>
              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  navigate('/profile');
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-secondary-text hover:bg-elevated hover:text-primary-text transition-colors"
              >
                <User className="h-4 w-4" />
                {t('nav.profile')}
              </button>
              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  navigate('/settings');
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-secondary-text hover:bg-elevated hover:text-primary-text transition-colors"
              >
                <Settings className="h-4 w-4" />
                {t('nav.settings')}
              </button>
              <div className="border-t border-sidebar my-1" />
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                {t('auth.logout')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search overlay */}
      {searchOpen && (
        <div className="absolute inset-x-0 top-full border-b border-sidebar bg-card p-4 shadow-lg">
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-text" />
            <input
              type="text"
              placeholder={t('common.search')}
              autoFocus
              className="w-full rounded-lg border border-sidebar bg-elevated ps-10 pe-4 py-2.5 text-sm text-primary-text placeholder:text-muted-text outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30"
              onKeyDown={(e) => e.key === 'Escape' && setSearchOpen(false)}
            />
          </div>
        </div>
      )}
    </header>
  );
}

export default TopBar;
