import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Pin, PinOff, Award, Sparkles,
  UserCheck, Package, Zap, Car, Trophy, Wrench, Star, Shield, BadgeCheck,
  Rocket, TrendingUp, Flame, Gem, Crown, MessageCircle, Megaphone, ShieldCheck,
  Settings, Handshake, Medal, Clock, Timer, Wifi, MessageSquare, Users, Network,
  HeartHandshake, MessagesSquare, Mail, Calendar, CalendarDays, CalendarCheck,
  CalendarHeart, Cake
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface Badge {
  id: string;
  badge_type: string;
  badge_name: string;
  badge_description: string | null;
  badge_icon: string | null;
  earned_at: string;
}

interface BadgeShowcaseProps {
  userId: string;
  isOwnProfile?: boolean;
  className?: string;
}

const BADGE_CONFIG: Record<string, {
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  shadowColor: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  animation?: string;
}> = {
  'profile_complete': { icon: UserCheck, gradient: 'from-emerald-400 via-teal-500 to-cyan-600', shadowColor: 'shadow-emerald-500/40', rarity: 'common' },
  'verified': { icon: BadgeCheck, gradient: 'from-blue-400 via-indigo-500 to-purple-600', shadowColor: 'shadow-blue-500/40', rarity: 'epic', animation: 'animate-pulse' },
  'first_listing': { icon: Rocket, gradient: 'from-orange-400 via-rose-500 to-pink-600', shadowColor: 'shadow-orange-500/40', rarity: 'common' },
  'five_listings': { icon: TrendingUp, gradient: 'from-lime-400 via-green-500 to-emerald-600', shadowColor: 'shadow-lime-500/40', rarity: 'rare' },
  'ten_listings': { icon: Zap, gradient: 'from-yellow-400 via-amber-500 to-orange-600', shadowColor: 'shadow-yellow-500/40', rarity: 'rare' },
  'twenty_five_listings': { icon: Flame, gradient: 'from-red-400 via-orange-500 to-yellow-500', shadowColor: 'shadow-red-500/40', rarity: 'epic' },
  'fifty_listings': { icon: Gem, gradient: 'from-violet-400 via-purple-500 to-fuchsia-600', shadowColor: 'shadow-violet-500/40', rarity: 'legendary', animation: 'animate-pulse' },
  'first_vehicle_sold': { icon: Car, gradient: 'from-sky-400 via-blue-500 to-indigo-600', shadowColor: 'shadow-sky-500/40', rarity: 'common' },
  'five_vehicles_sold': { icon: Trophy, gradient: 'from-amber-400 via-yellow-500 to-orange-500', shadowColor: 'shadow-amber-500/40', rarity: 'rare' },
  'ten_vehicles_sold': { icon: Crown, gradient: 'from-yellow-300 via-amber-400 to-yellow-600', shadowColor: 'shadow-yellow-500/50', rarity: 'legendary', animation: 'animate-pulse' },
  'first_part_sold': { icon: Wrench, gradient: 'from-slate-400 via-zinc-500 to-gray-600', shadowColor: 'shadow-slate-500/40', rarity: 'common' },
  'ten_parts_sold': { icon: Settings, gradient: 'from-cyan-400 via-teal-500 to-emerald-600', shadowColor: 'shadow-cyan-500/40', rarity: 'rare' },
  'ten_total_sold': { icon: Handshake, gradient: 'from-green-400 via-emerald-500 to-teal-600', shadowColor: 'shadow-green-500/40', rarity: 'rare' },
  'twenty_five_sold': { icon: Medal, gradient: 'from-amber-300 via-orange-400 to-red-500', shadowColor: 'shadow-amber-500/40', rarity: 'epic' },
  'fifty_sold': { icon: Sparkles, gradient: 'from-fuchsia-400 via-pink-500 to-rose-600', shadowColor: 'shadow-fuchsia-500/40', rarity: 'legendary', animation: 'animate-pulse' },
  'hundred_sold': { icon: Award, gradient: 'from-yellow-300 via-amber-400 via-orange-500 to-red-600', shadowColor: 'shadow-yellow-500/50', rarity: 'legendary', animation: 'animate-pulse' },
  'first_review': { icon: MessageCircle, gradient: 'from-blue-400 via-cyan-500 to-teal-600', shadowColor: 'shadow-blue-500/40', rarity: 'common' },
  'five_reviews': { icon: Star, gradient: 'from-yellow-400 via-orange-500 to-red-500', shadowColor: 'shadow-yellow-500/40', rarity: 'rare' },
  'ten_reviews': { icon: Megaphone, gradient: 'from-indigo-400 via-purple-500 to-pink-600', shadowColor: 'shadow-indigo-500/40', rarity: 'rare' },
  'twenty_five_reviews': { icon: ShieldCheck, gradient: 'from-emerald-400 via-green-500 to-teal-600', shadowColor: 'shadow-emerald-500/40', rarity: 'epic' },
  'fifty_reviews': { icon: Crown, gradient: 'from-purple-400 via-violet-500 to-indigo-600', shadowColor: 'shadow-purple-500/40', rarity: 'legendary', animation: 'animate-pulse' },
  'lightning_responder': { icon: Zap, gradient: 'from-yellow-300 via-amber-400 to-orange-500', shadowColor: 'shadow-yellow-500/50', rarity: 'rare', animation: 'animate-pulse' },
  'quick_responder': { icon: Clock, gradient: 'from-cyan-400 via-blue-500 to-indigo-600', shadowColor: 'shadow-cyan-500/40', rarity: 'rare' },
  'speed_demon': { icon: Timer, gradient: 'from-orange-400 via-red-500 to-pink-600', shadowColor: 'shadow-orange-500/40', rarity: 'epic' },
  'always_online': { icon: Wifi, gradient: 'from-green-400 via-emerald-500 to-teal-600', shadowColor: 'shadow-green-500/40', rarity: 'legendary', animation: 'animate-pulse' },
  'first_conversation': { icon: MessageSquare, gradient: 'from-sky-400 via-blue-500 to-indigo-600', shadowColor: 'shadow-sky-500/40', rarity: 'common' },
  'social_butterfly': { icon: Users, gradient: 'from-pink-400 via-rose-500 to-red-600', shadowColor: 'shadow-pink-500/40', rarity: 'rare' },
  'networking_pro': { icon: Network, gradient: 'from-violet-400 via-purple-500 to-fuchsia-600', shadowColor: 'shadow-violet-500/40', rarity: 'epic' },
  'community_pillar': { icon: HeartHandshake, gradient: 'from-rose-400 via-pink-500 to-fuchsia-600', shadowColor: 'shadow-rose-500/40', rarity: 'legendary', animation: 'animate-pulse' },
  'chatty': { icon: MessageCircle, gradient: 'from-teal-400 via-cyan-500 to-blue-600', shadowColor: 'shadow-teal-500/40', rarity: 'common' },
  'super_communicator': { icon: MessagesSquare, gradient: 'from-blue-400 via-indigo-500 to-violet-600', shadowColor: 'shadow-blue-500/40', rarity: 'rare' },
  'chat_legend': { icon: Mail, gradient: 'from-fuchsia-400 via-purple-500 to-violet-600', shadowColor: 'shadow-fuchsia-500/40', rarity: 'epic' },
  'one_week': { icon: Calendar, gradient: 'from-slate-400 via-gray-500 to-zinc-600', shadowColor: 'shadow-slate-500/40', rarity: 'common' },
  'one_month': { icon: CalendarDays, gradient: 'from-blue-400 via-indigo-500 to-purple-600', shadowColor: 'shadow-blue-500/40', rarity: 'common' },
  'three_months': { icon: CalendarCheck, gradient: 'from-emerald-400 via-green-500 to-teal-600', shadowColor: 'shadow-emerald-500/40', rarity: 'rare' },
  'six_months': { icon: CalendarHeart, gradient: 'from-pink-400 via-rose-500 to-red-600', shadowColor: 'shadow-pink-500/40', rarity: 'epic' },
  'one_year': { icon: Cake, gradient: 'from-yellow-300 via-amber-400 via-orange-500 to-red-600', shadowColor: 'shadow-yellow-500/50', rarity: 'legendary', animation: 'animate-pulse' },
};

