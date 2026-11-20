import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { COMMITTEE_DISPLAY } from '@/types';
import type { CommitteeName } from '@/types';
import { Eye, EyeOff, UserPlus, Sun, Moon, Languages, CheckCircle } from 'lucide-react';

const committees: CommitteeName[] = ['logistics', 'creativity', 'media', 'pr', 'hr', 'activity'];

const registerSchema = z
  .object({
    fullName: z.string().min(1, 'Full name is required'),
    email: z.string().min(1, 'Email is required').email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    phone: z.string().min(1, 'Phone number is required'),
    university: z.string().optional(),
    committee: z.string().min(1, 'Please select a committee'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const { t, i18n } = useTranslation();
  const { register: registerUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      university: '',
      committee: '',
    },
  });

  const onSubmit = async (data: RegisterForm) => {
    setError('');
    setSubmitting(true);
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        phone: data.phone,
        university: data.university || '',
        committee: data.committee as CommitteeName,
      });
      setSuccess(true);
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') {
        setError('An account with this email already exists');
      } else if (code === 'auth/weak-password') {
        setError('Password is too weak');
      } else {
        setError(err?.message || 'Registration failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'ar' : 'en');
  };

  // Success state
  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-main p-4">
        <div className="w-full max-w-md text-center">
          <div className="rounded-2xl border border-sidebar bg-card p-8">
            <CheckCircle className="mx-auto h-16 w-16 text-brand-primary mb-4" />
            <h2 className="text-xl font-bold text-primary-text mb-2">
              {t('auth.pendingApproval')}
            </h2>
            <p className="text-sm text-secondary-text mb-6">
              {t('auth.pendingMessage')}
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-lg bg-brand-primary px-6 py-2.5 text-sm font-semibold text-black hover:bg-brand-hover transition-colors"
            >
              {t('auth.login')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-primary-text">{t('auth.registerTitle')}</h1>
          <p className="mt-1 text-sm text-secondary-text">{t('auth.registerSubtitle')}</p>
        </div>

        {/* Registration card */}
        <div className="rounded-2xl border border-sidebar bg-card p-6 shadow-lg">
          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-primary-text">
                {t('auth.fullName')}
              </label>
              <input
                type="text"
                {...register('fullName', { required: t('auth.nameRequired') })}
                className="w-full rounded-lg border border-sidebar bg-elevated px-4 py-2.5 text-sm text-primary-text placeholder:text-muted-text outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 transition-colors"
              />
              {errors.fullName && (
                <p className="mt-1 text-xs text-red-400">{errors.fullName.message}</p>
              )}
            </div>

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
                    minLength: { value: 8, message: t('auth.passwordMin') },
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

            {/* Confirm Password */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-primary-text">
                {t('auth.confirmPassword')}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...register('confirmPassword', {
                    required: t('auth.passwordRequired'),
                    validate: (val, formValues) =>
                      val === formValues.password || t('auth.passwordMatch'),
                  })}
                  className="w-full rounded-lg border border-sidebar bg-elevated px-4 py-2.5 pe-10 text-sm text-primary-text placeholder:text-muted-text outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-secondary-text hover:text-primary-text"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-400">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-primary-text">
                {t('auth.phone')}
              </label>
              <input
                type="tel"
                {...register('phone', { required: t('auth.phoneRequired') })}
                className="w-full rounded-lg border border-sidebar bg-elevated px-4 py-2.5 text-sm text-primary-text placeholder:text-muted-text outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 transition-colors"
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-red-400">{errors.phone.message}</p>
              )}
            </div>

            {/* University */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-primary-text">
                {t('auth.university')}
              </label>
              <input
                type="text"
                {...register('university')}
                className="w-full rounded-lg border border-sidebar bg-elevated px-4 py-2.5 text-sm text-primary-text placeholder:text-muted-text outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 transition-colors"
              />
            </div>

            {/* Committee */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-primary-text">
                {t('auth.selectCommittee')}
              </label>
              <select
                {...register('committee', { required: t('auth.committeeRequired') })}
                className="w-full rounded-lg border border-sidebar bg-elevated px-4 py-2.5 text-sm text-primary-text outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 transition-colors appearance-none"
              >
                <option value="">{t('auth.selectCommittee')}</option>
                {committees.map((c) => (
                  <option key={c} value={c}>
                    {isRTL ? COMMITTEE_DISPLAY[c].ar : COMMITTEE_DISPLAY[c].en}
                  </option>
                ))}
              </select>
              {errors.committee && (
                <p className="mt-1 text-xs text-red-400">{errors.committee.message}</p>
              )}
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
                <UserPlus className="h-4 w-4" />
              )}
              {submitting ? t('common.loading') : t('auth.register')}
            </button>
          </form>

          {/* Login link */}
          <p className="mt-4 text-center text-sm text-secondary-text">
            {t('auth.hasAccount')}{' '}
            <Link to="/login" className="font-medium text-brand-primary hover:underline">
              {t('auth.login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
