import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/EmptyState';
import { Award, FileText, CheckCircle, Clock, Download, AlertCircle } from 'lucide-react';
import { getSubmissions } from '@/services/submission.service';
import { createEvaluation, finalizeEvaluation } from '@/services/evaluation.service';
import { getActiveSeason } from '@/services/season.service';
import type { Submission } from '@/types';
import { COMMITTEE_DISPLAY } from '@/types';
import { Timestamp } from 'firebase/firestore';

export default function EvaluationQueuePage() {
  const { userProfile } = useAuth();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  // Evaluation modal
  const [evaluatingSub, setEvaluatingSub] = useState<Submission | null>(null);
  const [maxScore, setMaxScore] = useState<number>(100);
  const [awardedScore, setAwardedScore] = useState<number>(85);
  const [feedback, setFeedback] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadQueue = async () => {
    setLoading(true);
    try {
      // Submissions that are not locked
      const data = await getSubmissions();
      setSubmissions(data.filter((s) => !s.isLocked));
    } catch (err) {
      console.error('Failed to load evaluation queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleFinalizeEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluatingSub || !userProfile) return;
    setError('');

    if (awardedScore < 0 || awardedScore > maxScore) {
      setError(`Awarded score must be between 0 and ${maxScore}`);
      return;
    }

    setSubmitting(true);
    try {
      const activeSeason = await getActiveSeason();
      const seasonId = activeSeason?.id || 'default_season';

      // 1. Create evaluation
      const evalId = await createEvaluation({
        taskId: evaluatingSub.taskId,
        taskTitle: evaluatingSub.taskTitle,
        submissionId: evaluatingSub.id,
        userId: evaluatingSub.userId,
        userName: evaluatingSub.userName,
        committee: evaluatingSub.committee,
        awardedPoints: Number(awardedScore),
        maxPoints: Number(maxScore),
        feedback,
        evaluatorId: userProfile.id,
        evaluatorName: userProfile.fullName,
        evaluationDate: Timestamp.now(),
        isFinalized: false,
        seasonId,
      });

      // 2. Finalize & lock submission & update user points
      await finalizeEvaluation(evalId);

      setEvaluatingSub(null);
      setFeedback('');
      await loadQueue();
    } catch (err) {
      console.error('Error finalizing evaluation:', err);
      setError('Failed to finalize evaluation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: Column<Submission>[] = [
    {
      key: 'taskTitle',
      header: t('tasks.title'),
      render: (s) => (
        <div>
          <p className="font-semibold text-primary">{s.taskTitle}</p>
          <p className="text-xs text-muted">Version {s.version}</p>
        </div>
      ),
    },
    {
      key: 'userName',
      header: t('leaderboard.memberName'),
      render: (s) => <span className="font-medium text-primary">{s.userName}</span>,
    },
    {
      key: 'committee',
      header: t('common.committee'),
      render: (s) => (
        <span>
          {isAr ? COMMITTEE_DISPLAY[s.committee]?.ar : COMMITTEE_DISPLAY[s.committee]?.en}
        </span>
      ),
    },
    {
      key: 'timing',
      header: 'Submission Status',
      render: (s) =>
        s.isLate ? (
          <Badge variant="destructive">{t('tasks.lateSubmission')}</Badge>
        ) : (
          <Badge variant="success">On Time</Badge>
        ),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (s) => (
        <Button
          size="sm"
          className="flex items-center gap-1.5"
          onClick={() => {
            setEvaluatingSub(s);
            setMaxScore(100);
            setAwardedScore(80);
            setFeedback('');
            setError('');
          }}
        >
          <Award className="h-4 w-4" />
          {t('evaluation.evaluate')}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('evaluation.evaluationQueue')}
        subtitle="Review member deliverables, grade points, and provide constructive feedback"
      >
        <Badge variant="warning">{submissions.length} Awaiting Review</Badge>
      </PageHeader>

      {submissions.length === 0 ? (
        <EmptyState
          icon={CheckCircle}
          title="All Submissions Evaluated!"
          description="There are currently no tasks waiting in the HR evaluation queue."
        />
      ) : (
        <DataTable
          data={submissions}
          columns={columns}
          searchKey={(s) => `${s.userName} ${s.taskTitle} ${s.committee}`}
          searchPlaceholder={t('common.search')}
        />
      )}

      {/* Evaluation Modal */}
      {evaluatingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-card border border-border-color rounded-xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-border-color pb-4">
              <div>
                <h3 className="text-xl font-bold text-primary">
                  {t('evaluation.evaluate')}: {evaluatingSub.taskTitle}
                </h3>
                <p className="text-sm text-secondary">
                  Member: <span className="text-[#8EDB2A] font-semibold">{evaluatingSub.userName}</span> (
                  {isAr ? COMMITTEE_DISPLAY[evaluatingSub.committee]?.ar : COMMITTEE_DISPLAY[evaluatingSub.committee]?.en})
                </p>
              </div>
              {evaluatingSub.isLate && (
                <Badge variant="destructive">LATE SUBMISSION</Badge>
              )}
            </div>

            {/* Submission preview */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-secondary uppercase tracking-wider">
                Member Deliverable:
              </h4>
              <div className="p-4 rounded-lg bg-elevated border border-border-color text-sm text-primary whitespace-pre-wrap max-h-40 overflow-y-auto">
                {evaluatingSub.textContent || 'No text content provided.'}
              </div>

              {evaluatingSub.files && evaluatingSub.files.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <span className="text-xs text-muted">Attached files ({evaluatingSub.files.length}):</span>
                  {evaluatingSub.files.map((f, i) => (
                    <a
                      key={i}
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2 rounded-lg border border-border-color bg-elevated/40 hover:border-[#8EDB2A] text-xs text-primary"
                    >
                      <span className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-[#8EDB2A]" />
                        {f.name}
                      </span>
                      <Download className="h-3.5 w-3.5 text-muted" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Grading Form */}
            <form onSubmit={handleFinalizeEvaluation} className="space-y-4 pt-3 border-t border-border-color">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-secondary mb-1 block">
                    {t('evaluation.maxScore')}
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={1000}
                    value={maxScore}
                    onChange={(e) => setMaxScore(Number(e.target.value))}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-secondary mb-1 block">
                    {t('evaluation.awardedPoints')}
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={maxScore}
                    value={awardedScore}
                    onChange={(e) => setAwardedScore(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-secondary mb-1 block">
                  {t('evaluation.feedback')} *
                </label>
                <Textarea
                  rows={4}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder={t('evaluation.writeFeedback')}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border-color">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEvaluatingSub(null)}
                  disabled={submitting}
                >
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? t('common.loading') : t('evaluation.finalize')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
