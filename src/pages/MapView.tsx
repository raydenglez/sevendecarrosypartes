import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Filter, List, Layers, Search, X, Navigation, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Map, getTravelTime } from '@/components/Map';
import { MapBusinessCard } from '@/components/MapBusinessCard';
import { ListingCard } from '@/components/ListingCard';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Listing } from '@/types';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Tables } from '@/integrations/supabase/types';

// Transform Supabase data to Listing type
function transformListing(
  dbListing: Tables<'listings'>,
  profile?: Tables<'profiles'> | null,
  vehicleAttrs?: Tables<'vehicle_attributes'> | null,
  partAttrs?: Tables<'part_attributes'> | null,
  serviceAttrs?: Tables<'service_attributes'> | null
): Listing | null {
  if (!dbListing.location_lat || !dbListing.location_lng) return null;

  return {
    id: dbListing.id,
    ownerId: dbListing.owner_id,
    owner: profile ? {
      id: profile.id,
      name: profile.full_name || 'Unknown',
      email: profile.email || '',
      phone: profile.phone || undefined,
      location: {
        lat: profile.location_lat || 0,
        lng: profile.location_lng || 0,
        city: profile.location_city || '',
        state: profile.location_state || undefined,
      },
      avatarUrl: profile.avatar_url || undefined,
      type: profile.user_type === 'dealer' ? 'pro_seller' : profile.user_type === 'service_provider' ? 'service_provider' : 'user',
      ratingAvg: profile.rating_avg || 0,
      totalReviews: profile.rating_count || 0,
      memberSince: profile.created_at ? new Date(profile.created_at).getFullYear().toString() : '',
      isVerified: profile.is_verified || false,
      badges: [],
    } : undefined,
    type: dbListing.type,
    status: dbListing.status === 'active' ? 'active' : dbListing.status === 'sold' ? 'sold' : 'inactive',
    title: dbListing.title,
    description: dbListing.description || '',
    price: dbListing.price || 0,
    location: {
      lat: dbListing.location_lat,
      lng: dbListing.location_lng,
      city: dbListing.location_city || '',
      state: dbListing.location_state || undefined,
    },
    images: dbListing.images || [],
    isPremium: dbListing.is_premium || false,
    isNegotiable: dbListing.is_negotiable || false,
    createdAt: dbListing.created_at || new Date().toISOString(),
    updatedAt: dbListing.updated_at || new Date().toISOString(),
    vehicleAttributes: vehicleAttrs ? {
      make: vehicleAttrs.make || '',
      model: vehicleAttrs.model || '',
      year: vehicleAttrs.year || 0,
      mileage: vehicleAttrs.mileage || 0,
      vin: vehicleAttrs.vin || undefined,
      fuelType: (vehicleAttrs.fuel_type as any) || 'gasoline',
      transmission: (vehicleAttrs.transmission as any) || 'automatic',
      color: vehicleAttrs.color || undefined,
    } : undefined,
    partAttributes: partAttrs ? {
      category: partAttrs.part_category || '',
      compatibilityTags: [...(partAttrs.compatible_makes || []), ...(partAttrs.compatible_models || [])],
      condition: (partAttrs.condition as any) || 'good',
    } : undefined,
    serviceAttributes: serviceAttrs ? {
      serviceCategory: serviceAttrs.service_category || '',
      priceStructure: serviceAttrs.price_structure || undefined,
      availability: serviceAttrs.availability || undefined,
    } : undefined,
  };
}

