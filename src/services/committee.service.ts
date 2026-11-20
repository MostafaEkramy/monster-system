// ============================================================
// MONSTERS TEAM MANAGEMENT SYSTEM — Committee Service
// ============================================================

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  writeBatch,
  getCountFromServer,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type {
  Committee,
  CommitteeName,
  UserProfile,
  FilterState,
} from '@/types';
import { COMMITTEE_DISPLAY } from '@/types';

// ---- Constants ----

const COMMITTEES_COL = 'committees';
const USERS_COL = 'users';
const TASKS_COL = 'tasks';
const ATTENDANCE_RECORDS_COL = 'attendanceRecords';

const DEFAULT_COMMITTEES: {
  name: CommitteeName;
  description: string;
  descriptionAr: string;
}[] = [
  {
    name: 'logistics',
    description: 'Handles event logistics and operations',
    descriptionAr: 'تتولى العمليات اللوجستية والتنظيمية',
  },
  {
    name: 'creativity',
    description: 'Manages creative content and design',
    descriptionAr: 'تدير المحتوى الإبداعي والتصميم',
  },
  {
    name: 'media',
    description: 'Oversees media production and coverage',
    descriptionAr: 'تشرف على الإنتاج الإعلامي والتغطية',
  },
  {
    name: 'pr',
    description: 'Manages public relations and outreach',
    descriptionAr: 'تدير العلاقات العامة والتواصل',
  },
  {
    name: 'hr',
    description: 'Handles human resources and team development',
    descriptionAr: 'تتولى الموارد البشرية وتطوير الفريق',
  },
  {
    name: 'activity',
    description: 'Plans and executes team activities',
    descriptionAr: 'تخطط وتنفذ أنشطة الفريق',
  },
];

// ---- Committee CRUD ----

/**
 * Initialize the 6 default committees if they don't already exist.
 */
export async function initializeCommittees(): Promise<void> {
  const batch = writeBatch(db);
  const existingSnap = await getDocs(collection(db, COMMITTEES_COL));
  const existingNames = new Set(
    existingSnap.docs.map((d) => d.data().name as CommitteeName)
  );

  for (const c of DEFAULT_COMMITTEES) {
    if (existingNames.has(c.name)) continue;

    const ref = doc(collection(db, COMMITTEES_COL));
    const display = COMMITTEE_DISPLAY[c.name];

    batch.set(ref, {
      name: c.name,
      displayName: display.en,
      displayNameAr: display.ar,
      description: c.description,
      descriptionAr: c.descriptionAr,
      leaderId: null,
      leaderName: null,
      memberCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  await batch.commit();
}

/**
 * Get all committees.
 */
export async function getCommittees(): Promise<Committee[]> {
  const snap = await getDocs(collection(db, COMMITTEES_COL));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Committee);
}

/**
 * Get a single committee by ID.
 */
export async function getCommitteeById(
  committeeId: string
): Promise<Committee | null> {
  const docSnap = await getDoc(doc(db, COMMITTEES_COL, committeeId));
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Committee;
}

/**
 * Update committee fields.
 */
export async function updateCommittee(
  committeeId: string,
  data: Partial<Omit<Committee, 'id' | 'createdAt'>>
): Promise<void> {
  await updateDoc(doc(db, COMMITTEES_COL, committeeId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Get all approved members of a committee.
 */
export async function getCommitteeMembers(
  committeeId: string
): Promise<UserProfile[]> {
  // First get the committee to know its name
  const committee = await getCommitteeById(committeeId);
  if (!committee) return [];

  const q = query(
    collection(db, USERS_COL),
    where('committee', '==', committee.name),
    where('status', '==', 'approved')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as UserProfile);
}

/**
 * Assign a leader to a committee.
 * Updates the committee's leaderId/leaderName and sets the user's role.
 */
export async function assignLeader(
  committeeId: string,
  userId: string
): Promise<void> {
  const batch = writeBatch(db);

  // Get user profile for the name
  const userSnap = await getDoc(doc(db, USERS_COL, userId));
  if (!userSnap.exists()) throw new Error('User not found');
  const user = userSnap.data() as Omit<UserProfile, 'id'>;

  // Get the committee to find the current leader (if any)
  const committee = await getCommitteeById(committeeId);
  if (!committee) throw new Error('Committee not found');

  // If there is an existing leader, demote them back to member
  if (committee.leaderId && committee.leaderId !== userId) {
    const isHr = committee.name === 'hr';
    batch.update(doc(db, USERS_COL, committee.leaderId), {
      role: isHr ? 'hr_member' : 'member',
      updatedAt: serverTimestamp(),
    });
  }

  // Determine the correct leader role
  const leaderRole = committee.name === 'hr' ? 'hr_leader' : 'leader';

  // Update user role
  batch.update(doc(db, USERS_COL, userId), {
    role: leaderRole,
    updatedAt: serverTimestamp(),
  });

  // Update committee leader info
  batch.update(doc(db, COMMITTEES_COL, committeeId), {
    leaderId: userId,
    leaderName: user.fullName,
    updatedAt: serverTimestamp(),
  });

  await batch.commit();
}

/**
 * Get statistics for a committee.
 */
export async function getCommitteeStats(committeeId: string): Promise<{
  memberCount: number;
  taskCount: number;
  avgAttendance: number;
}> {
  const committee = await getCommitteeById(committeeId);
  if (!committee) {
    return { memberCount: 0, taskCount: 0, avgAttendance: 0 };
  }

  // Member count
  const membersQuery = query(
    collection(db, USERS_COL),
    where('committee', '==', committee.name),
    where('status', '==', 'approved')
  );
  const memberCountSnap = await getCountFromServer(membersQuery);
  const memberCount = memberCountSnap.data().count;

  // Task count
  const tasksQuery = query(
    collection(db, TASKS_COL),
    where('committee', '==', committee.name)
  );
  const taskCountSnap = await getCountFromServer(tasksQuery);
  const taskCount = taskCountSnap.data().count;

  // Average attendance percentage from member profiles
  const membersSnap = await getDocs(membersQuery);
  let totalAttendance = 0;
  membersSnap.docs.forEach((d) => {
    const profile = d.data() as Omit<UserProfile, 'id'>;
    totalAttendance += profile.attendancePercentage ?? 0;
  });
  const avgAttendance =
    memberCount > 0 ? Math.round(totalAttendance / memberCount) : 0;

  return { memberCount, taskCount, avgAttendance };
}
