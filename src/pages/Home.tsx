import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, ChevronRight, Bell, User } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { SearchBar } from '@/components/SearchBar';
import { SegmentedControl } from '@/components/SegmentedControl';
import { CategoryFilter } from '@/components/CategoryFilter';
import { ListingCard } from '@/components/ListingCard';
import { MapPreview } from '@/components/MapPreview';
import { NotificationsPanel } from '@/components/NotificationsPanel';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { mockListings, categories, mockNotifications } from '@/data/mockData';
import logo from '@/assets/logo.png';

const segments = [
  { id: 'vehicles', label: 'Vehicles & Parts' },
  { id: 'services', label: 'Service Providers' },
];

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [segment, setSegment] = useState('vehicles');
  const [category, setCategory] = useState('all');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const unreadCount = mockNotifications.filter(n => !n.isRead).length;

  const featuredListings = mockListings.filter(l => {
    if (segment === 'vehicles') {
      return (l.isPremium || l.type === 'vehicle' || l.type === 'part');
    }
    return l.type === 'service';
  }).slice(0, 3);

  const justArrivedListings = mockListings.filter(l => 
    segment === 'vehicles' ? ['vehicle', 'part'].includes(l.type) : l.type === 'service'
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl safe-top">
        <div className="px-4 pt-4 pb-3 space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-10" />
            <img src={logo} alt="CarNexo" className="h-10 w-10 rounded-xl" />
            {user ? (
              <button 
                onClick={() => setIsNotificationsOpen(true)}
                className="w-10 h-10 flex items-center justify-center text-foreground relative"
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            ) : (
              <Button 
                variant="carnexo" 
                size="sm"
                onClick={() => navigate('/auth')}
              >
                Sign In
              </Button>
            )}
          </div>
          <SegmentedControl
            options={segments}
            selected={segment}
            onSelect={setSegment}
          />
          <SearchBar />
          <CategoryFilter
            categories={categories}
            selected={category}
            onSelect={setCategory}
          />
        </div>
      </header>

      {/* Content */}
      <main className="px-4 space-y-6 animate-fade-in">
        {/* Featured Near You */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-foreground">Featured Near You</h2>
              <Flame className="w-5 h-5 text-primary" />
            </div>
            <button className="text-sm font-medium text-primary flex items-center gap-1">
              See all
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto hide-scrollbar -mx-4 px-4 pb-2">
            {featuredListings.map((listing, index) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                variant="featured"
                className="animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` } as React.CSSProperties}
              />
            ))}
          </div>
        </section>

        {/* Map Preview */}
        <MapPreview listingCount={450} />

        {/* Just Arrived */}
        <section>
          <h2 className="text-lg font-bold text-foreground mb-4">Just Arrived</h2>
          <div className="space-y-3">
            {justArrivedListings.map((listing, index) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                variant="list"
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` } as React.CSSProperties}
              />
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
      
      <NotificationsPanel 
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={mockNotifications}
      />
    </div>
  );
}
