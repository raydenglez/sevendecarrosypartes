import { useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications, ActionPerformed, Channel } from '@capacitor/local-notifications';
import { useNavigate } from 'react-router-dom';

const NOTIFICATION_CHANNELS: Channel[] = [
  {
    id: 'messages',
    name: 'Messages',
    description: 'Chat message notifications',
    importance: 5, // Max importance
    visibility: 1, // Public
    vibration: true,
    sound: 'default',
  },
  {
    id: 'listings',
    name: 'Listings',
    description: 'Price drops and new listings',
    importance: 3, // Default importance
    visibility: 1,
    vibration: true,
  },
  {
    id: 'system',
    name: 'System',
    description: 'App updates and reminders',
    importance: 2, // Low importance
    visibility: 0, // Private
    vibration: false,
  },
];

interface NotificationData {
  conversationId?: string;
  listingId?: string;
  url?: string;
  [key: string]: unknown;
}

interface ShowNotificationOptions {
  id?: number;
  title: string;
  body: string;
  channelId?: 'messages' | 'listings' | 'system';
  data?: NotificationData;
  actionTypeId?: string;
  largeIcon?: string;
  smallIcon?: string;
}

export function useLocalNotifications() {
  const navigate = useNavigate();
  const platform = Capacitor.getPlatform();
  const isNative = platform === 'ios' || platform === 'android';

  useEffect(() => {
    if (!isNative) return;

    const setup = async () => {
      // Request permissions
      const permResult = await LocalNotifications.requestPermissions();
      if (permResult.display !== 'granted') {
        console.warn('Local notification permission not granted');
        return;
      }

      // Create notification channels (Android only)
      if (platform === 'android') {
        for (const channel of NOTIFICATION_CHANNELS) {
          await LocalNotifications.createChannel(channel);
        }
      }

      // Register action types
      await LocalNotifications.registerActionTypes({
        types: [
          {
            id: 'MESSAGE_ACTIONS',
            actions: [
              {
                id: 'open',
                title: 'Open',
                foreground: true,
              },
              {
                id: 'mark_read',
                title: 'Mark as Read',
                foreground: false,
              },
            ],
          },
          {
            id: 'LISTING_ACTIONS',
            actions: [
              {
                id: 'view',
                title: 'View',
                foreground: true,
              },
            ],
          },
        ],
      });
    };

    setup();

    // Handle notification action
    const actionListener = LocalNotifications.addListener(
      'localNotificationActionPerformed',
      (action: ActionPerformed) => {
        const data = action.notification.extra as NotificationData | undefined;
        const actionId = action.actionId;

        console.log('Local notification action:', actionId, data);

        if (actionId === 'tap' || actionId === 'open' || actionId === 'view') {
          // Navigate to appropriate screen
          if (data?.conversationId) {
            navigate(`/chat/${data.conversationId}`);
          } else if (data?.listingId) {
            navigate(`/listing/${data.listingId}`);
          } else if (data?.url) {
            navigate(data.url);
          }
        } else if (actionId === 'mark_read') {
          // Mark as read logic would go here
          // For now, just log it
          console.log('Mark as read:', data?.conversationId);
        }
      }
    );

    return () => {
      actionListener.then(listener => listener.remove());
    };
  }, [isNative, platform, navigate]);

  const showNotification = useCallback(
    async (options: ShowNotificationOptions) => {
      if (!isNative) return;

      const notificationId = options.id || Math.floor(Math.random() * 100000);

      await LocalNotifications.schedule({
        notifications: [
          {
            id: notificationId,
            title: options.title,
            body: options.body,
            channelId: options.channelId || 'messages',
            extra: options.data,
            actionTypeId: options.actionTypeId || 'MESSAGE_ACTIONS',
            largeIcon: options.largeIcon,
            smallIcon: options.smallIcon || 'ic_notification',
          },
        ],
      });

      return notificationId;
    },
    [isNative]
  );

  const cancelNotification = useCallback(
    async (id: number) => {
      if (!isNative) return;
      await LocalNotifications.cancel({ notifications: [{ id }] });
    },
    [isNative]
  );

  const cancelAllNotifications = useCallback(async () => {
    if (!isNative) return;
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications });
    }
  }, [isNative]);

  return {
    showNotification,
    cancelNotification,
    cancelAllNotifications,
    isNative,
  };
}
