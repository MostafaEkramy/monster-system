import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { initializeCommittees } from '@/services/committee.service';
import { Shield, Database, Sparkles, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  const { userProfile } = useAuth();
  const { t } = useTranslation();

  const [loadingCommittees, setLoadingCommittees] = useState(false);
  const [committeeSuccess, setCommitteeSuccess] = useState(false);

  const handleInitCommittees = async () => {
    setLoadingCommittees(true);
    setCommitteeSuccess(false);
    try {
      await initializeCommittees();
      setCommitteeSuccess(true);
    } catch (err) {
      console.error('Failed to initialize committees:', err);
    } finally {
      setLoadingCommittees(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.settings')}
        subtitle="System configuration, security settings, and organizational defaults"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Committee Initialization */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#8EDB2A]/10 flex items-center justify-center text-[#8EDB2A]">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Initialize Committees</CardTitle>
                <CardDescription>
                  Ensure all 6 core committees (Logistics, Creativity, Media, PR, HR, Activity) exist in Firestore.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-secondary">
              If this is a fresh setup or committees need to be provisioned with default descriptions in English and Arabic, run initialization.
            </p>
            {committeeSuccess && (
              <div className="flex items-center gap-2 text-sm text-[#8EDB2A] bg-[#8EDB2A]/10 p-3 rounded-lg border border-[#8EDB2A]/20">
                <CheckCircle2 className="h-4 w-4" />
                Committees successfully initialized!
              </div>
            )}
            <Button onClick={handleInitCommittees} disabled={loadingCommittees}>
              {loadingCommittees ? t('common.loading') : 'Initialize 6 Committees'}
            </Button>
          </CardContent>
        </Card>

        {/* System Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>System Information</CardTitle>
                <CardDescription>Current build & environment details</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-secondary">
            <div className="flex justify-between py-1.5 border-b border-border-color">
              <span>Organization</span>
              <span className="font-semibold text-primary">Monsters Team</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border-color">
              <span>Institution</span>
              <span className="font-semibold text-primary">Mansoura National University</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border-color">
              <span>Platform Version</span>
              <span className="font-mono text-primary">v2.0.0 (Production)</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span>Primary Brand Color</span>
              <span className="font-mono text-[#8EDB2A]">#8EDB2A</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