const RARITY_STYLES = {
  common: { border: 'border-white/20', glow: '', label: 'Common', labelColor: 'text-gray-400' },
  rare: { border: 'border-blue-400/40', glow: 'ring-2 ring-blue-400/20', label: 'Rare', labelColor: 'text-blue-400' },
  epic: { border: 'border-purple-400/40', glow: 'ring-2 ring-purple-400/30', label: 'Epic', labelColor: 'text-purple-400' },
  legendary: { border: 'border-yellow-400/50', glow: 'ring-2 ring-yellow-400/40 shadow-lg', label: 'Legendary', labelColor: 'text-yellow-400' },
};

export function BadgeShowcase({ userId, isOwnProfile = false, className }: BadgeShowcaseProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [pinnedBadgeIds, setPinnedBadgeIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [manageOpen, setManageOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch all badges
        const { data: badgesData, error: badgesError } = await supabase
          .from('user_badges')
          .select('*')
          .eq('user_id', userId)
          .order('earned_at', { ascending: false });

        if (badgesError) throw badgesError;
        setBadges(badgesData || []);

        // Fetch pinned badges from profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('pinned_badges')
          .eq('id', userId)
          .single();

        if (profileError && profileError.code !== 'PGRST116') throw profileError;
        setPinnedBadgeIds((profile?.pinned_badges as string[]) || []);
      } catch (error) {
        console.error('Error fetching badge data:', error);
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchData();
    }
  }, [userId]);

  const pinnedBadges = badges.filter(b => pinnedBadgeIds.includes(b.id));

  const togglePin = async (badgeId: string) => {
    if (!user || user.id !== userId) return;

    const isPinned = pinnedBadgeIds.includes(badgeId);
    let newPinned: string[];

    if (isPinned) {
      newPinned = pinnedBadgeIds.filter(id => id !== badgeId);
    } else {
      if (pinnedBadgeIds.length >= 5) {
        toast({
          title: 'Maximum 5 badges',
          description: 'Unpin a badge first to add a new one.',
          variant: 'destructive',
        });
        return;
      }
      newPinned = [...pinnedBadgeIds, badgeId];
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ pinned_badges: newPinned })
        .eq('id', user.id);

      if (error) throw error;
      setPinnedBadgeIds(newPinned);
      toast({
        title: isPinned ? 'Badge unpinned' : 'Badge pinned!',
        description: isPinned ? 'Removed from your showcase' : 'Added to your showcase',
      });
    } catch (error) {
      console.error('Error updating pinned badges:', error);
      toast({
        title: 'Error',
        description: 'Failed to update pinned badges',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || badges.length === 0) return null;

  // If no pinned badges and not own profile, don't show section
  if (pinnedBadges.length === 0 && !isOwnProfile) return null;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-warning" />
          {t('profile.badgeShowcase', 'Badge Showcase')}
        </h4>
        {isOwnProfile && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7"
            onClick={() => setManageOpen(true)}
          >
            <Pin className="w-3 h-3 mr-1" />
            {t('common.manage', 'Manage')}
          </Button>
        )}
      </div>

      {/* Showcase Display */}
      {pinnedBadges.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
          {pinnedBadges.map((badge) => {
            const config = BADGE_CONFIG[badge.badge_type] || {
              icon: Award,
              gradient: 'from-gray-400 to-gray-600',
              shadowColor: 'shadow-gray-500/40',
              rarity: 'common' as const,
            };
            const Icon = config.icon;
            const rarityStyle = RARITY_STYLES[config.rarity];

            return (
              <div
                key={badge.id}
                className={cn(
                  "relative flex-shrink-0 flex flex-col items-center gap-1.5 p-3 rounded-xl bg-card/50 border transition-all hover:scale-105",
                  rarityStyle.border,
                  config.rarity === 'legendary' && 'bg-gradient-to-b from-yellow-500/5 to-transparent',
                  config.rarity === 'epic' && 'bg-gradient-to-b from-purple-500/5 to-transparent'
                )}
              >
                {/* Badge icon with glow */}
                <div className="relative">
                  {(config.rarity === 'legendary' || config.rarity === 'epic') && (
                    <div className={cn(
                      "absolute inset-0 rounded-full bg-gradient-to-br blur-md opacity-50",
                      config.gradient
                    )} />
                  )}
                  <div className={cn(
                    "relative w-12 h-12 rounded-full bg-gradient-to-br flex items-center justify-center border-2 shadow-lg",
                    config.gradient,
                    config.shadowColor,
                    rarityStyle.border,
                    'animation' in config && config.animation
                  )}>
                    <Icon className="w-6 h-6 text-white drop-shadow-md" />
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/30 via-transparent to-transparent" />
                  </div>
                </div>
                <span className="text-[10px] font-medium text-muted-foreground text-center max-w-[70px] truncate">
                  {badge.badge_name}
                </span>
              </div>
            );
          })}
        </div>
      ) : isOwnProfile ? (
        <button
          onClick={() => setManageOpen(true)}
          className="w-full py-6 rounded-xl border-2 border-dashed border-muted-foreground/20 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors"
        >
          <Pin className="w-5 h-5" />
          <span className="text-xs font-medium">Pin your favorite badges</span>
        </button>
      ) : null}

      {/* Manage Sheet */}
      <Sheet open={manageOpen} onOpenChange={setManageOpen}>
        <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
          <SheetHeader className="text-left pb-4">
            <SheetTitle className="flex items-center gap-2">
              <Pin className="w-5 h-5 text-primary" />
              {t('profile.manageBadges', 'Manage Badge Showcase')}
            </SheetTitle>
            <SheetDescription>
              Pin up to 5 badges to showcase on your profile ({pinnedBadgeIds.length}/5 selected)
            </SheetDescription>
          </SheetHeader>
          
          <div className="space-y-3 overflow-y-auto max-h-[calc(80vh-140px)] pb-8">
            {badges.map((badge) => {
              const config = BADGE_CONFIG[badge.badge_type] || {
                icon: Award,
                gradient: 'from-gray-400 to-gray-600',
                shadowColor: 'shadow-gray-500/40',
                rarity: 'common' as const,
              };
              const Icon = config.icon;
              const rarityStyle = RARITY_STYLES[config.rarity];
              const isPinned = pinnedBadgeIds.includes(badge.id);
              const earnedDate = new Date(badge.earned_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });

              return (
                <div
                  key={badge.id}
                  className={cn(
                    "relative bg-card/80 backdrop-blur-sm rounded-2xl p-4 border overflow-hidden transition-all",
                    rarityStyle.border,
                    isPinned && 'ring-2 ring-primary/50 bg-primary/5'
                  )}
                >
                  {/* Background glow */}
                  {config.rarity !== 'common' && (
                    <div className={cn(
                      "absolute -top-10 -right-10 w-20 h-20 rounded-full bg-gradient-to-br blur-2xl opacity-30",
                      config.gradient
                    )} />
                  )}
                  
                  <div className="relative flex items-center gap-4">
                    {/* Badge icon */}
                    <div className="relative">
                      {(config.rarity === 'legendary' || config.rarity === 'epic') && (
                        <div className={cn(
                          "absolute inset-0 rounded-full bg-gradient-to-br blur-md opacity-50",
                          config.gradient
                        )} />
                      )}
                      <div className={cn(
                        "relative w-12 h-12 rounded-full bg-gradient-to-br flex items-center justify-center border-2 shadow-lg",
                        config.gradient,
                        config.shadowColor,
                        rarityStyle.border
                      )}>
                        <Icon className="w-6 h-6 text-white drop-shadow-md" />
                        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/30 via-transparent to-transparent" />
                      </div>
                    </div>
                    
                    {/* Badge info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-foreground truncate">{badge.badge_name}</h4>
                        <span className={cn("text-[10px] font-bold uppercase", rarityStyle.labelColor)}>
                          {rarityStyle.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {badge.badge_description}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        Earned {earnedDate}
                      </p>
                    </div>

                    {/* Pin button */}
                    <Button
                      variant={isPinned ? "default" : "outline"}
                      size="icon"
                      className={cn(
                        "shrink-0 h-9 w-9 rounded-full",
                        isPinned && "bg-primary"
                      )}
                      onClick={() => togglePin(badge.id)}
                      disabled={saving}
                    >
                      {isPinned ? (
                        <PinOff className="w-4 h-4" />
                      ) : (
                        <Pin className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
