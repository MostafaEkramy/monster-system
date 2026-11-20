import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserProfile, UserRole, CommitteeName, AccountStatus } from '@/types';
import { logActivity } from './activity.service';

const USERS_COLLECTION = 'users';

export async function getAllUsers(): Promise<UserProfile[]> {
  const q = query(collection(db, USERS_COLLECTION), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as UserProfile));
}

export async function getPendingUsers(): Promise<UserProfile[]> {
  const q = query(
    collection(db, USERS_COLLECTION),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as UserProfile));
}

export async function getUsersByCommittee(committee: CommitteeName): Promise<UserProfile[]> {
  const q = query(
    collection(db, USERS_COLLECTION),
    where('committee', '==', committee),
    where('status', '==', 'approved')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as UserProfile));
}

export async function getUserById(userId: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, USERS_COLLECTION, userId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as UserProfile;
}

export async function approveUser(
  userId: string,
  approvedRole: UserRole,
  approvedCommittee: CommitteeName,
  actorId: string,
  actorName: string
): Promise<void> {
  await updateDoc(doc(db, USERS_COLLECTION, userId), {
    status: 'approved',
    role: approvedRole,
    committee: approvedCommittee,
    updatedAt: serverTimestamp(),
  });

  await logActivity({
    actorId,
    actorName,
    action: 'registration_approved',
    targetEntity: 'user',
    targetId: userId,
    committeeId: approvedCommittee,
    details: `Approved registration for ${userId} with role ${approvedRole} in committee ${approvedCommittee}`,
  });
}

export async function rejectUser(
  userId: string,
  actorId: string,
  actorName: string,
  reason?: string
): Promise<void> {
  await updateDoc(doc(db, USERS_COLLECTION, userId), {
    status: 'rejected',
    updatedAt: serverTimestamp(),
  });

  await logActivity({
    actorId,
    actorName,
    action: 'registration_rejected',
    targetEntity: 'user',
    targetId: userId,
    details: `Rejected registration for ${userId}. Reason: ${reason || 'Not specified'}`,
  });
}

export async function updateUserRole(
  userId: string,
  newRole: UserRole,
  actorId: string,
  actorName: string
): Promise<void> {
  await updateDoc(doc(db, USERS_COLLECTION, userId), {
    role: newRole,
    updatedAt: serverTimestamp(),
  });

  await logActivity({
    actorId,
    actorName,
    action: 'role_changed',
    targetEntity: 'user',
    targetId: userId,
    details: `Changed role to ${newRole}`,
  });
}

export async function updateUserCommittee(
  userId: string,
  newCommittee: CommitteeName,
  actorId: string,
  actorName: string
): Promise<void> {
  await updateDoc(doc(db, USERS_COLLECTION, userId), {
    committee: newCommittee,
    updatedAt: serverTimestamp(),
  });

  await logActivity({
    actorId,
    actorName,
    action: 'committee_changed',
    targetEntity: 'user',
    targetId: userId,
    committeeId: newCommittee,
    details: `Moved user to ${newCommittee} committee`,
  });
}

export async function updateUserStatus(
  userId: string,
  newStatus: AccountStatus,
  actorId: string,
  actorName: string
): Promise<void> {
  await updateDoc(doc(db, USERS_COLLECTION, userId), {
    status: newStatus,
    updatedAt: serverTimestamp(),
  });

  await logActivity({
    actorId,
    actorName,
    action: 'admin_action',
    targetEntity: 'user',
    targetId: userId,
    details: `Updated user status to ${newStatus}`,
  });
}

export async function updateUserProfile(
  userId: string,
  data: Partial<UserProfile>
): Promise<void> {
  const updateData: Record<string, unknown> = {
    ...data,
    updatedAt: serverTimestamp(),
  };
  delete updateData.id;
  delete updateData.role; // Prevent self-elevation
  delete updateData.status;

  await updateDoc(doc(db, USERS_COLLECTION, userId), updateData);
}

export async function deleteUserAccount(
  userId: string,
  actorId: string,
  actorName: string
): Promise<void> {
  await deleteDoc(doc(db, USERS_COLLECTION, userId));

  await logActivity({
    actorId,
    actorName,
    action: 'admin_action',
    targetEntity: 'user',
    targetId: userId,
    details: `Deleted user profile ${userId}`,
  });
}
