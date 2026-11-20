import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Link } from 'react-router-dom';
import {
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Award,
  Calendar,
  TrendingUp,
  ArrowRight,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { getDashboardStats } from '@/services/analytics.service';
import { getUserAssignments } from '@/services/task.service';
import { getActiveSeason } from '@/services/season.service';
import { getCommitteeLeaderboard } from '@/services/leaderboard.service';
import { getUserNotifications } from '@/services/notification.service';
import type { TaskAssignment, Season } from '@/types';
import { COMMITTEE_DISPLAY } from '@/types';

export default function DashboardPage() {
  const { userProfile } = useAuth();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [stats, setStats] = useState<any>(null);
  const [activeSeason, setActiveSeason] = useState<Season | null>(null);
  const [memberTasks, setMemberTasks] = useState<TaskAssignment[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!userProfile) return;
      setLoading(true);
      try {
        const [statsData, seasonData] = await Promise.all([
          getDashboardStats(userProfile.role, userProfile.committee),
          getActiveSeason(),
        ]);
        setStats(statsData);
        setActiveSeason(seasonData);

        if (userProfile.role === 'member') {
          const tasks = await getUserAssignments(userProfile.id);
          setMemberTasks(tasks);
          if (seasonData) {
            const board = await getCommitteeLeaderboard(userProfile.committee, seasonData.id);
            setLeaderboard(board.slice(0, 5));
          }
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [userProfile]);

  if (!userProfile) return null;

  const role = userProfile.role;

  // Chart colors
  const COLORS = ['#8EDB2A', '#A3EB45', '#6FA51F', '#D9F7A8', '#3B82F6', '#8B5CF6'];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${t('dashboard.welcome')}, ${userProfile.fullName}!`}
        subtitle={`${t('common.role')}: ${t(`roles.${role}`, role)} • ${
          userProfile.committee
            ? isAr
              ? COMMITTEE_DISPLAY[userProfile.committee]?.ar
              : COMMITTEE_DISPLAY[userProfile.committee]?.en
            : ''
        }`}
      >
        {activeSeason && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#8EDB2A]/10 border border-[#8EDB2A]/20 text-[#8EDB2A] text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            <span>{activeSeason.name}</span>
          </div>
        )}
      </PageHeader>

      {/* ============================================================ */}
      {/* 1. MAGIC & EXECUTIVE DASHBOARD STATS */}
      {/* ============================================================ */}
      {(role === 'magic' || role === 'president' || role === 'vice_president') && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title={t('dashboard.totalMembers')}
              value={stats?.totalMembers || 0}
              icon={Users}
              subtitle={`${stats?.pendingRegistrations || 0} ${t('dashboard.pendingRegistrations')}`}
            />
            <StatCard
              title={t('dashboard.totalTasks')}
              value={stats?.totalTasks || 0}
              icon={FileText}
              subtitle={`${stats?.completedTasks || 0} ${t('dashboard.completedTasks')}`}
            />
            <StatCard
              title={t('dashboard.awaitingEvaluation')}
              value={stats?.awaitingEvaluation || 0}
              icon={Clock}
              subtitle={`${stats?.totalEvaluations || 0} ${t('dashboard.totalEvaluations')}`}
            />
            <StatCard
              title={t('dashboard.overallAttendance')}
              value={`${stats?.attendanceRate || 0}%`}
              icon={CheckCircle}
              subtitle={activeSeason?.name || 'Current Season'}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.membersPerCommittee')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stats?.membersPerCommittee || [
                        { name: isAr ? 'اللوجستيات' : 'Logistics', count: 8 },
                        { name: isAr ? 'الإبداع' : 'Creativity', count: 12 },
                        { name: isAr ? 'الإعلام' : 'Media', count: 10 },
                        { name: isAr ? 'العلاقات' : 'PR', count: 9 },
                        { name: isAr ? 'الموارد' : 'HR', count: 7 },
                        { name: isAr ? 'الأنشطة' : 'Activity', count: 11 },
                      ]}
                    >
                      <XAxis dataKey="name" stroke="#888888" fontSize={12} />
                      <YAxis stroke="#888888" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#151B13',
                          border: '1px solid #293324',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="count" fill="#8EDB2A" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.tasksByStatus')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats?.tasksByStatus || [
                          { name: isAr ? 'معيّنة' : 'Assigned', value: 5 },
                          { name: isAr ? 'قيد التنفيذ' : 'In Progress', value: 8 },
                          { name: isAr ? 'تم التسليم' : 'Submitted', value: 4 },
                          { name: isAr ? 'تم التقييم' : 'Evaluated', value: 14 },
                        ]}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#151B13',
                          border: '1px solid #293324',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* 2. COMMITTEE LEADER DASHBOARD */}
      {/* ============================================================ */}
      {role === 'leader' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title={t('dashboard.committeeMembers') || 'Committee Members'}
              value={stats?.committeeMembers || 0}
              icon={Users}
            />
            <StatCard
              title={t('dashboard.totalTasks')}
              value={stats?.committeeTasks || 0}
              icon={FileText}
            />
            <StatCard
              title={t('dashboard.submittedTasks') || 'Submissions'}
              value={stats?.submittedTasks || 0}
              icon={Clock}
            />
            <StatCard
              title={t('dashboard.attendanceOverview')}
              value={`${stats?.attendanceRate || 0}%`}
              icon={CheckCircle}
            />
          </div>

          <div className="flex gap-4">
            <Link to="/create-task">
              <Button className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t('tasks.createTask')}
              </Button>
            </Link>
            <Link to="/tasks">
              <Button variant="outline">
                {t('nav.tasks')}
              </Button>
            </Link>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* 3. HR DASHBOARD */}
      {/* ============================================================ */}
      {(role === 'hr_leader' || role === 'hr_member') && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title={t('dashboard.awaitingEvaluation')}
              value={stats?.pendingEvaluations || 0}
              icon={Clock}
              subtitle="Pending submissions"
            />
            <StatCard
              title={t('dashboard.totalEvaluations')}
              value={stats?.completedEvaluations || 0}
              icon={CheckCircle}
              subtitle="Evaluated this season"
            />
            <StatCard
              title={t('dashboard.totalMembers')}
              value={stats?.totalMembers || 0}
              icon={Users}
              subtitle="Across all 6 committees"
            />
          </div>

          <div className="flex gap-4">
            <Link to="/evaluation-queue">
              <Button className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                {t('evaluation.evaluationQueue')}
              </Button>
            </Link>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* 4. MEMBER DASHBOARD */}
      {/* ============================================================ */}
      {role === 'member' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title={t('dashboard.myPoints')}
              value={userProfile.currentSeasonPoints || 0}
              icon={Award}
              subtitle={`Rank #${userProfile.currentSeasonRank || '-'}`}
            />
            <StatCard
              title={t('dashboard.assignedTasks')}
              value={memberTasks.length}
              icon={FileText}
            />
            <StatCard
              title={t('dashboard.myAttendance')}
              value={`${userProfile.attendancePercentage || 100}%`}
              icon={CheckCircle}
            />
            <StatCard
              title={t('common.status')}
              value={userProfile.status}
              icon={Sparkles}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{t('dashboard.myTasks')}</CardTitle>
                <Link to="/my-tasks" className="text-sm text-[#8EDB2A] hover:underline flex items-center gap-1">
                  {t('common.viewAll')} <ArrowRight className="h-4 w-4" />
                </Link>
              </CardHeader>
              <CardContent className="space-y-3">
                {memberTasks.length === 0 ? (
                  <p className="text-sm text-secondary text-center py-6">
                    {t('tasks.noTasks')}
                  </p>
                ) : (
                  memberTasks.slice(0, 4).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border-color bg-elevated/50"
                    >
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium text-primary">Task #{task.taskId.slice(0, 6)}</p>
                        <p className="text-xs text-muted">Status: {task.status}</p>
                      </div>
                      <StatusBadge status={task.status} />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{t('leaderboard.committeeLeaderboard')}</CardTitle>
                <Link to="/leaderboard" className="text-sm text-[#8EDB2A] hover:underline flex items-center gap-1">
                  {t('common.viewAll')} <ArrowRight className="h-4 w-4" />
                </Link>
              </CardHeader>
              <CardContent className="space-y-3">
                {leaderboard.length === 0 ? (
                  <p className="text-sm text-secondary text-center py-6">
                    {t('leaderboard.noRankings')}
                  </p>
                ) : (
                  leaderboard.map((item, idx) => (
                    <div
                      key={item.userId}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        item.userId === userProfile.id
                          ? 'border-[#8EDB2A] bg-[#8EDB2A]/10'
                          : 'border-border-color bg-elevated/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-card text-xs font-bold text-primary">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-medium text-primary">{item.userName}</span>
                      </div>
                      <span className="text-sm font-bold text-[#8EDB2A]">{item.totalPoints} pts</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
