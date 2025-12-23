import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  LayoutDashboard, 
  Shield, 
  Flag, 
  Users, 
  History, 
  ChevronLeft,
  Loader2,
  Menu,
  Megaphone,
  Bell,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface AdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Overview', exact: true },
  { path: '/admin/moderation', icon: Shield, label: 'Moderation' },
  { path: '/admin/reports', icon: Flag, label: 'Reports' },
  { path: '/admin/sponsored', icon: Megaphone, label: 'Sponsored' },
  { path: '/admin/notifications', icon: Bell, label: 'Notifications' },
  { path: '/admin/users', icon: Users, label: 'Users' },
  { path: '/admin/history', icon: History, label: 'History' },
];

// Primary nav items for bottom bar (limited to 4 for mobile)
const primaryNavItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Overview', exact: true },
  { path: '/admin/moderation', icon: Shield, label: 'Moderation' },
  { path: '/admin/reports', icon: Flag, label: 'Reports' },
  { path: '/admin/notifications', icon: Bell, label: 'Alerts' },
];

// Secondary nav items shown in "More" menu
const secondaryNavItems = [
  { path: '/admin/sponsored', icon: Megaphone, label: 'Sponsored' },
  { path: '/admin/users', icon: Users, label: 'Users' },
  { path: '/admin/history', icon: History, label: 'History' },
];

function MobileBottomNav() {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  
  const isSecondaryActive = secondaryNavItems.some(item => 
    location.pathname.startsWith(item.path)
  );

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border safe-bottom z-40">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {primaryNavItems.map((item) => {
          const isActive = item.exact 
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center gap-1 min-w-[64px] min-h-[48px] py-2 px-2 rounded-lg transition-all touch-manipulation',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground active:scale-95'
              )}
            >
              <item.icon className={cn('h-5 w-5', isActive && 'text-primary')} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
        
        {/* More menu for secondary items */}
        <Popover open={moreOpen} onOpenChange={setMoreOpen}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                'flex flex-col items-center justify-center gap-1 min-w-[64px] min-h-[48px] py-2 px-2 rounded-lg transition-all touch-manipulation',
                isSecondaryActive || moreOpen
                  ? 'text-primary'
                  : 'text-muted-foreground active:scale-95'
              )}
            >
              <MoreHorizontal className={cn('h-5 w-5', (isSecondaryActive || moreOpen) && 'text-primary')} />
              <span className="text-[10px] font-medium">More</span>
            </button>
          </PopoverTrigger>
          <PopoverContent 
            side="top" 
            align="end" 
            className="w-48 p-2 mb-2"
            sideOffset={8}
          >
            <div className="space-y-1">
              {secondaryNavItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors touch-manipulation',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-muted active:bg-muted'
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </nav>
  );
}

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();

  return (
    <ul className="space-y-1">
      {navItems.map((item) => {
        const isActive = item.exact 
          ? location.pathname === item.path
          : location.pathname.startsWith(item.path);
        
        return (
          <li key={item.path}>
            <Link
              to={item.path}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin'
        });

        if (error) {
          console.error('Error checking admin role:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(data);
        }
      } catch (error) {
        console.error('Error checking admin role:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      checkAdminRole();
    }
  }, [user, authLoading]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <Shield className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground text-center mb-4">
          You don't have permission to access the admin dashboard.
        </p>
        <Link to="/" className="text-primary hover:underline flex items-center gap-1">
          <ChevronLeft className="h-4 w-4" />
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center justify-between pt-[calc(env(safe-area-inset-top)+12px)]">
        <div className="flex items-center gap-3">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <div className="p-4 border-b border-border">
                <Link 
                  to="/" 
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back to App
                </Link>
                <h1 className="text-xl font-bold mt-3">Admin Dashboard</h1>
              </div>
              <nav className="p-4">
                <NavContent onNavigate={() => setMobileMenuOpen(false)} />
              </nav>
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Logged in as admin
                </p>
              </div>
            </SheetContent>
          </Sheet>
          <h1 className="text-lg font-bold">Admin</h1>
        </div>
        <Link 
          to="/" 
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back</span>
        </Link>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 border-r border-border bg-card flex-col fixed inset-y-0 left-0">
          <div className="p-4 border-b border-border">
            <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4" />
              Back to App
            </Link>
            <h1 className="text-xl font-bold mt-3">Admin Dashboard</h1>
          </div>

          <nav className="flex-1 p-4 overflow-y-auto">
            <NavContent />
          </nav>

          <div className="p-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Logged in as admin
            </p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 min-h-screen">
          <div className="p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
