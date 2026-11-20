import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Eye, EyeOff, LogIn, Sparkles, Sun, Moon, Languages } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { t, i18n } = useTranslation();
  const { login, isMagicInitialized, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginForm) => {
    setError('');
    setSubmitting(true);
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Detailed login error:', err);
      const code = err?.code || '';
      if (code === 'auth/operation-not-allowed') {
        setError(
          i18n.language === 'ar'
            ? 'طريقة الدخول بالبريد وكلمة المرور غير مفعّلة في Firebase Console. يرجى تفعيل Email/Password تحت Authentication > Sign-in method.'
            : 'Email/Password sign-in is disabled in Firebase Console. Please enable it under Authentication > Sign-in method.'
        );
      } else if (
        code === 'auth/user-not-found' ||
        code === 'auth/wrong-password' ||
        code === 'auth/invalid-credential'
      ) {
        setError(
          i18n.language === 'ar'
            ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى التأكد من كلمة المرور التي عينتها في Firebase Console.'
            : 'Invalid email or password. Please verify the password set in Firebase Console.'
        );
      } else if (code === 'auth/too-many-requests') {
        setError(
          i18n.language === 'ar'
            ? 'محاولات كثيرة جداً، يرجى الانتظار قليلاً والمحاولة لاحقاً.'
            : 'Too many attempts. Please try again later.'
        );
      } else {
        setError(err?.message || 'Login failed');
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
          title={t('common.language')}
        >
          <Languages className="h-4 w-4" />
        </button>
        <button
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-sidebar text-secondary-text hover:text-primary-text hover:bg-elevated transition-colors"
          title={theme === 'dark' ? t('common.lightMode') : t('common.darkMode')}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>

      <div className="w-full max-w-md">
        {/* Logo & branding */}
        <div className="mb-8 text-center">
          <img
            src="/src/assets/logo.png"
            alt="Monsters Team"
            className="mx-auto mb-4 h-20 w-20 rounded-2xl"
          />
          <h1 className="text-2xl font-bold text-primary-text">{t('auth.loginTitle')}</h1>
          <p className="mt-1 text-sm text-secondary-text">{t('auth.loginSubtitle')}</p>
        </div>

        {/* Login card */}
        <div className="rounded-2xl border border-sidebar bg-card p-6 shadow-lg">
          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
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

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-primary-text">
                {t('auth.password')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', {
                    required: t('auth.passwordRequired'),
                  })}
                  className="w-full rounded-lg border border-sidebar bg-elevated px-4 py-2.5 pe-10 text-sm text-primary-text placeholder:text-muted-text outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-secondary-text hover:text-primary-text"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            {/* Forgot password link */}
            <div className="text-end">
              <Link
                to="/forgot-password"
                className="text-xs text-brand-primary hover:underline"
              >
                {t('auth.forgotPassword')}
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-primary py-2.5 text-sm font-semibold text-black transition-colors hover:bg-brand-hover disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              {submitting ? t('common.loading') : t('auth.login')}
            </button>
          </form>

          {/* Register link */}
          <p className="mt-4 text-center text-sm text-secondary-text">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="font-medium text-brand-primary hover:underline">
              {t('auth.register')}
            </Link>
          </p>
        </div>

        {/* Magic setup */}
        {!isMagicInitialized && (
          <div className="mt-4 text-center">
            <Link
              to="/magic-setup"
              className="inline-flex items-center gap-2 rounded-lg border border-brand-primary/30 bg-brand-primary/5 px-4 py-2.5 text-sm font-medium text-brand-primary hover:bg-brand-primary/10 transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              {t('auth.magicSetup')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default LoginPage;
