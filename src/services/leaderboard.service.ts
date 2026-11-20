// ============================================================
// MONSTERS TEAM MANAGEMENT SYSTEM — Leaderboard Service
// ============================================================

import {
  collection,
  doc,
  getDocs,
  updateDoc,
  query,
  where,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { CommitteeName, UserProfile } from '@/types';

// ---- Constants ----

const EVALUATIONS_COL = 'evaluations';
const USERS_COL = 'users';

// ---- Types ----

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  committee: CommitteeName;
  totalPoints: number;
  rank: number;
  evaluationCount: number;
}

// ---- Leaderboard Functions ----

/**
 * Get the leaderboard for a specific committee in a season.
 * Calculates rankings from finalized evaluations. Handles ties.
 */
export async function getCommitteeLeaderboard(
  committee: CommitteeName,
  seasonId: string
): Promise<LeaderboardEntry[]> {
  // Get all finalized evaluations for this committee and season
  const evalsSnap = await getDocs(
    query(
      collection(db, EVALUATIONS_COL),
      where('committee', '==', committee),
      where('seasonId', '==', seasonId),
      where('isFinalized', '==', true)
    )
  );

  // Aggregate points per user
  const userMap = new Map<
    string,
    { userName: string; totalPoints: number; evaluationCount: number }
  >();

  evalsSnap.docs.forEach((d) => {
    const data = d.data();
    const userId = data.userId as string;
    const existing = userMap.get(userId);

    if (existing) {
      existing.totalPoints += data.awardedPoints as number;
      existing.evaluationCount += 1;
    } else {
      userMap.set(userId, {
        userName: data.userName as string,
        totalPoints: data.awardedPoints as number,
        evaluationCount: 1,
      });
    }
  });

  // Convert to array, sort by points descending
  const entries: LeaderboardEntry[] = Array.from(userMap.entries()).map(
    ([userId, info]) => ({
      userId,
      userName: info.userName,
      committee,
      totalPoints: info.totalPoints,
      rank: 0, // Will be calculated
      evaluationCount: info.evaluationCount,
    })
  );

  // Calculate ranks with tie handling
  return calculateRanks(entries);
}

/**
 * Calculate ranks for leaderboard entries.
 * Same score = same rank. Next rank skips accordingly (dense ranking).
 * Example: 100, 90, 90, 80 → ranks 1, 2, 2, 4
 */
export function calculateRanks(
  entries: LeaderboardEntry[]
): LeaderboardEntry[] {
  // Sort by total points descending
  const sorted = [...entries].sort((a, b) => b.totalPoints - a.totalPoints);

  let currentRank = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i].totalPoints === sorted[i - 1].totalPoints) {
      // Same score = same rank as previous
      sorted[i].rank = sorted[i - 1].rank;
    } else {
      sorted[i].rank = currentRank;
    }
    currentRank = i + 2; // Next position (1-indexed)
  }

  return sorted;
}

/**
 * Update a user's rank in their profile.
 */
export async function updateUserRank(
  userId: string,
  rank: number
): Promise<void> {
  await updateDoc(doc(db, USERS_COL, userId), {
    currentSeasonRank: rank,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Get leaderboards for all committees in a season.
 */
export async function getAllLeaderboards(
  seasonId: string
): Promise<Record<CommitteeName, LeaderboardEntry[]>> {
  const committees: CommitteeName[] = [
    'logistics',
    'creativity',
    'media',
    'pr',
    'hr',
    'activity',
  ];

  const results: Record<string, LeaderboardEntry[]> = {};

  // Fetch all finalized evaluations for the season in one query
  const evalsSnap = await getDocs(
    query(
      collection(db, EVALUATIONS_COL),
      where('seasonId', '==', seasonId),
      where('isFinalized', '==', true)
    )
  );

  // Group by committee
  const committeeMap = new Map<CommitteeName, typeof evalsSnap.docs>();
  for (const committee of committees) {
    committeeMap.set(committee, []);
  }

  evalsSnap.docs.forEach((d) => {
    const committee = d.data().committee as CommitteeName;
    committeeMap.get(committee)?.push(d);
  });

  // Build leaderboard for each committee
  for (const committee of committees) {
    const docs = committeeMap.get(committee) ?? [];
    const userMap = new Map<
      string,
      { userName: string; totalPoints: number; evaluationCount: number }
    >();

    docs.forEach((d) => {
      const data = d.data();
      const userId = data.userId as string;
      const existing = userMap.get(userId);

      if (existing) {
        existing.totalPoints += data.awardedPoints as number;
        existing.evaluationCount += 1;
      } else {
        userMap.set(userId, {
          userName: data.userName as string,
          totalPoints: data.awardedPoints as number,
          evaluationCount: 1,
        });
      }
    });

    const entries: LeaderboardEntry[] = Array.from(userMap.entries()).map(
      ([userId, info]) => ({
        userId,
        userName: info.userName,
        committee,
        totalPoints: info.totalPoints,
        rank: 0,
        evaluationCount: info.evaluationCount,
      })
    );

    results[committee] = calculateRanks(entries);
  }

  return results as Record<CommitteeName, LeaderboardEntry[]>;
}

/**
 * Update ranks for all users in a committee for a given season.
 * Fetches the leaderboard and batch-updates each user's profile.
 */
export async function updateCommitteeRanks(
  committee: CommitteeName,
  seasonId: string
): Promise<void> {
  const leaderboard = await getCommitteeLeaderboard(committee, seasonId);
  if (leaderboard.length === 0) return;

  const batch = writeBatch(db);
  for (const entry of leaderboard) {
    batch.update(doc(db, USERS_COL, entry.userId), {
      currentSeasonRank: entry.rank,
      updatedAt: serverTimestamp(),
    });
  }

  await batch.commit();
}
