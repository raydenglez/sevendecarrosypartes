import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  is_negotiable: boolean | null;
  created_at: string | null;
  owner_id: string;
  distance?: number;
}

export interface SearchFilters {
  query: string;
  priceRange: [number, number];
  maxDistance: number;
  minRating: number;
  condition: string[];
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
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          // Default to San Luis, Argentina if location denied
          setUserLocation({ lat: -33.3, lng: -66.35 });
        }
      );
    } else {
      setUserLocation({ lat: -33.3, lng: -66.35 });
    }
  }, []);

  // Fetch and sort listings
  useEffect(() => {
    if (!userLocation) return;

    const fetchListings = async () => {
      setLoading(true);
      
      let query = supabase
        .from('listings')
        .select('*')
        .eq('status', 'active');

      // Filter by segment
      if (segment === 'vehicles') {
        query = query.in('type', ['vehicle', 'part']);
      } else {
        query = query.eq('type', 'service');
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

      // Sort by proximity
      listingsWithDistance.sort((a, b) => a.distance - b.distance);

      setListings(listingsWithDistance as DBListing[]);
      setLoading(false);
    };

    fetchListings();
  }, [userLocation, segment, filters?.query, filters?.priceRange, filters?.maxDistance, filters?.minRating, filters?.condition]);

  return { listings, loading, userLocation };
}
