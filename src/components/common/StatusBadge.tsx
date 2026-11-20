import React from 'react';
import { Badge } from '@/components/ui/badge';
import { STATUS_DISPLAY, PRIORITY_DISPLAY, ATTENDANCE_DISPLAY } from '@/types';
import type { TaskStatus, TaskPriority, AttendanceStatus, AccountStatus } from '@/types';
import { useTranslation } from 'react-i18next';

interface StatusBadgeProps {
  status: TaskStatus | TaskPriority | AttendanceStatus | AccountStatus | string;
  type?: 'task' | 'priority' | 'attendance' | 'account';
  className?: string;
}

export function StatusBadge({ status, type = 'task', className }: StatusBadgeProps) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  if (type === 'task') {
    const s = status as TaskStatus;
    const config = STATUS_DISPLAY[s] || { en: status, ar: status, color: 'bg-gray-500/20 text-gray-400' };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color} ${className || ''}`}>
        {isAr ? config.ar : config.en}
      </span>
    );
  }

  if (type === 'priority') {
    const p = status as TaskPriority;
    const config = PRIORITY_DISPLAY[p] || { en: status, ar: status, color: 'bg-gray-500/20 text-gray-400' };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color} ${className || ''}`}>
        {isAr ? config.ar : config.en}
      </span>
    );
  }

  if (type === 'attendance') {
    const a = status as AttendanceStatus;
    const config = ATTENDANCE_DISPLAY[a] || { en: status, ar: status, color: 'bg-gray-500/20 text-gray-400' };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color} ${className || ''}`}>
        {isAr ? config.ar : config.en}
      </span>
    );
  }

  // Account status
  const accountColors: Record<string, string> = {
    approved: 'bg-green-500/20 text-green-400',
    pending: 'bg-yellow-500/20 text-yellow-400',
    rejected: 'bg-red-500/20 text-red-400',
    suspended: 'bg-gray-500/20 text-gray-400',
  };

  return (
    <Badge
      variant="outline"
      className={`${accountColors[status] || ''} capitalize ${className || ''}`}
    >
      {status}
    </Badge>
  );
}
