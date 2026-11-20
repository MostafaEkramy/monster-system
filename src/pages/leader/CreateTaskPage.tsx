import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { createTask } from '@/services/task.service';
import { getUsersByCommittee } from '@/services/user.service';
import { getActiveSeason } from '@/services/season.service';
import type { TaskPriority, CommitteeName, UserProfile } from '@/types';
import { COMMITTEE_DISPLAY, PRIORITY_DISPLAY } from '@/types';
import { Timestamp } from 'firebase/firestore';

export default function CreateTaskPage() {
  const { userProfile } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isAr = i18n.language === 'ar';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [committee, setCommittee] = useState<CommitteeName>(
    userProfile?.role === 'magic' ? 'logistics' : userProfile?.committee || 'logistics'
  );
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [deadline, setDeadline] = useState('');
  const [submissionReqs, setSubmissionReqs] = useState('');
  const [maxScore, setMaxScore] = useState<number>(100);
  const [assignAll, setAssignAll] = useState(true);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const [committeeMembers, setCommitteeMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadMembers() {
      try {
        const members = await getUsersByCommittee(committee);
        setCommitteeMembers(members);
      } catch (err) {
        console.error('Failed to load committee members:', err);
      }
    }
    loadMembers();
  }, [committee]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || !title || !deadline) return;

    setLoading(true);
    try {
      const activeSeason = await getActiveSeason();
      const seasonId = activeSeason?.id || 'default_season';

      const assignedTo = assignAll ? committeeMembers.map((m) => m.id) : selectedMembers;

      await createTask(
        {
          title,
          description,
          committee,
          committeeId: committee,
          assignedTo,
          assignedToAll: assignAll,
          createdBy: userProfile.id,
          createdByName: userProfile.fullName,
          creationDate: Timestamp.now(),
          startDate: Timestamp.now(),
          deadline: Timestamp.fromDate(new Date(deadline)),
          priority,
          status: 'assigned',
          attachments: [],
          submissionRequirements: submissionReqs,
          maxScore: Number(maxScore),
          seasonId,
        },
        assignedTo
      );

      navigate('/tasks');
    } catch (err) {
      console.error('Error creating task:', err);
    } finally {
      setLoading(false);
    }
  };

  const committees: CommitteeName[] = ['logistics', 'creativity', 'media', 'pr', 'hr', 'activity'];
  const priorities: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title={t('tasks.createTask')}
        subtitle="Create an operational task with clear requirements, deadline, and scoring"
      />

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-sm font-semibold text-primary mb-1.5 block">
                {t('tasks.title')} *
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Design University Welcome Booth Graphics"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userProfile?.role === 'magic' ? (
                <div>
                  <label className="text-sm font-semibold text-primary mb-1.5 block">
                    {t('common.committee')} *
                  </label>
                  <Select
                    value={committee}
                    onChange={(e) => setCommittee(e.target.value as CommitteeName)}
                  >
                    {committees.map((c) => (
                      <option key={c} value={c}>
                        {isAr ? COMMITTEE_DISPLAY[c].ar : COMMITTEE_DISPLAY[c].en}
                      </option>
                    ))}
                  </Select>
                </div>
              ) : (
                <div>
                  <label className="text-sm font-semibold text-primary mb-1.5 block">
                    {t('common.committee')}
                  </label>
                  <Input
                    disabled
                    value={isAr ? COMMITTEE_DISPLAY[committee]?.ar : COMMITTEE_DISPLAY[committee]?.en}
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-semibold text-primary mb-1.5 block">
                  {t('tasks.priority')}
                </label>
                <Select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                >
                  {priorities.map((p) => (
                    <option key={p} value={p}>
                      {isAr ? PRIORITY_DISPLAY[p].ar : PRIORITY_DISPLAY[p].en}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-primary mb-1.5 block">
                  {t('tasks.deadline')} *
                </label>
                <Input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-primary mb-1.5 block">
                  {t('tasks.maxScore')}
                </label>
                <Input
                  type="number"
                  min={1}
                  max={500}
                  value={maxScore}
                  onChange={(e) => setMaxScore(Number(e.target.value))}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-primary mb-1.5 block">
                {t('tasks.description')} *
              </label>
              <Textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed task objectives, steps, and background context..."
                required
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-primary mb-1.5 block">
                {t('tasks.submissionRequirements')}
              </label>
              <Textarea
                rows={2}
                value={submissionReqs}
                onChange={(e) => setSubmissionReqs(e.target.value)}
                placeholder="File formats (PDF, PNG), drive links, or specific deliverable format..."
              />
            </div>

            {/* Assignment Section */}
            <div className="p-4 rounded-xl border border-border-color bg-elevated/40 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-primary">Assign To</h4>
                  <p className="text-xs text-secondary">
                    {assignAll
                      ? `Assigning to all ${committeeMembers.length} committee members`
                      : `Selected ${selectedMembers.length} member(s)`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={assignAll ? 'default' : 'outline'}
                    onClick={() => setAssignAll(true)}
                  >
                    All Members
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={!assignAll ? 'default' : 'outline'}
                    onClick={() => setAssignAll(false)}
                  >
                    Select Specific
                  </Button>
                </div>
              </div>

              {!assignAll && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-border-color max-h-48 overflow-y-auto">
                  {committeeMembers.map((m) => {
                    const isSelected = selectedMembers.includes(m.id);
                    return (
                      <label
                        key={m.id}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-sm cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-[#8EDB2A] bg-[#8EDB2A]/10 text-primary'
                            : 'border-border-color bg-card text-secondary'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMembers([...selectedMembers, m.id]);
                            } else {
                              setSelectedMembers(selectedMembers.filter((id) => id !== m.id));
                            }
                          }}
                          className="rounded text-[#8EDB2A]"
                        />
                        <span className="truncate">{m.fullName}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border-color">
              <Button type="button" variant="outline" onClick={() => navigate('/tasks')}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? t('common.loading') : t('tasks.createTask')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
