import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/common/PageHeader';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Medal, Award, Sparkles } from 'lucide-react';
import { getCommitteeLeaderboard } from '@/services/leaderboard.service';
import { getActiveSeason } from '@/services/season.service';
import type { CommitteeName } from '@/types';
import { COMMITTEE_DISPLAY } from '@/types';

export default function LeaderboardPage() {
  const { userProfile } = useAuth();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [activeTab, setActiveTab] = useState<CommitteeName>(userProfile?.committee || 'logistics');
  const [board, setBoard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const committees: CommitteeName[] = ['logistics', 'creativity', 'media', 'pr', 'hr', 'activity'];

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const season = await getActiveSeason();
        if (season) {
          const data = await getCommitteeLeaderboard(activeTab, season.id);
          setBoard(data);
        } else {
          setBoard([]);
        }
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [activeTab]);

  const topThree = board.slice(0, 3);
  const remaining = board.slice(3);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('leaderboard.committeeLeaderboard')}
        subtitle="Independent rankings per committee calculated from finalized active-season task evaluations"
      />

      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as CommitteeName)}
        className="w-full"
      >
        <TabsList className="grid grid-cols-3 sm:grid-cols-6 w-full max-w-3xl mb-6">
          {committees.map((c) => (
            <TabsTrigger key={c} value={c}>
              {isAr ? COMMITTEE_DISPLAY[c].ar : COMMITTEE_DISPLAY[c].en}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Podium for Top 3 */}
      {topThree.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 pb-2">
          {/* 2nd place */}
          {topThree[1] && (
            <Card className="border-border-color order-2 md:order-1 relative overflow-hidden bg-card text-center pt-8 pb-6">
              <div className="absolute top-3 left-3 text-xs font-bold text-gray-400 flex items-center gap-1">
                <Medal className="h-4 w-4" /> 2nd Place
              </div>
              <Avatar className="h-16 w-16 mx-auto mb-3 border-2 border-gray-400">
                <AvatarFallback className="text-gray-400 font-bold">2</AvatarFallback>
              </Avatar>
              <h3 className="font-bold text-primary text-base">{topThree[1].userName}</h3>
              <p className="text-xl font-black text-[#8EDB2A] mt-1">{topThree[1].totalPoints} pts</p>
              <p className="text-xs text-muted mt-1">{topThree[1].tasksEvaluated || 0} tasks evaluated</p>
            </Card>
          )}

          {/* 1st place */}
          {topThree[0] && (
            <Card className="border-[#8EDB2A] order-1 md:order-2 relative overflow-hidden bg-[#8EDB2A]/5 text-center pt-8 pb-6 md:-translate-y-2 shadow-lg shadow-[#8EDB2A]/10">
              <div className="absolute top-3 left-3 text-xs font-bold text-[#8EDB2A] flex items-center gap-1">
                <Trophy className="h-4 w-4 text-yellow-400" /> 1st Place
              </div>
              <Avatar className="h-20 w-20 mx-auto mb-3 border-4 border-[#8EDB2A]">
                <AvatarFallback className="text-[#8EDB2A] font-extrabold text-xl">1</AvatarFallback>
              </Avatar>
              <h3 className="font-bold text-primary text-lg">{topThree[0].userName}</h3>
              <p className="text-2xl font-black text-[#8EDB2A] mt-1">{topThree[0].totalPoints} pts</p>
              <p className="text-xs text-muted mt-1">{topThree[0].tasksEvaluated || 0} tasks evaluated</p>
            </Card>
          )}

          {/* 3rd place */}
          {topThree[2] && (
            <Card className="border-border-color order-3 relative overflow-hidden bg-card text-center pt-8 pb-6">
              <div className="absolute top-3 left-3 text-xs font-bold text-amber-600 flex items-center gap-1">
                <Medal className="h-4 w-4" /> 3rd Place
              </div>
              <Avatar className="h-16 w-16 mx-auto mb-3 border-2 border-amber-600">
                <AvatarFallback className="text-amber-600 font-bold">3</AvatarFallback>
              </Avatar>
              <h3 className="font-bold text-primary text-base">{topThree[2].userName}</h3>
              <p className="text-xl font-black text-[#8EDB2A] mt-1">{topThree[2].totalPoints} pts</p>
              <p className="text-xs text-muted mt-1">{topThree[2].tasksEvaluated || 0} tasks evaluated</p>
            </Card>
          )}
        </div>
      )}

      {/* Full Ranking Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {isAr ? COMMITTEE_DISPLAY[activeTab]?.ar : COMMITTEE_DISPLAY[activeTab]?.en} Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          {board.length === 0 ? (
            <p className="text-sm text-secondary text-center py-8">
              {t('leaderboard.noRankings')}
            </p>
          ) : (
            <div className="space-y-2">
              {board.map((item, index) => {
                const isCurrentUser = item.userId === userProfile?.id;
                return (
                  <div
                    key={item.userId}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-colors ${
                      isCurrentUser
                        ? 'border-[#8EDB2A] bg-[#8EDB2A]/10'
                        : 'border-border-color bg-elevated/40 hover:bg-elevated'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold ${
                          index === 0
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : index === 1
                            ? 'bg-gray-400/20 text-gray-300'
                            : index === 2
                            ? 'bg-amber-600/20 text-amber-500'
                            : 'bg-card text-secondary'
                        }`}
                      >
                        #{item.rank || index + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-primary flex items-center gap-2">
                          {item.userName}
                          {isCurrentUser && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#8EDB2A] text-black font-bold">
                              YOU
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted">
                          {item.tasksEvaluated || 0} tasks evaluated
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-[#8EDB2A]">
                        {item.totalPoints}
                      </span>
                      <span className="text-xs text-secondary ml-1">pts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
