import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Clock, CheckCircle } from 'lucide-react';
import { getSubmissions } from '@/services/submission.service';
import type { Submission } from '@/types';
import { COMMITTEE_DISPLAY } from '@/types';

export default function SubmissionsPage() {
  const { userProfile } = useAuth();
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const taskIdFilter = searchParams.get('taskId');
  const isAr = i18n.language === 'ar';

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);

  useEffect(() => {
    async function load() {
      if (!userProfile) return;
      setLoading(true);
      try {
        const committee = userProfile.role === 'magic' || userProfile.role === 'hr_leader' || userProfile.role === 'hr_member'
          ? undefined
          : userProfile.committee;

        const data = await getSubmissions(
          taskIdFilter
            ? { taskId: taskIdFilter }
            : committee
            ? { committee }
            : undefined
        );
        setSubmissions(data);
      } catch (err) {
        console.error('Failed to load submissions:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userProfile, taskIdFilter]);

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
      header: 'Timing',
      render: (s) =>
        s.isLate ? (
          <Badge variant="destructive">{t('tasks.lateSubmission')}</Badge>
        ) : (
          <Badge variant="success">On Time</Badge>
        ),
    },
    {
      key: 'date',
      header: t('common.date'),
      render: (s) => (
        <span className="text-xs text-secondary">
          {s.submittedAt ? new Date(s.submittedAt.toMillis()).toLocaleString() : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (s) => (
        <Button size="sm" variant="outline" onClick={() => setSelectedSub(s)}>
          {t('common.details')}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.submissions')}
        subtitle="Track submitted work, resubmission versions, and file attachments"
      />

      <DataTable
        data={submissions}
        columns={columns}
        searchKey={(s) => `${s.userName} ${s.taskTitle} ${s.committee}`}
        searchPlaceholder={t('common.search')}
      />

      {/* Submission Detail Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-card border border-border-color rounded-xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-border-color pb-4">
              <div>
                <h3 className="text-lg font-bold text-primary">{selectedSub.taskTitle}</h3>
                <p className="text-sm text-secondary">
                  Submitted by <span className="text-[#8EDB2A] font-semibold">{selectedSub.userName}</span> • Version {selectedSub.version}
                </p>
              </div>
              {selectedSub.isLate ? (
                <Badge variant="destructive">LATE SUBMISSION</Badge>
              ) : (
                <Badge variant="success">ON TIME</Badge>
              )}
            </div>

            <div>
              <h4 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2">
                {t('tasks.textSubmission')}
              </h4>
              <div className="p-4 rounded-lg bg-elevated border border-border-color text-sm text-primary whitespace-pre-wrap">
                {selectedSub.textContent || 'No written text provided.'}
              </div>
            </div>

            {selectedSub.files && selectedSub.files.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2">
                  {t('tasks.fileSubmission')} ({selectedSub.files.length})
                </h4>
                <div className="space-y-2">
                  {selectedSub.files.map((f, i) => (
                    <a
                      key={i}
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-lg border border-border-color bg-elevated/40 hover:border-[#8EDB2A] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[#8EDB2A]" />
                        <span className="text-sm font-medium text-primary">{f.name}</span>
                        <span className="text-xs text-muted">({(f.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                      <Download className="h-4 w-4 text-muted" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-border-color">
              <Button onClick={() => setSelectedSub(null)}>
                {t('common.close')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
