import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Car, Settings, Wrench, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BottomNav } from '@/components/BottomNav';
import { ListingCard } from '@/components/ListingCard';
import { ListingCardSkeleton } from '@/components/ListingCardSkeleton';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Listing } from '@/types';
import { cn } from '@/lib/utils';

type FilterType = 'all' | 'vehicle' | 'part' | 'service';
type StatusFilter = 'all' | 'active' | 'sold' | 'expired' | 'draft';

export default function MyListings() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  useEffect(() => {
    async function fetchListings() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('listings')
          .select(`
            *,
            vehicle_attributes(*),
            part_attributes(*),
            service_attributes(*),
            profiles:owner_id(*)
          `)
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const transformed: Listing[] = (data || []).map((item) => ({
          id: item.id,
          ownerId: item.owner_id,
          type: item.type as Listing['type'],
          status: (item.status || 'active') as Listing['status'],
          title: item.title,
          description: item.description || '',
          price: Number(item.price) || 0,
          location: {
            lat: Number(item.location_lat) || 0,
            lng: Number(item.location_lng) || 0,
            city: item.location_city || 'Unknown',
            state: item.location_state || undefined,
          },
          images: item.images || [],
          isPremium: item.is_premium || false,
          isNegotiable: item.is_negotiable || false,
          createdAt: item.created_at || new Date().toISOString(),
          updatedAt: item.updated_at || new Date().toISOString(),
          vehicleAttributes: item.vehicle_attributes
            ? {
                make: item.vehicle_attributes.make || '',
                model: item.vehicle_attributes.model || '',
                year: item.vehicle_attributes.year || new Date().getFullYear(),
                mileage: item.vehicle_attributes.mileage || 0,
                vin: item.vehicle_attributes.vin || undefined,
                fuelType: (item.vehicle_attributes.fuel_type || 'gasoline') as Listing['vehicleAttributes']['fuelType'],
                transmission: (item.vehicle_attributes.transmission || 'automatic') as Listing['vehicleAttributes']['transmission'],
                color: item.vehicle_attributes.color || undefined,
              }
            : undefined,
        }));

        setListings(transformed);
      } catch (error) {
        console.error('Error fetching listings:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchListings();
  }, [user]);

  const filteredListings = listings.filter((listing) => {
    const matchesType = typeFilter === 'all' || listing.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || listing.status === statusFilter;
    return matchesType && matchesStatus;
  });

  const typeFilters: { value: FilterType; label: string; icon: React.ReactNode }[] = [
    { value: 'all', label: 'All', icon: null },
    { value: 'vehicle', label: 'Vehicles', icon: <Car className="w-4 h-4" /> },
    { value: 'part', label: 'Parts', icon: <Settings className="w-4 h-4" /> },
    { value: 'service', label: 'Services', icon: <Wrench className="w-4 h-4" /> },
  ];

  const statusFilters: { value: StatusFilter; label: string; color: string }[] = [
    { value: 'all', label: 'All', color: 'text-foreground' },
    { value: 'active', label: 'Active', color: 'text-success' },
    { value: 'sold', label: 'Sold', color: 'text-primary' },
    { value: 'expired', label: 'Expired', color: 'text-destructive' },
    { value: 'draft', label: 'Draft', color: 'text-warning' },
  ];

  if (authLoading) {
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

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3 safe-top">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">My Listings</h1>
        </div>
      </header>

      {/* Type Filters */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {typeFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setTypeFilter(filter.value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                typeFilter === filter.value
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {filter.icon}
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Status Filters */}
      <div className="px-4 py-2 border-b border-border">
        <div className="flex gap-3 overflow-x-auto no-scrollbar">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={cn(
                "text-sm font-medium whitespace-nowrap transition-colors pb-1",
                statusFilter === filter.value
                  ? `${filter.color} border-b-2 border-current`
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Listings */}
      <div className="px-4 py-4">
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <ListingCardSkeleton key={i} variant="list" />
            ))}
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No listings found</p>
            <Button
              variant="carnexo"
              className="mt-4"
              onClick={() => navigate('/publish')}
            >
              Create Listing
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} variant="list" />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
