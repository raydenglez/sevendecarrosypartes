import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Listing } from '@/types';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoicmF5ZGVuZ2xleiIsImEiOiJjbWphZXRrOXYwNWE5M2NvYjVyYXF2cWYwIn0.gf5T_m7h8riFgLoPsPFyBg';

interface MapProps {
  center?: [number, number];
  zoom?: number;
  className?: string;
  listings?: Listing[];
  onMarkerClick?: (listing: Listing) => void;
  showRoute?: boolean;
  destination?: [number, number];
  userLocation?: [number, number];
}

export function Map({ 
  center = [-122.4194, 37.7749], 
  zoom = 12, 
  className = '',
  listings = [],
  onMarkerClick,
  showRoute = false,
  destination,
  userLocation,
}: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Create custom marker element
  const createMarkerElement = useCallback((listing: Listing, isSelected: boolean = false) => {
    const el = document.createElement('div');
    el.className = 'carnetworx-map-marker';
    
    const priceText = listing.type === 'service' 
      ? `$${listing.price}` 
      : `$${(listing.price / 1000).toFixed(0)}k`;
    
    const bgColor = isSelected 
      ? 'hsl(24, 100%, 50%)' 
      : listing.isPremium 
        ? 'hsl(24, 100%, 50%)' 
        : 'hsl(220, 25%, 15%)';
    
    const borderColor = isSelected ? 'hsl(24, 100%, 60%)' : 'hsl(220, 20%, 25%)';
    
    el.innerHTML = `
      <div style="
        background: ${bgColor};
        border: 2px solid ${borderColor};
        border-radius: 20px;
        padding: 6px 12px;
        font-size: 12px;
        font-weight: 600;
        color: white;
        white-space: nowrap;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transform: ${isSelected ? 'scale(1.1)' : 'scale(1)'};
        transition: transform 0.2s ease;
      ">
        ${priceText}
      </div>
      <div style="
        width: 0;
        height: 0;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-top: 8px solid ${bgColor};
        margin: 0 auto;
        margin-top: -1px;
      "></div>
    `;
    
    el.addEventListener('mouseenter', () => {
      const inner = el.querySelector('div') as HTMLElement;
      if (inner && !isSelected) inner.style.transform = 'scale(1.05)';
    });
    
    el.addEventListener('mouseleave', () => {
      const inner = el.querySelector('div') as HTMLElement;
      if (inner && !isSelected) inner.style.transform = 'scale(1)';
    });
    
    return el;
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;
    
    // Clean up existing map first
    if (map.current) {
      map.current.remove();
      map.current = null;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: center,
      zoom: zoom,
      pitch: 45,
      bearing: -17.6,
    });
    
    map.current = mapInstance;

    map.current.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: true }),
      'top-right'
    );

    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true
      }),
      'top-right'
    );

    map.current.on('style.load', () => {
      if (!map.current) return;

      map.current.setFog({
        color: 'hsl(220, 20%, 7%)',
        'high-color': 'hsl(220, 25%, 12%)',
        'horizon-blend': 0.1,
      });

      // Add 3D buildings
      const layers = map.current.getStyle().layers;
      const labelLayerId = layers?.find(
        (layer) => layer.type === 'symbol' && layer.layout?.['text-field']
      )?.id;

      map.current.addLayer(
        {
          id: 'add-3d-buildings',
          source: 'composite',
          'source-layer': 'building',
          filter: ['==', 'extrude', 'true'],
          type: 'fill-extrusion',
          minzoom: 15,
          paint: {
            'fill-extrusion-color': 'hsl(220, 25%, 18%)',
            'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 15, 0, 15.05, ['get', 'height']],
            'fill-extrusion-base': ['interpolate', ['linear'], ['zoom'], 15, 0, 15.05, ['get', 'min_height']],
            'fill-extrusion-opacity': 0.6
          }
        },
        labelLayerId
      );

      setMapLoaded(true);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update markers when listings change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    listings.forEach((listing) => {
      if (!listing.location?.lat || !listing.location?.lng) return;

      const el = createMarkerElement(listing);
      
      el.addEventListener('click', () => {
        onMarkerClick?.(listing);
      });

      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([listing.location.lng, listing.location.lat])
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
  }, [listings, mapLoaded, createMarkerElement, onMarkerClick]);

  // Add user location marker
  useEffect(() => {
    if (!map.current || !mapLoaded || !userLocation) {
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      return;
    }

    // Remove existing user marker
    userMarkerRef.current?.remove();

    // Create custom user location element with pulsing effect
    const el = document.createElement('div');
    el.className = 'user-location-marker';
    el.innerHTML = `
      <div style="
        position: relative;
        width: 20px;
        height: 20px;
      ">
        <div style="
          position: absolute;
          inset: 0;
          background: hsl(210, 100%, 60%);
          border-radius: 50%;
          animation: userPulse 2s ease-out infinite;
        "></div>
        <div style="
          position: absolute;
          inset: 4px;
          background: hsl(210, 100%, 50%);
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        "></div>
      </div>
    `;

    // Add keyframes for pulse animation
    if (!document.getElementById('user-marker-styles')) {
      const style = document.createElement('style');
      style.id = 'user-marker-styles';
      style.textContent = `
        @keyframes userPulse {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(3); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    userMarkerRef.current = new mapboxgl.Marker({ element: el, anchor: 'center' })
      .setLngLat(userLocation)
      .addTo(map.current);

  }, [userLocation, mapLoaded]);

  // Draw route when destination is set
  useEffect(() => {
    if (!map.current || !mapLoaded || !showRoute || !destination || !userLocation) return;

    const drawRoute = async () => {
      try {
        const response = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${userLocation[0]},${userLocation[1]};${destination[0]},${destination[1]}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`
        );
        
        const data = await response.json();
        
        if (data.routes && data.routes[0]) {
          const route = data.routes[0].geometry;

          // Remove existing route layer if present
          if (map.current!.getSource('route')) {
            map.current!.removeLayer('route');
            map.current!.removeSource('route');
          }

          map.current!.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: route
            }
          });

          map.current!.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': 'hsl(24, 100%, 50%)',
              'line-width': 6,
              'line-opacity': 0.8
            }
          });

          // Fit bounds to show the entire route
          const coordinates = route.coordinates;
          const bounds = coordinates.reduce((bounds: mapboxgl.LngLatBounds, coord: [number, number]) => {
            return bounds.extend(coord);
          }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

          map.current!.fitBounds(bounds, { padding: 80 });
        }
      } catch (error) {
        console.error('Error fetching route:', error);
      }
    };

    drawRoute();
  }, [showRoute, destination, userLocation, mapLoaded]);

  // Update center when it changes
  useEffect(() => {
    if (map.current && mapLoaded) {
      map.current.flyTo({ center, zoom, duration: 1500 });
    }
  }, [center, zoom, mapLoaded]);

  return (
    <div className={`relative w-full h-full min-h-[300px] ${className}`}>
      <div ref={mapContainer} className="absolute inset-0" />
      <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-border/20" />
    </div>
  );
}

// Utility function to get travel time
export async function getTravelTime(
  origin: [number, number],
  destination: [number, number]
): Promise<{ driving: string; walking: string; distance: string } | null> {
  try {
    const response = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?access_token=${MAPBOX_TOKEN}`
    );
    
    const data = await response.json();
    
    if (data.routes && data.routes[0]) {
      const durationSec = data.routes[0].duration;
      const distanceM = data.routes[0].distance;
      
      const drivingMins = Math.round(durationSec / 60);
      const walkingMins = Math.round((distanceM / 80)); // ~80m per minute walking
      
      const distanceKm = distanceM / 1000;
      const distanceMiles = distanceKm * 0.621371;
      
      return {
        driving: drivingMins < 60 ? `${drivingMins} min` : `${Math.round(drivingMins / 60)}h ${drivingMins % 60}m`,
        walking: walkingMins < 60 ? `${walkingMins} min` : `${Math.round(walkingMins / 60)}h ${walkingMins % 60}m`,
        distance: distanceMiles < 10 ? `${distanceMiles.toFixed(1)} mi` : `${Math.round(distanceMiles)} mi`
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting travel time:', error);
    return null;
  }
}

export default Map;