export default function MapView() {
  const navigate = useNavigate();
  const [showListings, setShowListings] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [travelTime, setTravelTime] = useState<{ driving: string; walking: string; distance: string } | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'vehicle' | 'part' | 'service'>('all');
  const [showRoute, setShowRoute] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-122.4194, 37.7749]);

  // Fetch listings from Supabase
  const { data: listings = [], isLoading: isLoadingListings } = useQuery({
    queryKey: ['map-listings'],
    queryFn: async () => {
      // Fetch all active listings with location data
      const { data: dbListings, error: listingsError } = await supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
        .not('location_lat', 'is', null)
        .not('location_lng', 'is', null);

      if (listingsError) throw listingsError;
      if (!dbListings?.length) return [];

      // Get unique owner IDs
      const ownerIds = [...new Set(dbListings.map(l => l.owner_id))];
      
      // Fetch profiles for all owners
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', ownerIds);

      // Fetch vehicle attributes
      const vehicleListingIds = dbListings.filter(l => l.type === 'vehicle').map(l => l.id);
      const { data: vehicleAttrs } = vehicleListingIds.length 
        ? await supabase.from('vehicle_attributes').select('*').in('listing_id', vehicleListingIds)
        : { data: [] };

      // Fetch part attributes
      const partListingIds = dbListings.filter(l => l.type === 'part').map(l => l.id);
      const { data: partAttrs } = partListingIds.length
        ? await supabase.from('part_attributes').select('*').in('listing_id', partListingIds)
        : { data: [] };

      // Fetch service attributes
      const serviceListingIds = dbListings.filter(l => l.type === 'service').map(l => l.id);
      const { data: serviceAttrs } = serviceListingIds.length
        ? await supabase.from('service_attributes').select('*').in('listing_id', serviceListingIds)
        : { data: [] };

      // Transform listings
      const transformed: Listing[] = [];
      for (const listing of dbListings) {
        const profile = profiles?.find(p => p.id === listing.owner_id);
        const vehicleAttr = vehicleAttrs?.find(v => v.listing_id === listing.id);
        const partAttr = partAttrs?.find(p => p.listing_id === listing.id);
        const serviceAttr = serviceAttrs?.find(s => s.listing_id === listing.id);

        const transformedListing = transformListing(listing, profile, vehicleAttr, partAttr, serviceAttr);
        if (transformedListing) {
          transformed.push(transformedListing);
        }
      }

      return transformed;
    },
  });

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc: [number, number] = [position.coords.longitude, position.coords.latitude];
          setUserLocation(loc);
          setMapCenter(loc);
          setIsLoadingLocation(false);
        },
        (error) => {
          console.log('Geolocation error:', error);
          setIsLoadingLocation(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      setIsLoadingLocation(false);
    }
  }, []);

  // Filter listings
  const filteredListings = useMemo(() => {
    return listings.filter(listing => {
      const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           listing.location.city.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || listing.type === filterType;
      return matchesSearch && matchesType && listing.location?.lat && listing.location?.lng;
    });
  }, [listings, searchQuery, filterType]);

  // Handle marker click
  const handleMarkerClick = useCallback(async (listing: Listing) => {
    setSelectedListing(listing);
    setShowRoute(false);
    
    if (userLocation && listing.location) {
      const time = await getTravelTime(
        userLocation,
        [listing.location.lng, listing.location.lat]
      );
      setTravelTime(time);
    }
  }, [userLocation]);

  // Handle get directions
  const handleGetDirections = useCallback(() => {
    if (selectedListing?.location) {
      setShowRoute(true);
    }
  }, [selectedListing]);

  // Handle view details
  const handleViewDetails = useCallback(() => {
    if (selectedListing) {
      navigate(`/listing/${selectedListing.id}`);
    }
  }, [selectedListing, navigate]);

  // Close selected listing
  const handleCloseCard = useCallback(() => {
    setSelectedListing(null);
    setTravelTime(null);
    setShowRoute(false);
  }, []);

  // Default center (San Francisco area, or first listing if available)
  const defaultCenter: [number, number] = userLocation || 
    (filteredListings.length > 0 && filteredListings[0].location
      ? [filteredListings[0].location.lng, filteredListings[0].location.lat]
      : [-122.4194, 37.7749]);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 safe-top">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-card/90 backdrop-blur-sm shadow-card hover:bg-card shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search locations..."
              className="pl-10 bg-card/90 backdrop-blur-sm border-0 shadow-card"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="w-10 h-10 rounded-full bg-card/90 backdrop-blur-sm shadow-card hover:bg-card shrink-0"
          >
            <Layers className="w-5 h-5" />
          </Button>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 mt-3 overflow-x-auto hide-scrollbar">
          {(['all', 'vehicle', 'service', 'part'] as const).map((type) => (
            <Badge
              key={type}
              variant={filterType === type ? 'default' : 'secondary'}
              className={`cursor-pointer shrink-0 ${filterType === type ? 'bg-primary text-primary-foreground' : 'bg-card/90 backdrop-blur-sm'}`}
              onClick={() => setFilterType(type)}
            >
              {type === 'all' ? 'All' : type === 'vehicle' ? 'Vehicles' : type === 'service' ? 'Services' : 'Parts'}
            </Badge>
          ))}
        </div>
      </div>

      {/* Map */}
      <Map 
        center={mapCenter}
        zoom={12}
        listings={filteredListings}
        onMarkerClick={handleMarkerClick}
        showRoute={showRoute}
        destination={selectedListing?.location ? [selectedListing.location.lng, selectedListing.location.lat] : undefined}
        userLocation={userLocation || undefined}
        className="flex-1"
      />

      {/* Loading Indicator */}
      {(isLoadingLocation || isLoadingListings) && (
        <div className="absolute top-32 left-1/2 -translate-x-1/2 z-10">
          <div className="flex items-center gap-2 bg-card/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-card">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-sm">{isLoadingLocation ? 'Getting location...' : 'Loading listings...'}</span>
          </div>
        </div>
      )}

      {/* Selected Listing Card */}
      {selectedListing && (
        <div className="absolute bottom-24 left-4 right-4 z-10 safe-bottom">
          <MapBusinessCard
            listing={selectedListing}
            travelTime={travelTime || undefined}
            onClose={handleCloseCard}
            onGetDirections={handleGetDirections}
            onViewDetails={handleViewDetails}
          />
        </div>
      )}

      {/* Bottom Sheet for Listings */}
      {!selectedListing && (
        <Sheet open={showListings} onOpenChange={setShowListings}>
          <SheetTrigger asChild>
            <Button
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 rounded-full shadow-orange safe-bottom"
            >
              <List className="w-4 h-4 mr-2" />
              View {filteredListings.length} Listings
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
            <SheetHeader>
              <SheetTitle>Nearby Listings</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-4 overflow-y-auto h-[calc(100%-4rem)] hide-scrollbar pb-6">
              {filteredListings.map((listing) => (
                <div 
                  key={listing.id}
                  onClick={() => {
                    setShowListings(false);
                    handleMarkerClick(listing);
                    if (listing.location) {
                      setMapCenter([listing.location.lng, listing.location.lat]);
                    }
                  }}
                  className="cursor-pointer"
                >
                  <ListingCard listing={listing} variant="list" />
                </div>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Recenter Button */}
      {userLocation && !selectedListing && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMapCenter(userLocation)}
          className="absolute bottom-20 right-4 z-10 w-12 h-12 rounded-full bg-card/90 backdrop-blur-sm shadow-card hover:bg-card"
        >
          <Navigation className="w-5 h-5" />
        </Button>
      )}
    </div>
  );
}
