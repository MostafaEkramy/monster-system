import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { getTasks } from '@/services/task.service';
import type { Task } from '@/types';
import { COMMITTEE_DISPLAY } from '@/types';

export default function TasksOverviewPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getTasks();
        setTasks(data);
      } catch (err) {
        console.error('Failed to load tasks:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const columns: Column<Task>[] = [
    {
      key: 'title',
      header: t('tasks.title'),
      render: (tItem) => (
        <div>
          <p className="font-semibold text-primary">{tItem.title}</p>
          <p className="text-xs text-muted line-clamp-1">{tItem.description}</p>
        </div>
      ),
    },
    {
      key: 'committee',
      header: t('common.committee'),
      render: (tItem) => (
        <span>
          {isAr ? COMMITTEE_DISPLAY[tItem.committee]?.ar : COMMITTEE_DISPLAY[tItem.committee]?.en}
        </span>
      ),
    },
    {
      key: 'priority',
      header: t('tasks.priority'),
      render: (tItem) => <StatusBadge status={tItem.priority} type="priority" />,
    },
    {
      key: 'status',
      header: t('common.status'),
      render: (tItem) => <StatusBadge status={tItem.status} type="task" />,
    },
    {
      key: 'deadline',
      header: t('tasks.deadline'),
      render: (tItem) => (
        <span className="text-xs text-secondary">
          {tItem.deadline ? new Date(tItem.deadline.toMillis()).toLocaleDateString() : '-'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.overview')}
        subtitle="Global executive overview of tasks across all committees"
      />

      <DataTable
        data={tasks}
        columns={columns}
        searchKey={(tItem) => `${tItem.title} ${tItem.committee}`}
        searchPlaceholder={t('common.search')}
      />
    </div>
  );
}
