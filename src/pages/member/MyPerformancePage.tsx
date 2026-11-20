import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { StatCard } from '@/components/common/StatCard';
import { Award, Trophy, TrendingUp, CheckCircle } from 'lucide-react';
import { getCommitteeLeaderboard } from '@/services/leaderboard.service';
import { getActiveSeason } from '@/services/season.service';
import { COMMITTEE_DISPLAY } from '@/types';

export default function MyPerformancePage() {
  const { userProfile } = useAuth();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [leaderboardRank, setLeaderboardRank] = useState<number | null>(null);
  const [totalParticipants, setTotalParticipants] = useState(0);

  useEffect(() => {
    async function load() {
      if (!userProfile) return;
      try {
        const season = await getActiveSeason();
        if (season) {
          const board = await getCommitteeLeaderboard(userProfile.committee, season.id);
          setTotalParticipants(board.length);
          const foundIndex = board.findIndex((item) => item.userId === userProfile.id);
          if (foundIndex !== -1) {
            setLeaderboardRank(foundIndex + 1);
          }
        }
      } catch (err) {
        console.error('Failed to load performance ranking:', err);
      }
    }
    load();
  }, [userProfile]);

  if (!userProfile) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.myPerformance')}
        subtitle="Individual scorecard, ranking standings, and personal metrics"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('dashboard.myPoints')}
          value={userProfile.currentSeasonPoints || 0}
          icon={Award}
          subtitle="Cumulative season points"
        />
        <StatCard
          title={t('dashboard.myRank')}
          value={leaderboardRank ? `#${leaderboardRank}` : '#-'}
          icon={Trophy}
          subtitle={`Out of ${totalParticipants} members`}
        />
        <StatCard
          title={t('dashboard.myAttendance')}
          value={`${userProfile.attendancePercentage || 100}%`}
          icon={CheckCircle}
          subtitle="Attendance percentage"
        />
        <StatCard
          title={t('common.committee')}
          value={isAr ? COMMITTEE_DISPLAY[userProfile.committee]?.ar : COMMITTEE_DISPLAY[userProfile.committee]?.en}
          icon={TrendingUp}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Standing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-secondary">
            Your points are calculated directly from verified evaluations made by the HR Committee and Magic Administrators during the active season. High scores and on-time task submissions elevate your standing on the committee leaderboard.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
