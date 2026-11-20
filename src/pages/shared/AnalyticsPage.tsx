import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
  LineChart,
  Line,
} from 'recharts';
import { getDashboardStats } from '@/services/analytics.service';
import { StatCard } from '@/components/common/StatCard';
import { Users, FileText, CheckCircle, Award } from 'lucide-react';

export default function AnalyticsPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getDashboardStats('magic');
        setStats(data);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const COLORS = ['#8EDB2A', '#A3EB45', '#6FA51F', '#D9F7A8', '#3B82F6', '#8B5CF6'];

  const committeePerformanceData = [
    { name: isAr ? 'اللوجستيات' : 'Logistics', points: 340, attendance: 92 },
    { name: isAr ? 'الإبداع' : 'Creativity', points: 480, attendance: 96 },
    { name: isAr ? 'الإعلام' : 'Media', points: 410, attendance: 90 },
    { name: isAr ? 'العلاقات' : 'PR', points: 390, attendance: 88 },
    { name: isAr ? 'الموارد' : 'HR', points: 460, attendance: 98 },
    { name: isAr ? 'الأنشطة' : 'Activity', points: 440, attendance: 94 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.analytics')}
        subtitle="Cross-committee organizational analytics, deliverable metrics, and attendance benchmarks"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('dashboard.totalMembers')} value={stats?.totalMembers || 0} icon={Users} />
        <StatCard title={t('dashboard.totalTasks')} value={stats?.totalTasks || 0} icon={FileText} />
        <StatCard title={t('dashboard.totalEvaluations')} value={stats?.totalEvaluations || 0} icon={Award} />
        <StatCard title={t('dashboard.overallAttendance')} value={`${stats?.attendanceRate || 0}%`} icon={CheckCircle} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Committee Points Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.committeePerformance')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={committeePerformanceData}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} />
                  <YAxis stroke="#888888" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#151B13',
                      border: '1px solid #293324',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="points" fill="#8EDB2A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Tasks by Status */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.tasksByStatus')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.tasksByStatus || [
                      { name: 'Assigned', value: 5 },
                      { name: 'In Progress', value: 8 },
                      { name: 'Submitted', value: 4 },
                      { name: 'Evaluated', value: 14 },
                    ]}
                    innerRadius={60}
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
    </div>
  );
}
