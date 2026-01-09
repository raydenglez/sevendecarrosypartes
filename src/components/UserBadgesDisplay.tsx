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
  BadgeCheck,
  Rocket,
  TrendingUp,
  Flame,
  Gem,
  Crown,
  MessageCircle,
  Megaphone,
  ShieldCheck,
  Settings,
  Handshake,
  Medal,
  Sparkles,
  Clock,
  Timer,
  Wifi,
  MessageSquare,
  Users,
  Network,
  HeartHandshake,
  MessagesSquare,
  Mail,
  Calendar,
  CalendarDays,
  CalendarCheck,
  CalendarHeart,
  Cake
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
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

interface UserBadgesDisplayProps {
  userId: string;
  compact?: boolean;
  className?: string;
}

// TikTok-inspired badge configurations with vibrant gradients
const BADGE_CONFIG: Record<string, {
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  shadowColor: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  animation?: string;
}> = {
  // Profile badges
  'profile_complete': {
    icon: UserCheck,
    gradient: 'from-emerald-400 via-teal-500 to-cyan-600',
    shadowColor: 'shadow-emerald-500/40',
    rarity: 'common',
  },
  'verified': {
    icon: BadgeCheck,
    gradient: 'from-blue-400 via-indigo-500 to-purple-600',
    shadowColor: 'shadow-blue-500/40',
    rarity: 'epic',
    animation: 'animate-pulse',
  },
  
  // Listing badges
  'first_listing': {
    icon: Rocket,
    gradient: 'from-orange-400 via-rose-500 to-pink-600',
    shadowColor: 'shadow-orange-500/40',
    rarity: 'common',
  },
  'five_listings': {
    icon: TrendingUp,
    gradient: 'from-lime-400 via-green-500 to-emerald-600',
    shadowColor: 'shadow-lime-500/40',
    rarity: 'rare',
  },
  'ten_listings': {
    icon: Zap,
    gradient: 'from-yellow-400 via-amber-500 to-orange-600',
    shadowColor: 'shadow-yellow-500/40',
    rarity: 'rare',
  },
  'twenty_five_listings': {
    icon: Flame,
    gradient: 'from-red-400 via-orange-500 to-yellow-500',
    shadowColor: 'shadow-red-500/40',
    rarity: 'epic',
  },
  'fifty_listings': {
    icon: Gem,
    gradient: 'from-violet-400 via-purple-500 to-fuchsia-600',
    shadowColor: 'shadow-violet-500/40',
    rarity: 'legendary',
    animation: 'animate-pulse',
  },
  
  // Vehicle sold badges
  'first_vehicle_sold': {
    icon: Car,
    gradient: 'from-sky-400 via-blue-500 to-indigo-600',
    shadowColor: 'shadow-sky-500/40',
    rarity: 'common',
  },
  'five_vehicles_sold': {
    icon: Trophy,
    gradient: 'from-amber-400 via-yellow-500 to-orange-500',
    shadowColor: 'shadow-amber-500/40',
    rarity: 'rare',
  },
  'ten_vehicles_sold': {
    icon: Crown,
    gradient: 'from-yellow-300 via-amber-400 to-yellow-600',
    shadowColor: 'shadow-yellow-500/50',
    rarity: 'legendary',
    animation: 'animate-pulse',
  },
  
  // Part sold badges
  'first_part_sold': {
    icon: Wrench,
    gradient: 'from-slate-400 via-zinc-500 to-gray-600',
    shadowColor: 'shadow-slate-500/40',
    rarity: 'common',
  },
  'ten_parts_sold': {
    icon: Settings,
    gradient: 'from-cyan-400 via-teal-500 to-emerald-600',
    shadowColor: 'shadow-cyan-500/40',
    rarity: 'rare',
  },
  
  // Total sales badges
  'ten_total_sold': {
    icon: Handshake,
    gradient: 'from-green-400 via-emerald-500 to-teal-600',
    shadowColor: 'shadow-green-500/40',
    rarity: 'rare',
  },
  'twenty_five_sold': {
    icon: Medal,
    gradient: 'from-amber-300 via-orange-400 to-red-500',
    shadowColor: 'shadow-amber-500/40',
    rarity: 'epic',
  },
  'fifty_sold': {
    icon: Sparkles,
    gradient: 'from-fuchsia-400 via-pink-500 to-rose-600',
    shadowColor: 'shadow-fuchsia-500/40',
    rarity: 'legendary',
    animation: 'animate-pulse',
  },
  'hundred_sold': {
    icon: Award,
    gradient: 'from-yellow-300 via-amber-400 via-orange-500 to-red-600',
    shadowColor: 'shadow-yellow-500/50',
    rarity: 'legendary',
    animation: 'animate-pulse',
  },
  
  // Review badges
  'first_review': {
    icon: MessageCircle,
    gradient: 'from-blue-400 via-cyan-500 to-teal-600',
    shadowColor: 'shadow-blue-500/40',
    rarity: 'common',
  },
  'five_reviews': {
    icon: Star,
    gradient: 'from-yellow-400 via-orange-500 to-red-500',
    shadowColor: 'shadow-yellow-500/40',
    rarity: 'rare',
  },
  'ten_reviews': {
    icon: Megaphone,
    gradient: 'from-indigo-400 via-purple-500 to-pink-600',
    shadowColor: 'shadow-indigo-500/40',
    rarity: 'rare',
  },
  'twenty_five_reviews': {
    icon: ShieldCheck,
    gradient: 'from-emerald-400 via-green-500 to-teal-600',
    shadowColor: 'shadow-emerald-500/40',
    rarity: 'epic',
  },
  'fifty_reviews': {
    icon: Crown,
    gradient: 'from-purple-400 via-violet-500 to-indigo-600',
    shadowColor: 'shadow-purple-500/40',
    rarity: 'legendary',
    animation: 'animate-pulse',
  },
  
  // Response time badges
  'lightning_responder': {
    icon: Zap,
    gradient: 'from-yellow-300 via-amber-400 to-orange-500',
    shadowColor: 'shadow-yellow-500/50',
    rarity: 'rare',
    animation: 'animate-pulse',
  },
  'quick_responder': {
    icon: Clock,
    gradient: 'from-cyan-400 via-blue-500 to-indigo-600',
    shadowColor: 'shadow-cyan-500/40',
    rarity: 'rare',
  },
  'speed_demon': {
    icon: Timer,
    gradient: 'from-orange-400 via-red-500 to-pink-600',
    shadowColor: 'shadow-orange-500/40',
    rarity: 'epic',
  },
  'always_online': {
    icon: Wifi,
    gradient: 'from-green-400 via-emerald-500 to-teal-600',
    shadowColor: 'shadow-green-500/40',
    rarity: 'legendary',
    animation: 'animate-pulse',
  },
  
  // Conversation badges
  'first_conversation': {
    icon: MessageSquare,
    gradient: 'from-sky-400 via-blue-500 to-indigo-600',
    shadowColor: 'shadow-sky-500/40',
    rarity: 'common',
  },
  'social_butterfly': {
    icon: Users,
    gradient: 'from-pink-400 via-rose-500 to-red-600',
    shadowColor: 'shadow-pink-500/40',
    rarity: 'rare',
  },
  'networking_pro': {
    icon: Network,
    gradient: 'from-violet-400 via-purple-500 to-fuchsia-600',
    shadowColor: 'shadow-violet-500/40',
    rarity: 'epic',
  },
  'community_pillar': {
    icon: HeartHandshake,
    gradient: 'from-rose-400 via-pink-500 to-fuchsia-600',
    shadowColor: 'shadow-rose-500/40',
    rarity: 'legendary',
    animation: 'animate-pulse',
  },
  
  // Message count badges
  'chatty': {
    icon: MessageCircle,
    gradient: 'from-teal-400 via-cyan-500 to-blue-600',
    shadowColor: 'shadow-teal-500/40',
    rarity: 'common',
  },
  'super_communicator': {
    icon: MessagesSquare,
    gradient: 'from-blue-400 via-indigo-500 to-violet-600',
    shadowColor: 'shadow-blue-500/40',
    rarity: 'rare',
  },
  'chat_legend': {
    icon: Mail,
    gradient: 'from-fuchsia-400 via-purple-500 to-violet-600',
    shadowColor: 'shadow-fuchsia-500/40',
    rarity: 'epic',
  },
  
  // Loyalty / tenure badges
  'one_week': {
    icon: Calendar,
    gradient: 'from-slate-400 via-gray-500 to-zinc-600',
    shadowColor: 'shadow-slate-500/40',
    rarity: 'common',
  },
  'one_month': {
    icon: CalendarDays,
    gradient: 'from-blue-400 via-indigo-500 to-purple-600',
    shadowColor: 'shadow-blue-500/40',
    rarity: 'common',
  },
  'three_months': {
    icon: CalendarCheck,
    gradient: 'from-emerald-400 via-green-500 to-teal-600',
    shadowColor: 'shadow-emerald-500/40',
    rarity: 'rare',
  },
  'six_months': {
    icon: CalendarHeart,
    gradient: 'from-pink-400 via-rose-500 to-red-600',
    shadowColor: 'shadow-pink-500/40',
    rarity: 'epic',
  },
  'one_year': {
    icon: Cake,
    gradient: 'from-yellow-300 via-amber-400 via-orange-500 to-red-600',
    shadowColor: 'shadow-yellow-500/50',
    rarity: 'legendary',
    animation: 'animate-pulse',
  },
};

