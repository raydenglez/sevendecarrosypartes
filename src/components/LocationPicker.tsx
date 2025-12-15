import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Navigation, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

const MAPBOX_TOKEN = 'pk.eyJ1IjoicmF5ZGVuZ2xleiIsImEiOiJjbWoyMmNmazMwN3dxM2ZxMWx6YWh6NWNpIn0.1ktomA51sIeX7o7QGB2y9w';

interface LocationData {
  lat: number;
  lng: number;
  city: string;
  state: string;
  address?: string;
}

interface LocationPickerProps {
  open: boolean;
  onClose: () => void;
  onLocationSelect: (location: LocationData) => void;
  initialLocation?: LocationData | null;
}

export function LocationPicker({
  open,
  onClose,
  onLocationSelect,
  initialLocation,
}: LocationPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(initialLocation || null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Reverse geocode coordinates to get address
  const reverseGeocode = useCallback(async (lng: number, lat: number): Promise<Partial<LocationData>> => {
    try {
      setIsGeocoding(true);
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&types=place,region,address`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const context = feature.context || [];
        
        let city = '';
        let state = '';
        let address = feature.place_name || '';
        
        // Extract city and state from context
        for (const item of context) {
          if (item.id.startsWith('place')) {
            city = item.text;
          } else if (item.id.startsWith('region')) {
            state = item.short_code?.replace('US-', '') || item.text;
          }
        }
        
        // If place type is 'place', it's the city
        if (feature.place_type?.includes('place')) {
          city = feature.text;
        }
        
        return { city, state, address };
      }
      
      return { city: 'Unknown', state: '', address: '' };
    } catch (error) {
      console.error('Geocoding error:', error);
      return { city: 'Unknown', state: '', address: '' };
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  // Update marker position
  const updateMarker = useCallback((lng: number, lat: number) => {
    if (!map.current) return;

    if (markerRef.current) {
      markerRef.current.setLngLat([lng, lat]);
    } else {
      // Create custom marker element
      const el = document.createElement('div');
      el.innerHTML = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
        ">
          <div style="
            width: 40px;
            height: 40px;
            background: hsl(24, 100%, 50%);
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(255, 106, 0, 0.4);
          ">
            <svg 
              style="transform: rotate(45deg); width: 20px; height: 20px; color: white;"
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              stroke-width="2"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <div style="
            width: 8px;
            height: 8px;
            background: hsl(24, 100%, 50%);
            border-radius: 50%;
            margin-top: -4px;
            opacity: 0.6;
          "></div>
        </div>
      `;

      markerRef.current = new mapboxgl.Marker({ 
        element: el, 
        anchor: 'bottom',
        draggable: true 
      })
        .setLngLat([lng, lat])
        .addTo(map.current);

      // Handle marker drag
      markerRef.current.on('dragend', async () => {
        const lngLat = markerRef.current?.getLngLat();
        if (lngLat) {
          const geoData = await reverseGeocode(lngLat.lng, lngLat.lat);
          setSelectedLocation({
            lat: lngLat.lat,
            lng: lngLat.lng,
            city: geoData.city || 'Unknown',
            state: geoData.state || '',
            address: geoData.address,
          });
        }
      });
    }
  }, [reverseGeocode]);

  // Initialize map
  useEffect(() => {
    if (!open || !mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    const initialCenter: [number, number] = initialLocation 
      ? [initialLocation.lng, initialLocation.lat]
      : [-80.1918, 25.7617]; // Default to Miami

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: initialCenter,
      zoom: 13,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: false }),
      'top-right'
    );

    map.current.on('style.load', () => {
      if (!map.current) return;
      
      map.current.setFog({
        color: 'hsl(220, 20%, 7%)',
        'high-color': 'hsl(220, 25%, 12%)',
        'horizon-blend': 0.1,
      });
      
      setMapLoaded(true);
    });

    // Handle map click to place marker
    map.current.on('click', async (e) => {
      const { lng, lat } = e.lngLat;
      updateMarker(lng, lat);
      
      const geoData = await reverseGeocode(lng, lat);
      setSelectedLocation({
        lat,
        lng,
        city: geoData.city || 'Unknown',
        state: geoData.state || '',
        address: geoData.address,
      });
    });

    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
      map.current?.remove();
      map.current = null;
      setMapLoaded(false);
    };
  }, [open, initialLocation, updateMarker, reverseGeocode]);

  // Set initial marker if location exists
  useEffect(() => {
    if (mapLoaded && initialLocation && map.current) {
      updateMarker(initialLocation.lng, initialLocation.lat);
      setSelectedLocation(initialLocation);
    }
  }, [mapLoaded, initialLocation, updateMarker]);

  // Detect user's current location
  const detectLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsDetecting(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        if (map.current) {
          map.current.flyTo({
            center: [longitude, latitude],
            zoom: 15,
            duration: 1500,
          });
        }
        
        updateMarker(longitude, latitude);
        
        const geoData = await reverseGeocode(longitude, latitude);
        setSelectedLocation({
          lat: latitude,
          lng: longitude,
          city: geoData.city || 'Unknown',
          state: geoData.state || '',
          address: geoData.address,
        });
        
        setIsDetecting(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsDetecting(false);
        alert('Unable to detect your location. Please enable location services or select manually on the map.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [updateMarker, reverseGeocode]);

  // Search for a location
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${MAPBOX_TOKEN}&limit=1`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const [lng, lat] = feature.center;
        
        if (map.current) {
          map.current.flyTo({
            center: [lng, lat],
            zoom: 14,
            duration: 1500,
          });
        }
        
        updateMarker(lng, lat);
        
        const geoData = await reverseGeocode(lng, lat);
        setSelectedLocation({
          lat,
          lng,
          city: geoData.city || feature.text || 'Unknown',
          state: geoData.state || '',
          address: geoData.address || feature.place_name,
        });
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <DialogTitle>Select Location</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search bar */}
          <div className="px-4 py-3 border-b border-border flex gap-2">
            <div className="flex-1 relative">
              <Input
                placeholder="Search for an address or place..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pr-10"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
            <Button 
              variant="outline" 
              onClick={handleSearch}
              disabled={isSearching}
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
            </Button>
          </div>

          {/* Map container */}
          <div className="flex-1 relative">
            <div ref={mapContainer} className="absolute inset-0" />
            
            {/* Detect location button */}
            <Button
              variant="secondary"
              size="sm"
              className="absolute bottom-4 left-4 shadow-lg"
              onClick={detectLocation}
              disabled={isDetecting}
            >
              {isDetecting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Navigation className="w-4 h-4 mr-2" />
              )}
              Detect My Location
            </Button>

            {/* Selected location info */}
            {selectedLocation && (
              <div className="absolute top-4 left-4 right-4 bg-card/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-border">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    {isGeocoding ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span className="text-sm">Getting address...</span>
                      </div>
                    ) : (
                      <>
                        <p className="font-medium text-sm truncate">
                          {selectedLocation.city}{selectedLocation.state ? `, ${selectedLocation.state}` : ''}
                        </p>
                        {selectedLocation.address && (
                          <p className="text-xs text-muted-foreground truncate">
                            {selectedLocation.address}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Instructions */}
            {!selectedLocation && (
              <div className="absolute top-4 left-4 right-4 bg-card/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-border">
                <p className="text-sm text-muted-foreground text-center">
                  Click on the map to pin your location or use "Detect My Location"
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant="carnexo" 
            onClick={handleConfirm}
            disabled={!selectedLocation || isGeocoding}
          >
            Confirm Location
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
