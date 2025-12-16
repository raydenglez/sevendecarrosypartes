import { X, MessageSquare, ChevronRight, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { ConversationWithDetails } from '@/hooks/useConversations';
import { useNavigate } from 'react-router-dom';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: ConversationWithDetails[];
  onViewAll?: () => void;
}

export function NotificationsPanel({ isOpen, onClose, conversations, onViewAll }: NotificationsPanelProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  if (!isOpen) return null;

  // Filter to only unread conversations and take first 5
  const unreadConversations = conversations
    .filter(c => c.unread_count > 0)
    .slice(0, 5);

  const handleConversationClick = (conversationId: string) => {
    onClose();
    navigate(`/chat/${conversationId}`);
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-sm bg-background border-l border-border shadow-xl z-50 animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">{t('notifications.title')}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        
        <div className="overflow-y-auto h-[calc(100%-120px)]">
          {unreadConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2">
              <MessageSquare className="w-10 h-10 text-muted-foreground/50" />
              <p>{t('notifications.noNewMessages')}</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {unreadConversations.map((conversation) => (
                <div 
                  key={conversation.id}
                  onClick={() => handleConversationClick(conversation.id)}
                  className="p-4 hover:bg-muted/50 transition-colors cursor-pointer bg-primary/5"
                >
                  <div className="flex gap-3">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={conversation.other_user.avatar_url || undefined} alt={conversation.other_user.full_name} />
                      <AvatarFallback className="bg-secondary text-secondary-foreground font-semibold">
                        {conversation.other_user.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-foreground truncate">
                          {conversation.other_user.full_name || 'User'}
                        </p>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {conversation.last_message?.created_at 
                            ? formatDistanceToNow(new Date(conversation.last_message.created_at), { addSuffix: true })
                            : ''}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate mt-0.5">
                        {conversation.listing.title}
                      </p>
                      <p className="text-sm text-foreground line-clamp-1 mt-1">
                        {conversation.last_message?.content || t('notifications.noNewMessages')}
                      </p>
                    </div>
                    {conversation.unread_count > 0 && (
                      <div className="min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* View All Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-background">
          <button
            onClick={onViewAll}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-medium transition-colors"
          >
            {t('notifications.viewAllMessages')}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}