import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { Badge } from '@/components/ui/badge';
import { getActivityLogs } from '@/services/activity.service';
import type { ActivityLog } from '@/types';

export default function ActivityLogPage() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getActivityLogs(100);
        setLogs(data);
      } catch (err) {
        console.error('Failed to load activity logs:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const columns: Column<ActivityLog>[] = [
    {
      key: 'timestamp',
      header: t('activity.timestamp'),
      render: (log) => (
        <span className="text-xs text-muted">
          {log.timestamp ? new Date(log.timestamp.toMillis()).toLocaleString() : '-'}
        </span>
      ),
    },
    {
      key: 'actorName',
      header: t('activity.actor'),
      render: (log) => (
        <span className="font-semibold text-primary">{log.actorName}</span>
      ),
    },
    {
      key: 'action',
      header: t('activity.action'),
      render: (log) => (
        <Badge variant="outline" className="text-xs font-mono">
          {log.action}
        </Badge>
      ),
    },
    {
      key: 'details',
      header: t('activity.details'),
      render: (log) => <span className="text-sm text-secondary">{log.details}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('activity.activityLog')}
        subtitle="Immutable audit log of all system actions, approvals, submissions, and evaluations"
      />

      <DataTable
        data={logs}
        columns={columns}
        searchKey={(log) => `${log.actorName} ${log.action} ${log.details}`}
        searchPlaceholder={t('common.search')}
      />
    </div>
  );
}
