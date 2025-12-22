import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type MessageType = 'text' | 'image' | 'voice';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  status: 'sent' | 'delivered' | 'read';
  message_type: MessageType;
  media_url: string | null;
  media_duration: number | null;
  created_at: string;
}

export function useMessages(conversationId: string | undefined) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!conversationId || !user) return;

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    setMessages(data as Message[]);
    setLoading(false);

    // Mark messages as read
    await supabase
      .from('messages')
      .update({ status: 'read' })
      .eq('conversation_id', conversationId)
      .neq('sender_id', user.id)
      .neq('status', 'read');
  }, [conversationId, user]);

  useEffect(() => {
    if (!conversationId || !user) {
      setMessages([]);
      setLoading(false);
      return;
    }

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);
          
          // Mark as read if not from current user
          if (newMessage.sender_id !== user.id) {
            supabase
              .from('messages')
              .update({ status: 'read' })
              .eq('id', newMessage.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user, fetchMessages]);

  const uploadMedia = async (file: Blob, type: 'image' | 'voice'): Promise<string | null> => {
    if (!user) return null;

    const ext = type === 'image' ? 'jpg' : 'webm';
    const path = `${user.id}/${conversationId}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from('chat-media')
      .upload(path, file, {
        contentType: type === 'image' ? 'image/jpeg' : 'audio/webm',
      });

    if (error) {
      console.error('Error uploading media:', error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('chat-media')
      .getPublicUrl(path);

    return urlData.publicUrl;
  };

  const sendMessage = async (
    content: string,
    type: MessageType = 'text',
    mediaBlob?: Blob,
    mediaDuration?: number
  ): Promise<boolean> => {
    if (!conversationId || !user) return false;
    if (type === 'text' && !content.trim()) return false;
    if ((type === 'image' || type === 'voice') && !mediaBlob) return false;

    let mediaUrl: string | null = null;

    // Upload media if needed
    if (mediaBlob && (type === 'image' || type === 'voice')) {
      mediaUrl = await uploadMedia(mediaBlob, type);
      if (!mediaUrl) return false;
    }

    // Get recipient ID before sending
    const { data: conversation } = await supabase
      .from('conversations')
      .select('buyer_id, seller_id')
      .eq('id', conversationId)
      .single();

    const recipientId = conversation?.buyer_id === user.id 
      ? conversation?.seller_id 
      : conversation?.buyer_id;

    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim() || (type === 'image' ? '📷 Image' : '🎤 Voice message'),
        message_type: type,
        media_url: mediaUrl,
        media_duration: mediaDuration || null,
      });

    if (error) {
      console.error('Error sending message:', error);
      return false;
    }

    // Update conversation's last_message_at
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    // Send push notification to recipient
    if (recipientId) {
      // Get sender name for notification
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      const senderName = senderProfile?.full_name || 'Someone';
      const notificationBody = type === 'text' 
        ? content.trim().slice(0, 100)
        : type === 'image' 
        ? '📷 Sent an image'
        : '🎤 Sent a voice message';

      // Fire and forget - don't wait for push notification
      supabase.functions.invoke('send-push-notification', {
        body: {
          userId: recipientId,
          title: `Message from ${senderName}`,
          body: notificationBody,
          conversationId,
        },
      }).catch(console.error);
    }

    return true;
  };

  return { messages, loading, sendMessage, refetch: fetchMessages };
}
