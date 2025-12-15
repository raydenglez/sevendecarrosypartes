import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatBubble } from '@/components/ChatBubble';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface ConversationDetails {
  id: string;
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
}

export default function Chat() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { messages, loading: messagesLoading, sendMessage } = useMessages(conversationId);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [conversation, setConversation] = useState<ConversationDetails | null>(null);
  const [loadingConvo, setLoadingConvo] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchConversation() {
      if (!conversationId || !user) return;

      const { data: conv } = await supabase
        .from('conversations')
        .select(`
          id,
          seller_id,
          buyer_id,
          listing:listings (
            id,
            title,
            images,
            price
          )
        `)
        .eq('id', conversationId)
        .single();

      if (conv) {
        const otherId = conv.seller_id === user.id ? conv.buyer_id : conv.seller_id;
        
        const { data: otherUser } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('id', otherId)
          .single();

        setConversation({
          id: conv.id,
          listing: conv.listing as any,
          other_user: otherUser || { id: otherId, full_name: 'Unknown', avatar_url: null },
        });
      }
      setLoadingConvo(false);
    }

    fetchConversation();
  }, [conversationId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || sending) return;

    setSending(true);
    const success = await sendMessage(inputValue);
    if (success) {
      setInputValue('');
    }
    setSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (authLoading || loadingConvo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Conversation not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border safe-top">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => navigate('/messages')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div 
            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
            onClick={() => navigate(`/listing/${conversation.listing.id}`)}
          >
            <img
              src={conversation.other_user.avatar_url || '/placeholder.svg'}
              alt={conversation.other_user.full_name}
              className="w-10 h-10 rounded-full object-cover shrink-0"
            />
            <div className="min-w-0">
              <h1 className="font-semibold text-foreground truncate">
                {conversation.other_user.full_name}
              </h1>
              <p className="text-xs text-muted-foreground truncate">
                {conversation.listing.title}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Listing Preview */}
      <div 
        className="px-4 py-3 border-b border-border bg-card/50 cursor-pointer"
        onClick={() => navigate(`/listing/${conversation.listing.id}`)}
      >
        <div className="flex items-center gap-3">
          <img
            src={conversation.listing.images?.[0] || '/placeholder.svg'}
            alt={conversation.listing.title}
            className="w-12 h-12 rounded-lg object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">
              {conversation.listing.title}
            </p>
            <p className="text-sm text-primary font-semibold">
              ${conversation.listing.price?.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messagesLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-muted-foreground text-sm">
              Start the conversation by sending a message
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <ChatBubble
                key={msg.id}
                content={msg.content}
                timestamp={msg.created_at}
                isSent={msg.sender_id === user.id}
                status={msg.status}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="sticky bottom-0 p-4 bg-background/95 backdrop-blur-xl border-t border-border safe-bottom">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1"
            disabled={sending}
          />
          <Button
            variant="carnexo"
            size="icon"
            onClick={handleSend}
            disabled={!inputValue.trim() || sending}
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
