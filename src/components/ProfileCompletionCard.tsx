import { useTranslation } from 'react-i18next';
import { Progress } from '@/components/ui/progress';
import { 
  Camera, 
  User, 
  FileText, 
  MapPin, 
  Instagram, 
  Phone as PhoneIcon,
  Trophy,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

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

// Confetti particle component
function ConfettiParticle({ delay, color }: { delay: number; color: string }) {
  const randomX = Math.random() * 100;
  const randomRotation = Math.random() * 360;
  
  return (
    <motion.div
      className="absolute w-2 h-2 rounded-sm"
      style={{ 
        left: `${randomX}%`, 
        top: '-10px',
        backgroundColor: color,
      }}
      initial={{ y: 0, opacity: 1, rotate: 0, scale: 1 }}
      animate={{ 
        y: 150, 
        opacity: 0, 
        rotate: randomRotation + 360,
        scale: 0.5,
        x: (Math.random() - 0.5) * 100
      }}
      transition={{ 
        duration: 2, 
        delay: delay,
        ease: "easeOut"
      }}
    />
  );
}

// Celebration component
function CelebrationAnimation() {
  const colors = ['#FF6B35', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    delay: Math.random() * 0.5,
    color: colors[i % colors.length],
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <ConfettiParticle 
          key={particle.id} 
          delay={particle.delay} 
          color={particle.color} 
        />
      ))}
    </div>
  );
}

export function ProfileCompletionCard({
  profileData,
  socialData,
  onEditProfile,
  onEditSocialLinks,
  onEditPersonalInfo,
}: ProfileCompletionCardProps) {
  const { t } = useTranslation();
  const [showCelebration, setShowCelebration] = useState(false);
  const [hasShownCelebration, setHasShownCelebration] = useState(false);

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
  const isComplete = percentage === 100;

  // Trigger celebration when reaching 100%
  useEffect(() => {
    if (isComplete && !hasShownCelebration) {
      setShowCelebration(true);
      setHasShownCelebration(true);
      // Hide celebration after animation
      const timer = setTimeout(() => setShowCelebration(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isComplete, hasShownCelebration]);

  // Show celebration card when complete
  if (isComplete) {
    return (
      <motion.div 
        className="relative bg-gradient-to-br from-success/20 via-primary/10 to-warning/20 rounded-2xl p-4 border border-success/30 overflow-hidden"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <AnimatePresence>
          {showCelebration && <CelebrationAnimation />}
        </AnimatePresence>
        
        <div className="flex items-center gap-3">
          <motion.div 
            className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center"
            animate={{ 
              scale: showCelebration ? [1, 1.2, 1] : 1,
              rotate: showCelebration ? [0, -10, 10, 0] : 0
            }}
            transition={{ duration: 0.5, repeat: showCelebration ? 2 : 0 }}
          >
            <Trophy className="w-6 h-6 text-success" />
          </motion.div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-foreground">
                {t('profile.completion.complete')}
              </h3>
              <motion.div
                animate={{ rotate: showCelebration ? 360 : 0 }}
                transition={{ duration: 1, repeat: showCelebration ? 2 : 0 }}
              >
                <Sparkles className="w-4 h-4 text-warning" />
              </motion.div>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('profile.completion.completeDesc')}
            </p>
          </div>
          <span className="text-2xl font-bold text-success">100%</span>
        </div>

        {/* All items completed indicators */}
        <div className="flex items-center gap-1 mt-4">
          {items.map((item, index) => (
            <motion.div
              key={item.key}
              className="flex-1 h-1.5 rounded-full bg-success"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
            />
          ))}
        </div>
      </motion.div>
    );
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