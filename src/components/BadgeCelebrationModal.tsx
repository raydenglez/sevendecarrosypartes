import { useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Star, Award, Trophy, Crown, Shield, Zap, Heart, Flame, Target, 
  Medal, Clock, Timer, Wifi, MessageSquare, Users, Network, 
  HeartHandshake, MessagesSquare, Mail, Calendar, CalendarDays, 
  CalendarCheck, CalendarHeart, Cake, Share2, Twitter, Facebook, 
  Link, X, Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useToast } from '@/hooks/use-toast';

type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

interface BadgeConfig {
  icon: React.ElementType;
  gradient: string;
  label: string;
  description: string;
  rarity: BadgeRarity;
  glow?: string;
}

const BADGE_CONFIG: Record<string, BadgeConfig> = {
  first_listing: { icon: Star, gradient: 'from-yellow-400 to-orange-500', label: 'First Listing', description: 'Published your first listing', rarity: 'common' },
  five_listings: { icon: Award, gradient: 'from-blue-400 to-cyan-500', label: '5 Listings', description: 'Published 5 listings', rarity: 'rare', glow: 'shadow-blue-500/50' },
  ten_listings: { icon: Trophy, gradient: 'from-purple-400 to-pink-500', label: '10 Listings', description: 'Published 10 listings', rarity: 'epic', glow: 'shadow-purple-500/50' },
  power_seller: { icon: Crown, gradient: 'from-amber-300 via-yellow-400 to-orange-500', label: 'Power Seller', description: '50+ listings published', rarity: 'legendary', glow: 'shadow-yellow-500/50' },
  first_sale: { icon: Target, gradient: 'from-green-400 to-emerald-500', label: 'First Sale', description: 'Made your first sale', rarity: 'common' },
  five_sales: { icon: Medal, gradient: 'from-teal-400 to-cyan-500', label: '5 Sales', description: 'Sold 5 items', rarity: 'rare', glow: 'shadow-teal-500/50' },
  sales_master: { icon: Trophy, gradient: 'from-rose-400 via-pink-500 to-purple-500', label: 'Sales Master', description: 'Sold 25+ items', rarity: 'epic', glow: 'shadow-pink-500/50' },
  sales_legend: { icon: Crown, gradient: 'from-yellow-300 via-amber-400 to-orange-600', label: 'Sales Legend', description: 'Sold 100+ items', rarity: 'legendary', glow: 'shadow-amber-500/50' },
  verified: { icon: Shield, gradient: 'from-blue-500 to-indigo-600', label: 'Verified', description: 'Account verified', rarity: 'rare', glow: 'shadow-blue-500/50' },
  trusted_seller: { icon: Heart, gradient: 'from-rose-400 to-red-500', label: 'Trusted Seller', description: 'Highly rated by buyers', rarity: 'epic', glow: 'shadow-rose-500/50' },
  premium: { icon: Flame, gradient: 'from-orange-400 via-red-500 to-pink-600', label: 'Premium', description: 'Premium member', rarity: 'legendary', glow: 'shadow-orange-500/50' },
  early_adopter: { icon: Zap, gradient: 'from-violet-400 to-purple-600', label: 'Early Adopter', description: 'Joined early', rarity: 'rare', glow: 'shadow-violet-500/50' },
  first_review: { icon: Star, gradient: 'from-amber-300 to-yellow-500', label: 'First Review', description: 'Left your first review', rarity: 'common' },
  five_reviews: { icon: Award, gradient: 'from-orange-400 to-amber-500', label: '5 Reviews', description: 'Left 5 reviews', rarity: 'rare', glow: 'shadow-orange-500/50' },
  review_expert: { icon: Trophy, gradient: 'from-rose-400 to-orange-500', label: 'Review Expert', description: 'Left 25 reviews', rarity: 'epic', glow: 'shadow-rose-500/50' },
  fifty_reviews: { icon: Crown, gradient: 'from-red-400 via-orange-500 to-yellow-500', label: 'Review Legend', description: 'Left 50+ reviews', rarity: 'legendary', glow: 'shadow-red-500/50' },
  lightning_responder: { icon: Zap, gradient: 'from-yellow-300 to-amber-500', label: 'Lightning Fast', description: 'Average response under 1 minute', rarity: 'legendary', glow: 'shadow-yellow-500/50' },
  quick_responder: { icon: Timer, gradient: 'from-green-400 to-emerald-500', label: 'Quick Responder', description: 'Average response under 5 minutes', rarity: 'epic', glow: 'shadow-green-500/50' },
  speed_demon: { icon: Clock, gradient: 'from-cyan-400 to-blue-500', label: 'Speed Demon', description: 'Average response under 15 minutes', rarity: 'rare', glow: 'shadow-cyan-500/50' },
  always_online: { icon: Wifi, gradient: 'from-indigo-400 to-violet-500', label: 'Always Online', description: 'Consistently fast responses', rarity: 'epic', glow: 'shadow-indigo-500/50' },
  first_conversation: { icon: MessageSquare, gradient: 'from-blue-400 to-cyan-500', label: 'First Chat', description: 'Started your first conversation', rarity: 'common' },
  social_butterfly: { icon: Users, gradient: 'from-pink-400 to-rose-500', label: 'Social Butterfly', description: '10+ conversations', rarity: 'rare', glow: 'shadow-pink-500/50' },
  networking_pro: { icon: Network, gradient: 'from-purple-400 to-indigo-500', label: 'Networking Pro', description: '50+ conversations', rarity: 'epic', glow: 'shadow-purple-500/50' },
  community_pillar: { icon: HeartHandshake, gradient: 'from-rose-400 via-pink-500 to-purple-500', label: 'Community Pillar', description: '100+ conversations', rarity: 'legendary', glow: 'shadow-rose-500/50' },
  chatty: { icon: MessagesSquare, gradient: 'from-teal-400 to-cyan-500', label: 'Chatty', description: 'Sent 100+ messages', rarity: 'common' },
  super_communicator: { icon: Mail, gradient: 'from-blue-400 to-indigo-500', label: 'Super Communicator', description: 'Sent 500+ messages', rarity: 'rare', glow: 'shadow-blue-500/50' },
  chat_legend: { icon: Crown, gradient: 'from-violet-400 via-purple-500 to-pink-500', label: 'Chat Legend', description: 'Sent 1000+ messages', rarity: 'legendary', glow: 'shadow-violet-500/50' },
  one_week: { icon: Calendar, gradient: 'from-slate-400 to-gray-500', label: '1 Week', description: 'Member for 1 week', rarity: 'common' },
  one_month: { icon: CalendarDays, gradient: 'from-emerald-400 to-teal-500', label: '1 Month', description: 'Member for 1 month', rarity: 'rare', glow: 'shadow-emerald-500/50' },
  three_months: { icon: CalendarCheck, gradient: 'from-blue-400 to-cyan-500', label: '3 Months', description: 'Member for 3 months', rarity: 'rare', glow: 'shadow-blue-500/50' },
  six_months: { icon: CalendarHeart, gradient: 'from-purple-400 to-pink-500', label: '6 Months', description: 'Member for 6 months', rarity: 'epic', glow: 'shadow-purple-500/50' },
  one_year: { icon: Cake, gradient: 'from-amber-300 via-orange-400 to-red-500', label: 'Anniversary', description: 'Member for 1 year!', rarity: 'legendary', glow: 'shadow-amber-500/50' },
};