const RARITY_STYLES = {
  common: {
    border: 'border-white/20',
    glow: '',
    label: 'Common',
    labelColor: 'text-gray-400',
  },
  rare: {
    border: 'border-blue-400/40',
    glow: 'ring-2 ring-blue-400/20',
    label: 'Rare',
    labelColor: 'text-blue-400',
  },
  epic: {
    border: 'border-purple-400/40',
    glow: 'ring-2 ring-purple-400/30',
    label: 'Epic',
    labelColor: 'text-purple-400',
  },
  legendary: {
    border: 'border-yellow-400/50',
    glow: 'ring-2 ring-yellow-400/40 shadow-lg',
    label: 'Legendary',
    labelColor: 'text-yellow-400',
  },
};

function BadgeItem({ badge, onClick }: { badge: Badge; onClick?: () => void }) {
  const config = BADGE_CONFIG[badge.badge_type] || {
    icon: Award,
    gradient: 'from-gray-400 to-gray-600',
    shadowColor: 'shadow-gray-500/40',
    rarity: 'common' as const,
    animation: undefined,
  };
  
  const Icon = config.icon;
  const rarityStyle = RARITY_STYLES[config.rarity];

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative group cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95",
        config.animation
      )}
    >
      {/* Outer glow for legendary/epic */}
      {(config.rarity === 'legendary' || config.rarity === 'epic') && (
        <div className={cn(
          "absolute inset-0 rounded-full bg-gradient-to-br blur-md opacity-60 group-hover:opacity-80 transition-opacity",
          config.gradient
        )} />
      )}
      
      {/* Main badge */}
      <div className={cn(
        "relative w-12 h-12 rounded-full bg-gradient-to-br flex items-center justify-center border-2 shadow-lg",
        config.gradient,
        config.shadowColor,
        rarityStyle.border,
        rarityStyle.glow
      )}>
        <Icon className="w-6 h-6 text-white drop-shadow-md" />
        
        {/* Shine effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/30 via-transparent to-transparent" />
      </div>
    </button>
  );
}

function BadgeCard({ badge }: { badge: Badge }) {
  const config = BADGE_CONFIG[badge.badge_type] || {
    icon: Award,
    gradient: 'from-gray-400 to-gray-600',
    shadowColor: 'shadow-gray-500/40',
    rarity: 'common' as const,
  };
  
  const Icon = config.icon;
  const rarityStyle = RARITY_STYLES[config.rarity];
  const earnedDate = new Date(badge.earned_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className={cn(
      "relative bg-card/80 backdrop-blur-sm rounded-2xl p-4 border overflow-hidden transition-all duration-300 hover:scale-[1.02]",
      rarityStyle.border,
      config.rarity === 'legendary' && 'bg-gradient-to-br from-yellow-500/5 to-orange-500/5',
      config.rarity === 'epic' && 'bg-gradient-to-br from-purple-500/5 to-pink-500/5'
    )}>
      {/* Background glow for rare+ */}
      {config.rarity !== 'common' && (
        <div className={cn(
          "absolute -top-10 -right-10 w-20 h-20 rounded-full bg-gradient-to-br blur-2xl opacity-30",
          config.gradient
        )} />
      )}
      
      <div className="relative flex items-center gap-4">
        {/* Badge icon with glow */}
        <div className="relative">
          {(config.rarity === 'legendary' || config.rarity === 'epic') && (
            <div className={cn(
              "absolute inset-0 rounded-full bg-gradient-to-br blur-md opacity-50",
              config.gradient
            )} />
          )}
          <div className={cn(
            "relative w-14 h-14 rounded-full bg-gradient-to-br flex items-center justify-center border-2 shadow-lg",
            config.gradient,
            config.shadowColor,
            rarityStyle.border
          )}>
            <Icon className="w-7 h-7 text-white drop-shadow-md" />
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
      </div>
    </div>
  );
}

