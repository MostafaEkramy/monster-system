// ============================================================
// MONSTERS TEAM MANAGEMENT SYSTEM — Notifications Hook
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  updateDoc,
  doc,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Notification } from '@/types';

// ---- Types ----

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: Error | null;
}

interface UseNotificationsReturn extends NotificationsState {
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

// ---- Constants ----

const NOTIFICATIONS_COL = 'notifications';
const MAX_NOTIFICATIONS = 50;

// ---- Hook ----

/**
 * Real-time notification hook.
 * Subscribes to the current user's notifications and provides
 * unread count + mark-as-read functionality.
 */
export function useNotifications(userId: string | undefined): UseNotificationsReturn {
  const [state, setState] = useState<NotificationsState>({
    notifications: [],
    unreadCount: 0,
    loading: true,
    error: null,
  });

  const unsubscribeRef = useRef<Unsubscribe | null>(null);

  // Subscribe to real-time notification updates
  useEffect(() => {
    if (!userId) {
      setState({
        notifications: [],
        unreadCount: 0,
        loading: false,
        error: null,
      });
      return;
    }

    setState((prev) => ({ ...prev, loading: true }));

    const q = query(
      collection(db, NOTIFICATIONS_COL),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(MAX_NOTIFICATIONS)
    );

    unsubscribeRef.current = onSnapshot(
      q,
      (snapshot) => {
        const notifications = snapshot.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as Notification
        );
        const unreadCount = notifications.filter((n) => !n.isRead).length;

        setState({
          notifications,
          unreadCount,
          loading: false,
          error: null,
        });
      },
      (err) => {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err,
        }));
      }
    );

    return () => {
      unsubscribeRef.current?.();
    };
  }, [userId]);

  /**
   * Mark a single notification as read.
   */
  const markAsRead = useCallback(
    async (notificationId: string): Promise<void> => {
      try {
        await updateDoc(doc(db, NOTIFICATIONS_COL, notificationId), {
          isRead: true,
        });
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    },
    []
  );

  /**
   * Mark all unread notifications as read using a batch write.
   */
  const markAllAsRead = useCallback(async (): Promise<void> => {
    try {
      const unread = state.notifications.filter((n) => !n.isRead);
      if (unread.length === 0) return;

      const batch = writeBatch(db);
      for (const notification of unread) {
        batch.update(doc(db, NOTIFICATIONS_COL, notification.id), {
          isRead: true,
        });
      }
      await batch.commit();
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  }, [state.notifications]);

  return {
    ...state,
    markAsRead,
    markAllAsRead,
  };
}
