import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Clock, XCircle, ShieldOff, LogOut } from 'lucide-react';

export function PendingApprovalPage() {
  const { t } = useTranslation();
  const { userProfile, logout, user } = useAuth();
  const navigate = useNavigate();

  // If user is approved, redirect to dashboard
  useEffect(() => {
    if (userProfile?.status === 'approved') {
      navigate('/dashboard', { replace: true });
    }
    if (!user) {
      navigate('/login', { replace: true });
    }
  }, [userProfile, user, navigate]);

  const status = userProfile?.status || 'pending';

  const statusConfig = {
    pending: {
      icon: Clock,
      title: t('auth.pendingApproval'),
      message: t('auth.pendingMessage'),
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20',
    },
    rejected: {
      icon: XCircle,
      title: 'Registration Rejected',
      message: t('auth.rejectedMessage'),
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
    },
    suspended: {
      icon: ShieldOff,
      title: 'Account Suspended',
      message: t('auth.suspendedMessage'),
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20',
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = config.icon;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-main p-4">
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <img
          src="/src/assets/logo.png"
          alt="Monsters Team"
          className="mx-auto mb-6 h-20 w-20 rounded-2xl"
        />

        <div className={`rounded-2xl border ${config.borderColor} ${config.bgColor} p-8`}>
          <StatusIcon className={`mx-auto h-16 w-16 ${config.color} mb-4`} />

          <h2 className="text-xl font-bold text-primary-text mb-2">
            {config.title}
          </h2>

          <p className="text-sm text-secondary-text mb-2">
            {config.message}
          </p>

          {status === 'pending' && (
            <div className="mt-6 flex items-center justify-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-brand-primary animate-bounce [animation-delay:0ms]" />
              <div className="h-2 w-2 rounded-full bg-brand-primary animate-bounce [animation-delay:150ms]" />
              <div className="h-2 w-2 rounded-full bg-brand-primary animate-bounce [animation-delay:300ms]" />
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="mt-6 inline-flex items-center gap-2 rounded-lg border border-sidebar px-6 py-2.5 text-sm font-medium text-secondary-text hover:text-primary-text hover:bg-elevated transition-colors"
        >
          <LogOut className="h-4 w-4" />
          {t('auth.logout')}
        </button>
      </div>
    </div>
  );
}

export default PendingApprovalPage;