export function UserBadgesDisplay({ userId, compact = false, className }: UserBadgesDisplayProps) {
  const { t } = useTranslation();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

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
      <>
        <div className={cn('flex flex-wrap gap-2', className)}>
          {badges.slice(0, 5).map((badge) => (
            <BadgeItem 
              key={badge.id} 
              badge={badge}
              onClick={() => {
                setSelectedBadge(badge);
                setSheetOpen(true);
              }}
            />
          ))}
          {badges.length > 5 && (
            <button
              onClick={() => setSheetOpen(true)}
              className="w-12 h-12 rounded-full bg-gradient-to-br from-muted to-muted/80 flex items-center justify-center text-sm font-bold text-muted-foreground border-2 border-border hover:scale-110 transition-transform"
            >
              +{badges.length - 5}
            </button>
          )}
        </div>

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
            <SheetHeader className="text-left pb-4">
              <SheetTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-warning" />
                {t('profile.awards')} ({badges.length})
              </SheetTitle>
              <SheetDescription>
                Achievements earned through activity on CarNetworx
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-3 overflow-y-auto max-h-[calc(70vh-120px)] pb-8">
              {badges.map((badge) => (
                <BadgeCard key={badge.id} badge={badge} />
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Award className="w-4 h-4 text-warning" />
          {t('profile.awards')}
        </h4>
        {badges.length > 4 && (
          <button
            onClick={() => setSheetOpen(true)}
            className="text-xs text-primary font-medium"
          >
            View all ({badges.length})
          </button>
        )}
      </div>
      
      {/* Badge grid with TikTok-style display */}
      <div className="flex flex-wrap gap-3">
        {badges.slice(0, 6).map((badge) => (
          <BadgeItem 
            key={badge.id} 
            badge={badge}
            onClick={() => {
              setSelectedBadge(badge);
              setSheetOpen(true);
            }}
          />
        ))}
        {badges.length > 6 && (
          <button
            onClick={() => setSheetOpen(true)}
            className="w-12 h-12 rounded-full bg-gradient-to-br from-muted to-muted/80 flex items-center justify-center text-sm font-bold text-muted-foreground border-2 border-border hover:scale-110 transition-transform"
          >
            +{badges.length - 6}
          </button>
        )}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
          <SheetHeader className="text-left pb-4">
            <SheetTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-warning" />
              {t('profile.awards')} ({badges.length})
            </SheetTitle>
            <SheetDescription>
              Achievements earned through activity on CarNetworx
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-3 overflow-y-auto max-h-[calc(70vh-120px)] pb-8">
            {badges.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} />
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
