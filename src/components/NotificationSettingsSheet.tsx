import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Bell, MessageSquare, Tag, Search, MapPin, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';

interface NotificationPreferences {
  new_messages: boolean;
  price_drops: boolean;
  search_alerts: boolean;
  nearby_listings: boolean;
}

interface NotificationSettingsSheetProps {
  open: boolean;
  onClose: () => void;
}

export function NotificationSettingsSheet({ open, onClose }: NotificationSettingsSheetProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    new_messages: true,
    price_drops: true,
    search_alerts: false,
    nearby_listings: true,
  });

  // For now, we'll store preferences in localStorage since we don't have a dedicated table
  useEffect(() => {
    if (open && user) {
      const stored = localStorage.getItem(`notification-prefs-${user.id}`);
      if (stored) {
        setPreferences(JSON.parse(stored));
      }
      setLoading(false);
    }
  }, [open, user]);

  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    
    if (user) {
      localStorage.setItem(`notification-prefs-${user.id}`, JSON.stringify(newPrefs));
    }
  };

  const notificationOptions = [
    {
      key: 'new_messages' as const,
      icon: MessageSquare,
      iconColor: 'text-primary',
      iconBg: 'bg-primary/20',
      label: t('notificationSettings.newMessages'),
      description: t('notificationSettings.newMessagesDesc'),
    },
    {
      key: 'price_drops' as const,
      icon: Tag,
      iconColor: 'text-success',
      iconBg: 'bg-success/20',
      label: t('notificationSettings.priceDrops'),
      description: t('notificationSettings.priceDropsDesc'),
    },
    {
      key: 'search_alerts' as const,
      icon: Search,
      iconColor: 'text-secondary',
      iconBg: 'bg-secondary/20',
      label: t('notificationSettings.searchAlerts'),
      description: t('notificationSettings.searchAlertsDesc'),
    },
    {
      key: 'nearby_listings' as const,
      icon: MapPin,
      iconColor: 'text-warning',
      iconBg: 'bg-warning/20',
      label: t('notificationSettings.nearbyListings'),
      description: t('notificationSettings.nearbyListingsDesc'),
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl flex flex-col">
        <SheetHeader className="pb-4 flex-shrink-0">
          <SheetTitle className="text-xl flex items-center gap-2">
            <Bell className="w-5 h-5 text-warning" />
            {t('notificationSettings.title')}
          </SheetTitle>
          <p className="text-sm text-muted-foreground">{t('notificationSettings.description')}</p>
        </SheetHeader>

        <div className="space-y-3 overflow-y-auto flex-1 pb-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            notificationOptions.map((option) => {
              const Icon = option.icon;
              return (
                <div key={option.key} className="bg-muted/50 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${option.iconBg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${option.iconColor}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-foreground font-medium">{option.label}</p>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                    <Switch
                      checked={preferences[option.key]}
                      onCheckedChange={(checked) => updatePreference(option.key, checked)}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}