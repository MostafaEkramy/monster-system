// ============================================================
// MONSTERS TEAM MANAGEMENT SYSTEM — Evaluation Service
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
  runTransaction,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Evaluation, FilterState } from '@/types';

// ---- Constants ----

const EVALUATIONS_COL = 'evaluations';
const SUBMISSIONS_COL = 'submissions';
const USERS_COL = 'users';

// ---- Evaluation CRUD ----

/**
 * Create a new evaluation.
 */
export async function createEvaluation(
  evaluation: Omit<Evaluation, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const docRef = await addDoc(collection(db, EVALUATIONS_COL), {
    ...evaluation,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Get evaluations with optional filters.
 */
export async function getEvaluations(
  filters?: FilterState
): Promise<Evaluation[]> {
  let q = query(
    collection(db, EVALUATIONS_COL),
    orderBy('evaluationDate', 'desc')
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
      collection(db, EVALUATIONS_COL),
      ...constraints,
      orderBy('evaluationDate', 'desc')
    );
  }

  const snap = await getDocs(q);
  let evaluations = snap.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as Evaluation
  );

  // Client-side text search
  if (filters?.search) {
    const term = filters.search.toLowerCase();
    evaluations = evaluations.filter(
      (e) =>
        e.taskTitle.toLowerCase().includes(term) ||
        e.userName.toLowerCase().includes(term) ||
        e.feedback.toLowerCase().includes(term)
    );
  }

  return evaluations;
}

/**
 * Get all pending (non-finalized) evaluations.
 */
export async function getPendingEvaluations(): Promise<Evaluation[]> {
  const q = query(
    collection(db, EVALUATIONS_COL),
    where('isFinalized', '==', false),
    orderBy('evaluationDate', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as Evaluation
  );
}

/**
 * Finalize an evaluation using a Firestore transaction.
 * - Marks evaluation as finalized
 * - Locks the related submission
 * - Recalculates the user's total season points
 */
export async function finalizeEvaluation(
  evaluationId: string
): Promise<void> {
  await runTransaction(db, async (transaction) => {
    // 1. Read the evaluation
    const evalRef = doc(db, EVALUATIONS_COL, evaluationId);
    const evalSnap = await transaction.get(evalRef);
    if (!evalSnap.exists()) throw new Error('Evaluation not found');

    const evaluation = evalSnap.data() as Omit<Evaluation, 'id'>;
    if (evaluation.isFinalized) {
      throw new Error('Evaluation is already finalized');
    }

    // 2. Read the submission
    const submissionRef = doc(db, SUBMISSIONS_COL, evaluation.submissionId);
    const submissionSnap = await transaction.get(submissionRef);
    if (!submissionSnap.exists()) throw new Error('Submission not found');

    // 3. Read the user
    const userRef = doc(db, USERS_COL, evaluation.userId);
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists()) throw new Error('User not found');

    // 4. Calculate total season points from all finalized evaluations + this one
    const allEvalsSnap = await getDocs(
      query(
        collection(db, EVALUATIONS_COL),
        where('userId', '==', evaluation.userId),
        where('seasonId', '==', evaluation.seasonId),
        where('isFinalized', '==', true)
      )
    );
    let totalPoints = evaluation.awardedPoints;
    allEvalsSnap.docs.forEach((d) => {
      totalPoints += d.data().awardedPoints as number;
    });

    // 5. Write: finalize evaluation
    transaction.update(evalRef, {
      isFinalized: true,
      updatedAt: serverTimestamp(),
    });

    // 6. Write: lock submission
    transaction.update(submissionRef, {
      isLocked: true,
      updatedAt: serverTimestamp(),
    });

    // 7. Write: update user points
    transaction.update(userRef, {
      currentSeasonPoints: totalPoints,
      updatedAt: serverTimestamp(),
    });
  });
}

/**
 * Update evaluation data (non-finalized only). Logs changes.
 */
export async function updateEvaluation(
  evaluationId: string,
  data: Partial<Omit<Evaluation, 'id' | 'createdAt' | 'isFinalized'>>
): Promise<void> {
  const snap = await getDoc(doc(db, EVALUATIONS_COL, evaluationId));
  if (!snap.exists()) throw new Error('Evaluation not found');

  const current = snap.data();
  if (current.isFinalized) {
    throw new Error('Cannot modify a finalized evaluation');
  }

  await updateDoc(doc(db, EVALUATIONS_COL, evaluationId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Get the evaluation for a specific submission.
 */
export async function getEvaluationBySubmission(
  submissionId: string
): Promise<Evaluation | null> {
  const q = query(
    collection(db, EVALUATIONS_COL),
    where('submissionId', '==', submissionId)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Evaluation;
}

/**
 * Safely recalculate a user's total season points from all finalized evaluations.
 * Uses a transaction to prevent race conditions.
 */
export async function recalculateUserPoints(
  userId: string,
  seasonId: string
): Promise<number> {
  return await runTransaction(db, async (transaction) => {
    // Get all finalized evaluations for this user and season
    const evalsSnap = await getDocs(
      query(
        collection(db, EVALUATIONS_COL),
        where('userId', '==', userId),
        where('seasonId', '==', seasonId),
        where('isFinalized', '==', true)
      )
    );

    let totalPoints = 0;
    evalsSnap.docs.forEach((d) => {
      totalPoints += d.data().awardedPoints as number;
    });

    // Update user profile with recalculated total
    const userRef = doc(db, USERS_COL, userId);
    transaction.update(userRef, {
      currentSeasonPoints: totalPoints,
      updatedAt: serverTimestamp(),
    });

    return totalPoints;
  });
}
