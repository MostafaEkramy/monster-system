import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, FileText, CheckCircle } from 'lucide-react';
import { getCommittees } from '@/services/committee.service';
import type { Committee } from '@/types';
import { COMMITTEE_DISPLAY } from '@/types';

export default function CommitteesPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getCommittees();
        setCommittees(data);
      } catch (err) {
        console.error('Failed to load committees:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.committees')}
        subtitle="Operational overview of all six Monsters Team committees"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {committees.map((c) => (
          <Card key={c.id} className="border-border-color hover:border-[#8EDB2A]/50 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[#8EDB2A]/10 border border-[#8EDB2A]/20 flex items-center justify-center text-[#8EDB2A]">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {isAr ? c.displayNameAr || COMMITTEE_DISPLAY[c.name]?.ar : c.displayName || COMMITTEE_DISPLAY[c.name]?.en}
                    </CardTitle>
                    <p className="text-xs text-muted">
                      Leader: {c.leaderName || 'Unassigned'}
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-secondary min-h-[40px]">
                {isAr ? c.descriptionAr : c.description}
              </p>
              <div className="flex items-center justify-between pt-3 border-t border-border-color text-xs text-muted">
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-[#8EDB2A]" />
                  {c.memberCount || 0} Members
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  Active
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
