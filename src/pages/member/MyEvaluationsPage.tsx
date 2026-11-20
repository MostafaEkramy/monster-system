import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { Award, Star, MessageSquare } from 'lucide-react';
import { getEvaluations } from '@/services/evaluation.service';
import type { Evaluation } from '@/types';

export default function MyEvaluationsPage() {
  const { userProfile } = useAuth();
  const { t } = useTranslation();

  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!userProfile) return;
      setLoading(true);
      try {
        const data = await getEvaluations({ userId: userProfile.id });
        setEvaluations(data);
      } catch (err) {
        console.error('Failed to load my evaluations:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userProfile]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.myEvaluations')}
        subtitle="Review HR scores and personalized feedback on your completed work"
      />

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#8EDB2A] border-t-transparent" />
        </div>
      ) : evaluations.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No Evaluated Tasks Yet"
          description="When you submit tasks and HR reviews them, your scores and feedback will appear here."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {evaluations.map((ev) => (
            <Card key={ev.id} className="border-border-color">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{ev.taskTitle}</CardTitle>
                    <p className="text-xs text-muted mt-0.5">
                      Graded on {ev.evaluationDate ? new Date(ev.evaluationDate.toMillis()).toLocaleDateString() : 'Recent'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-[#8EDB2A]">
                      {ev.awardedPoints}
                    </span>
                    <span className="text-xs text-muted"> / {ev.maxPoints} pts</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded-lg bg-elevated border border-border-color space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8EDB2A]">
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>HR Feedback:</span>
                  </div>
                  <p className="text-sm text-primary whitespace-pre-wrap">{ev.feedback}</p>
                </div>

                <div className="text-xs text-muted text-right">
                  Evaluated by: {ev.evaluatorName}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
