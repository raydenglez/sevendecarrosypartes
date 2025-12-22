import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TypingUser {
  id: string;
  name: string;
}

export function useTypingIndicator(conversationId: string | undefined, userId: string | undefined, userName: string | undefined) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    if (!conversationId || !userId) return;

    const channel = supabase.channel(`typing:${conversationId}`);
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.userId !== userId) {
          setTypingUsers(prev => {
            const exists = prev.some(u => u.id === payload.userId);
            if (payload.isTyping) {
              if (!exists) {
                return [...prev, { id: payload.userId, name: payload.userName }];
              }
              return prev;
            } else {
              return prev.filter(u => u.id !== payload.userId);
            }
          });

          // Auto-remove after 3 seconds if no update
          setTimeout(() => {
            setTypingUsers(prev => prev.filter(u => u.id !== payload.userId));
          }, 3000);
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [conversationId, userId]);

  const sendTypingStatus = useCallback((isTyping: boolean) => {
    if (!channelRef.current || !userId || !conversationId) return;

    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        userId,
        userName: userName || 'User',
        isTyping,
      },
    });
  }, [userId, userName, conversationId]);

  const startTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      sendTypingStatus(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      sendTypingStatus(false);
    }, 2000);
  }, [sendTypingStatus]);

  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (isTypingRef.current) {
      isTypingRef.current = false;
      sendTypingStatus(false);
    }
  }, [sendTypingStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    typingUsers,
    startTyping,
    stopTyping,
  };
}
