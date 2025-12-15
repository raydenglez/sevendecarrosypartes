import { Bell, BellOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/hooks/useAuth';

export function NotificationToggle() {
  const { user } = useAuth();
  const { isSupported, isSubscribed, permission, subscribe, unsubscribe } = usePushNotifications();

  if (!user) {
    return null;
  }

  if (!isSupported) {
    return (
      <div className="flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <BellOff className="w-5 h-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Push Notifications</p>
            <p className="text-xs text-muted-foreground">Not supported in this browser</p>
          </div>
        </div>
      </div>
    );
  }

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      await subscribe();
    } else {
      await unsubscribe();
    }
  };

  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <Bell className="w-5 h-5 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">Push Notifications</p>
          <p className="text-xs text-muted-foreground">
            {permission === 'denied' 
              ? 'Blocked in browser settings' 
              : isSubscribed 
                ? 'Get notified of new messages' 
                : 'Enable to receive message alerts'}
          </p>
        </div>
      </div>
      <Switch
        checked={isSubscribed}
        onCheckedChange={handleToggle}
        disabled={permission === 'denied'}
      />
    </div>
  );
}
