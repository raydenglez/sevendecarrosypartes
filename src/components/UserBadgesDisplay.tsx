import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  UserCheck, 
  Package, 
  Zap, 
  Car, 
  Trophy, 
  Wrench,
  Award,
  Star,
  Shield,
  BadgeCheck
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Badge {
  id: string;
  badge_type: string;
  badge_name: string;
  badge_description: string | null;
  badge_icon: string | null;
  earned_at: string;
}

interface UserBadgesDisplayProps {
  userId: string;
  compact?: boolean;
  className?: string;
}

const BADGE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'user-check': UserCheck,
  'package': Package,
  'zap': Zap,
  'car': Car,
  'trophy': Trophy,
  'wrench': Wrench,
  'award': Award,
  'star': Star,
  'shield': Shield,
  'badge-check': BadgeCheck,
};

const BADGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'profile_complete': { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20' },
  'first_listing': { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20' },
  'ten_listings': { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/20' },
  'first_vehicle_sold': { bg: 'bg-secondary/10', text: 'text-secondary', border: 'border-secondary/20' },
  'five_vehicles_sold': { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20' },
  'first_part_sold': { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/20' },
  'verified': { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20' },
};

export function UserBadgesDisplay({ userId, compact = false, className }: UserBadgesDisplayProps) {
  const { t } = useTranslation();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBadges() {
      try {
        const { data, error } = await supabase
          .from('user_badges')
          .select('*')
          .eq('user_id', userId)
          .order('earned_at', { ascending: false });

        if (error) throw error;
        setBadges(data || []);
      } catch (error) {
        console.error('Error fetching badges:', error);
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchBadges();
    }
  }, [userId]);

  if (loading || badges.length === 0) return null;

  if (compact) {
    return (
      <div className={cn('flex flex-wrap gap-1.5', className)}>
        {badges.slice(0, 4).map((badge) => {
          const IconComponent = BADGE_ICONS[badge.badge_icon || 'award'] || Award;
          const colors = BADGE_COLORS[badge.badge_type] || { bg: 'bg-muted', text: 'text-foreground', border: 'border-border' };
          
          return (
            <div
              key={badge.id}
              className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center border',
                colors.bg,
                colors.border
              )}
              title={badge.badge_name}
            >
              <IconComponent className={cn('w-3.5 h-3.5', colors.text)} />
            </div>
          );
        })}
        {badges.length > 4 && (
          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
            +{badges.length - 4}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Award className="w-4 h-4 text-warning" />
        {t('profile.awards')}
      </h4>
      <div className="grid grid-cols-2 gap-2">
        {badges.map((badge) => {
          const IconComponent = BADGE_ICONS[badge.badge_icon || 'award'] || Award;
          const colors = BADGE_COLORS[badge.badge_type] || { bg: 'bg-muted', text: 'text-foreground', border: 'border-border' };
          
          return (
            <div
              key={badge.id}
              className={cn(
                'flex items-center gap-2 p-2 rounded-lg border',
                colors.bg,
                colors.border
              )}
            >
              <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', colors.bg)}>
                <IconComponent className={cn('w-4 h-4', colors.text)} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground truncate">{badge.badge_name}</p>
                {badge.badge_description && (
                  <p className="text-[10px] text-muted-foreground truncate">{badge.badge_description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
