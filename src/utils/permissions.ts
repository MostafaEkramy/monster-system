import type { UserRole, CommitteeName } from '@/types';

/**
 * Super Admin check - Magic has absolute control
 */
export function isMagic(role: UserRole): boolean {
  return role === 'magic';
}

/**
 * President or Vice President - Global read-only
 */
export function isExecutive(role: UserRole): boolean {
  return role === 'president' || role === 'vice_president';
}

/**
 * Committee Leader
 */
export function isCommitteeLeader(role: UserRole): boolean {
  return role === 'leader';
}

/**
 * HR Personnel (HR Leader or HR Member)
 */
export function isHR(role: UserRole): boolean {
  return role === 'hr_leader' || role === 'hr_member';
}

/**
 * Check if role is read-only (President & VP)
 */
export function isReadOnly(role: UserRole): boolean {
  return role === 'president' || role === 'vice_president';
}

/**
 * Can manage users (Approve, reject, edit role, edit committee, delete)
 * Only Magic has this right.
 */
export function canManageUsers(role: UserRole): boolean {
  return role === 'magic';
}

/**
 * Can approve or reject registrations
 * Only Magic
 */
export function canApproveRegistrations(role: UserRole): boolean {
  return role === 'magic';
}

/**
 * Can create tasks
 * Magic can create for any committee. Committee leader can create for their committee.
 */
export function canCreateTasks(role: UserRole, userCommittee?: CommitteeName, targetCommittee?: CommitteeName): boolean {
  if (role === 'magic') return true;
  if (role === 'leader' && userCommittee && targetCommittee) {
    return userCommittee === targetCommittee;
  }
  return false;
}

/**
 * Can edit or delete task
 */
export function canManageTask(role: UserRole, userCommittee?: CommitteeName, taskCommittee?: CommitteeName): boolean {
  if (role === 'magic') return true;
  if (role === 'leader' && userCommittee && taskCommittee) {
    return userCommittee === taskCommittee;
  }
  return false;
}

/**
 * Can evaluate task submissions
 * HR Leader, HR Members, and Magic only.
 */
export function canEvaluateTasks(role: UserRole): boolean {
  return role === 'magic' || role === 'hr_leader' || role === 'hr_member';
}

/**
 * Can record attendance
 * Committee Leader: for their own committee
 * HR Leader / HR Member: for any committee
 * Magic: for any committee
 */
export function canRecordAttendance(role: UserRole, userCommittee?: CommitteeName, targetCommittee?: CommitteeName): boolean {
  if (role === 'magic' || role === 'hr_leader' || role === 'hr_member') return true;
  if (role === 'leader' && userCommittee && targetCommittee) {
    return userCommittee === targetCommittee;
  }
  return false;
}

/**
 * Can manage seasons (create, activate, archive)
 * Only Magic
 */
export function canManageSeasons(role: UserRole): boolean {
  return role === 'magic';
}

/**
 * Can view all committees data
 * Magic, President, Vice President, HR Leader, HR Member
 */
export function canViewAllCommittees(role: UserRole): boolean {
  return role === 'magic' || role === 'president' || role === 'vice_president' || role === 'hr_leader' || role === 'hr_member';
}

/**
 * Can view activity logs
 * Magic, President, Vice President
 */
export function canViewActivityLogs(role: UserRole): boolean {
  return role === 'magic' || role === 'president' || role === 'vice_president';
}
