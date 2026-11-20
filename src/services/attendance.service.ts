// ============================================================
// MONSTERS TEAM MANAGEMENT SYSTEM — Attendance Service
// ============================================================

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type {
  AttendanceSession,
  AttendanceRecord,
  AttendanceStatus,
  CommitteeName,
  FilterState,
} from '@/types';

// ---- Constants ----

const ATTENDANCE_SESSIONS_COL = 'attendanceSessions';
const ATTENDANCE_RECORDS_COL = 'attendanceRecords';
const USERS_COL = 'users';

// ---- Attendance Session ----

/**
 * Create a new attendance session.
 */
export async function createAttendanceSession(
  session: Omit<AttendanceSession, 'id' | 'totalPresent' | 'totalAbsent' | 'totalLate' | 'totalExcused' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const docRef = await addDoc(collection(db, ATTENDANCE_SESSIONS_COL), {
    ...session,
    totalPresent: 0,
    totalAbsent: 0,
    totalLate: 0,
    totalExcused: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Record attendance for multiple users in a session using a batch write.
 * Also updates session totals.
 */
export async function recordAttendance(
  sessionId: string,
  records: Array<{
    userId: string;
    userName: string;
    committee: CommitteeName;
    status: AttendanceStatus;
    date: Timestamp;
    recordedBy: string;
    seasonId: string;
  }>
): Promise<void> {
  const batch = writeBatch(db);

  // Counters for session summary
  let totalPresent = 0;
  let totalAbsent = 0;
  let totalLate = 0;
  let totalExcused = 0;

  for (const record of records) {
    const recordRef = doc(collection(db, ATTENDANCE_RECORDS_COL));
    batch.set(recordRef, {
      sessionId,
      userId: record.userId,
      userName: record.userName,
      committee: record.committee,
      status: record.status,
      date: record.date,
      recordedBy: record.recordedBy,
      seasonId: record.seasonId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    switch (record.status) {
      case 'present':
        totalPresent++;
        break;
      case 'absent':
        totalAbsent++;
        break;
      case 'late':
        totalLate++;
        break;
      case 'excused':
        totalExcused++;
        break;
    }
  }

  // Update session totals
  batch.update(doc(db, ATTENDANCE_SESSIONS_COL, sessionId), {
    totalPresent,
    totalAbsent,
    totalLate,
    totalExcused,
    updatedAt: serverTimestamp(),
  });

  await batch.commit();
}

/**
 * Get attendance sessions with optional filters.
 */
export async function getAttendanceSessions(
  filters?: FilterState
): Promise<AttendanceSession[]> {
  let q = query(
    collection(db, ATTENDANCE_SESSIONS_COL),
    orderBy('date', 'desc')
  );

  const constraints: ReturnType<typeof where>[] = [];

  if (filters?.committee) {
    constraints.push(where('committee', '==', filters.committee));
  }
  if (filters?.season) {
    constraints.push(where('seasonId', '==', filters.season));
  }

  if (constraints.length > 0) {
    q = query(
      collection(db, ATTENDANCE_SESSIONS_COL),
      ...constraints,
      orderBy('date', 'desc')
    );
  }

  const snap = await getDocs(q);
  let sessions = snap.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as AttendanceSession
  );

  // Client-side text search
  if (filters?.search) {
    const term = filters.search.toLowerCase();
    sessions = sessions.filter((s) =>
      s.title.toLowerCase().includes(term)
    );
  }

  return sessions;
}

/**
 * Get all attendance records for a specific session.
 */
export async function getAttendanceRecords(
  sessionId: string
): Promise<AttendanceRecord[]> {
  const q = query(
    collection(db, ATTENDANCE_RECORDS_COL),
    where('sessionId', '==', sessionId),
    orderBy('userName', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as AttendanceRecord
  );
}

/**
 * Get all attendance records for a specific user.
 */
export async function getUserAttendance(
  userId: string
): Promise<AttendanceRecord[]> {
  const q = query(
    collection(db, ATTENDANCE_RECORDS_COL),
    where('userId', '==', userId),
    orderBy('date', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as AttendanceRecord
  );
}

/**
 * Calculate attendance percentage for a user.
 * Excused absences are excluded from the denominator.
 */
export async function calculateAttendancePercentage(
  userId: string
): Promise<number> {
  const records = await getUserAttendance(userId);
  if (records.length === 0) return 0;

  const excusedCount = records.filter((r) => r.status === 'excused').length;
  const countableSessions = records.length - excusedCount;

  if (countableSessions === 0) return 100; // All sessions excused

  const presentCount = records.filter((r) => r.status === 'present').length;
  const lateCount = records.filter((r) => r.status === 'late').length;

  // Late counts as half attendance
  const effectivePresent = presentCount + lateCount * 0.5;
  return Math.round((effectivePresent / countableSessions) * 100);
}

/**
 * Update a single attendance record.
 */
export async function updateAttendanceRecord(
  recordId: string,
  data: Partial<Omit<AttendanceRecord, 'id' | 'createdAt'>>
): Promise<void> {
  await updateDoc(doc(db, ATTENDANCE_RECORDS_COL, recordId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}
