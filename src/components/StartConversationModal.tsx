import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MessageSquare, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface StartConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellerId: string;
  sellerName: string;
  listingId?: string;
  listingTitle?: string;
}

export function StartConversationModal({
  isOpen,
  onClose,
  sellerId,
  sellerName,
  listingId,
  listingTitle,
}: StartConversationModalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!message.trim()) {
      toast({
        title: t('common.error'),
        description: t('messages.emptyMessage'),
        variant: 'destructive',
      });
      return;
    }

    if (user.id === sellerId) {
      toast({
        title: t('common.error'),
        description: t('messages.cannotMessageSelf'),
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // If no listingId provided, we need to find or create a "general" conversation
      // For now, we'll use the seller's first active listing
      let targetListingId = listingId;

      if (!targetListingId) {
        // Find seller's first active listing
        const { data: listings } = await supabase
          .from('listings')
          .select('id')
          .eq('owner_id', sellerId)
          .eq('status', 'active')
          .limit(1);

        if (listings && listings.length > 0) {
          targetListingId = listings[0].id;
        } else {
          toast({
            title: t('common.error'),
            description: t('messages.noListingsFound'),
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
      }

      // Check if conversation already exists
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('listing_id', targetListingId)
        .eq('buyer_id', user.id)
        .maybeSingle();

      let conversationId: string;

      if (existingConv) {
        conversationId = existingConv.id;
      } else {
        // Create new conversation
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({
            listing_id: targetListingId,
            seller_id: sellerId,
            buyer_id: user.id,
          })
          .select('id')
          .single();

        if (convError || !newConv) {
          throw new Error('Failed to create conversation');
        }
        conversationId = newConv.id;
      }

      // Send the message
      const { error: msgError } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: message.trim(),
      });

      if (msgError) {
        throw new Error('Failed to send message');
      }

      // Update conversation last_message_at
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      toast({
        title: t('messages.sent'),
        description: t('messages.sentDescription'),
      });

      onClose();
      setMessage('');
      navigate(`/chat/${conversationId}`);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: t('common.error'),
        description: t('messages.sendError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            {t('messages.messageTitle', { name: sellerName })}
          </DialogTitle>
          <DialogDescription>
            {listingTitle
              ? t('messages.aboutListing', { title: listingTitle })
              : t('messages.startConversation')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('messages.typePlaceholder')}
            className="min-h-[120px] resize-none"
            autoFocus
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSend} disabled={loading || !message.trim()}>
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            {t('messages.send')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
