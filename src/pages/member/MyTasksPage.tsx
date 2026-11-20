import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/EmptyState';
import { FileText, Clock, Upload, CheckCircle, AlertTriangle, Send } from 'lucide-react';
import { getUserAssignments, getTaskById } from '@/services/task.service';
import { createSubmission, getSubmissionByTaskAndUser } from '@/services/submission.service';
import { uploadSubmissionFile } from '@/services/storage.service';
import { getActiveSeason } from '@/services/season.service';
import type { TaskAssignment, Task, Submission, SubmissionFile } from '@/types';
import { Timestamp } from 'firebase/firestore';

export default function MyTasksPage() {
  const { userProfile } = useAuth();
  const { t } = useTranslation();

  const [assignments, setAssignments] = useState<TaskAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected task modal for submission
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [existingSubmission, setExistingSubmission] = useState<Submission | null>(null);
  const [textContent, setTextContent] = useState('');
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const loadMyTasks = async () => {
    if (!userProfile) return;
    setLoading(true);
    try {
      const data = await getUserAssignments(userProfile.id);
      setAssignments(data);
    } catch (err) {
      console.error('Failed to load my tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyTasks();
  }, [userProfile]);

  const handleOpenTask = async (taskId: string) => {
    if (!userProfile) return;
    setSubmitSuccess(false);
    try {
      const [taskDoc, sub] = await Promise.all([
        getTaskById(taskId),
        getSubmissionByTaskAndUser(taskId, userProfile.id),
      ]);
      setSelectedTask(taskDoc);
      setExistingSubmission(sub);
      setTextContent(sub?.textContent || '');
      setUploadFiles([]);
    } catch (err) {
      console.error('Failed to open task:', err);
    }
  };

  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !userProfile) return;

    setSubmitting(true);
    try {
      const activeSeason = await getActiveSeason();
      const seasonId = activeSeason?.id || 'default_season';

      // Check if submission is late
      const deadlineMillis = selectedTask.deadline.toMillis();
      const isLate = Date.now() > deadlineMillis;

      // Upload files if any
      const uploadedFilesList: SubmissionFile[] = existingSubmission?.files || [];
      for (const file of uploadFiles) {
        const fileData = await uploadSubmissionFile(selectedTask.id, userProfile.id, file);
        uploadedFilesList.push({
          name: file.name,
          url: fileData.url,
          type: file.type,
          size: file.size,
          storagePath: fileData.storagePath,
        });
      }

      await createSubmission({
        taskId: selectedTask.id,
        taskTitle: selectedTask.title,
        userId: userProfile.id,
        userName: userProfile.fullName,
        committee: userProfile.committee,
        textContent,
        files: uploadedFilesList,
        isLate,
        submittedAt: Timestamp.now(),
        seasonId,
      });

      setSubmitSuccess(true);
      setTimeout(() => {
        setSelectedTask(null);
        loadMyTasks();
      }, 1500);
    } catch (err) {
      console.error('Failed to submit task:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.myTasks')}
        subtitle="View tasks assigned to you, track deadlines, and submit your deliverables"
      />

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#8EDB2A] border-t-transparent" />
        </div>
      ) : assignments.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={t('tasks.noTasks')}
          description="You currently have no tasks assigned. Whenever a task is assigned to your committee, it will appear here."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((assignment) => (
            <Card
              key={assignment.id}
              className="border-border-color hover:border-[#8EDB2A]/50 transition-colors cursor-pointer"
              onClick={() => handleOpenTask(assignment.taskId)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">
                      Task Assignment
                    </CardTitle>
                    <p className="text-xs text-muted mt-1">ID: #{assignment.taskId.slice(0, 8)}</p>
                  </div>
                  <StatusBadge status={assignment.status} type="task" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-xs text-secondary pt-2 border-t border-border-color">
                  <span>
                    {assignment.isLate ? (
                      <span className="text-red-400 font-medium">LATE</span>
                    ) : (
                      'On schedule'
                    )}
                  </span>
                  <Button size="sm" variant="outline" className="text-xs">
                    {assignment.status === 'evaluated'
                      ? 'View Results'
                      : assignment.status === 'submitted'
                      ? 'Edit / Resubmit'
                      : t('tasks.submitTask')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Task Details & Submission Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-card border border-border-color rounded-xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="border-b border-border-color pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-primary">{selectedTask.title}</h3>
                  <p className="text-xs text-muted mt-1">
                    Deadline: {new Date(selectedTask.deadline.toMillis()).toLocaleString()}
                  </p>
                </div>
                <StatusBadge status={selectedTask.priority} type="priority" />
              </div>

              {Date.now() > selectedTask.deadline.toMillis() && (
                <div className="flex items-center gap-2 mt-3 p-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>The original deadline has passed. Late submission is permitted and will be flagged for HR review.</span>
                </div>
              )}
            </div>

            <div>
              <h4 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-1">
                Description:
              </h4>
              <p className="text-sm text-primary whitespace-pre-wrap">{selectedTask.description}</p>
            </div>

            {selectedTask.submissionRequirements && (
              <div>
                <h4 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-1">
                  Submission Requirements:
                </h4>
                <p className="text-xs text-secondary bg-elevated p-3 rounded-lg border border-border-color">
                  {selectedTask.submissionRequirements}
                </p>
              </div>
            )}

            {/* Submission Form */}
            {existingSubmission?.isLocked ? (
              <div className="p-4 rounded-xl border border-green-500/30 bg-green-500/10 text-center space-y-1">
                <CheckCircle className="h-6 w-6 text-green-400 mx-auto" />
                <h4 className="font-semibold text-primary">Submission Evaluated and Locked</h4>
                <p className="text-xs text-secondary">
                  Your work has been graded by HR. View score in My Evaluations.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitTask} className="space-y-4 pt-3 border-t border-border-color">
                {submitSuccess && (
                  <div className="p-3 rounded-lg bg-[#8EDB2A]/10 border border-[#8EDB2A]/30 text-[#8EDB2A] text-sm text-center">
                    Submission uploaded successfully!
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-primary mb-1.5 block">
                    {t('tasks.textSubmission')} *
                  </label>
                  <Textarea
                    rows={4}
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Describe your completed work, paste cloud document links, or write response..."
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-primary mb-1.5 block">
                    {t('tasks.fileSubmission')} (Optional)
                  </label>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        setUploadFiles(Array.from(e.target.files));
                      }
                    }}
                    className="block w-full text-xs text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#8EDB2A]/10 file:text-[#8EDB2A] hover:file:bg-[#8EDB2A]/20 cursor-pointer"
                  />
                  <p className="text-[10px] text-muted mt-1">
                    Allowed: PDF, DOCX, PNG, JPG, ZIP (Max 10MB per file)
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-border-color">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedTask(null)}
                    disabled={submitting}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? t('common.loading') : t('tasks.submitTask')}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
