import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Bell,
  Sun,
  Moon,
  Languages,
  User,
  Settings,
  LogOut,
  Menu,
  ChevronDown,
  Sparkles,
  Shield,
  GraduationCap,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ROLE_DISPLAY } from '@/types';

interface TopBarProps {
  onMenuClick: () => void;
  sidebarCollapsed: boolean;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { t, i18n } = useTranslation();
  const { userProfile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isRTL = i18n.language === 'ar';

  const [userMenuOpen, setUserMenuOpen] = useState(false);
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

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
  };

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
    navigate('/login');
  };

  // Main quick navigation capsule matching Image 1
  const quickNav = [
    { label: isRTL ? 'الرئيسية' : 'Home', path: '/dashboard' },
    { label: isRTL ? 'مجلس الإدارة' : 'Our Board', path: '/users' },
    { label: isRTL ? 'اللجان' : 'Committees', path: '/committees' },
    { label: isRTL ? 'الفعاليات' : 'Events', path: userProfile?.role === 'member' ? '/my-tasks' : '/tasks' },
    { label: isRTL ? 'المسابقات' : 'Competitions', path: '/leaderboard' },
    { label: isRTL ? 'الرحلات' : 'Trips', path: userProfile?.role === 'member' ? '/my-attendance' : '/attendance' },
    { label: isRTL ? 'الأعضاء' : 'Members', path: userProfile?.role === 'magic' ? '/pending-registrations' : '/users' },
    { label: isRTL ? 'الإعدادات' : 'Contact', path: '/settings' },
  ];

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between gap-4 border-b border-[#18241C] bg-[#070B08]/90 backdrop-blur-xl px-4 md:px-8 transition-colors">
      {/* Left: Mobile trigger & Monsters Brand + University Badges */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="text-secondary hover:text-[#2CEE55] transition-colors md:hidden p-2 rounded-xl bg-[#111A13]"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link to="/dashboard" className="flex items-center gap-3 group">
          {/* Monsters Emblem Box */}
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[#0E1610] border border-[#1A281D] shadow-[0_0_15px_rgba(44,238,85,0.2)] group-hover:border-[#2CEE55] transition-all">
            <img src="/logo.png" alt="Monsters Logo" className="h-6 w-6 object-contain" />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-base font-black tracking-wider text-white">
              MONSTERS
            </span>

            {/* University & Faculty Badges from Image 1 */}
            <div className="hidden sm:flex items-center gap-1.5 ms-1">
              {/* MNU Badge */}
              <div
                className="h-6 w-6 rounded-full bg-[#111B14] border border-[#2B402F] flex items-center justify-center shadow-sm"
                title="Mansoura National University"
              >
                <GraduationCap className="h-3.5 w-3.5 text-[#2CEE55]" />
              </div>
              {/* Engineering Crest Badge */}
              <div
                className="h-6 w-6 rounded-full bg-[#111B14] border border-[#2B402F] flex items-center justify-center shadow-sm"
                title="Faculty of Engineering"
              >
                <Shield className="h-3.5 w-3.5 text-white/80" />
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Middle: Floating Capsule Navbar from Image 1 */}
      <nav className="hidden xl:flex items-center gap-1 bg-[#0C130E] border border-[#19261C] p-1.5 rounded-full shadow-inner">
        {quickNav.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.label}
              to={item.path}
              className={cn(
                'px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200',
                isActive
                  ? 'bg-[#2CEE55] text-black shadow-[0_0_20px_rgba(44,238,85,0.45)] font-bold'
                  : 'text-[#9AA69C] hover:text-white hover:bg-[#121E15]'
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Notifications */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#0C130E] border border-[#19261C] text-secondary hover:text-[#2CEE55] hover:border-[#2CEE55]/50 transition-all cursor-pointer"
          title={t('nav.notifications')}
        >
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute top-1 end-1 flex h-2 w-2 rounded-full bg-[#2CEE55] shadow-[0_0_8px_#2CEE55]" />
        </button>

        {/* Language switcher pill */}
        <button
          onClick={toggleLanguage}
          className="flex h-10 items-center gap-1.5 rounded-full bg-[#0C130E] border border-[#19261C] px-3.5 text-xs font-bold text-secondary hover:text-[#2CEE55] hover:border-[#2CEE55]/50 transition-all cursor-pointer"
          title={t('common.language')}
        >
          <Languages className="h-3.5 w-3.5 text-[#2CEE55]" />
          <span>{i18n.language === 'en' ? 'العربية' : 'English'}</span>
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0C130E] border border-[#19261C] text-secondary hover:text-[#2CEE55] hover:border-[#2CEE55]/50 transition-all cursor-pointer"
          title={theme === 'dark' ? t('common.lightMode') : t('common.darkMode')}
        >
          {theme === 'dark' ? (
            <Sun className="h-4.5 w-4.5" />
          ) : (
            <Moon className="h-4.5 w-4.5" />
          )}
        </button>

        {/* User profile dropdown button */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2.5 rounded-full bg-[#0C130E] border border-[#19261C] hover:border-[#2CEE55] p-1.5 pr-3 text-start transition-all cursor-pointer"
          >
            <Avatar className="h-7 w-7 border border-[#2CEE55]/60">
              <AvatarImage src={userProfile?.profileImage} />
              <AvatarFallback className="text-[10px] bg-[#2CEE55] text-black font-extrabold">
                {userProfile?.fullName ? userProfile.fullName.slice(0, 2).toUpperCase() : 'MT'}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block text-start">
              <div className="text-xs font-bold text-white leading-tight">
                {userProfile?.fullName || 'User'}
              </div>
              <div className="text-[10px] text-[#2CEE55] font-semibold">
                {userProfile ? (isRTL ? ROLE_DISPLAY[userProfile.role]?.ar : ROLE_DISPLAY[userProfile.role]?.en) : ''}
              </div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-secondary" />
          </button>

          {userMenuOpen && (
            <div
              className={cn(
                'absolute mt-2 w-56 rounded-2xl border border-[#19261C] bg-[#0A100C] p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150',
                isRTL ? 'left-0' : 'right-0'
              )}
            >
              <div className="p-2 border-b border-[#18241C]">
                <p className="text-xs font-bold text-white truncate">{userProfile?.fullName}</p>
                <p className="text-[11px] text-muted truncate">{userProfile?.email}</p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate('/profile');
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-secondary hover:text-white hover:bg-[#121E15] transition-colors cursor-pointer"
                >
                  <User className="h-4 w-4 text-[#2CEE55]" />
                  <span>{t('nav.profile')}</span>
                </button>
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate('/settings');
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-secondary hover:text-white hover:bg-[#121E15] transition-colors cursor-pointer"
                >
                  <Settings className="h-4 w-4 text-[#2CEE55]" />
                  <span>{t('nav.settings')}</span>
                </button>
              </div>

              <div className="border-t border-[#18241C] pt-1">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-950/30 transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{t('auth.logout')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
