import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Notification, NotificationType } from '@/types';

const NOTIFICATIONS_COLLECTION = 'notifications';

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  titleAr: string;
  message: string;
  messageAr: string;
  targetId?: string;
  targetType?: string;
}

export async function createNotification(params: CreateNotificationParams): Promise<void> {
  try {
    await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      ...params,
      isRead: false,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Error creating notification:', err);
  }
}

export async function getUserNotifications(userId: string): Promise<Notification[]> {
  const q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    where('userId', 'in', [userId, 'all', 'magic']),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Notification));
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await updateDoc(doc(db, NOTIFICATIONS_COLLECTION, notificationId), {
    isRead: true,
  });
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    where('userId', '==', userId),
    where('isRead', '==', false)
  );
  const snap = await getDocs(q);
  const updates = snap.docs.map((d) => updateDoc(d.ref, { isRead: true }));
  await Promise.all(updates);
}

export function subscribeToNotifications(
  userId: string,
  callback: (notifications: Notification[]) => void
) {
  const q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    where('userId', 'in', [userId, 'all']),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Notification));
      callback(items);
    },
    (err) => {
      console.warn('Error subscribing to notifications:', err);
    }
  );
}
