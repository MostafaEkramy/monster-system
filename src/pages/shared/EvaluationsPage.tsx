import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { getEvaluations } from '@/services/evaluation.service';
import type { Evaluation } from '@/types';
import { COMMITTEE_DISPLAY } from '@/types';

export default function EvaluationsPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getEvaluations();
        setEvaluations(data);
      } catch (err) {
        console.error('Failed to load evaluations:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const columns: Column<Evaluation>[] = [
    {
      key: 'taskTitle',
      header: t('tasks.title'),
      render: (e) => (
        <div>
          <p className="font-semibold text-primary">{e.taskTitle}</p>
          <p className="text-xs text-muted">Evaluated by {e.evaluatorName}</p>
        </div>
      ),
    },
    {
      key: 'userName',
      header: t('leaderboard.memberName'),
      render: (e) => <span className="font-medium text-primary">{e.userName}</span>,
    },
    {
      key: 'committee',
      header: t('common.committee'),
      render: (e) => (
        <span>
          {isAr ? COMMITTEE_DISPLAY[e.committee]?.ar : COMMITTEE_DISPLAY[e.committee]?.en}
        </span>
      ),
    },
    {
      key: 'score',
      header: t('evaluation.score'),
      render: (e) => (
        <span className="font-bold text-[#8EDB2A]">
          {e.awardedPoints} / {e.maxPoints} pts
        </span>
      ),
    },
    {
      key: 'feedback',
      header: t('evaluation.feedback'),
      render: (e) => <p className="text-xs text-secondary line-clamp-2">{e.feedback}</p>,
    },
    {
      key: 'date',
      header: t('common.date'),
      render: (e) => (
        <span className="text-xs text-secondary">
          {e.evaluationDate ? new Date(e.evaluationDate.toMillis()).toLocaleDateString() : '-'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.evaluations')}
        subtitle="Global audit of all evaluated task submissions and assigned scores"
      />

      <DataTable
        data={evaluations}
        columns={columns}
        searchKey={(e) => `${e.userName} ${e.taskTitle} ${e.committee}`}
        searchPlaceholder={t('common.search')}
      />
    </div>
  );
}
