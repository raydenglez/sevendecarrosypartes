import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useNativePushNotifications } from './useNativePushNotifications';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const platform = Capacitor.getPlatform();
  const isNative = platform === 'ios' || platform === 'android';
  
  // Use native push for iOS/Android
  const nativePush = useNativePushNotifications();
  
  // Web push state
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [vapidKey, setVapidKey] = useState<string | null>(null);

  useEffect(() => {
    // If native, we don't need web push setup
    if (isNative) return;
    
    // Check if push notifications are supported
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
      checkSubscription();
      fetchVapidKey();
    }
  }, [user, isNative]);

  const fetchVapidKey = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-vapid-key');
      if (error) {
        console.error('Error fetching VAPID key:', error);
        return;
      }
      setVapidKey(data.vapidPublicKey);
    } catch (error) {
      console.error('Error fetching VAPID key:', error);
    }
  };

  const checkSubscription = async () => {
    if (!user) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const registerServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service workers not supported');
    }

    // Register our push service worker
    const registration = await navigator.serviceWorker.register('/sw-push.js');
    await navigator.serviceWorker.ready;
    return registration;
  };

  const subscribeWeb = useCallback(async () => {
    if (!user || !isSupported || !vapidKey) {
      if (!vapidKey) {
        toast.error('Push notifications not configured');
      }
      return false;
    }

    try {
      // Request notification permission
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== 'granted') {
        toast.error('Notification permission denied');
        return false;
      }

      // Register service worker
      const registration = await registerServiceWorker();

      // Subscribe to push
      const applicationServerKey = urlBase64ToUint8Array(vapidKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
      });

      const subscriptionJson = subscription.toJSON();

      // Save subscription to database
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscriptionJson.endpoint!,
          p256dh: subscriptionJson.keys!.p256dh,
          auth: subscriptionJson.keys!.auth,
          platform: 'web',
        }, {
          onConflict: 'user_id,endpoint',
        });

      if (error) {
        console.error('Error saving subscription:', error);
        toast.error('Failed to enable notifications');
        return false;
      }

      setIsSubscribed(true);
      toast.success('Notifications enabled!');
      return true;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      toast.error('Failed to enable notifications');
      return false;
    }
  }, [user, isSupported, vapidKey]);

  const unsubscribeWeb = useCallback(async () => {
    if (!user) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Remove from database
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id)
          .eq('endpoint', subscription.endpoint);
      }

      setIsSubscribed(false);
      toast.success('Notifications disabled');
      return true;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast.error('Failed to disable notifications');
      return false;
    }
  }, [user]);

  // Return native push for iOS/Android, web push for browsers
  if (isNative) {
    return nativePush;
  }

  return {
    isSupported,
    isSubscribed,
    permission,
    subscribe: subscribeWeb,
    unsubscribe: unsubscribeWeb,
  };
}
