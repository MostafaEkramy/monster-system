import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { UserProfile } from '@/types';
import { Eye, EyeOff, Sparkles, Shield, CheckCircle, ArrowLeft } from 'lucide-react';

const SETUP_SECRET = 'MONSTERS_MAGIC_2024';

interface MagicSetupForm {
  setupSecret: string;
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phone: string;
}

export function MagicSetupPage() {
  const { t } = useTranslation();
  const { isMagicInitialized } = useAuth();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MagicSetupForm>({
    defaultValues: {
      setupSecret: '',
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      phone: '',
    },
  });

  // Redirect if already initialized
  if (isMagicInitialized) {
    navigate('/login', { replace: true });
    return null;
  }

  const onSubmit = async (data: MagicSetupForm) => {
    setError('');

    // Validate setup secret
    if (data.setupSecret !== SETUP_SECRET) {
      setError('Invalid setup secret');
      return;
    }

    // Validate password match
    if (data.password !== data.confirmPassword) {
      setError(t('auth.passwordMatch'));
      return;
    }

    setSubmitting(true);
    try {
      // Create Firebase Auth user
      const credential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const uid = credential.user.uid;
      const now = Timestamp.now();

      // Create UserProfile in Firestore
      const userProfile: Omit<UserProfile, 'id'> = {
        email: data.email,
        fullName: data.fullName,
        phone: data.phone,
        university: '',
        committee: 'hr',
        role: 'magic',
        status: 'approved',
        joinDate: now,
        currentSeasonPoints: 0,
        currentSeasonRank: 0,
        attendancePercentage: 0,
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(doc(db, 'users', uid), { ...userProfile, id: uid });

      // Set systemSettings to mark magic as initialized
      await setDoc(doc(db, 'systemSettings', 'config'), {
        id: 'config',
        magicInitialized: true,
        currentSeasonId: '',
        currentSeasonName: '',
        maintenanceMode: false,
        updatedAt: now,
      });

      setSuccess(true);
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') {
        setError('An account with this email already exists');
      } else if (code === 'auth/weak-password') {
        setError('Password is too weak. Use at least 6 characters.');
      } else {
        setError(err?.message || 'Setup failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-main p-4">
        <div className="w-full max-w-md text-center">
          <div className="rounded-2xl border border-brand-primary/20 bg-brand-primary/5 p-8">
            <CheckCircle className="mx-auto h-16 w-16 text-brand-primary mb-4" />
            <h2 className="text-xl font-bold text-primary-text mb-2">
              Magic Account Created!
            </h2>
            <p className="text-sm text-secondary-text mb-6">
              The administrator account has been initialized. You can now log in.
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
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-primary/10 border border-brand-primary/20">
            <Sparkles className="h-10 w-10 text-brand-primary" />
          </div>
          <h1 className="text-2xl font-bold text-primary-text">{t('auth.magicSetup')}</h1>
          <p className="mt-1 text-sm text-secondary-text">{t('auth.magicSetupSubtitle')}</p>
        </div>

        <div className="rounded-2xl border border-sidebar bg-card p-6 shadow-lg">
          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Setup Secret */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-primary-text">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-brand-primary" />
                  {t('auth.setupSecret')}
                </div>
              </label>
              <input
                type="password"
                {...register('setupSecret', { required: 'Setup secret is required' })}
                className="w-full rounded-lg border border-sidebar bg-elevated px-4 py-2.5 text-sm text-primary-text placeholder:text-muted-text outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 transition-colors"
                placeholder="Enter the setup secret"
              />
              {errors.setupSecret && (
                <p className="mt-1 text-xs text-red-400">{errors.setupSecret.message}</p>
              )}
            </div>

            <div className="border-t border-sidebar pt-4">
              <p className="text-sm font-medium text-secondary-text mb-3">Admin Credentials</p>
            </div>

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
                placeholder="admin@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
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

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-primary py-2.5 text-sm font-semibold text-black transition-colors hover:bg-brand-hover disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {submitting ? t('common.loading') : t('auth.initializeMagic')}
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
        </div>
      </div>
    </div>
  );
}

export default MagicSetupPage;
