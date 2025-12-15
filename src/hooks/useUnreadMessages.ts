import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useUnreadMessages() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    fetchUnreadCount();

    // Subscribe to message changes
    const channel = supabase
      .channel('unread-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => fetchUnreadCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  async function fetchUnreadCount() {
    if (!user) return;

    // Get all conversations where user is participant
    const { data: convos } = await supabase
      .from('conversations')
      .select('id')
      .or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`);

    if (!convos || convos.length === 0) {
      setUnreadCount(0);
      return;
    }

    const conversationIds = convos.map(c => c.id);

    // Count unread messages across all conversations
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('conversation_id', conversationIds)
      .neq('sender_id', user.id)
      .neq('status', 'read');

    setUnreadCount(count || 0);
  }

  return { unreadCount, refetch: fetchUnreadCount };
}
