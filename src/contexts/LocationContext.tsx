import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

interface LocationState {
  lat: number;
  lng: number;
}

interface LocationContextType {
  userLocation: LocationState | null;
  isLoading: boolean;
  locationDenied: boolean;
  showLocationModal: boolean;
  setShowLocationModal: (show: boolean) => void;
  requestLocation: (forceRefresh?: boolean) => Promise<void>;
  permissionState: PermissionState | null;
  locationEnabled: boolean;
  setLocationEnabled: (enabled: boolean) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const LOCATION_STORAGE_KEY = 'carnetworx_user_location';
const LOCATION_PERMISSION_KEY = 'carnetworx_location_granted';
const LOCATION_ENABLED_KEY = 'carnetworx_location_enabled';
const LOCATION_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Default location (San Luis, Argentina)
const DEFAULT_LOCATION: LocationState = { lat: -33.3, lng: -66.35 };

function getSavedLocation(): LocationState | null {
  try {
    const saved = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Check if location is not too old (24 hours)
      if (parsed.timestamp && Date.now() - parsed.timestamp < LOCATION_CACHE_DURATION) {
        return { lat: parsed.lat, lng: parsed.lng };
      }
    }
  } catch {
    // Ignore parsing errors
  }
  return null;
}

function saveLocation(lat: number, lng: number) {
  try {
    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify({ lat, lng, timestamp: Date.now() }));
    localStorage.setItem(LOCATION_PERMISSION_KEY, 'true');
  } catch {
    // Ignore storage errors
  }
}

function hasLocationPermission(): boolean {
  try {
    return localStorage.getItem(LOCATION_PERMISSION_KEY) === 'true';
  } catch {
    return false;
  }
}

function getLocationEnabled(): boolean {
  try {
    const stored = localStorage.getItem(LOCATION_ENABLED_KEY);
    // Default to true if not set
    return stored === null ? true : stored === 'true';
  } catch {
    return true;
  }
}

function setLocationEnabledStorage(enabled: boolean) {
  try {
    localStorage.setItem(LOCATION_ENABLED_KEY, enabled ? 'true' : 'false');
  } catch {
    // Ignore storage errors
  }
}

async function checkBrowserPermission(): Promise<PermissionState | null> {
  try {
    if ('permissions' in navigator) {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      return result.state;
    }
  } catch {
    // Some browsers don't support permissions API
  }
  return null;
}

interface LocationProviderProps {
  children: ReactNode;
}

