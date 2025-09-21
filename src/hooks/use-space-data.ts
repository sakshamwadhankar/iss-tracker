/**
 * Space Data Hooks - React hooks for space tracking data
 * Custom hooks for managing ISS position, crew data, and user location
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ISSPositionData, 
  UserLocation, 
  CrewData, 
  UseISSPositionReturn,
  UseUserLocationReturn 
} from '../types/space-tracker';
import { SpaceAPI } from '../services/space-api';
import { SpaceCalculations } from '../services/space-calculations';

/**
 * Hook for managing ISS position data
 */
export function useISSPosition(updateInterval: number = 3000): UseISSPositionReturn {
  const [position, setPosition] = useState<ISSPositionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const updatePosition = useCallback(async () => {
    try {
      setError(null);
      const data = await SpaceAPI.ISS.getCurrentPosition();
      setPosition(data);
      setLastUpdated(new Date());
      setLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch ISS position';
      setError(errorMessage);
      setLoading(false);
      console.error('ISS position update failed:', err);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    updatePosition();

    // Set up interval
    if (updateInterval > 0) {
      intervalRef.current = setInterval(updatePosition, updateInterval);
    }

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [updatePosition, updateInterval]);

  return { position, loading, error, lastUpdated };
}

/**
 * Hook for managing user location
 */
export function useUserLocation(): UseUserLocationReturn {
  const [location, setLocation] = useState<UserLocation>({
    latitude: null,
    longitude: null,
    altitude: null,
    accuracy: null,
    error: null
  });

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocation(prev => ({
        ...prev,
        error: 'Geolocation is not supported by your browser'
      }));
      return;
    }

    setLocation(prev => ({ ...prev, error: null }));

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude: position.coords.altitude,
          accuracy: position.coords.accuracy,
          error: null
        });
      },
      (error) => {
        let errorMessage = 'Unknown error occurred';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        setLocation(prev => ({ ...prev, error: errorMessage }));
      },
      options
    );
  }, []);

  const clearLocation = useCallback(() => {
    setLocation({
      latitude: null,
      longitude: null,
      altitude: null,
      accuracy: null,
      error: null
    });
  }, []);

  return { location, requestLocation, clearLocation };
}

/**
 * Hook for managing crew data
 */
export function useCrewData(updateInterval: number = 300000): {
  crewData: CrewData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
} {
  const [crewData, setCrewData] = useState<CrewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCrewData = useCallback(async () => {
    try {
      setError(null);
      const data = await SpaceAPI.Crew.getCurrentCrew();
      setCrewData(data);
      setLastUpdated(new Date());
      setLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch crew data';
      setError(errorMessage);
      setLoading(false);
      console.error('Crew data fetch failed:', err);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchCrewData();
  }, [fetchCrewData]);

  useEffect(() => {
    // Initial fetch
    fetchCrewData();

    // Set up interval
    if (updateInterval > 0) {
      intervalRef.current = setInterval(fetchCrewData, updateInterval);
    }

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchCrewData, updateInterval]);

  return { crewData, loading, error, lastUpdated, refresh };
}

/**
 * Hook for calculating ISS distance to user
 */
export function useISSDistance(
  issPosition: ISSPositionData | null,
  userLocation: UserLocation
): {
  distance: number | null;
  formattedDistance: string;
  bearing: number | null;
  elevation: number | null;
  isVisible: boolean;
} {
  const [distance, setDistance] = useState<number | null>(null);
  const [bearing, setBearing] = useState<number | null>(null);
  const [elevation, setElevation] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!issPosition || !userLocation.latitude || !userLocation.longitude) {
      setDistance(null);
      setBearing(null);
      setElevation(null);
      setIsVisible(false);
      return;
    }

    // Calculate distance
    const calculatedDistance = SpaceCalculations.calculateISSDistance(
      issPosition,
      userLocation
    );
    setDistance(calculatedDistance);

    // Calculate bearing
    const calculatedBearing = SpaceCalculations.calculateBearing(
      userLocation.latitude!,
      userLocation.longitude!,
      issPosition.latitude,
      issPosition.longitude
    );
    setBearing(calculatedBearing);

    // Calculate elevation
    const calculatedElevation = SpaceCalculations.calculateElevationAngle(
      userLocation.latitude!,
      userLocation.longitude!,
      userLocation.altitude || 0,
      issPosition.latitude,
      issPosition.longitude,
      issPosition.altitude
    );
    setElevation(calculatedElevation);

    // Check visibility
    const visible = SpaceCalculations.isISSVisible(
      userLocation.latitude!,
      userLocation.longitude!,
      userLocation.altitude || 0,
      issPosition.latitude,
      issPosition.longitude,
      issPosition.altitude
    );
    setIsVisible(visible);

  }, [issPosition, userLocation]);

  const formattedDistance = distance ? SpaceCalculations.formatDistance(distance) : 'Unknown';

  return {
    distance,
    formattedDistance,
    bearing,
    elevation,
    isVisible
  };
}

