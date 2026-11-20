import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Mail, ArrowLeft, CheckCircle, Sun, Moon, Languages } from 'lucide-react';

interface ForgotForm {
  email: string;
}

export function ForgotPasswordPage() {
  const { t, i18n } = useTranslation();
  const { resetPassword } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isRTL = i18n.language === 'ar';

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotForm>({ defaultValues: { email: '' } });

  const onSubmit = async (data: ForgotForm) => {
    setError('');
    setSubmitting(true);
    try {
      await resetPassword(data.email);
      setSuccess(true);
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/user-not-found') {
        setError('No account found with this email');
      } else {
        setError(err?.message || 'Failed to send reset email');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'ar' : 'en');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-main p-4">
      {/* Theme & language controls */}
      <div className="fixed top-4 end-4 flex items-center gap-2 z-10">
        <button
          onClick={toggleLanguage}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-sidebar text-secondary-text hover:text-primary-text hover:bg-elevated transition-colors"
        >
          <Languages className="h-4 w-4" />
        </button>
        <button
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-sidebar text-secondary-text hover:text-primary-text hover:bg-elevated transition-colors"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>

      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="mb-8 text-center">
          <img
            src="/src/assets/logo.png"
            alt="Monsters Team"
            className="mx-auto mb-4 h-20 w-20 rounded-2xl"
          />
          <h1 className="text-2xl font-bold text-primary-text">{t('auth.resetPassword')}</h1>
          <p className="mt-1 text-sm text-secondary-text">
            Enter your email to receive a password reset link
          </p>
        </div>

        <div className="rounded-2xl border border-sidebar bg-card p-6 shadow-lg">
          {success ? (
            <div className="text-center py-4">
              <CheckCircle className="mx-auto h-14 w-14 text-brand-primary mb-4" />
              <h2 className="text-lg font-semibold text-primary-text mb-2">Check your email</h2>
              <p className="text-sm text-secondary-text mb-6">
                We've sent a password reset link to your email address. Please check your inbox.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-medium text-brand-primary hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                {t('auth.login')}
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-primary-text">
                    {t('auth.email')}
                  </label>
                  <input
                    type="email"
                    {...register('email', {
                      required: t('auth.emailRequired'),
                      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: t('auth.invalidEmail') },
                    })}
                    className="w-full rounded-lg border border-sidebar bg-elevated px-4 py-2.5 text-sm text-primary-text placeholder:text-muted-text outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 transition-colors"
                    placeholder="email@example.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-primary py-2.5 text-sm font-semibold text-black transition-colors hover:bg-brand-hover disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  {submitting ? t('common.loading') : t('auth.sendResetLink')}
                </button>
              </form>

              <div className="mt-4 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm text-secondary-text hover:text-primary-text"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  {t('auth.login')}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
