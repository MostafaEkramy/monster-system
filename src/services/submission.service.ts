// ============================================================
// MONSTERS TEAM MANAGEMENT SYSTEM — Submission Service
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
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Submission, FilterState } from '@/types';

// ---- Constants ----

const SUBMISSIONS_COL = 'submissions';

// ---- Submission CRUD ----

/**
 * Create a new submission with version tracking.
 * Automatically detects if submission is late based on deadline.
 */
export async function createSubmission(
  submission: Omit<Submission, 'id' | 'version' | 'isLocked' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  // Check for existing submissions to determine version
  const existingSnap = await getDocs(
    query(
      collection(db, SUBMISSIONS_COL),
      where('taskId', '==', submission.taskId),
      where('userId', '==', submission.userId),
      orderBy('version', 'desc'),
      limit(1)
    )
  );

  const version = existingSnap.empty
    ? 1
    : (existingSnap.docs[0].data().version as number) + 1;

  const docRef = await addDoc(collection(db, SUBMISSIONS_COL), {
    ...submission,
    version,
    isLocked: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

/**
 * Get submissions with optional filters.
 */
export async function getSubmissions(filters?: FilterState): Promise<Submission[]> {
  let q = query(
    collection(db, SUBMISSIONS_COL),
    orderBy('submittedAt', 'desc')
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
      collection(db, SUBMISSIONS_COL),
      ...constraints,
      orderBy('submittedAt', 'desc')
    );
  }

  const snap = await getDocs(q);
  let submissions = snap.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as Submission
  );

  // Client-side text search
  if (filters?.search) {
    const term = filters.search.toLowerCase();
    submissions = submissions.filter(
      (s) =>
        s.taskTitle.toLowerCase().includes(term) ||
        s.userName.toLowerCase().includes(term) ||
        s.textContent.toLowerCase().includes(term)
    );
  }

  return submissions;
}

/**
 * Get the latest submission for a specific task and user.
 */
export async function getSubmissionByTaskAndUser(
  taskId: string,
  userId: string
): Promise<Submission | null> {
  const q = query(
    collection(db, SUBMISSIONS_COL),
    where('taskId', '==', taskId),
    where('userId', '==', userId),
    orderBy('version', 'desc'),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Submission;
}

/**
 * Update a submission (resubmission): increments version and updates timestamp.
 */
export async function updateSubmission(
  submissionId: string,
  data: Partial<Omit<Submission, 'id' | 'createdAt' | 'version' | 'isLocked'>>
): Promise<void> {
  // Get current submission to check lock status and get version
  const snap = await getDoc(doc(db, SUBMISSIONS_COL, submissionId));
  if (!snap.exists()) throw new Error('Submission not found');

  const current = snap.data();
  if (current.isLocked) {
    throw new Error('Cannot update a locked submission');
  }

  await updateDoc(doc(db, SUBMISSIONS_COL, submissionId), {
    ...data,
    version: (current.version as number) + 1,
    submittedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Lock a submission after evaluation is finalized.
 */
export async function lockSubmission(submissionId: string): Promise<void> {
  await updateDoc(doc(db, SUBMISSIONS_COL, submissionId), {
    isLocked: true,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Check if a submission is late relative to the task deadline.
 */
export function checkIfLate(
  deadline: Timestamp,
  submittedAt: Timestamp
): boolean {
  return submittedAt.toMillis() > deadline.toMillis();
}

/**
 * Get the full submission history for a task-user pair, ordered by version.
 */
export async function getSubmissionHistory(
  taskId: string,
  userId: string
): Promise<Submission[]> {
  const q = query(
    collection(db, SUBMISSIONS_COL),
    where('taskId', '==', taskId),
    where('userId', '==', userId),
    orderBy('version', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as Submission
  );
}
