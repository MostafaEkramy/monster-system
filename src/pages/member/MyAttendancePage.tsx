import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { DataTable, Column } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { StatCard } from '@/components/common/StatCard';
import { CheckCircle, XCircle, Clock, ShieldCheck } from 'lucide-react';
import { getUserAttendance } from '@/services/attendance.service';
import type { AttendanceRecord } from '@/types';

export default function MyAttendancePage() {
  const { userProfile } = useAuth();
  const { t } = useTranslation();

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!userProfile) return;
      setLoading(true);
      try {
        const data = await getUserAttendance(userProfile.id);
        setRecords(data);
      } catch (err) {
        console.error('Failed to load my attendance:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userProfile]);

  const presentCount = records.filter((r) => r.status === 'present').length;
  const absentCount = records.filter((r) => r.status === 'absent').length;
  const lateCount = records.filter((r) => r.status === 'late').length;
  const excusedCount = records.filter((r) => r.status === 'excused').length;

  const columns: Column<AttendanceRecord>[] = [
    {
      key: 'date',
      header: t('common.date'),
      render: (r) => (
        <span className="font-medium text-primary">
          {r.date ? new Date(r.date.toMillis()).toLocaleDateString() : '-'}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('common.status'),
      render: (r) => <StatusBadge status={r.status} type="attendance" />,
    },
    {
      key: 'recordedBy',
      header: 'Recorded By',
      render: (r) => <span className="text-xs text-muted">Authorized HR / Leader</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.myAttendance')}
        subtitle="Individual presence logs, meeting sessions, and attendance percentage"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('attendance.present')} value={presentCount} icon={CheckCircle} />
        <StatCard title={t('attendance.absent')} value={absentCount} icon={XCircle} />
        <StatCard title={t('attendance.late')} value={lateCount} icon={Clock} />
        <StatCard title={t('attendance.excused')} value={excusedCount} icon={ShieldCheck} />
      </div>

      <DataTable
        data={records}
        columns={columns}
        searchKey={(r) => r.status}
        searchPlaceholder={t('common.search')}
      />
    </div>
  );
}
