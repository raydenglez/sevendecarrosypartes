import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OnlineUser {
  id: string;
  lastSeen: string;
}

export function useOnlinePresence(userId: string | undefined) {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        // Presence synced
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            id: userId,
            lastSeen: new Date().toISOString(),
          });
        }
      });

    // Update presence every 30 seconds to show we're still online
    const interval = setInterval(() => {
      if (channelRef.current) {
        channelRef.current.track({
          id: userId,
          lastSeen: new Date().toISOString(),
        });
      }
    }, 30000);

    return () => {
      clearInterval(interval);
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [userId]);
}

export function useOnlineStatus(userIds: string[]) {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (userIds.length === 0) return;

    const channel = supabase.channel('online-users');
    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<OnlineUser>();
        const online = new Set<string>();
        
        Object.values(state).forEach((presences) => {
          presences.forEach((presence) => {
            if (userIds.includes(presence.id)) {
              // Consider online if last seen within 2 minutes
              const lastSeen = new Date(presence.lastSeen);
              const now = new Date();
              if (now.getTime() - lastSeen.getTime() < 120000) {
                online.add(presence.id);
              }
            }
          });
        });
        
        setOnlineUsers(online);
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [userIds.join(',')]);

  const isOnline = (userId: string) => onlineUsers.has(userId);

  return { onlineUsers, isOnline };
}
