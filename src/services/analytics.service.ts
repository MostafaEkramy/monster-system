// ============================================================
// MONSTERS TEAM MANAGEMENT SYSTEM — Analytics Service
// ============================================================

import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  getCountFromServer,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type {
  CommitteeName,
  UserRole,
  TaskStatus,
  UserProfile,
  Task,
  Evaluation,
  AttendanceRecord,
  AttendanceSession,
} from '@/types';
import { COMMITTEE_DISPLAY } from '@/types';

// ---- Constants ----

const USERS_COL = 'users';
const TASKS_COL = 'tasks';
const EVALUATIONS_COL = 'evaluations';
const ATTENDANCE_SESSIONS_COL = 'attendanceSessions';
const ATTENDANCE_RECORDS_COL = 'attendanceRecords';
const SUBMISSIONS_COL = 'submissions';

// ---- Types ----

export interface DashboardStats {
  totalMembers: number;
  totalTasks: number;
  pendingEvaluations: number;
  attendanceRate: number;
  totalSubmissions: number;
  activeTasks: number;
}

export interface CommitteeBreakdown {
  committee: CommitteeName;
  displayName: string;
  memberCount: number;
}

export interface TaskStatusBreakdown {
  status: TaskStatus;
  count: number;
}

export interface AttendanceOverview {
  totalSessions: number;
  averageAttendanceRate: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
}

export interface PerformanceTrend {
  taskTitle: string;
  awardedPoints: number;
  maxPoints: number;
  percentage: number;
  evaluationDate: Date;
}

export interface CommitteeComparison {
  committee: CommitteeName;
  displayName: string;
  avgPoints: number;
  avgAttendance: number;
  taskCompletionRate: number;
  memberCount: number;
}

// ---- Dashboard Stats ----

/**
 * Get dashboard statistics, scoped by role and optional committee.
 */
export async function getDashboardStats(
  role: UserRole,
  committee?: CommitteeName
): Promise<DashboardStats> {
  const isGlobal = ['magic', 'president', 'vice_president'].includes(role);

  // Build committee filter
  const committeeFilter = isGlobal ? undefined : committee;

  // Members count
  let membersQuery = query(
    collection(db, USERS_COL),
    where('status', '==', 'approved')
  );
  if (committeeFilter) {
    membersQuery = query(membersQuery, where('committee', '==', committeeFilter));
  }
  const membersCount = (await getCountFromServer(membersQuery)).data().count;

  // Tasks count
  let tasksQuery = query(collection(db, TASKS_COL));
  if (committeeFilter) {
    tasksQuery = query(tasksQuery, where('committee', '==', committeeFilter));
  }
  const tasksCount = (await getCountFromServer(tasksQuery)).data().count;

  // Active tasks
  let activeTasksQuery = query(
    collection(db, TASKS_COL),
    where('status', 'in', ['assigned', 'in_progress'])
  );
  if (committeeFilter) {
    activeTasksQuery = query(
      collection(db, TASKS_COL),
      where('committee', '==', committeeFilter),
      where('status', 'in', ['assigned', 'in_progress'])
    );
  }
  const activeTasksCount = (await getCountFromServer(activeTasksQuery)).data().count;

  // Pending evaluations
  let pendingQuery = query(
    collection(db, EVALUATIONS_COL),
    where('isFinalized', '==', false)
  );
  if (committeeFilter) {
    pendingQuery = query(
      collection(db, EVALUATIONS_COL),
      where('isFinalized', '==', false),
      where('committee', '==', committeeFilter)
    );
  }
  const pendingCount = (await getCountFromServer(pendingQuery)).data().count;

  // Submissions count
  let submissionsQuery = query(collection(db, SUBMISSIONS_COL));
  if (committeeFilter) {
    submissionsQuery = query(
      submissionsQuery,
      where('committee', '==', committeeFilter)
    );
  }
  const submissionsCount = (await getCountFromServer(submissionsQuery)).data().count;

  // Average attendance rate from user profiles
  let attendanceQuery = query(
    collection(db, USERS_COL),
    where('status', '==', 'approved')
  );
  if (committeeFilter) {
    attendanceQuery = query(
      attendanceQuery,
      where('committee', '==', committeeFilter)
    );
  }
  const usersSnap = await getDocs(attendanceQuery);
  let totalAttendance = 0;
  usersSnap.docs.forEach((d) => {
    totalAttendance += (d.data().attendancePercentage as number) ?? 0;
  });
  const attendanceRate =
    usersSnap.size > 0 ? Math.round(totalAttendance / usersSnap.size) : 0;

  return {
    totalMembers: membersCount,
    totalTasks: tasksCount,
    pendingEvaluations: pendingCount,
    attendanceRate,
    totalSubmissions: submissionsCount,
    activeTasks: activeTasksCount,
  };
}

/**
 * Get member count per committee.
 */
export async function getMembersPerCommittee(): Promise<CommitteeBreakdown[]> {
  const committees: CommitteeName[] = [
    'logistics',
    'creativity',
    'media',
    'pr',
    'hr',
    'activity',
  ];

  const results: CommitteeBreakdown[] = [];

  for (const committee of committees) {
    const q = query(
      collection(db, USERS_COL),
      where('committee', '==', committee),
      where('status', '==', 'approved')
    );
    const count = (await getCountFromServer(q)).data().count;
    results.push({
      committee,
      displayName: COMMITTEE_DISPLAY[committee].en,
      memberCount: count,
    });
  }

  return results;
}

/**
 * Get task breakdown by status, optionally filtered by committee.
 */
