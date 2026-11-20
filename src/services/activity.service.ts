import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit as firestoreLimit,
  serverTimestamp,
  Timestamp,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ActivityLog, ActivityAction, CommitteeName } from '@/types';

const ACTIVITY_COLLECTION = 'activityLogs';

export interface CreateActivityLogParams {
  actorId: string;
  actorName: string;
  action: ActivityAction;
  targetEntity: string;
  targetId: string;
  committeeId?: CommitteeName | string;
  details: string;
}

export async function logActivity(params: CreateActivityLogParams): Promise<void> {
  try {
    await addDoc(collection(db, ACTIVITY_COLLECTION), {
      ...params,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Failed to log activity:', err);
  }
}

export async function getActivityLogs(limitCount = 100, committee?: string): Promise<ActivityLog[]> {
  try {
    let q = query(
      collection(db, ACTIVITY_COLLECTION),
      orderBy('timestamp', 'desc'),
      firestoreLimit(limitCount)
    );

    if (committee) {
      q = query(
        collection(db, ACTIVITY_COLLECTION),
        where('committeeId', '==', committee),
        orderBy('timestamp', 'desc'),
        firestoreLimit(limitCount)
      );
    }

    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as ActivityLog[];
  } catch (err) {
    console.error('Error fetching activity logs:', err);
    return [];
  }
}
