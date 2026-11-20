import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { StatCard } from '@/components/common/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Link } from 'react-router-dom';
import {
  Users,
  CheckCircle,
  Clock,
  FileText,
  Award,
  Calendar,
  Sparkles,
  ArrowRight,
  Target,
  Trophy,
  Compass,
  Layers,
  ChevronRight,
  Flame,
  Zap,
  TrendingUp,
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
  const COLORS = ['#2CEE55', '#3BF362', '#1E8236', '#A3F7B5', '#3B82F6', '#8B5CF6'];

  return (
    <div className="space-y-12 pb-16 max-w-7xl mx-auto">
      {/* ============================================================ */}
      {/* 1. HERO BRAND BANNER (Inspired directly by Image 1 & 2)       */}
      {/* ============================================================ */}
      <div className="relative overflow-hidden rounded-3xl border border-[#19261C] bg-gradient-to-b from-[#0A120D] via-[#070B08] to-[#050806] p-8 md:p-14 text-center shadow-2xl">
        {/* Soft Radial Ambient Green Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#2CEE55]/12 blur-[120px] rounded-full pointer-events-none" />

        {/* Top Tag Badge */}
        <div className="relative inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#101C13] border border-[#1F3825] text-[#2CEE55] text-xs font-semibold mb-6 shadow-sm">
          <Sparkles className="h-3.5 w-3.5" />
          <span>{isAr ? 'نبض الترفيه • كلية الهندسة' : 'The Entertainment Pulse • Faculty of Engineering'}</span>
          <span className="h-1.5 w-1.5 rounded-full bg-[#2CEE55] shadow-[0_0_6px_#2CEE55]" />
        </div>

        {/* Central Logo Box with Glow */}
        <div className="relative mx-auto mb-6 flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-3xl bg-[#0D1610] border border-[#1C2C1F] shadow-[0_0_60px_rgba(44,238,85,0.25)] hover:border-[#2CEE55] hover:scale-105 transition-all duration-300">
          <img src="/logo.png" alt="Monsters Emblem" className="h-16 w-16 object-contain" />
        </div>

        {/* Main Title */}
        <h1 className="relative text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white mb-2">
          {isAr ? (
            <>
              مرحباً بكم في فريق <span className="text-[#2CEE55]">مونسترز</span>
            </>
          ) : (
            <>
              Welcome to Monsters <span className="text-[#2CEE55]">Team</span>
            </>
          )}
        </h1>

        {/* University Subtitle with Decorative Lines */}
        <div className="relative flex items-center justify-center gap-3 text-xs sm:text-sm font-bold text-[#2CEE55] tracking-wider uppercase my-4">
          <span className="h-px w-16 bg-gradient-to-r from-transparent to-[#2CEE55]/70" />
          <span>{isAr ? 'جامعة المنصورة الأهلية' : 'Mansoura National University'}</span>
          <span className="h-px w-16 bg-gradient-to-l from-transparent to-[#2CEE55]/70" />
        </div>

        {/* Description from Screenshot */}
        <p className="relative max-w-2xl mx-auto text-xs sm:text-sm text-secondary leading-relaxed">
          {isAr
            ? 'من نحن؟ نحن نبض الترفيه بكلية الهندسة بجامعة المنصورة الأهلية. أنشأنا فريق مونسترز لرعاية المواهب وتنظيم الفعاليات وصناعة تجربة طلابية استثنائية.'
            : 'Who are we? We are the entertainment pulse of the Faculty of Engineering at Mansoura National University. We established monsters team to cultivate talent, orchestrate memorable events, and elevate student life.'}
        </p>
      </div>

      {/* ============================================================ */}
      {/* 2. STATS OVERVIEW CARDS                                       */}
      {/* ============================================================ */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#2CEE55]" />
            {isAr ? 'المؤشرات والعمليات الرئيسية' : 'Key Operational Metrics'}
          </h3>
          {activeSeason && (
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#121E15] border border-[#1F3524] text-[#2CEE55]">
              {activeSeason.name}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {(role === 'magic' || role === 'president' || role === 'vice_president') && (
            <>
              <StatCard
                title={t('dashboard.totalMembers')}
                value={stats?.totalMembers || 0}
                tag="ORGANIZATION"
                icon={Users}
                subtitle={`${stats?.pendingRegistrations || 0} ${t('dashboard.pendingRegistrations')}`}
              />
              <StatCard
                title={t('dashboard.totalTasks')}
                value={stats?.totalTasks || 0}
                tag="DELIVERABLES"
                icon={FileText}
                subtitle={`${stats?.completedTasks || 0} ${t('dashboard.completedTasks')}`}
              />
              <StatCard
                title={t('dashboard.awaitingEvaluation')}
                value={stats?.awaitingEvaluation || 0}
                tag="HR QUEUE"
                icon={Clock}
                subtitle={`${stats?.totalEvaluations || 0} ${t('dashboard.totalEvaluations')}`}
              />
              <StatCard
                title={t('dashboard.overallAttendance')}
                value={`${stats?.attendanceRate || 0}%`}
                tag="PARTICIPATION"
                icon={CheckCircle}
                subtitle="Calculated across all sessions"
              />
            </>
          )}

          {role === 'leader' && (
            <>
              <StatCard
                title="Committee Members"
                value={stats?.committeeMembers || 0}
                tag="TEAM"
                icon={Users}
              />
              <StatCard
                title={t('dashboard.totalTasks')}
                value={stats?.committeeTasks || 0}
                tag="ASSIGNMENTS"
                icon={FileText}
              />
              <StatCard
                title="Submissions Received"
                value={stats?.submittedTasks || 0}
                tag="DELIVERIES"
                icon={Clock}
              />
              <StatCard
                title="Committee Attendance"
                value={`${stats?.attendanceRate || 0}%`}
                tag="ATTENDANCE"
                icon={CheckCircle}
              />
            </>
          )}

          {(role === 'hr_leader' || role === 'hr_member') && (
            <>
              <StatCard
                title={t('dashboard.awaitingEvaluation')}
                value={stats?.pendingEvaluations || 0}
                tag="EVALUATION QUEUE"
                icon={Clock}
                subtitle="Awaiting grade and feedback"
              />
              <StatCard
                title={t('dashboard.totalEvaluations')}
                value={stats?.completedEvaluations || 0}
                tag="GRADED"
                icon={Award}
                subtitle="Finalized this season"
              />
              <StatCard
                title={t('dashboard.totalMembers')}
                value={stats?.totalMembers || 0}
                tag="ALL COMMITTEES"
                icon={Users}
                subtitle="Monitored personnel"
              />
              <StatCard
                title={t('dashboard.overallAttendance')}
                value={`${stats?.attendanceRate || 0}%`}
                tag="ATTENDANCE"
                icon={CheckCircle}
              />
            </>
          )}

          {role === 'member' && (
            <>
              <StatCard
                title={t('dashboard.myPoints')}
                value={userProfile.currentSeasonPoints || 0}
                tag="SCORECARD"
                icon={Award}
                subtitle={`Current Rank #${userProfile.currentSeasonRank || '-'}`}
              />
              <StatCard
                title={t('dashboard.assignedTasks')}
                value={memberTasks.length}
                tag="MY WORK"
                icon={FileText}
              />
              <StatCard
                title={t('dashboard.myAttendance')}
                value={`${userProfile.attendancePercentage || 100}%`}
                tag="ATTENDANCE"
                icon={CheckCircle}
              />
              <StatCard
                title="My Committee"
                value={isAr ? COMMITTEE_DISPLAY[userProfile.committee]?.ar : COMMITTEE_DISPLAY[userProfile.committee]?.en}
                tag="UNIT"
                icon={Sparkles}
              />
            </>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. FOUR INTERACTIVE CARDS (Pixel Perfect to Image 3)          */}
      {/* ============================================================ */}
      <div>
        <div className="text-center md:text-left mb-6">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {isAr ? 'تجربة متكاملة وشاملة' : 'A Complete Experience'}
          </h2>
          <p className="text-xs sm:text-sm text-secondary mt-1">
            {isAr
              ? 'الجمع بين الترفيه، وبناء المهارات، وروح الفريق لرحلة لا تُنسى داخل الجامعة.'
              : 'Combining entertainment, skill-building, and camaraderie for an unforgettable journey.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Our Vision */}
          <Link to="/committees" className="block group">
            <Card className="h-full flex flex-col justify-between p-6 rounded-2xl border border-[#19261C] bg-[#0C120E] hover:border-[#2CEE55] hover:shadow-[0_12px_35px_-8px_rgba(44,238,85,0.25)] hover:-translate-y-1.5 transition-all duration-300">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="h-12 w-12 rounded-xl bg-[#121F16] border border-[#1E3324] flex items-center justify-center text-[#2CEE55] group-hover:bg-[#2CEE55] group-hover:text-black group-hover:scale-105 transition-all duration-300">
                    <Target className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-[#121F16] text-[#2CEE55] border border-[#1E3324]">
                    VISION & COMMITTEES
                  </span>
                </div>
                <h4 className="text-lg font-bold text-white group-hover:text-[#2CEE55] transition-colors mb-2">
                  {isAr ? 'رؤيتنا' : 'Our Vision'}
                </h4>
                <p className="text-xs text-secondary leading-relaxed">
                  {isAr
                    ? 'أن نكون الفريق الجامعي الرائد الذي يعزز الابتكار والتميز والتعاون المشترك.'
                    : 'To be the leading university team fostering innovation, excellence, and collaboration.'}
                </p>
              </div>
              <div className="flex items-center gap-1.5 pt-5 text-xs font-bold text-[#2CEE55] group-hover:translate-x-1.5 transition-transform duration-200">
                <span>{isAr ? 'استكشف' : 'Explore'}</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </Card>
          </Link>

          {/* Card 2: Our Board */}
          <Link to="/users" className="block group">
            <Card className="h-full flex flex-col justify-between p-6 rounded-2xl border border-[#19261C] bg-[#0C120E] hover:border-[#2CEE55] hover:shadow-[0_12px_35px_-8px_rgba(44,238,85,0.25)] hover:-translate-y-1.5 transition-all duration-300">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="h-12 w-12 rounded-xl bg-[#121F16] border border-[#1E3324] flex items-center justify-center text-[#2CEE55] group-hover:bg-[#2CEE55] group-hover:text-black group-hover:scale-105 transition-all duration-300">
                    <Users className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-[#121F16] text-[#2CEE55] border border-[#1E3324]">
                    THE BOARD
                  </span>
                </div>
                <h4 className="text-lg font-bold text-white group-hover:text-[#2CEE55] transition-colors mb-2">
                  {isAr ? 'مجلس الإدارة' : 'Our Board'}
                </h4>
                <p className="text-xs text-secondary leading-relaxed">
                  {isAr
                    ? 'مجموعة متميزة من الكفاءات الموهوبة التي تعمل معاً بكل شغف واحترافية.'
                    : 'A diverse group of talented individuals working together with passion.'}
                </p>
              </div>
              <div className="flex items-center gap-1.5 pt-5 text-xs font-bold text-[#2CEE55] group-hover:translate-x-1.5 transition-transform duration-200">
                <span>{isAr ? 'استكشف' : 'Explore'}</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </Card>
          </Link>

          {/* Card 3: Events (Highlighted Green State from Screenshot 3) */}
          <Link to={role === 'member' ? '/my-tasks' : '/tasks'} className="block group">
            <Card className="h-full flex flex-col justify-between p-6 rounded-2xl border-2 border-[#2CEE55] bg-[#0E1711] shadow-[0_0_35px_rgba(44,238,85,0.28)] hover:-translate-y-1.5 hover:shadow-[0_0_45px_rgba(44,238,85,0.4)] transition-all duration-300">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="h-12 w-12 rounded-xl bg-[#2CEE55] text-black shadow-[0_0_20px_rgba(44,238,85,0.5)] flex items-center justify-center transition-all">
                    <Trophy className="h-6 w-6 stroke-[2.5]" />
                  </div>
                  <span className="text-[10px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-[#2CEE55] text-black">
                    ACTIVITIES
                  </span>
                </div>
                <h4 className="text-lg font-bold text-[#2CEE55] mb-2">
                  {isAr ? 'الفعاليات والأنشطة' : 'Events'}
                </h4>
                <p className="text-xs text-[#D9F7A8] leading-relaxed">
                  {isAr
                    ? 'أنشطة حماسية ومسابقات وورش عمل متخصصة تضفي طاقة حيوية على الحياة الجامعية.'
                    : 'Exciting activities, competitions, and workshops that energize campus life.'}
                </p>
              </div>
              <div className="flex items-center gap-1.5 pt-5 text-xs font-bold text-[#2CEE55] group-hover:translate-x-1.5 transition-transform duration-200">
                <span>{isAr ? 'استكشف' : 'Explore'}</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </Card>
          </Link>

          {/* Card 4: Trips */}
          <Link to={role === 'member' ? '/my-attendance' : '/attendance'} className="block group">
            <Card className="h-full flex flex-col justify-between p-6 rounded-2xl border border-[#19261C] bg-[#0C120E] hover:border-[#2CEE55] hover:shadow-[0_12px_35px_-8px_rgba(44,238,85,0.25)] hover:-translate-y-1.5 transition-all duration-300">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="h-12 w-12 rounded-xl bg-[#121F16] border border-[#1E3324] flex items-center justify-center text-[#2CEE55] group-hover:bg-[#2CEE55] group-hover:text-black group-hover:scale-105 transition-all duration-300">
                    <Compass className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-[#121F16] text-[#2CEE55] border border-[#1E3324]">
                    ADVENTURES
                  </span>
                </div>
                <h4 className="text-lg font-bold text-white group-hover:text-[#2CEE55] transition-colors mb-2">
                  {isAr ? 'الرحلات والمغامرات' : 'Trips'}
                </h4>
                <p className="text-xs text-secondary leading-relaxed">
                  {isAr
                    ? 'مغامرات لا تُنسى ورحلات ترفيهية وجولات استكشافية عبر أجمل الوجهات.'
                    : 'Memorable adventures, road trips, and outings across the most beautiful spots.'}
                </p>
              </div>
              <div className="flex items-center gap-1.5 pt-5 text-xs font-bold text-[#2CEE55] group-hover:translate-x-1.5 transition-transform duration-200">
                <span>{isAr ? 'استكشف' : 'Explore'}</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </Card>
          </Link>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. BREAKING THE ROUTINE BANNER (From Bottom of Image 3)       */}
      {/* ============================================================ */}
      <div className="relative overflow-hidden rounded-2xl border border-[#19261C] bg-gradient-to-r from-[#0C120E] via-[#0F1A12] to-[#0C120E] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-[#2CEE55]/60 transition-all duration-300">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-[#121F16] border border-[#1E3324] flex items-center justify-center text-[#2CEE55] shadow-[0_0_20px_rgba(44,238,85,0.25)] shrink-0">
            <Flame className="h-7 w-7 text-[#2CEE55]" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <span>{isAr ? 'كسر الروتين' : 'Breaking The Routine'}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#2CEE55]/15 text-[#2CEE55] border border-[#2CEE55]/30">
                CULTURE
              </span>
            </h3>
            <p className="text-xs sm:text-sm text-secondary mt-1 max-w-xl">
              {isAr
                ? 'نعمل على تحويل البيئة الجامعية إلى تجربة مفعمة بالطاقة، الإبداع، وروح الفريق المتماسك.'
                : 'Transforming campus life into an energizing experience packed with creativity, camaraderie, and purpose.'}
            </p>
          </div>
        </div>

        <Link to="/leaderboard">
          <Button className="rounded-full bg-[#2CEE55] hover:bg-[#39E75F] text-black font-extrabold px-6 shadow-[0_0_25px_rgba(44,238,85,0.35)] shrink-0">
            <span>{isAr ? 'شاهد المتصدرين' : 'View Leaderboard'}</span>
            <ChevronRight className="h-4 w-4 ms-1" />
          </Button>
        </Link>
      </div>

      {/* ============================================================ */}
      {/* 5. VISUAL ANALYTICS & CHARTS                                  */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 border border-[#19261C] bg-[#0C120E] rounded-2xl hover:border-[#2CEE55]/40 transition-colors">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#2CEE55]" />
              {t('dashboard.membersPerCommittee')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
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
                  <XAxis dataKey="name" stroke="#6B796D" fontSize={12} />
                  <YAxis stroke="#6B796D" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0C120E',
                      border: '1px solid #19261C',
                      borderRadius: '12px',
                    }}
                  />
                  <Bar dataKey="count" fill="#2CEE55" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="p-6 border border-[#19261C] bg-[#0C120E] rounded-2xl hover:border-[#2CEE55]/40 transition-colors">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#2CEE55]" />
              {t('dashboard.tasksByStatus')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.tasksByStatus || [
                      { name: 'Assigned', value: 5 },
                      { name: 'In Progress', value: 8 },
                      { name: 'Submitted', value: 4 },
                      { name: 'Evaluated', value: 14 },
                    ]}
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0C120E',
                      border: '1px solid #19261C',
                      borderRadius: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
