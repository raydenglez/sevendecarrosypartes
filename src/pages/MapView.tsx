import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

export default function MapView() {
  const { t } = useTranslation();
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
  const [dbListings, setDbListings] = useState<Listing[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(true);

  // Fetch listings from database
  useEffect(() => {
    const fetchListings = async () => {
      setIsLoadingListings(true);
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('status', 'active');

      if (error) {
        console.error('Error fetching listings:', error);
        setIsLoadingListings(false);
        return;
      }

      const transformed: Listing[] = (data || []).map(l => ({
        id: l.id,
        ownerId: l.owner_id,
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
        images: l.images || ['/placeholder.svg'],
        isPremium: l.is_premium || false,
        isNegotiable: l.is_negotiable || false,
        createdAt: l.created_at || new Date().toISOString(),
        updatedAt: l.updated_at || new Date().toISOString(),
      }));

      setDbListings(transformed);
      setIsLoadingListings(false);
    };

    fetchListings();
  }, []);

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
    return dbListings.filter(listing => {
      const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           listing.location.city.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || listing.type === filterType;
      return matchesSearch && matchesType && listing.location?.lat && listing.location?.lng;
    });
  }, [dbListings, searchQuery, filterType]);

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
              placeholder={t('map.searchLocations')}
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
              {t(`map.filterTypes.${type}`)}
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

      {/* Loading Location Indicator */}
      {isLoadingLocation && (
        <div className="absolute top-32 left-1/2 -translate-x-1/2 z-10">
          <div className="flex items-center gap-2 bg-card/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-card">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-sm">{t('map.gettingLocation')}</span>
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
              {t('map.viewListings', { count: filteredListings.length })}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
            <SheetHeader>
              <SheetTitle>{t('map.nearbyListings')}</SheetTitle>
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
