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
import { User, Mail, Phone, School, Camera, Check } from 'lucide-react';
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
    try {
      const file = e.target.files[0];
      const uploadResult = await uploadProfileImage(userProfile.id, file);
      await updateUserProfile(userProfile.id, { profileImage: uploadResult.url });
      await refreshProfile();
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
        <Card className="text-center p-6">
          <div className="relative inline-block mx-auto mb-4">
            <Avatar className="h-28 w-28 border-4 border-[#8EDB2A]">
              <AvatarImage src={userProfile.profileImage} />
              <AvatarFallback className="text-2xl font-bold text-[#8EDB2A]">
                {userProfile.fullName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <label className="absolute bottom-0 right-0 p-2 rounded-full bg-[#8EDB2A] text-black cursor-pointer hover:bg-[#A3EB45] transition-colors shadow">
              <Camera className="h-4 w-4" />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                className="hidden"
              />
            </label>
          </div>

          <h3 className="text-xl font-bold text-primary">{userProfile.fullName}</h3>
          <p className="text-xs text-[#8EDB2A] font-semibold mt-1 uppercase tracking-wider">
            {isAr ? ROLE_DISPLAY[userProfile.role]?.ar : ROLE_DISPLAY[userProfile.role]?.en}
          </p>
          <p className="text-xs text-muted mt-0.5">
            {isAr ? COMMITTEE_DISPLAY[userProfile.committee]?.ar : COMMITTEE_DISPLAY[userProfile.committee]?.en} Committee
          </p>

          <div className="grid grid-cols-2 gap-2 mt-6 pt-6 border-t border-border-color text-center">
            <div>
              <p className="text-2xl font-black text-[#8EDB2A]">{userProfile.currentSeasonPoints || 0}</p>
              <p className="text-xs text-muted">Season Points</p>
            </div>
            <div>
              <p className="text-2xl font-black text-primary">{userProfile.attendancePercentage || 100}%</p>
              <p className="text-xs text-muted">Attendance</p>
            </div>
          </div>
        </Card>

        {/* Right: Personal Information Form */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{t('profile.personalInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              {success && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-[#8EDB2A]/10 border border-[#8EDB2A]/30 text-[#8EDB2A] text-sm">
                  <Check className="h-4 w-4" />
                  {t('profile.profileUpdated')}
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-primary mb-1.5 block">
                  {t('auth.fullName')}
                </label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-primary mb-1.5 block">
                  {t('auth.email')}
                </label>
                <Input disabled value={userProfile.email} />
                <p className="text-[10px] text-muted mt-1">
                  Email is locked to your authenticated Monsters Team ID.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-primary mb-1.5 block">
                  {t('auth.phone')}
                </label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01xxxxxxxxx"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-primary mb-1.5 block">
                  {t('auth.university')}
                </label>
                <Input
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="Faculty / Academic year"
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-border-color">
                <Button type="submit" disabled={saving}>
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
