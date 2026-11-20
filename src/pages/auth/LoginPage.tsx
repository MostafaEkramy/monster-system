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
  const { login } = useAuth();
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
    <div className="relative flex min-h-screen items-center justify-center bg-[#060907] p-4 overflow-hidden">
      {/* Background Ambient Radial Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#2CEE55]/12 blur-[120px] rounded-full pointer-events-none" />

      {/* Top right language & theme capsule */}
      <div className="fixed top-5 end-5 flex items-center gap-2 z-10 bg-[#0C120E] border border-[#19261C] p-1.5 rounded-full shadow-lg">
        <button
          onClick={toggleLanguage}
          className="flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-bold text-secondary hover:text-[#2CEE55] transition-colors"
          title={t('common.language')}
        >
          <Languages className="h-3.5 w-3.5 text-[#2CEE55]" />
          <span>{i18n.language === 'en' ? 'العربية' : 'English'}</span>
        </button>
        <button
          onClick={toggleTheme}
          className="flex h-8 w-8 items-center justify-center rounded-full text-secondary hover:text-[#2CEE55] transition-colors"
          title={theme === 'dark' ? t('common.lightMode') : t('common.darkMode')}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>

      <div className="relative w-full max-w-md z-10">
        {/* Glowing Logo Card (Inspired by Image 1) */}
        <div className="mb-6 text-center">
          <div className="relative inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#101C13] border border-[#1F3825] text-[#2CEE55] text-xs font-semibold mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Mansoura National University</span>
          </div>

          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-[#0D1610] border border-[#1C2C1F] shadow-[0_0_50px_rgba(44,238,85,0.22)] mx-auto mb-4">
            <img src="/logo.png" alt="Monsters Emblem" className="h-14 w-14 object-contain" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Welcome to Monsters <span className="text-[#2CEE55]">Team</span>
          </h1>
          <p className="mt-1 text-xs text-secondary">{t('auth.loginSubtitle')}</p>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl border border-[#18241C] bg-[#0C120E]/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-5 rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-xs font-medium text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-secondary">
                {t('auth.email')}
              </label>
              <input
                type="email"
                {...register('email', {
                  required: t('auth.emailRequired'),
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: t('auth.invalidEmail') },
                })}
                placeholder="name@example.com"
                className="w-full rounded-xl border border-[#18241C] bg-[#111A13] px-4 py-3 text-sm text-white placeholder:text-muted outline-none focus:border-[#2CEE55] focus:ring-1 focus:ring-[#2CEE55]/30 transition-all"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-secondary">
                  {t('auth.password')}
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-[#2CEE55] hover:underline"
                >
                  {t('auth.forgotPassword')}
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', { required: t('auth.passwordRequired') })}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-[#18241C] bg-[#111A13] px-4 py-3 pe-11 text-sm text-white placeholder:text-muted outline-none focus:border-[#2CEE55] focus:ring-1 focus:ring-[#2CEE55]/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 end-0 flex items-center pe-3.5 text-muted hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-[#2CEE55] py-3.5 text-sm font-extrabold text-black shadow-[0_0_25px_rgba(44,238,85,0.35)] hover:bg-[#3DF567] hover:shadow-[0_0_35px_rgba(44,238,85,0.5)] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <LogIn className="h-4 w-4" />
              <span>{submitting ? t('common.loading') : t('auth.login')}</span>
            </button>
          </form>

          {/* Register Link */}
          <p className="mt-6 text-center text-xs text-secondary">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="font-bold text-[#2CEE55] hover:underline">
              {t('auth.register')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
