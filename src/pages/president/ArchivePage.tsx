import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/EmptyState';
import { Archive, Calendar } from 'lucide-react';
import { getSeasons } from '@/services/season.service';
import type { Season } from '@/types';

export default function ArchivePage() {
  const { t } = useTranslation();
  const [archivedSeasons, setArchivedSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const seasons = await getSeasons();
        setArchivedSeasons(seasons.filter((s) => s.status === 'archived'));
      } catch (err) {
        console.error('Failed to load archive:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.archive')}
        subtitle="Historical records of finalized competition seasons and awards"
      />

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#8EDB2A] border-t-transparent" />
        </div>
      ) : archivedSeasons.length === 0 ? (
        <EmptyState
          icon={Archive}
          title="No Archived Seasons"
          description="When active seasons are finalized and archived by Magic, their historical leaderboards and statistics will be safely preserved here."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {archivedSeasons.map((s) => (
            <Card key={s.id} className="border-border-color">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{s.name}</CardTitle>
                  <Badge variant="secondary">ARCHIVED</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {s.startDate && new Date(s.startDate.toMillis()).toLocaleDateString()} -{' '}
                  {s.endDate && new Date(s.endDate.toMillis()).toLocaleDateString()}
                </p>
                {s.description && (
                  <p className="text-sm text-secondary">{s.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
