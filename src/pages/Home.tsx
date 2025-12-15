import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, ChevronRight, Bell, Loader2 } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { SearchBar } from '@/components/SearchBar';
import { SegmentedControl } from '@/components/SegmentedControl';
import { CategoryFilter } from '@/components/CategoryFilter';
import { ListingCard } from '@/components/ListingCard';
import { ListingCardSkeleton } from '@/components/ListingCardSkeleton';
import { MapPreview } from '@/components/MapPreview';
import { NotificationsPanel } from '@/components/NotificationsPanel';
import { FilterSheet, FilterOptions } from '@/components/FilterSheet';
import { PullToRefresh } from '@/components/PullToRefresh';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useNearbyListings, SearchFilters } from '@/hooks/useNearbyListings';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { useConversations } from '@/hooks/useConversations';
import { vehicleCategories, serviceCategories } from '@/data/mockData';
import { Listing } from '@/types';
import { LocationPermissionModal } from '@/components/LocationPermissionModal';
import logo from '@/assets/logo.png';

const segments = [
  { id: 'vehicles', label: 'Vehicles & Parts' },
  { id: 'services', label: 'Service Providers' },
];

const defaultFilters: FilterOptions = {
  priceRange: [0, 1000000],
  maxDistance: 50,
  minRating: 0,
  condition: [],
};

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [segment, setSegment] = useState<'vehicles' | 'services'>('vehicles');
  const [category, setCategory] = useState('all');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>(defaultFilters);
  const { unreadCount } = useUnreadMessages();
  const { conversations } = useConversations();

  const searchFilters: SearchFilters = useMemo(() => ({
    query: searchQuery,
    category,
    ...filters,
  }), [searchQuery, category, filters]);

  const { 
    listings: nearbyListings, 
    loading: listingsLoading, 
    showLocationModal, 
    setShowLocationModal, 
    requestLocation,
    refresh
  } = useNearbyListings(segment, searchFilters);

  // Transform DB listings to match ListingCard format
  const transformedListings: Listing[] = useMemo(() => 
    nearbyListings.map(l => ({
      id: l.id,
      ownerId: l.owner_id || '',
      type: l.type,
      status: 'active' as const,
      title: l.title,
      description: l.description || '',
      price: l.price || 0,
      location: {
        lat: l.location_lat || 0,
        lng: l.location_lng || 0,
        city: l.location_city || 'Unknown',
        state: l.location_state || undefined,
      },
      distance: l.distance ? parseFloat(l.distance.toFixed(1)) : undefined,
      images: l.images || ['/placeholder.svg'],
      isPremium: l.is_premium || false,
      isNegotiable: l.is_negotiable || false,
      createdAt: l.created_at || new Date().toISOString(),
      updatedAt: l.created_at || new Date().toISOString(),
    }))
  , [nearbyListings]);

  const featuredListings = transformedListings.filter(l => l.isPremium).slice(0, 3);

  const { displayedItems, hasMore, isLoading, reset } = useInfiniteScroll(transformedListings, {
    initialLimit: 6,
    increment: 6,
  });

  // Reset scroll when segment changes
  useEffect(() => {
    reset();
  }, [segment, reset]);

  const handleSegmentChange = (id: string) => {
    setSegment(id as 'vehicles' | 'services');
    setCategory('all'); // Reset category when changing segment
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <PullToRefresh onRefresh={refresh} className="min-h-full">
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
          <div className="flex justify-center">
            <SegmentedControl
              options={segments}
              selected={segment}
              onSelect={handleSegmentChange}
            />
          </div>
          <SearchBar 
            onSearch={setSearchQuery}
            onFilter={() => setIsFilterOpen(true)}
          />
          <CategoryFilter
            categories={segment === 'vehicles' ? vehicleCategories : serviceCategories}
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
            <button 
              onClick={() => navigate('/featured')}
              className="text-sm font-medium text-primary flex items-center gap-1"
            >
              See all
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto hide-scrollbar -mx-4 px-4 pb-2">
            {listingsLoading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <ListingCardSkeleton key={i} variant="featured" />
                ))}
              </>
            ) : featuredListings.length > 0 ? (
              featuredListings.map((listing, index) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  variant="featured"
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` } as React.CSSProperties}
                />
              ))
            ) : (
              <p className="text-muted-foreground text-sm py-4">No featured listings nearby</p>
            )}
          </div>
        </section>

        {/* Map Preview */}
        <MapPreview listingCount={nearbyListings.length} onClick={() => navigate('/map')} />

        {/* Just Arrived */}
        <section>
          <h2 className="text-lg font-bold text-foreground mb-4">Just Arrived</h2>
          <div className="grid grid-cols-2 gap-2">
            {listingsLoading ? (
              <>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <ListingCardSkeleton key={i} variant="grid" />
                ))}
              </>
            ) : displayedItems.length > 0 ? (
              displayedItems.map((listing, index) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  variant="grid"
                  className="animate-fade-in"
                  style={{ animationDelay: `${Math.min(index, 5) * 50}ms` } as React.CSSProperties}
                />
              ))
            ) : (
              <p className="text-muted-foreground text-sm py-4 col-span-2 text-center">
                No listings found nearby
              </p>
            )}
          </div>
          {!listingsLoading && isLoading && (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          )}
          {!listingsLoading && !hasMore && displayedItems.length > 0 && (
            <p className="text-center text-muted-foreground text-sm py-6">
              You've seen all listings
            </p>
          )}
        </section>
        </main>
      </PullToRefresh>

      <BottomNav />
      
      <NotificationsPanel 
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        conversations={conversations}
        onViewAll={() => {
          setIsNotificationsOpen(false);
          navigate('/messages');
        }}
      />
      
      <FilterSheet
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onApply={setFilters}
      />
      
      <LocationPermissionModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onRetry={requestLocation}
      />
    </div>
  );
}
