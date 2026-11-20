import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Plus, Trash2, Eye, FileText } from 'lucide-react';
import { getTasks, deleteTask } from '@/services/task.service';
import type { Task } from '@/types';
import { COMMITTEE_DISPLAY } from '@/types';

export default function TasksPage() {
  const { userProfile } = useAuth();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadTasks = async () => {
    if (!userProfile) return;
    setLoading(true);
    try {
      // Magic sees all, leader sees their own committee tasks
      const committeeFilter = userProfile.role === 'magic' ? undefined : userProfile.committee;
      const data = await getTasks(committeeFilter ? { committee: committeeFilter } : undefined);
      setTasks(data);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [userProfile]);

  const handleDelete = async () => {
    if (!deletingTask || !userProfile) return;
    setActionLoading(true);
    try {
      await deleteTask(deletingTask.id);
      setDeletingTask(null);
      await loadTasks();
    } catch (err) {
      console.error('Error deleting task:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const columns: Column<Task>[] = [
    {
      key: 'title',
      header: t('tasks.title'),
      render: (task) => (
        <div>
          <p className="font-semibold text-primary">{task.title}</p>
          <p className="text-xs text-muted line-clamp-1">{task.description}</p>
        </div>
      ),
    },
    {
      key: 'committee',
      header: t('common.committee'),
      render: (task) => (
        <span>
          {isAr ? COMMITTEE_DISPLAY[task.committee]?.ar : COMMITTEE_DISPLAY[task.committee]?.en}
        </span>
      ),
    },
    {
      key: 'priority',
      header: t('tasks.priority'),
      render: (task) => <StatusBadge status={task.priority} type="priority" />,
    },
    {
      key: 'status',
      header: t('common.status'),
      render: (task) => <StatusBadge status={task.status} type="task" />,
    },
    {
      key: 'deadline',
      header: t('tasks.deadline'),
      render: (task) => (
        <span className="text-xs text-secondary">
          {task.deadline ? new Date(task.deadline.toMillis()).toLocaleDateString() : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (task) => (
        <div className="flex items-center gap-2">
          <Link to={`/submissions?taskId=${task.id}`}>
            <Button size="sm" variant="ghost" title="Submissions">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
            onClick={() => setDeletingTask(task)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.tasks')}
        subtitle="Manage assigned operational tasks, deadlines, and submissions"
      >
        <Link to="/create-task">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {t('tasks.createTask')}
          </Button>
        </Link>
      </PageHeader>

      <DataTable
        data={tasks}
        columns={columns}
        searchKey={(tItem) => `${tItem.title} ${tItem.committee}`}
        searchPlaceholder={t('common.search')}
      />

      <ConfirmDialog
        open={!!deletingTask}
        onOpenChange={(open) => !open && setDeletingTask(null)}
        title={t('tasks.deleteTask')}
        description={`Are you sure you want to delete task "${deletingTask?.title}"? All member submissions will also be deleted.`}
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        loading={actionLoading}
      />
    </div>
  );
}