const RARITY_COLORS: Record<BadgeRarity, { bg: string; text: string; border: string }> = {
  common: { bg: 'bg-slate-500/20', text: 'text-slate-300', border: 'border-slate-500/30' },
  rare: { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/30' },
  epic: { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/30' },
  legendary: { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/30' },
};

interface BadgeCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  badgeType: string;
  badgeName?: string;
}

export const BadgeCelebrationModal = ({ 
  isOpen, 
  onClose, 
  badgeType,
  badgeName 
}: BadgeCelebrationModalProps) => {
  const { toast } = useToast();
  const config = BADGE_CONFIG[badgeType];
  
  const fireConfetti = useCallback(() => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#A855F7'],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#A855F7'],
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen && config) {
      const cleanup = fireConfetti();
      return cleanup;
    }
  }, [isOpen, config, fireConfetti]);

  if (!config) return null;

  const Icon = config.icon;
  const rarity = RARITY_COLORS[config.rarity];
  const displayName = badgeName || config.label;

  const shareText = `🎉 I just earned the "${displayName}" badge on CarNexo! ${config.description}`;
  const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const handleShare = (platform: 'twitter' | 'facebook' | 'copy') => {
    switch (platform) {
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
          '_blank',
          'noopener,noreferrer'
        );
        break;
      case 'facebook':
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
          '_blank',
          'noopener,noreferrer'
        );
        break;
      case 'copy':
        navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        toast({
          title: 'Copied!',
          description: 'Share text copied to clipboard',
        });
        break;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md border-0 bg-gradient-to-b from-background via-background to-muted/30 overflow-hidden">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity z-10"
        >
          <X className="h-4 w-4" />
        </button>
        
        {/* Animated background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r ${config.gradient} opacity-20 blur-3xl animate-pulse`} />
        </div>

        <div className="flex flex-col items-center text-center py-6 relative z-10">
          {/* Sparkles decoration */}
          <div className="absolute top-0 left-1/4 animate-bounce delay-100">
            <Sparkles className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="absolute top-4 right-1/4 animate-bounce delay-300">
            <Sparkles className="h-4 w-4 text-pink-400" />
          </div>

          {/* Congratulations text */}
          <div className="mb-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Congratulations!
            </span>
            <h2 className="text-2xl font-bold mt-1 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              New Badge Earned!
            </h2>
          </div>

          {/* Badge display */}
          <div className="relative mb-6">
            {/* Outer glow ring */}
            {config.rarity === 'legendary' && (
              <div className={`absolute inset-0 bg-gradient-to-r ${config.gradient} rounded-full blur-xl opacity-50 animate-pulse scale-125`} />
            )}
            
            {/* Badge container */}
            <div className={`relative w-28 h-28 rounded-full bg-gradient-to-br ${config.gradient} p-1 ${config.rarity === 'legendary' ? 'animate-pulse' : ''}`}>
              <div className="w-full h-full rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center">
                <Icon className="h-12 w-12 text-foreground" strokeWidth={1.5} />
              </div>
            </div>

            {/* Rarity tag */}
            <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${rarity.bg} ${rarity.text} border ${rarity.border}`}>
              {config.rarity}
            </div>
          </div>

          {/* Badge info */}
          <h3 className={`text-xl font-bold bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent mb-2`}>
            {displayName}
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-[250px]">
            {config.description}
          </p>

          {/* Share section */}
          <div className="w-full space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Share your achievement
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full h-11 w-11 hover:bg-[#1DA1F2]/10 hover:border-[#1DA1F2]/50 hover:text-[#1DA1F2] transition-colors"
                onClick={() => handleShare('twitter')}
              >
                <Twitter className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full h-11 w-11 hover:bg-[#4267B2]/10 hover:border-[#4267B2]/50 hover:text-[#4267B2] transition-colors"
                onClick={() => handleShare('facebook')}
              >
                <Facebook className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full h-11 w-11 hover:bg-primary/10 hover:border-primary/50 transition-colors"
                onClick={() => handleShare('copy')}
              >
                <Link className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Close button */}
          <Button 
            className={`mt-6 w-full bg-gradient-to-r ${config.gradient} hover:opacity-90 text-white font-semibold`}
            onClick={onClose}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Awesome!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