/**
 * Hook for managing search functionality
 */
export function useLocationSearch() {
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<any | null>(null);

  const search = useCallback(async (query: string, options?: any) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const results = await SpaceAPI.Geocoding.searchLocations(query, options);
      setSearchResults(results);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      console.error('Location search failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getSuggestions = useCallback(async (query: string, limit: number = 5) => {
    if (!query.trim()) {
      return [];
    }

    try {
      return await SpaceAPI.Geocoding.getSuggestions(query, limit);
    } catch (err) {
      console.error('Suggestion fetch failed:', err);
      return [];
    }
  }, []);

  const clearResults = useCallback(() => {
    setSearchResults([]);
    setSelectedResult(null);
    setError(null);
  }, []);

  return {
    searchResults,
    loading,
    error,
    selectedResult,
    search,
    getSuggestions,
    clearResults,
    setSelectedResult
  };
}

/**
 * Hook for managing application settings
 */
export function useAppSettings() {
  const [settings, setSettings] = useState({
    showCoordinates: true,
    showCompass: false,
    showStars: true,
    showAtmosphere: true,
    autoRotate: false,
    rotationSpeed: 1.0,
    animationSpeed: 1.0,
    debugMode: false,
    theme: 'dark' as const,
    language: 'en'
  });

  const updateSetting = useCallback(<K extends keyof typeof settings>(
    key: K,
    value: typeof settings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings({
      showCoordinates: true,
      showCompass: false,
      showStars: true,
      showAtmosphere: true,
      autoRotate: false,
      rotationSpeed: 1.0,
      animationSpeed: 1.0,
      debugMode: false,
      theme: 'dark',
      language: 'en'
    });
  }, []);

  const exportSettings = useCallback(() => {
    return JSON.stringify(settings, null, 2);
  }, [settings]);

  const importSettings = useCallback((settingsJson: string) => {
    try {
      const importedSettings = JSON.parse(settingsJson);
      setSettings(prev => ({ ...prev, ...importedSettings }));
      return true;
    } catch (error) {
      console.error('Failed to import settings:', error);
      return false;
    }
  }, []);

  return {
    settings,
    updateSetting,
    resetSettings,
    exportSettings,
    importSettings
  };
}

/**
 * Hook for managing performance metrics
 */
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState({
    frameRate: 0,
    layerCount: 0,
    enabledLayers: 0,
    memoryUsage: null as any,
    loadTime: 0
  });

  const updateMetrics = useCallback(() => {
    const newMetrics = {
      frameRate: 60, // Placeholder - would need actual frame rate tracking
      layerCount: 0, // Would be set by layer management
      enabledLayers: 0, // Would be set by layer management
      memoryUsage: performance.memory ? {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
      } : null,
      loadTime: performance.now()
    };

    setMetrics(newMetrics);
  }, []);

  useEffect(() => {
    updateMetrics();
    const interval = setInterval(updateMetrics, 1000);
    return () => clearInterval(interval);
  }, [updateMetrics]);

  return { metrics, updateMetrics };
}

// Export all hooks
export const SpaceHooks = {
  useISSPosition,
  useUserLocation,
  useCrewData,
  useISSDistance,
  useLocationSearch,
  useAppSettings,
  usePerformanceMetrics
};

// Export default
export default SpaceHooks;