export async function getTasksByStatus(
  committee?: CommitteeName
): Promise<TaskStatusBreakdown[]> {
  const statuses: TaskStatus[] = [
    'assigned',
    'in_progress',
    'submitted',
    'late',
    'under_review',
    'evaluated',
  ];

  const results: TaskStatusBreakdown[] = [];

  for (const status of statuses) {
    let q = query(
      collection(db, TASKS_COL),
      where('status', '==', status)
    );
    if (committee) {
      q = query(
        collection(db, TASKS_COL),
        where('status', '==', status),
        where('committee', '==', committee)
      );
    }
    const count = (await getCountFromServer(q)).data().count;
    results.push({ status, count });
  }

  return results;
}

/**
 * Get attendance overview, optionally filtered by committee.
 */
export async function getAttendanceOverview(
  committee?: CommitteeName
): Promise<AttendanceOverview> {
  // Get session count
  let sessionsQuery = query(collection(db, ATTENDANCE_SESSIONS_COL));
  if (committee) {
    sessionsQuery = query(
      sessionsQuery,
      where('committee', '==', committee)
    );
  }
  const sessionsSnap = await getDocs(sessionsQuery);
  const totalSessions = sessionsSnap.size;

  // Aggregate attendance records
  let recordsQuery = query(collection(db, ATTENDANCE_RECORDS_COL));
  if (committee) {
    recordsQuery = query(
      recordsQuery,
      where('committee', '==', committee)
    );
  }
  const recordsSnap = await getDocs(recordsQuery);

  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let excusedCount = 0;

  recordsSnap.docs.forEach((d) => {
    switch (d.data().status) {
      case 'present':
        presentCount++;
        break;
      case 'absent':
        absentCount++;
        break;
      case 'late':
        lateCount++;
        break;
      case 'excused':
        excusedCount++;
        break;
    }
  });

  const totalRecords = recordsSnap.size;
  const countable = totalRecords - excusedCount;
  const averageAttendanceRate =
    countable > 0 ? Math.round(((presentCount + lateCount * 0.5) / countable) * 100) : 0;

  return {
    totalSessions,
    averageAttendanceRate,
    presentCount,
    absentCount,
    lateCount,
    excusedCount,
  };
}

/**
 * Get performance trends for a specific user (evaluation scores over time).
 */
export async function getPerformanceTrends(
  userId: string
): Promise<PerformanceTrend[]> {
  const q = query(
    collection(db, EVALUATIONS_COL),
    where('userId', '==', userId),
    where('isFinalized', '==', true),
    orderBy('evaluationDate', 'asc')
  );
  const snap = await getDocs(q);

  return snap.docs.map((d) => {
    const data = d.data();
    const awarded = data.awardedPoints as number;
    const max = data.maxPoints as number;
    return {
      taskTitle: data.taskTitle as string,
      awardedPoints: awarded,
      maxPoints: max,
      percentage: max > 0 ? Math.round((awarded / max) * 100) : 0,
      evaluationDate: (data.evaluationDate as { toDate: () => Date }).toDate(),
    };
  });
}

/**
 * Get a comparison across all committees.
 */
export async function getCommitteeComparison(): Promise<CommitteeComparison[]> {
  const committees: CommitteeName[] = [
    'logistics',
    'creativity',
    'media',
    'pr',
    'hr',
    'activity',
  ];

  const results: CommitteeComparison[] = [];

  for (const committee of committees) {
    // Members
    const membersQuery = query(
      collection(db, USERS_COL),
      where('committee', '==', committee),
      where('status', '==', 'approved')
    );
    const membersSnap = await getDocs(membersQuery);
    const memberCount = membersSnap.size;

    // Average points
    let totalPoints = 0;
    let totalAttendance = 0;
    membersSnap.docs.forEach((d) => {
      const data = d.data();
      totalPoints += (data.currentSeasonPoints as number) ?? 0;
      totalAttendance += (data.attendancePercentage as number) ?? 0;
    });
    const avgPoints = memberCount > 0 ? Math.round(totalPoints / memberCount) : 0;
    const avgAttendance =
      memberCount > 0 ? Math.round(totalAttendance / memberCount) : 0;

    // Task completion rate
    const allTasksQuery = query(
      collection(db, TASKS_COL),
      where('committee', '==', committee)
    );
    const allTasksCount = (await getCountFromServer(allTasksQuery)).data().count;

    const completedQuery = query(
      collection(db, TASKS_COL),
      where('committee', '==', committee),
      where('status', '==', 'evaluated')
    );
    const completedCount = (await getCountFromServer(completedQuery)).data().count;

    const taskCompletionRate =
      allTasksCount > 0 ? Math.round((completedCount / allTasksCount) * 100) : 0;

    results.push({
      committee,
      displayName: COMMITTEE_DISPLAY[committee].en,
      avgPoints,
      avgAttendance,
      taskCompletionRate,
      memberCount,
    });
  }

  return results;
}

/**
 * Get evaluation statistics.
 */
export async function getEvaluationStats(): Promise<{
  totalEvaluations: number;
  finalizedCount: number;
  pendingCount: number;
  averageScore: number;
  averagePercentage: number;
}> {
  const allSnap = await getDocs(collection(db, EVALUATIONS_COL));
  const totalEvaluations = allSnap.size;

  let finalizedCount = 0;
  let pendingCount = 0;
  let totalScore = 0;
  let totalMaxScore = 0;

  allSnap.docs.forEach((d) => {
    const data = d.data();
    if (data.isFinalized) {
      finalizedCount++;
      totalScore += data.awardedPoints as number;
      totalMaxScore += data.maxPoints as number;
    } else {
      pendingCount++;
    }
  });

  const averageScore =
    finalizedCount > 0 ? Math.round(totalScore / finalizedCount) : 0;
  const averagePercentage =
    totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;

  return {
    totalEvaluations,
    finalizedCount,
    pendingCount,
    averageScore,
    averagePercentage,
  };
}
