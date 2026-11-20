import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import {
  getAllUsers,
  updateUserRole,
  updateUserCommittee,
  updateUserStatus,
  deleteUserAccount,
} from '@/services/user.service';
import type { UserProfile, UserRole, CommitteeName, AccountStatus } from '@/types';
import { COMMITTEE_DISPLAY, ROLE_DISPLAY } from '@/types';
import { Shield, UserCheck, Trash2, Edit3, UserX } from 'lucide-react';

export default function UsersPage() {
  const { userProfile: currentUser } = useAuth();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit user modal
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('member');
  const [newCommittee, setNewCommittee] = useState<CommitteeName>('logistics');
  const [newStatus, setNewStatus] = useState<AccountStatus>('approved');

  // Delete dialog
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSaveEdit = async () => {
    if (!editingUser || !currentUser) return;
    setActionLoading(true);
    try {
      if (newRole !== editingUser.role) {
        await updateUserRole(editingUser.id, newRole, currentUser.id, currentUser.fullName);
      }
      if (newCommittee !== editingUser.committee) {
        await updateUserCommittee(editingUser.id, newCommittee, currentUser.id, currentUser.fullName);
      }
      if (newStatus !== editingUser.status) {
        await updateUserStatus(editingUser.id, newStatus, currentUser.id, currentUser.fullName);
      }
      setEditingUser(null);
      await loadUsers();
    } catch (err) {
      console.error('Failed to update user:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingUser || !currentUser) return;
    setActionLoading(true);
    try {
      await deleteUserAccount(deletingUser.id, currentUser.id, currentUser.fullName);
      setDeletingUser(null);
      await loadUsers();
    } catch (err) {
      console.error('Failed to delete user:', err);
    } finally {
      setActionLoading(false);
    }
  };

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
      key: 'status',
      header: t('common.status'),
      render: (u) => <StatusBadge status={u.status} type="account" />,
    },
    {
      key: 'points',
      header: 'Points',
      render: (u) => <span className="font-bold text-[#8EDB2A]">{u.currentSeasonPoints || 0} pts</span>,
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (u) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setEditingUser(u);
              setNewRole(u.role);
              setNewCommittee(u.committee);
              setNewStatus(u.status);
            }}
          >
            <Edit3 className="h-4 w-4" />
          </Button>
          {u.role !== 'magic' && (
            <Button
              size="sm"
              variant="ghost"
              className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
              onClick={() => setDeletingUser(u)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const committees: CommitteeName[] = ['logistics', 'creativity', 'media', 'pr', 'hr', 'activity'];
  const roles: UserRole[] = ['magic', 'president', 'vice_president', 'leader', 'hr_leader', 'hr_member', 'member'];
  const statuses: AccountStatus[] = ['approved', 'pending', 'rejected', 'suspended'];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('users.userManagement')}
        subtitle="Manage all member accounts, roles, committees, and permissions"
      />

      <DataTable
        data={users}
        columns={columns}
        searchKey={(u) => `${u.fullName} ${u.email}`}
        searchPlaceholder={t('common.search')}
      />

      {/* Edit User Dialog */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md bg-card border-border-color shadow-2xl">
            <CardHeader>
              <CardTitle>Edit {editingUser.fullName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-medium text-secondary mb-1.5 block">
                  {t('common.role')}
                </label>
                <Select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                >
                  {roles.map((r) => (
                    <option key={r} value={r}>
                      {isAr ? ROLE_DISPLAY[r].ar : ROLE_DISPLAY[r].en}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-secondary mb-1.5 block">
                  {t('common.committee')}
                </label>
                <Select
                  value={newCommittee}
                  onChange={(e) => setNewCommittee(e.target.value as CommitteeName)}
                >
                  {committees.map((c) => (
                    <option key={c} value={c}>
                      {isAr ? COMMITTEE_DISPLAY[c].ar : COMMITTEE_DISPLAY[c].en}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-secondary mb-1.5 block">
                  {t('common.status')}
                </label>
                <Select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as AccountStatus)}
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditingUser(null)}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleSaveEdit} disabled={actionLoading}>
                  {actionLoading ? t('common.loading') : t('common.save')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete User Dialog */}
      <ConfirmDialog
        open={!!deletingUser}
        onOpenChange={(open) => !open && setDeletingUser(null)}
        title="Delete User Account"
        description={`Are you sure you want to delete ${deletingUser?.fullName}'s profile? This action cannot be undone.`}
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        loading={actionLoading}
      />
    </div>
  );
}
