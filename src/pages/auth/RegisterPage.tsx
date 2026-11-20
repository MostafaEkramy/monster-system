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
      <div className="flex min-h-screen items-center justify-center bg-[#060907] p-4">
        <div className="w-full max-w-md text-center">
          <div className="rounded-3xl border border-[#18241C] bg-[#0C120E] p-8 shadow-2xl">
            <CheckCircle className="mx-auto h-16 w-16 text-[#2CEE55] mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">
              {t('auth.pendingApproval')}
            </h2>
            <p className="text-sm text-secondary mb-6">
              {t('auth.pendingMessage')}
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-full bg-[#2CEE55] px-6 py-2.5 text-sm font-bold text-black hover:bg-[#3BF362] shadow-[0_0_20px_rgba(44,238,85,0.35)] transition-all"
            >
              {t('auth.login')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#060907] p-4 overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#2CEE55]/10 blur-[120px] rounded-full pointer-events-none" />

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

      <div className="relative w-full max-w-md z-10 py-8">
        {/* Branding */}
        <div className="mb-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[#0D1610] border border-[#1C2C1F] shadow-[0_0_50px_rgba(44,238,85,0.22)] mx-auto mb-4">
            <img src="/logo.png" alt="Monsters Emblem" className="h-12 w-12 object-contain" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Join Monsters <span className="text-[#2CEE55]">Team</span>
          </h1>
          <p className="mt-1 text-xs text-secondary">{t('auth.registerSubtitle')}</p>
        </div>

        {/* Registration Card */}
        <div className="rounded-3xl border border-[#18241C] bg-[#0C120E]/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-secondary">
                {t('auth.fullName')}
              </label>
              <input
                type="text"
                {...register('fullName', { required: t('auth.nameRequired') })}
                className="w-full rounded-xl border border-[#18241C] bg-[#111A13] px-4 py-3 text-sm text-white placeholder:text-muted outline-none focus:border-[#2CEE55] focus:ring-1 focus:ring-[#2CEE55]/30 transition-all"
              />
              {errors.fullName && (
                <p className="mt-1 text-xs text-red-400">{errors.fullName.message}</p>
              )}
            </div>

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
                className="w-full rounded-xl border border-[#18241C] bg-[#111A13] px-4 py-3 text-sm text-white placeholder:text-muted outline-none focus:border-[#2CEE55] focus:ring-1 focus:ring-[#2CEE55]/30 transition-all"
                placeholder="name@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-secondary">
                {t('auth.password')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', {
                    required: t('auth.passwordRequired'),
                    minLength: { value: 8, message: t('auth.passwordMin') },
                  })}
                  className="w-full rounded-xl border border-[#18241C] bg-[#111A13] px-4 py-3 pe-10 text-sm text-white placeholder:text-muted outline-none focus:border-[#2CEE55] focus:ring-1 focus:ring-[#2CEE55]/30 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted hover:text-white"
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
              <label className="mb-1.5 block text-xs font-bold text-secondary">
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
                  className="w-full rounded-xl border border-[#18241C] bg-[#111A13] px-4 py-3 pe-10 text-sm text-white placeholder:text-muted outline-none focus:border-[#2CEE55] focus:ring-1 focus:ring-[#2CEE55]/30 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted hover:text-white"
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
              <label className="mb-1.5 block text-xs font-bold text-secondary">
                {t('auth.phone')}
              </label>
              <input
                type="tel"
                {...register('phone', { required: t('auth.phoneRequired') })}
                className="w-full rounded-xl border border-[#18241C] bg-[#111A13] px-4 py-3 text-sm text-white placeholder:text-muted outline-none focus:border-[#2CEE55] focus:ring-1 focus:ring-[#2CEE55]/30 transition-all"
                placeholder="01xxxxxxxxx"
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-red-400">{errors.phone.message}</p>
              )}
            </div>

            {/* University */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-secondary">
                {t('auth.university')}
              </label>
              <input
                type="text"
                {...register('university')}
                placeholder="Faculty of Engineering"
                className="w-full rounded-xl border border-[#18241C] bg-[#111A13] px-4 py-3 text-sm text-white placeholder:text-muted outline-none focus:border-[#2CEE55] focus:ring-1 focus:ring-[#2CEE55]/30 transition-all"
              />
            </div>

            {/* Committee */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-secondary">
                {t('auth.selectCommittee')}
              </label>
              <select
                {...register('committee', { required: t('auth.committeeRequired') })}
                className="w-full rounded-xl border border-[#18241C] bg-[#111A13] px-4 py-3 text-sm text-white outline-none focus:border-[#2CEE55] focus:ring-1 focus:ring-[#2CEE55]/30 transition-all"
              >
                <option value="">{t('auth.selectCommittee')}</option>
                {committees.map((c) => (
                  <option key={c} value={c} className="bg-[#0C120E] text-white">
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
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-[#2CEE55] py-3.5 text-sm font-extrabold text-black shadow-[0_0_25px_rgba(44,238,85,0.35)] hover:bg-[#3DF567] hover:shadow-[0_0_35px_rgba(44,238,85,0.5)] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              <span>{submitting ? t('common.loading') : t('auth.register')}</span>
            </button>
          </form>

          {/* Login link */}
          <p className="mt-6 text-center text-xs text-secondary">
            {t('auth.hasAccount')}{' '}
            <Link to="/login" className="font-bold text-[#2CEE55] hover:underline">
              {t('auth.login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
