import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface NewBadge {
  badgeType: string;
  badgeName: string;
}

export const useBadgeCelebration = () => {
  const { user } = useAuth();
  const [newBadge, setNewBadge] = useState<NewBadge | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const shownBadgesRef = useRef<Set<string>>(new Set());

  const closeCelebration = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => setNewBadge(null), 300);
  }, []);

  const showCelebration = useCallback((badgeType: string, badgeName: string) => {
    // Prevent showing the same badge multiple times in the same session
    const badgeKey = `${badgeType}-${badgeName}`;
    if (shownBadgesRef.current.has(badgeKey)) return;
    
    shownBadgesRef.current.add(badgeKey);
    setNewBadge({ badgeType, badgeName });
    setIsOpen(true);
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to new badge inserts for the current user
    const channel = supabase
      .channel('badge-celebration')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_badges',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newBadge = payload.new as {
            badge_type: string;
            badge_name: string;
          };
          showCelebration(newBadge.badge_type, newBadge.badge_name);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, showCelebration]);

  return {
    newBadge,
    isOpen,
    closeCelebration,
    showCelebration, // Expose for manual triggering
  };
};
