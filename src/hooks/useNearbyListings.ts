import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from '@/contexts/LocationContext';

interface DBListing {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  type: 'vehicle' | 'part' | 'service';
  images: string[] | null;
  location_city: string | null;
  location_state: string | null;
  location_lat: number | null;
  location_lng: number | null;
  is_premium: boolean | null;
  is_sponsored: boolean | null;
  sponsored_until: string | null;
  is_negotiable: boolean | null;
  created_at: string | null;
  owner_id: string;
  distance?: number;
}

// Helper to check if sponsorship is active (not expired)
function isSponsorshipActive(listing: DBListing): boolean {
  if (!listing.is_sponsored) return false;
  if (!listing.sponsored_until) return true; // No expiration = always active
  return new Date(listing.sponsored_until) > new Date();
}

export interface SearchFilters {
  query: string;
  priceRange: [number, number];
  maxDistance: number;
  minRating: number;
  condition: string[];
  category: string;
}

// Haversine formula to calculate distance between two coordinates
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function useNearbyListings(segment: 'vehicles' | 'services', filters?: SearchFilters) {
  const [listings, setListings] = useState<DBListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Use shared location context
  const { 
    userLocation, 
    locationDenied, 
    showLocationModal, 
    setShowLocationModal, 
    requestLocation 
  } = useLocation();

  // Fetch and sort listings
  useEffect(() => {
    if (!userLocation) return;

    const fetchListings = async () => {
      setLoading(true);
      
      let query = supabase
        .from('listings')
        .select('*, service_attributes(service_category)')
        .eq('status', 'active');

      // Filter by segment
      if (segment === 'vehicles') {
        query = query.in('type', ['vehicle', 'part']);
      } else {
        query = query.eq('type', 'service');
      }

      // Filter by category
      if (filters?.category && filters.category !== 'all') {
        if (filters.category === 'vehicles') {
          query = query.eq('type', 'vehicle');
        } else if (filters.category === 'parts') {
          query = query.eq('type', 'part');
        }
        // Service categories are filtered client-side after join
      }

      // Apply price filter
      if (filters?.priceRange) {
        query = query.gte('price', filters.priceRange[0]).lte('price', filters.priceRange[1]);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching listings:', error);
        setLoading(false);
        return;
      }

      // Calculate distance and apply client-side filters
      let listingsWithDistance = (data || [])
        .map((listing) => ({
          ...listing,
          distance:
            listing.location_lat && listing.location_lng
              ? calculateDistance(
                  userLocation.lat,
                  userLocation.lng,
                  listing.location_lat,
                  listing.location_lng
                )
              : Infinity,
        }));

      // Apply search query filter
      if (filters?.query) {
        const searchLower = filters.query.toLowerCase();
        listingsWithDistance = listingsWithDistance.filter(
          (l) =>
            l.title.toLowerCase().includes(searchLower) ||
            l.description?.toLowerCase().includes(searchLower) ||
            l.location_city?.toLowerCase().includes(searchLower)
        );
      }

      // Apply max distance filter
      if (filters?.maxDistance) {
        listingsWithDistance = listingsWithDistance.filter(
          (l) => l.distance <= filters.maxDistance
        );
      }

      // Filter by service category (client-side for joined data)
      if (filters?.category && !['all', 'vehicles', 'parts'].includes(filters.category)) {
        listingsWithDistance = listingsWithDistance.filter((l: any) => {
          const serviceAttrs = l.service_attributes;
          return serviceAttrs?.service_category === filters.category;
        });
      }

      // Sort: Active sponsored first, then by proximity
      listingsWithDistance.sort((a, b) => {
        const aSponsored = isSponsorshipActive(a);
        const bSponsored = isSponsorshipActive(b);
        // Active sponsored listings always come first
        if (aSponsored && !bSponsored) return -1;
        if (!aSponsored && bSponsored) return 1;
        // Then sort by distance
        return a.distance - b.distance;
      });

      setListings(listingsWithDistance as DBListing[]);
      setLoading(false);
    };

    fetchListings();
  }, [userLocation, segment, filters?.query, filters?.priceRange, filters?.maxDistance, filters?.minRating, filters?.condition, filters?.category, refreshKey]);

  const refresh = useCallback(async () => {
    setRefreshKey(prev => prev + 1);
    // Return a promise that resolves when loading is complete
    return new Promise<void>((resolve) => {
      setTimeout(resolve, 500); // Give time for the fetch to start
    });
  }, []);

  // Helper to force refresh location
  const refreshLocation = useCallback(() => {
    return requestLocation(true);
  }, [requestLocation]);

  return { 
    listings, 
    loading, 
    userLocation, 
    locationDenied, 
    showLocationModal, 
    setShowLocationModal, 
    requestLocation: refreshLocation,
    refresh
  };
}
