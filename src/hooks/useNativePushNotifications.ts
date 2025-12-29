import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export function useNativePushNotifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'default'>('default');
  const listenersSetup = useRef(false);

  const platform = Capacitor.getPlatform();
  const isNative = platform === 'ios' || platform === 'android';

  useEffect(() => {
    setIsSupported(isNative);
    
    if (isNative && user && !listenersSetup.current) {
      checkRegistration();
      setupListeners();
      setupLocalNotifications();
      listenersSetup.current = true;
    }
  }, [user, isNative]);

  const checkRegistration = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('platform', platform)
        .single();

      setIsSubscribed(!!data);
      if (data) {
        setPermission('granted');
      }
    } catch (error) {
      console.error('Error checking push registration:', error);
    }
  };

  const setupLocalNotifications = async () => {
    // Request local notification permissions
    const permResult = await LocalNotifications.requestPermissions();
    if (permResult.display !== 'granted') {
      console.warn('Local notification permission not granted');
      return;
    }

    // Create notification channels for Android
    if (platform === 'android') {
      await LocalNotifications.createChannel({
        id: 'messages',
        name: 'Messages',
        description: 'Chat message notifications',
        importance: 5,
        visibility: 1,
        vibration: true,
        sound: 'default',
      });

      await LocalNotifications.createChannel({
        id: 'listings',
        name: 'Listings',
        description: 'Price drops and new listings',
        importance: 3,
        visibility: 1,
        vibration: true,
      });
    }

    // Register action types for interactive notifications
    await LocalNotifications.registerActionTypes({
      types: [
        {
          id: 'MESSAGE_ACTIONS',
          actions: [
            { id: 'open', title: 'Open', foreground: true },
            { id: 'mark_read', title: 'Mark as Read', foreground: false },
          ],
        },
      ],
    });

    // Handle local notification actions
    LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
      const data = action.notification.extra;
      const actionId = action.actionId;

      if (actionId === 'tap' || actionId === 'open') {
        if (data?.conversationId) {
          navigate(`/chat/${data.conversationId}`);
        } else if (data?.listingId) {
          navigate(`/listing/${data.listingId}`);
        } else if (data?.url) {
          navigate(data.url);
        }
      }
    });
  };

  const showLocalNotification = async (notification: PushNotificationSchema) => {
    const notificationId = Math.floor(Math.random() * 100000);
    
    await LocalNotifications.schedule({
      notifications: [
        {
          id: notificationId,
          title: notification.title || 'New notification',
          body: notification.body || '',
          channelId: 'messages',
          extra: notification.data,
          actionTypeId: 'MESSAGE_ACTIONS',
          smallIcon: 'ic_notification',
        },
      ],
    });
  };

  const setupListeners = () => {
    // Handle registration success
    PushNotifications.addListener('registration', async (token: Token) => {
      console.log('Push registration success, token:', token.value);
      await saveDeviceToken(token.value);
    });

    // Handle registration error
    PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error:', error);
      toast.error('Failed to register for notifications');
    });

    // Handle push notification received while app is in foreground
    PushNotifications.addListener('pushNotificationReceived', async (notification: PushNotificationSchema) => {
      console.log('Push notification received:', notification);
      // Show native local notification instead of toast
      await showLocalNotification(notification);
    });

    // Handle push notification action (user tapped on notification)
    PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      console.log('Push notification action performed:', action);
      const data = action.notification.data;
      
      if (data?.conversationId) {
        navigate(`/chat/${data.conversationId}`);
      } else if (data?.url) {
        navigate(data.url);
      }
    });
  };

  const saveDeviceToken = async (token: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          device_token: token,
          platform: platform,
          // For native, endpoint is derived from device token
          endpoint: `${platform}://${token}`,
          // These are not used for native but required by schema
          p256dh: '',
          auth: '',
        }, {
          onConflict: 'user_id,endpoint',
        });

      if (error) {
        console.error('Error saving device token:', error);
        toast.error('Failed to save notification settings');
        return;
      }

      setIsSubscribed(true);
      setPermission('granted');
      toast.success('Notifications enabled!');
    } catch (error) {
      console.error('Error saving device token:', error);
      toast.error('Failed to enable notifications');
    }
  };

  const subscribe = useCallback(async () => {
    if (!user || !isNative) return false;

    try {
      // Request permission
      let permResult = await PushNotifications.checkPermissions();
      
      if (permResult.receive === 'prompt') {
        permResult = await PushNotifications.requestPermissions();
      }

      if (permResult.receive !== 'granted') {
        setPermission('denied');
        toast.error('Notification permission denied');
        return false;
      }

      // Register with the push service (FCM/APNs)
      await PushNotifications.register();
      
      return true;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      toast.error('Failed to enable notifications');
      return false;
    }
  }, [user, isNative]);

  const unsubscribe = useCallback(async () => {
    if (!user || !isNative) return false;

    try {
      // Remove from database
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id)
        .eq('platform', platform);

      setIsSubscribed(false);
      toast.success('Notifications disabled');
      return true;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast.error('Failed to disable notifications');
      return false;
    }
  }, [user, isNative, platform]);

  return {
    isSupported,
    isSubscribed,
    permission,
    subscribe,
    unsubscribe,
    isNative,
  };
}
