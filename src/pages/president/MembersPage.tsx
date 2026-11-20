import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { getAllUsers } from '@/services/user.service';
import type { UserProfile } from '@/types';
import { COMMITTEE_DISPLAY, ROLE_DISPLAY } from '@/types';

export default function MembersPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const users = await getAllUsers();
        // Executive read-only view of approved members
        setMembers(users.filter((u) => u.status === 'approved'));
      } catch (err) {
        console.error('Failed to load members:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const columns: Column<UserProfile>[] = [
    {
      key: 'fullName',
      header: t('common.name'),
      render: (u) => (
        <div>
          <p className="font-semibold text-primary">{u.fullName}</p>
          <p className="text-xs text-muted">{u.email}</p>
        </div>
      ),
    },
    {
      key: 'committee',
      header: t('common.committee'),
      render: (u) => (
        <span className="font-medium text-primary">
          {u.committee ? (isAr ? COMMITTEE_DISPLAY[u.committee]?.ar : COMMITTEE_DISPLAY[u.committee]?.en) : '-'}
        </span>
      ),
    },
    {
      key: 'role',
      header: t('common.role'),
      render: (u) => (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#8EDB2A]/10 text-[#8EDB2A]">
          {isAr ? ROLE_DISPLAY[u.role]?.ar : ROLE_DISPLAY[u.role]?.en}
        </span>
      ),
    },
    {
      key: 'points',
      header: 'Season Points',
      render: (u) => <span className="font-bold text-[#8EDB2A]">{u.currentSeasonPoints || 0} pts</span>,
    },
    {
      key: 'attendance',
      header: 'Attendance',
      render: (u) => <span className="text-xs font-medium">{u.attendancePercentage || 100}%</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.members')}
        subtitle="Read-only directory of all approved Monsters Team personnel"
      />

      <DataTable
        data={members}
        columns={columns}
        searchKey={(u) => `${u.fullName} ${u.email} ${u.committee}`}
        searchPlaceholder={t('common.search')}
      />
    </div>
  );
}