export function LocationProvider({ children }: LocationProviderProps) {
  const [userLocation, setUserLocation] = useState<LocationState | null>(() => getSavedLocation());
  const [isLoading, setIsLoading] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [permissionState, setPermissionState] = useState<PermissionState | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [locationEnabled, setLocationEnabledState] = useState<boolean>(() => getLocationEnabled());

  // Handle location enabled toggle
  const setLocationEnabled = useCallback((enabled: boolean) => {
    setLocationEnabledState(enabled);
    setLocationEnabledStorage(enabled);
    
    if (!enabled) {
      // Clear cached location when disabled
      try {
        localStorage.removeItem(LOCATION_STORAGE_KEY);
        localStorage.removeItem(LOCATION_PERMISSION_KEY);
      } catch {
        // Ignore errors
      }
      setUserLocation(DEFAULT_LOCATION);
      setLocationDenied(true);
    } else {
      // Re-request location when enabled
      setLocationDenied(false);
      // Will trigger a fresh location request
    }
  }, []);

  // Request location with smart permission checking
  const requestLocation = useCallback(async (forceRefresh = false) => {
    // If location is disabled by user, use default
    if (!locationEnabled) {
      if (!userLocation) {
        setUserLocation(DEFAULT_LOCATION);
      }
      setLocationDenied(true);
      return;
    }

    // Check for cached location first (unless force refresh)
    if (!forceRefresh) {
      const cached = getSavedLocation();
      if (cached) {
        setUserLocation(cached);
        setLocationDenied(false);
        // Don't need to request fresh location if cache is valid
        return;
      }
    }

    // Check browser permission state first
    const permission = await checkBrowserPermission();
    setPermissionState(permission);

    // If permission is denied, don't trigger another prompt
    if (permission === 'denied') {
      setLocationDenied(true);
      if (!userLocation) {
        setUserLocation(DEFAULT_LOCATION);
      }
      // Only show modal if user hasn't previously granted permission
      if (!hasLocationPermission()) {
        setShowLocationModal(true);
      }
      return;
    }

    // If no geolocation support, use default
    if (!navigator.geolocation) {
      setUserLocation(DEFAULT_LOCATION);
      setLocationDenied(true);
      return;
    }

    setIsLoading(true);

    // Request fresh location
    return new Promise<void>((resolve) => {
      let finished = false;
      const timeoutId = window.setTimeout(() => {
        if (!finished) {
          finished = true;
          setIsLoading(false);
          if (!userLocation) {
            setUserLocation(DEFAULT_LOCATION);
            setLocationDenied(true);
          }
          resolve();
        }
      }, 8000);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (finished) return;
          finished = true;
          window.clearTimeout(timeoutId);
          
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(newLocation);
          saveLocation(newLocation.lat, newLocation.lng);
          setLocationDenied(false);
          setShowLocationModal(false);
          setIsLoading(false);
          resolve();
        },
        () => {
          if (finished) return;
          finished = true;
          window.clearTimeout(timeoutId);
          
          setIsLoading(false);
          setLocationDenied(true);
          
          if (!userLocation) {
            setUserLocation(DEFAULT_LOCATION);
          }
          
          // Only show modal if user hasn't previously granted permission
          if (!hasLocationPermission()) {
            setShowLocationModal(true);
          }
          resolve();
        },
        {
          enableHighAccuracy: false,
          timeout: 7000,
          maximumAge: 5 * 60 * 1000, // 5 minutes
        }
      );
    });
  }, [userLocation, locationEnabled]);

  // Initialize location on mount - only once
  useEffect(() => {
    if (hasInitialized) return;
    setHasInitialized(true);

    const initLocation = async () => {
      // If location is disabled, use default
      if (!locationEnabled) {
        setUserLocation(DEFAULT_LOCATION);
        setLocationDenied(true);
        return;
      }

      const cached = getSavedLocation();
      
      if (cached) {
        // Use cached location immediately, don't request fresh
        setUserLocation(cached);
        setLocationDenied(false);
        return;
      }

      // No cached location - check permission state
      const permission = await checkBrowserPermission();
      setPermissionState(permission);

      if (permission === 'granted') {
        // Permission already granted, safe to request
        await requestLocation(true);
      } else if (permission === 'denied') {
        // Permission denied, use default without prompting
        setUserLocation(DEFAULT_LOCATION);
        setLocationDenied(true);
      } else {
        // 'prompt' state - we'll request location which will trigger the prompt
        // This is the only case where user sees the permission dialog
        await requestLocation(true);
      }
    };

    initLocation();
  }, [hasInitialized, requestLocation, locationEnabled]);

  // Re-request location when enabled changes
  useEffect(() => {
    if (hasInitialized && locationEnabled) {
      requestLocation(true);
    }
  }, [locationEnabled, hasInitialized, requestLocation]);

  // Listen for permission changes
  useEffect(() => {
    const listenToPermissionChanges = async () => {
      try {
        if ('permissions' in navigator) {
          const result = await navigator.permissions.query({ name: 'geolocation' });
          result.addEventListener('change', () => {
            setPermissionState(result.state);
            if (result.state === 'granted') {
              requestLocation(true);
            }
          });
        }
      } catch {
        // Ignore errors
      }
    };

    listenToPermissionChanges();
  }, [requestLocation]);

  return (
    <LocationContext.Provider
      value={{
        userLocation,
        isLoading,
        locationDenied,
        showLocationModal,
        setShowLocationModal,
        requestLocation,
        permissionState,
        locationEnabled,
        setLocationEnabled,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
