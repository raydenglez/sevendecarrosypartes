import { useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { mockConversations } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export default function Messages() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Show sign-in prompt for guests
  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl safe-top">
          <div className="px-4 py-4">
            <h1 className="text-xl font-bold text-foreground">Messages</h1>
          </div>
        </header>
        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <MessageSquare className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Sign in to message sellers</h2>
          <p className="text-muted-foreground mb-6 max-w-[280px]">
            Create an account to contact sellers and negotiate deals
          </p>
          <Button variant="carnexo" size="lg" onClick={() => navigate('/auth')}>
            Sign In or Create Account
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
          <h1 className="text-xl font-bold text-foreground">Messages</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mockConversations.length} conversations
          </p>
        </div>
      </header>

      <main className="px-4 animate-fade-in">
        {mockConversations.length > 0 ? (
          <div className="space-y-2">
            {mockConversations.map((conv, index) => (
              <button
                key={conv.id}
                className={cn(
                  "w-full flex gap-4 p-4 bg-card rounded-2xl transition-all hover:bg-card-elevated animate-fade-in",
                )}
                style={{ animationDelay: `${index * 50}ms` } as React.CSSProperties}
              >
                <div className="relative shrink-0">
                  <img
                    src={conv.otherUser.avatarUrl}
                    alt={conv.otherUser.name}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                  {conv.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-foreground truncate">
                      {conv.otherUser.name}
                    </h3>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatDistanceToNow(new Date(conv.lastMessage.sentAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate mt-0.5">
                    {conv.listing.title}
                  </p>
                  <p className={cn(
                    "text-sm truncate mt-1",
                    conv.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                  )}>
                    {conv.lastMessage.message}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-2">No messages yet</h2>
            <p className="text-muted-foreground max-w-[250px]">
              Start a conversation by contacting sellers from their listings
            </p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
