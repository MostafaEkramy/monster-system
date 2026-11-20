import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { UserCheck, Check, X, Shield, Clock, Mail, Phone, School } from 'lucide-react';
import { getPendingUsers, approveUser, rejectUser } from '@/services/user.service';
import type { UserProfile, UserRole, CommitteeName } from '@/types';
import { COMMITTEE_DISPLAY, ROLE_DISPLAY } from '@/types';

export default function PendingRegistrationsPage() {
  const { userProfile } = useAuth();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Approve dialog state
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [assignedRole, setAssignedRole] = useState<UserRole>('member');
  const [assignedCommittee, setAssignedCommittee] = useState<CommitteeName>('logistics');
  const [actionLoading, setActionLoading] = useState(false);

  // Reject dialog
  const [rejectingUser, setRejectingUser] = useState<UserProfile | null>(null);

  const loadPending = async () => {
    setLoading(true);
    try {
      const users = await getPendingUsers();
      setPendingUsers(users);
    } catch (err) {
      console.error('Failed to load pending users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleApprove = async () => {
    if (!selectedUser || !userProfile) return;
    setActionLoading(true);
    try {
      await approveUser(
        selectedUser.id,
        assignedRole,
        assignedCommittee,
        userProfile.id,
        userProfile.fullName
      );
      setSelectedUser(null);
      await loadPending();
    } catch (err) {
      console.error('Error approving user:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectingUser || !userProfile) return;
    setActionLoading(true);
    try {
      await rejectUser(
        rejectingUser.id,
        userProfile.id,
        userProfile.fullName,
        'Rejected by Magic Administrator'
      );
      setRejectingUser(null);
      await loadPending();
    } catch (err) {
      console.error('Error rejecting user:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const committees: CommitteeName[] = ['logistics', 'creativity', 'media', 'pr', 'hr', 'activity'];
  const roles: UserRole[] = ['member', 'leader', 'hr_leader', 'hr_member', 'vice_president', 'president'];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.pendingRegistrations')}
        subtitle="Review and approve new member registration requests"
      >
        <Badge variant="outline" className="px-3 py-1">
          {pendingUsers.length} {t('common.pending')}
        </Badge>
      </PageHeader>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#8EDB2A] border-t-transparent" />
        </div>
      ) : pendingUsers.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="No Pending Registrations"
          description="All registrations have been reviewed. New applicant requests will appear here."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingUsers.map((user) => (
            <Card key={user.id} className="relative overflow-hidden border-border-color hover:border-[#8EDB2A]/40 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{user.fullName}</CardTitle>
                    <p className="text-xs text-muted flex items-center gap-1 mt-1">
                      <Clock className="h-3.5 w-3.5" />
                      {user.createdAt ? new Date(user.createdAt.toMillis()).toLocaleDateString() : 'Recent'}
                    </p>
                  </div>
                  <Badge variant="warning">{t('common.pending')}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center gap-2 text-secondary">
                    <Mail className="h-4 w-4 text-muted shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-secondary">
                    <Phone className="h-4 w-4 text-muted shrink-0" />
                    <span>{user.phone || 'N/A'}</span>
                  </div>
                  {user.university && (
                    <div className="flex items-center gap-2 text-secondary">
                      <School className="h-4 w-4 text-muted shrink-0" />
                      <span>{user.university}</span>
                    </div>
                  )}
                  <div className="mt-2 pt-2 border-t border-border-color">
                    <span className="text-xs text-muted">Requested Committee:</span>
                    <p className="font-semibold text-[#8EDB2A]">
                      {isAr ? COMMITTEE_DISPLAY[user.committee]?.ar : COMMITTEE_DISPLAY[user.committee]?.en}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-border-color">
                  <Button
                    size="sm"
                    className="flex-1 flex items-center justify-center gap-1.5"
                    onClick={() => {
                      setSelectedUser(user);
                      setAssignedCommittee(user.committee || 'logistics');
                      setAssignedRole('member');
                    }}
                  >
                    <Check className="h-4 w-4" />
                    {t('common.approve')}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1 flex items-center justify-center gap-1.5"
                    onClick={() => setRejectingUser(user)}
                  >
                    <X className="h-4 w-4" />
                    {t('common.reject')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Approve Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md bg-card border-border-color shadow-2xl">
            <CardHeader>
              <CardTitle>Approve {selectedUser.fullName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-medium text-secondary mb-1.5 block">
                  Assign Committee
                </label>
                <Select
                  value={assignedCommittee}
                  onChange={(e) => setAssignedCommittee(e.target.value as CommitteeName)}
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
                  Assign Initial Role
                </label>
                <Select
                  value={assignedRole}
                  onChange={(e) => setAssignedRole(e.target.value as UserRole)}
                >
                  {roles.map((r) => (
                    <option key={r} value={r}>
                      {isAr ? ROLE_DISPLAY[r].ar : ROLE_DISPLAY[r].en}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setSelectedUser(null)}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleApprove} disabled={actionLoading}>
                  {actionLoading ? t('common.loading') : t('common.approve')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reject Confirm Dialog */}
      <ConfirmDialog
        open={!!rejectingUser}
        onOpenChange={(open) => !open && setRejectingUser(null)}
        title="Reject Registration"
        description={`Are you sure you want to reject registration for ${rejectingUser?.fullName}?`}
        confirmLabel={t('common.reject')}
        onConfirm={handleReject}
        loading={actionLoading}
      />
    </div>
  );
}
