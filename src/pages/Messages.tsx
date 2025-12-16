import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MessageSquare, Loader2 } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useConversations } from '@/hooks/useConversations';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, Locale } from 'date-fns';
import { es, ptBR } from 'date-fns/locale';

const locales: Record<string, Locale> = {
  es,
  pt: ptBR,
};

export default function Messages() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { conversations, loading: convosLoading } = useConversations();
  const { t, i18n } = useTranslation();

  const getDateLocale = () => locales[i18n.language] || undefined;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show sign-in prompt for guests
  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl safe-top">
          <div className="px-4 py-4">
            <h1 className="text-xl font-bold text-foreground">{t('messages.title')}</h1>
          </div>
        </header>
        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <MessageSquare className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">{t('messages.signInPrompt')}</h2>
          <p className="text-muted-foreground mb-6 max-w-[280px]">
            {t('messages.signInPromptDesc')}
          </p>
          <Button variant="carnexo" size="lg" onClick={() => navigate('/auth')}>
            {t('auth.signInOrCreate')}
          </Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl safe-top">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-foreground">{t('messages.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('messages.conversationCount', { count: conversations.length })}
          </p>
        </div>
      </header>

      <main className="px-4 animate-fade-in">
        {convosLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : conversations.length > 0 ? (
          <div className="space-y-2">
            {conversations.map((conv, index) => (
              <button
                key={conv.id}
                onClick={() => navigate(`/chat/${conv.id}`)}
                className={cn(
                  "w-full flex gap-4 p-4 bg-card rounded-2xl transition-all hover:bg-card-elevated animate-fade-in",
                )}
                style={{ animationDelay: `${index * 50}ms` } as React.CSSProperties}
              >
                <div className="relative shrink-0">
                  <img
                    src={conv.other_user.avatar_url || '/placeholder.svg'}
                    alt={conv.other_user.full_name}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                  {conv.unread_count > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-foreground truncate">
                      {conv.other_user.full_name}
                    </h3>
                    {conv.last_message && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatDistanceToNow(new Date(conv.last_message.created_at), { 
                          addSuffix: true,
                          locale: getDateLocale()
                        })}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate mt-0.5">
                    {conv.listing.title}
                  </p>
                  {conv.last_message && (
                    <p className={cn(
                      "text-sm truncate mt-1",
                      conv.unread_count > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                    )}>
                      {conv.last_message.content}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-2">{t('messages.noMessages')}</h2>
            <p className="text-muted-foreground max-w-[250px]">
              {t('messages.noMessagesDesc')}
            </p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}