import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = 'pk.eyJ1IjoicmF5ZGVuZ2xleiIsImEiOiJjbWoyMmNmazMwN3dxM2ZxMWx6YWh6NWNpIn0.1ktomA51sIeX7o7QGB2y9w';

interface MapProps {
  center?: [number, number];
  zoom?: number;
  className?: string;
  markers?: Array<{
    lng: number;
    lat: number;
    title?: string;
    price?: string;
  }>;
}

export function Map({ 
  center = [-122.4194, 37.7749], 
  zoom = 12, 
  className = '',
  markers = []
}: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: center,
      zoom: zoom,
      pitch: 45,
      bearing: -17.6,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    // Add geolocate control
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true
      }),
      'top-right'
    );

    // Custom style adjustments for CarNexo palette
    map.current.on('style.load', () => {
      if (!map.current) return;

      // Adjust fog for atmosphere
      map.current.setFog({
        color: 'hsl(220, 20%, 7%)', // --background
        'high-color': 'hsl(220, 25%, 12%)', // --card
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
            'fill-extrusion-color': 'hsl(220, 25%, 15%)',
            'fill-extrusion-height': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              15.05,
              ['get', 'height']
            ],
            'fill-extrusion-base': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              15.05,
              ['get', 'min_height']
            ],
            'fill-extrusion-opacity': 0.6
          }
        },
        labelLayerId
      );
    });

    // Add markers
    markers.forEach((marker) => {
      const el = document.createElement('div');
      el.className = 'carnexo-marker';
      el.innerHTML = `
        <div class="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-orange cursor-pointer transform hover:scale-110 transition-transform">
          <svg class="w-5 h-5 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </div>
        ${marker.price ? `<div class="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-card px-2 py-0.5 rounded text-xs font-semibold text-foreground whitespace-nowrap shadow-card">${marker.price}</div>` : ''}
      `;

      const mapboxMarker = new mapboxgl.Marker(el)
        .setLngLat([marker.lng, marker.lat])
        .addTo(map.current!);

      if (marker.title) {
        const popup = new mapboxgl.Popup({ offset: 25 })
          .setHTML(`<div class="text-sm font-medium">${marker.title}</div>`);
        mapboxMarker.setPopup(popup);
      }

      markersRef.current.push(mapboxMarker);
    });

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      map.current?.remove();
    };
  }, [center, zoom, markers]);

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainer} className="absolute inset-0 rounded-2xl overflow-hidden" />
      <div className="absolute inset-0 pointer-events-none rounded-2xl ring-1 ring-inset ring-border/20" />
    </div>
  );
}

export default Map;
