import { useTranslation } from 'react-i18next';
import { Progress } from '@/components/ui/progress';
import { 
  Camera, 
  User, 
  FileText, 
  MapPin, 
  Instagram, 
  Phone as PhoneIcon,
  Globe,
  CheckCircle2,
  Circle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileCompletionCardProps {
  profileData: {
    avatarUrl?: string;
    name?: string;
    username?: string | null;
    bio?: string | null;
    location?: { city: string; state: string };
    phone?: string;
  };
  socialData: {
    instagram_url: string | null;
    whatsapp_number: string | null;
    website_url: string | null;
  };
  onEditProfile: () => void;
  onEditSocialLinks: () => void;
  onEditPersonalInfo: () => void;
}

interface CompletionItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  completed: boolean;
  action: () => void;
}

export function ProfileCompletionCard({
  profileData,
  socialData,
  onEditProfile,
  onEditSocialLinks,
  onEditPersonalInfo,
}: ProfileCompletionCardProps) {
  const { t } = useTranslation();

  const items: CompletionItem[] = [
    {
      key: 'photo',
      label: t('profile.completion.photo'),
      icon: <Camera className="w-4 h-4" />,
      completed: !!profileData.avatarUrl,
      action: onEditProfile,
    },
    {
      key: 'username',
      label: t('profile.completion.username'),
      icon: <User className="w-4 h-4" />,
      completed: !!profileData.username,
      action: onEditProfile,
    },
    {
      key: 'bio',
      label: t('profile.completion.bio'),
      icon: <FileText className="w-4 h-4" />,
      completed: !!profileData.bio,
      action: onEditProfile,
    },
    {
      key: 'location',
      label: t('profile.completion.location'),
      icon: <MapPin className="w-4 h-4" />,
      completed: !!(profileData.location?.city && profileData.location.city !== 'Unknown'),
      action: onEditPersonalInfo,
    },
    {
      key: 'phone',
      label: t('profile.completion.phone'),
      icon: <PhoneIcon className="w-4 h-4" />,
      completed: !!profileData.phone,
      action: onEditPersonalInfo,
    },
    {
      key: 'social',
      label: t('profile.completion.social'),
      icon: <Instagram className="w-4 h-4" />,
      completed: !!(socialData.instagram_url || socialData.whatsapp_number || socialData.website_url),
      action: onEditSocialLinks,
    },
  ];

  const completedCount = items.filter(item => item.completed).length;
  const percentage = Math.round((completedCount / items.length) * 100);
  const incompleteItems = items.filter(item => !item.completed);

  // Don't show if 100% complete
  if (percentage === 100) {
    return null;
  }

  return (
    <div className="bg-card rounded-2xl p-4 border border-border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-foreground text-sm">
          {t('profile.completion.title')}
        </h3>
        <span className={cn(
          "text-sm font-bold",
          percentage >= 80 ? "text-success" : percentage >= 50 ? "text-warning" : "text-primary"
        )}>
          {percentage}%
        </span>
      </div>
      
      <Progress value={percentage} className="h-2 mb-4" />
      
      {/* Show incomplete items */}
      {incompleteItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground mb-2">
            {t('profile.completion.missing')}
          </p>
          <div className="flex flex-wrap gap-2">
            {incompleteItems.map((item) => (
              <button
                key={item.key}
                onClick={item.action}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 hover:bg-muted rounded-full text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Progress indicators */}
      <div className="flex items-center gap-1 mt-4">
        {items.map((item) => (
          <div
            key={item.key}
            className={cn(
              "flex-1 h-1 rounded-full transition-colors",
              item.completed ? "bg-success" : "bg-muted"
            )}
          />
        ))}
      </div>
    </div>
  );
}