import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Sparkles, Calendar, CheckCircle2, Archive, Plus } from 'lucide-react';
import {
  getSeasons,
  getActiveSeason,
  createSeason,
  activateSeason,
  archiveSeason,
} from '@/services/season.service';
import type { Season } from '@/types';
import { Timestamp } from 'firebase/firestore';

export default function SeasonsPage() {
  const { userProfile } = useAuth();
  const { t } = useTranslation();

  const [seasons, setSeasons] = useState<Season[]>([]);
  const [activeSeason, setActiveSeason] = useState<Season | null>(null);
  const [loading, setLoading] = useState(true);

  // Create season form
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Archive dialog
  const [archivingSeason, setArchivingSeason] = useState<Season | null>(null);

  const loadSeasons = async () => {
    setLoading(true);
    try {
      const [list, active] = await Promise.all([getSeasons(), getActiveSeason()]);
      setSeasons(list);
      setActiveSeason(active);
    } catch (err) {
      console.error('Failed to load seasons:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSeasons();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !startDate || !endDate) return;
    setActionLoading(true);
    try {
      await createSeason({
        name,
        description,
        startDate: Timestamp.fromDate(new Date(startDate)),
        endDate: Timestamp.fromDate(new Date(endDate)),
        status: 'upcoming',
      });
      setShowCreate(false);
      setName('');
      setDescription('');
      setStartDate('');
      setEndDate('');
      await loadSeasons();
    } catch (err) {
      console.error('Error creating season:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivate = async (seasonId: string) => {
    setActionLoading(true);
    try {
      await activateSeason(seasonId);
      await loadSeasons();
    } catch (err) {
      console.error('Error activating season:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!archivingSeason) return;
    setActionLoading(true);
    try {
      await archiveSeason(archivingSeason.id);
      setArchivingSeason(null);
      await loadSeasons();
    } catch (err) {
      console.error('Error archiving season:', err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('seasons.createSeason')}
        subtitle="Manage organizational competition seasons and archive historical results"
      >
        <Button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {t('seasons.createSeason')}
        </Button>
      </PageHeader>

      {/* Create Season Form */}
      {showCreate && (
        <Card className="border-[#8EDB2A]/40 bg-card">
          <CardHeader>
            <CardTitle>{t('seasons.createSeason')}</CardTitle>
            <CardDescription>Start a new competition season with points reset to zero.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-secondary mb-1 block">
                  {t('seasons.seasonName')} *
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Season 2024 / Semester 1"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-secondary mb-1 block">
                    {t('seasons.startDate')} *
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-secondary mb-1 block">
                    {t('seasons.endDate')} *
                  </label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-secondary mb-1 block">
                  {t('seasons.description')}
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional season notes and milestones..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => setShowCreate(false)}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={actionLoading}>
                  {actionLoading ? t('common.loading') : t('seasons.createSeason')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Active Season Highlight */}
      {activeSeason ? (
        <Card className="border-[#8EDB2A] bg-[#8EDB2A]/5 relative overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#8EDB2A]/20 flex items-center justify-center text-[#8EDB2A]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xl">{activeSeason.name}</CardTitle>
                    <Badge variant="default">ACTIVE</Badge>
                  </div>
                  <p className="text-xs text-muted mt-1">
                    {activeSeason.startDate && new Date(activeSeason.startDate.toMillis()).toLocaleDateString()} -{' '}
                    {activeSeason.endDate && new Date(activeSeason.endDate.toMillis()).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="text-yellow-400 hover:text-yellow-500 border-yellow-500/30"
                onClick={() => setArchivingSeason(activeSeason)}
              >
                <Archive className="h-4 w-4 mr-2" />
                {t('seasons.archiveSeason')}
              </Button>
            </div>
          </CardHeader>
        </Card>
      ) : (
        <Card className="border-dashed border-border-color">
          <CardContent className="py-8 text-center text-secondary">
            {t('seasons.noActiveSeason')}
          </CardContent>
        </Card>
      )}

      {/* All Seasons List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-primary">{t('seasons.seasonArchive')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {seasons.map((season) => (
            <Card key={season.id} className="border-border-color">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{season.name}</CardTitle>
                  <Badge
                    variant={
                      season.status === 'active'
                        ? 'default'
                        : season.status === 'archived'
                        ? 'secondary'
                        : 'outline'
                    }
                  >
                    {season.status.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted">
                  {season.startDate && new Date(season.startDate.toMillis()).toLocaleDateString()} -{' '}
                  {season.endDate && new Date(season.endDate.toMillis()).toLocaleDateString()}
                </p>
                {season.description && (
                  <p className="text-xs text-secondary line-clamp-2">{season.description}</p>
                )}
                {season.status !== 'active' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs"
                    onClick={() => handleActivate(season.id)}
                    disabled={actionLoading}
                  >
                    {t('seasons.activateSeason')}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Archive Confirm Dialog */}
      <ConfirmDialog
        open={!!archivingSeason}
        onOpenChange={(open) => !open && setArchivingSeason(null)}
        title={t('seasons.archiveSeason')}
        description={`Are you sure you want to archive "${archivingSeason?.name}"? Historical points will be preserved.`}
        confirmLabel={t('seasons.archiveSeason')}
        onConfirm={handleArchive}
        loading={actionLoading}
      />
    </div>
  );
}
