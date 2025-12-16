import { NavLink, useLocation } from 'react-router-dom';
import { Home, Heart, Plus, MessageSquare, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';

export function BottomNav() {
  const location = useLocation();
  const { unreadCount } = useUnreadMessages();
  const { t } = useTranslation();

  const navItems = [
    { path: '/', icon: Home, label: t('nav.home') },
    { path: '/favorites', icon: Heart, label: t('nav.favorites') },
    { path: '/publish', icon: Plus, label: t('nav.publish'), isAction: true },
    { path: '/messages', icon: MessageSquare, label: t('nav.messages') },
    { path: '/profile', icon: User, label: t('nav.profile') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border safe-bottom">
      <div className="flex items-center justify-around h-20 max-w-lg mx-auto px-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          if (item.isAction) {
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className="flex items-center justify-center -mt-6 touch-manipulation"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-orange shadow-orange flex items-center justify-center transition-transform hover:scale-105 active:scale-95">
                  <Icon className="w-7 h-7 text-primary-foreground" />
                </div>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center min-w-[56px] min-h-[56px] py-2 px-3 relative group touch-manipulation"
            >
              <div
                className={cn(
                  'flex flex-col items-center gap-1 transition-all duration-200',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <div className="relative">
                  <Icon className={cn('w-6 h-6', isActive && 'text-primary')} />
                  {item.path === '/messages' && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center animate-pulse">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-medium mt-0.5">{item.label}</span>
              </div>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}