import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { getEvaluations } from '@/services/evaluation.service';
import type { Evaluation } from '@/types';
import { COMMITTEE_DISPLAY } from '@/types';

export default function PerformancePage() {
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
        console.error('Failed to load performance evaluations:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const columns: Column<Evaluation>[] = [
    {
      key: 'userName',
      header: t('leaderboard.memberName'),
      render: (e) => (
        <div>
          <p className="font-semibold text-primary">{e.userName}</p>
          <p className="text-xs text-muted">{e.taskTitle}</p>
        </div>
      ),
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
          {e.awardedPoints} / {e.maxPoints} pts ({Math.round((e.awardedPoints / e.maxPoints) * 100)}%)
        </span>
      ),
    },
    {
      key: 'evaluator',
      header: t('evaluation.evaluatedBy'),
      render: (e) => <span className="text-xs text-secondary">{e.evaluatorName}</span>,
    },
    {
      key: 'feedback',
      header: t('evaluation.feedback'),
      render: (e) => <p className="text-xs text-secondary line-clamp-2">{e.feedback}</p>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('evaluation.memberPerformance')}
        subtitle="Evaluated task performance metrics and historical feedback logs"
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
