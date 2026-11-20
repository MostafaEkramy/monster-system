import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { CalendarCheck, Plus, Check, Clock, X, ShieldAlert } from 'lucide-react';
import {
  createAttendanceSession,
  getAttendanceSessions,
  recordAttendance,
  getAttendanceRecords,
} from '@/services/attendance.service';
import { getUsersByCommittee } from '@/services/user.service';
import { getActiveSeason } from '@/services/season.service';
import type { AttendanceSession, AttendanceStatus, CommitteeName, UserProfile } from '@/types';
import { COMMITTEE_DISPLAY } from '@/types';
import { Timestamp } from 'firebase/firestore';

export default function AttendancePage() {
  const { userProfile } = useAuth();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Create session state
  const [showCreate, setShowCreate] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionCommittee, setSessionCommittee] = useState<CommitteeName>(
    userProfile?.role === 'leader' ? userProfile.committee : 'logistics'
  );
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [committeeMembers, setCommitteeMembers] = useState<UserProfile[]>([]);
  const [memberStatuses, setMemberStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [saving, setSaving] = useState(false);

  // Active session records preview
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null);
  const [sessionRecords, setSessionRecords] = useState<any[]>([]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await getAttendanceSessions();
      setSessions(data);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  // When committee changes in session creation, load its members
  useEffect(() => {
    async function loadMembers() {
      try {
        const members = await getUsersByCommittee(sessionCommittee);
        setCommitteeMembers(members);
        const initialMap: Record<string, AttendanceStatus> = {};
        members.forEach((m) => {
          initialMap[m.id] = 'present';
        });
        setMemberStatuses(initialMap);
      } catch (err) {
        console.error('Failed to load members for attendance:', err);
      }
    }
    if (showCreate) {
      loadMembers();
    }
  }, [sessionCommittee, showCreate]);

  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || !sessionTitle) return;
    setSaving(true);
    try {
      const activeSeason = await getActiveSeason();
      const seasonId = activeSeason?.id || 'default_season';

      // 1. Create session
      const sessionId = await createAttendanceSession({
        title: sessionTitle,
        committee: sessionCommittee,
        date: Timestamp.fromDate(new Date(sessionDate)),
        createdBy: userProfile.id,
        createdByName: userProfile.fullName,
        seasonId,
      });

      // 2. Record items
      const recordsToSave = committeeMembers.map((m) => ({
        sessionId,
        userId: m.id,
        userName: m.fullName,
        committee: sessionCommittee,
        status: memberStatuses[m.id] || 'present',
        date: Timestamp.fromDate(new Date(sessionDate)),
        recordedBy: userProfile.id,
        seasonId,
      }));

      await recordAttendance(sessionId, recordsToSave);

      setShowCreate(false);
      setSessionTitle('');
      await loadSessions();
    } catch (err) {
      console.error('Error saving attendance session:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleViewSession = async (session: AttendanceSession) => {
    setActiveSession(session);
    try {
      const recs = await getAttendanceRecords(session.id);
      setSessionRecords(recs);
    } catch (err) {
      console.error('Failed to load session records:', err);
    }
  };

  const committees: CommitteeName[] = ['logistics', 'creativity', 'media', 'pr', 'hr', 'activity'];
  const attendanceOptions: AttendanceStatus[] = ['present', 'absent', 'late', 'excused'];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.attendance')}
        subtitle="Record meeting attendance, track participation, and calculate member attendance percentage"
      >
        <Button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {t('attendance.createSession')}
        </Button>
      </PageHeader>

      {/* Create Session Form */}
      {showCreate && (
        <Card className="border-[#8EDB2A]/50 bg-card">
          <CardHeader>
            <CardTitle>{t('attendance.createSession')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveAttendance} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-primary mb-1 block">
                    {t('attendance.sessionTitle')} *
                  </label>
                  <Input
                    value={sessionTitle}
                    onChange={(e) => setSessionTitle(e.target.value)}
                    placeholder="e.g. Weekly Committee Meeting"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-primary mb-1 block">
                    {t('common.committee')} *
                  </label>
                  {userProfile?.role === 'leader' ? (
                    <Input
                      disabled
                      value={isAr ? COMMITTEE_DISPLAY[userProfile.committee]?.ar : COMMITTEE_DISPLAY[userProfile.committee]?.en}
                    />
                  ) : (
                    <Select
                      value={sessionCommittee}
                      onChange={(e) => setSessionCommittee(e.target.value as CommitteeName)}
                    >
                      {committees.map((c) => (
                        <option key={c} value={c}>
                          {isAr ? COMMITTEE_DISPLAY[c].ar : COMMITTEE_DISPLAY[c].en}
                        </option>
                      ))}
                    </Select>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-primary mb-1 block">
                    {t('attendance.selectDate')} *
                  </label>
                  <Input
                    type="date"
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Members Attendance Checklist */}
              <div className="pt-3 border-t border-border-color space-y-2">
                <h4 className="text-xs font-semibold text-secondary uppercase tracking-wider">
                  Mark Committee Members ({committeeMembers.length}):
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {committeeMembers.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-border-color bg-elevated/40"
                    >
                      <span className="text-sm font-medium text-primary">{m.fullName}</span>
                      <div className="flex items-center gap-1">
                        {attendanceOptions.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() =>
                              setMemberStatuses({ ...memberStatuses, [m.id]: opt })
                            }
                            className={`px-2.5 py-1 rounded text-xs font-semibold capitalize transition-colors ${
                              memberStatuses[m.id] === opt
                                ? opt === 'present'
                                  ? 'bg-green-500 text-white'
                                  : opt === 'absent'
                                  ? 'bg-red-500 text-white'
                                  : opt === 'late'
                                  ? 'bg-yellow-500 text-black'
                                  : 'bg-blue-500 text-white'
                                : 'bg-card text-muted border border-border-color hover:text-primary'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border-color">
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? t('common.loading') : t('common.save')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Attendance Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sessions.map((s) => (
          <Card
            key={s.id}
            className="border-border-color hover:border-[#8EDB2A]/40 transition-colors cursor-pointer"
            onClick={() => handleViewSession(s)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{s.title}</CardTitle>
                  <p className="text-xs text-muted mt-1">
                    {s.date ? new Date(s.date.toMillis()).toLocaleDateString() : 'Recent'} •{' '}
                    {isAr ? COMMITTEE_DISPLAY[s.committee]?.ar : COMMITTEE_DISPLAY[s.committee]?.en}
                  </p>
                </div>
                <Badge variant="outline">{s.totalPresent || 0} Present</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-1 text-center text-xs pt-2 border-t border-border-color">
                <div className="text-green-400 font-bold">{s.totalPresent || 0} P</div>
                <div className="text-red-400 font-bold">{s.totalAbsent || 0} A</div>
                <div className="text-yellow-400 font-bold">{s.totalLate || 0} L</div>
                <div className="text-blue-400 font-bold">{s.totalExcused || 0} E</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Session Records Modal */}
      {activeSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-card border border-border-color rounded-xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-border-color pb-3">
              <div>
                <h3 className="text-lg font-bold text-primary">{activeSession.title}</h3>
                <p className="text-xs text-muted">
                  {activeSession.date ? new Date(activeSession.date.toMillis()).toLocaleDateString() : ''}
                </p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setActiveSession(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {sessionRecords.map((rec) => (
                <div
                  key={rec.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-border-color bg-elevated/40"
                >
                  <span className="text-sm font-medium text-primary">{rec.userName}</span>
                  <StatusBadge status={rec.status} type="attendance" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
