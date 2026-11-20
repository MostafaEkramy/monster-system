import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/EmptyState';
import { Bell, CheckCheck, Clock, CheckCircle } from 'lucide-react';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/services/notification.service';
import type { Notification } from '@/types';

export default function NotificationsPage() {
  const { userProfile } = useAuth();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    if (!userProfile) return;
    setLoading(true);
    try {
      const data = await getUserNotifications(userProfile.id);
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [userProfile]);

  const handleMarkAllRead = async () => {
    if (!userProfile) return;
    await markAllNotificationsAsRead(userProfile.id);
    await loadNotifications();
  };

  const handleMarkOne = async (id: string) => {
    await markNotificationAsRead(id);
    await loadNotifications();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title={t('notifications.title')}
        subtitle="In-app notification center for tasks, evaluations, attendance, and team events"
      >
        <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="flex items-center gap-1.5">
          <CheckCheck className="h-4 w-4" />
          {t('notifications.markAllRead')}
        </Button>
      </PageHeader>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#8EDB2A] border-t-transparent" />
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={t('notifications.noNotifications')}
          description="You are completely caught up! New events and alerts will appear in this feed."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((item) => (
            <div
              key={item.id}
              className={`flex items-start justify-between p-4 rounded-xl border transition-colors ${
                !item.isRead
                  ? 'border-[#8EDB2A]/50 bg-[#8EDB2A]/5'
                  : 'border-border-color bg-card'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-primary text-sm">
                    {isAr ? item.titleAr : item.title}
                  </h4>
                  {!item.isRead && (
                    <Badge variant="default" className="text-[10px] px-1.5 py-0">
                      NEW
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-secondary">{isAr ? item.messageAr : item.message}</p>
                <p className="text-[10px] text-muted flex items-center gap-1 pt-1">
                  <Clock className="h-3 w-3" />
                  {item.createdAt ? new Date(item.createdAt.toMillis()).toLocaleString() : 'Just now'}
                </p>
              </div>

              {!item.isRead && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs text-[#8EDB2A]"
                  onClick={() => handleMarkOne(item.id)}
                >
                  {t('notifications.markAsRead')}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
