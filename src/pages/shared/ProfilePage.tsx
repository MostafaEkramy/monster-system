import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { updateUserProfile } from '@/services/user.service';
import { uploadProfileImage } from '@/services/storage.service';
import { User, Mail, Phone, School, Camera, Check, Loader2, Sparkles, Zap } from 'lucide-react';
import { COMMITTEE_DISPLAY, ROLE_DISPLAY } from '@/types';

export default function ProfilePage() {
  const { userProfile, refreshProfile } = useAuth();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [fullName, setFullName] = useState(userProfile?.fullName || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [university, setUniversity] = useState(userProfile?.university || '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [compressionStats, setCompressionStats] = useState<{
    original: string;
    compressed: string;
    saved: number;
  } | null>(null);

  if (!userProfile) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      await updateUserProfile(userProfile.id, {
        fullName,
        phone,
        university,
      });
      await refreshProfile();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploadingImage(true);
    setCompressionStats(null);
    try {
      const file = e.target.files[0];
      const uploadResult = await uploadProfileImage(userProfile.id, file);
      await updateUserProfile(userProfile.id, { profileImage: uploadResult.url });
      await refreshProfile();
      if (uploadResult.compression) {
        setCompressionStats(uploadResult.compression);
      }
    } catch (err) {
      console.error('Error uploading image:', err);
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title={t('profile.myProfile')}
        subtitle="Manage personal contact info and view organizational status"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Avatar & Role Summary */}
        <Card className="text-center p-6 border border-[#19261C] bg-[#0C120E] rounded-2xl">
          <div className="relative inline-block mx-auto mb-4">
            <Avatar className="h-28 w-28 border-4 border-[#2CEE55] shadow-[0_0_25px_rgba(44,238,85,0.3)]">
              <AvatarImage src={userProfile.profileImage} />
              <AvatarFallback className="text-2xl font-black bg-[#121F16] text-[#2CEE55]">
                {userProfile.fullName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <label className="absolute bottom-0 right-0 p-2.5 rounded-full bg-[#2CEE55] text-black cursor-pointer hover:bg-[#39E75F] transition-all shadow-lg hover:scale-110">
              {uploadingImage ? (
                <Loader2 className="h-4 w-4 animate-spin text-black" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                className="hidden"
              />
            </label>
          </div>

          {/* Compression Feedback Banner */}
          {uploadingImage && (
            <p className="text-xs font-semibold text-[#2CEE55] animate-pulse mb-3">
              {isAr ? '⚡ جاري ضغط الصورة ورفعها...' : '⚡ Compressing & uploading image...'}
            </p>
          )}

          {compressionStats && !uploadingImage && (
            <div className="mb-4 p-2.5 rounded-xl bg-[#121F16] border border-[#2CEE55]/40 text-start text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-[#2CEE55] font-bold">
                <Zap className="h-3.5 w-3.5" />
                <span>{isAr ? 'تم ضغط الصورة بنجاح!' : 'Image Compressed!'}</span>
              </div>
              <p className="text-[11px] text-secondary">
                {isAr
                  ? `الحجم الأصلي: ${compressionStats.original} ← المضغوط: ${compressionStats.compressed}`
                  : `Original: ${compressionStats.original} → ${compressionStats.compressed}`}
              </p>
              <p className="text-[11px] font-bold text-[#2CEE55]">
                {isAr
                  ? `وفرت ${compressionStats.saved}% من الحجم`
                  : `Saved ${compressionStats.saved}% storage`}
              </p>
            </div>
          )}

          <h3 className="text-xl font-bold text-white">{userProfile.fullName}</h3>
          <p className="text-xs text-[#2CEE55] font-semibold mt-1 uppercase tracking-wider">
            {isAr ? ROLE_DISPLAY[userProfile.role]?.ar : ROLE_DISPLAY[userProfile.role]?.en}
          </p>
          <p className="text-xs text-secondary mt-0.5">
            {isAr ? COMMITTEE_DISPLAY[userProfile.committee]?.ar : COMMITTEE_DISPLAY[userProfile.committee]?.en} Committee
          </p>

          <div className="grid grid-cols-2 gap-2 mt-6 pt-6 border-t border-[#18241C] text-center">
            <div>
              <p className="text-2xl font-black text-[#2CEE55]">{userProfile.currentSeasonPoints || 0}</p>
              <p className="text-xs text-secondary">Season Points</p>
            </div>
            <div>
              <p className="text-2xl font-black text-white">{userProfile.attendancePercentage || 100}%</p>
              <p className="text-xs text-secondary">Attendance</p>
            </div>
          </div>
        </Card>

        {/* Right: Personal Information Form */}
        <Card className="md:col-span-2 border border-[#19261C] bg-[#0C120E] rounded-2xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#2CEE55]" />
              {t('profile.personalInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              {success && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-[#2CEE55]/15 border border-[#2CEE55]/30 text-[#2CEE55] text-sm">
                  <Check className="h-4 w-4" />
                  {t('profile.profileUpdated')}
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-secondary mb-1.5 block">
                  {t('auth.fullName')}
                </label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-secondary mb-1.5 block">
                  {t('auth.email')}
                </label>
                <Input
                  value={userProfile.email}
                  disabled
                  className="opacity-60 cursor-not-allowed"
                />
                <p className="text-[11px] text-muted mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-secondary mb-1.5 block">
                  {t('auth.phone')}
                </label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01xxxxxxxxx"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-secondary mb-1.5 block">
                  {t('auth.university')}
                </label>
                <Input
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="Faculty of Engineering"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-[#2CEE55] hover:bg-[#39E75F] text-black font-extrabold px-6"
                >
                  {saving ? t('common.loading') : t('common.save')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
