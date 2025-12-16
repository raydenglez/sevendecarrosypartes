import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ConversationWithDetails {
  id: string;
  listing_id: string;
  seller_id: string;
  buyer_id: string;
  last_message_at: string;
  created_at: string;
  listing: {
    id: string;
    title: string;
    images: string[];
    price: number;
  };
  other_user: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  last_message?: {
    content: string;
    sender_id: string;
    created_at: string;
  };
  unread_count: number;
}

export function useConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setConversations([]);
      setLoading(false);
      return;
    }

    fetchConversations();

    // Subscribe to new conversations
    const channel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `seller_id=eq.${user.id}`,
        },
        () => fetchConversations()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `buyer_id=eq.${user.id}`,
        },
        () => fetchConversations()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  async function fetchConversations() {
    if (!user) return;

    setLoading(true);
    
    const { data: convos, error } = await supabase
      .from('conversations')
      .select(`
        *,
        listing:listings (
          id,
          title,
          images,
          price
        )
      `)
      .or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false });

    if (error || !convos) {
      console.error('Error fetching conversations:', error);
      setLoading(false);
      return;
    }

    // Fetch additional data for each conversation
    const enrichedConvos = await Promise.all(
      convos.map(async (conv) => {
        const otherId = conv.seller_id === user.id ? conv.buyer_id : conv.seller_id;
        
        // Get other user's profile from public view (excludes sensitive data)
        const { data: otherUser } = await supabase
          .from('public_profiles')
          .select('id, full_name, avatar_url')
          .eq('id', otherId)
          .single();

        // Get last message
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('content, sender_id, created_at')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Count unread messages
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .neq('sender_id', user.id)
          .neq('status', 'read');

        // Count total messages to check if conversation has any messages
        const { count: totalMessages } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id);

        return {
          ...conv,
          listing: conv.listing,
          other_user: otherUser || { id: otherId, full_name: 'Unknown', avatar_url: null },
          last_message: lastMsg || undefined,
          unread_count: count || 0,
          has_messages: (totalMessages || 0) > 0,
        } as ConversationWithDetails & { has_messages: boolean };
      })
    );

    // Filter out conversations without any messages
    const conversationsWithMessages = enrichedConvos.filter(c => c.has_messages);

    setConversations(conversationsWithMessages);
    setLoading(false);
  }

  return { conversations, loading, refetch: fetchConversations };
}

export async function getOrCreateConversation(
  listingId: string,
  sellerId: string,
  buyerId: string
): Promise<string | null> {
  // Check if conversation already exists
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('listing_id', listingId)
    .eq('buyer_id', buyerId)
    .single();

  if (existing) {
    return existing.id;
  }

  // Create new conversation
  const { data: newConv, error } = await supabase
    .from('conversations')
    .insert({
      listing_id: listingId,
      seller_id: sellerId,
      buyer_id: buyerId,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating conversation:', error);
    return null;
  }

  return newConv.id;
}
