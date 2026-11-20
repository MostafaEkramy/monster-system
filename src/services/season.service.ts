// ============================================================
// MONSTERS TEAM MANAGEMENT SYSTEM — Season Service
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
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Season, FilterState } from '@/types';

// ---- Constants ----

const SEASONS_COL = 'seasons';
const SYSTEM_SETTINGS_COL = 'systemSettings';
const EVALUATIONS_COL = 'evaluations';
const ATTENDANCE_RECORDS_COL = 'attendanceRecords';
const USERS_COL = 'users';

// ---- Season CRUD ----

/**
 * Create a new season.
 */
export async function createSeason(
  season: Omit<Season, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const docRef = await addDoc(collection(db, SEASONS_COL), {
    ...season,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Get all seasons, ordered by start date descending.
 */
export async function getSeasons(): Promise<Season[]> {
  const q = query(
    collection(db, SEASONS_COL),
    orderBy('startDate', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Season);
}

/**
 * Get the currently active season.
 */
export async function getActiveSeason(): Promise<Season | null> {
  const q = query(
    collection(db, SEASONS_COL),
    where('status', '==', 'active'),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Season;
}

/**
 * Activate a season: deactivates all other active seasons and updates system settings.
 * Uses a batch write for atomicity.
 */
export async function activateSeason(seasonId: string): Promise<void> {
  const batch = writeBatch(db);

  // Get the season to activate
  const seasonSnap = await getDoc(doc(db, SEASONS_COL, seasonId));
  if (!seasonSnap.exists()) throw new Error('Season not found');
  const season = seasonSnap.data();

  // Deactivate all currently active seasons
  const activeSnap = await getDocs(
    query(collection(db, SEASONS_COL), where('status', '==', 'active'))
  );
  activeSnap.docs.forEach((d) => {
    if (d.id !== seasonId) {
      batch.update(d.ref, {
        status: 'upcoming',
        updatedAt: serverTimestamp(),
      });
    }
  });

  // Activate the target season
  batch.update(doc(db, SEASONS_COL, seasonId), {
    status: 'active',
    updatedAt: serverTimestamp(),
  });

  // Update system settings
  batch.update(doc(db, SYSTEM_SETTINGS_COL, 'config'), {
    currentSeasonId: seasonId,
    currentSeasonName: season.name,
    updatedAt: serverTimestamp(),
  });

  await batch.commit();
}

/**
 * Archive a season.
 */
export async function archiveSeason(seasonId: string): Promise<void> {
  await updateDoc(doc(db, SEASONS_COL, seasonId), {
    status: 'archived',
    updatedAt: serverTimestamp(),
  });
}

/**
 * Get aggregated results for a season:
 * - Total evaluations and average score
 * - Total attendance sessions
 * - Top performers
 */
export async function getSeasonResults(seasonId: string): Promise<{
  totalEvaluations: number;
  averageScore: number;
  topPerformers: Array<{ userId: string; userName: string; points: number }>;
}> {
  // Get all finalized evaluations for the season
  const evalsSnap = await getDocs(
    query(
      collection(db, EVALUATIONS_COL),
      where('seasonId', '==', seasonId),
      where('isFinalized', '==', true)
    )
  );

  const totalEvaluations = evalsSnap.size;
  let totalScore = 0;
  const userPoints = new Map<string, { userName: string; points: number }>();

  evalsSnap.docs.forEach((d) => {
    const data = d.data();
    totalScore += data.awardedPoints as number;

    const existing = userPoints.get(data.userId as string);
    if (existing) {
      existing.points += data.awardedPoints as number;
    } else {
      userPoints.set(data.userId as string, {
        userName: data.userName as string,
        points: data.awardedPoints as number,
      });
    }
  });

  const averageScore =
    totalEvaluations > 0 ? Math.round(totalScore / totalEvaluations) : 0;

  // Sort by points descending and take top 10
  const topPerformers = Array.from(userPoints.entries())
    .map(([userId, info]) => ({ userId, ...info }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 10);

  return { totalEvaluations, averageScore, topPerformers };
}
