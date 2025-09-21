/**
 * Space API Service - External API integrations for space data
 * Handles ISS position, crew data, and geocoding services
 */

import axios, { AxiosResponse } from 'axios';
import { 
  ISSPositionData, 
  CrewData, 
  SearchResult, 
  ApiResponse,
  ISS_SATELLITE_ID 
} from '../types/space-tracker';

// API Configuration
const API_CONFIG = {
  ISS_BASE_URL: 'https://api.wheretheiss.at/v1',
  CREW_API_URL: 'http://api.open-notify.org/astros.json',
  NOMINATIM_BASE_URL: 'https://nominatim.openstreetmap.org',
  BIGDATA_CLOUD_URL: 'https://api.bigdatacloud.net/data/reverse-geocode-client',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
};

// HTTP Client Configuration
const httpClient = axios.create({
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'SpaceTracker Pro/1.0'
  }
});

// Request interceptor for logging
httpClient.interceptors.request.use(
  (config) => {
    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
httpClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.status, error.message);
    return Promise.reject(error);
  }
);

/**
 * Retry mechanism for failed requests
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  attempts: number = API_CONFIG.RETRY_ATTEMPTS
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (attempts > 1) {
      console.warn(`⚠️ Request failed, retrying... (${attempts - 1} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY));
      return withRetry(operation, attempts - 1);
    }
    throw error;
  }
}

/**
 * ISS Position Service
 */
export class ISSPositionService {
  /**
   * Get current ISS position
   */
  static async getCurrentPosition(): Promise<ISSPositionData> {
    return withRetry(async () => {
      const response: AxiosResponse<ISSPositionData> = await httpClient.get(
        `${API_CONFIG.ISS_BASE_URL}/satellites/${ISS_SATELLITE_ID}`
      );
      
      return {
        latitude: parseFloat(response.data.latitude.toString()),
        longitude: parseFloat(response.data.longitude.toString()),
        altitude: parseFloat(response.data.altitude.toString()),
        velocity: parseFloat(response.data.velocity.toString()),
        timestamp: parseInt(response.data.timestamp.toString())
      };
    });
  }

  /**
   * Get ISS position at specific timestamp
   */
  static async getPositionAtTime(timestamp: number): Promise<ISSPositionData> {
    return withRetry(async () => {
      const response: AxiosResponse<ISSPositionData> = await httpClient.get(
        `${API_CONFIG.ISS_BASE_URL}/satellites/${ISS_SATELLITE_ID}`,
        { params: { timestamp } }
      );
      
      return {
        latitude: parseFloat(response.data.latitude.toString()),
        longitude: parseFloat(response.data.longitude.toString()),
        altitude: parseFloat(response.data.altitude.toString()),
        velocity: parseFloat(response.data.velocity.toString()),
        timestamp: parseInt(response.data.timestamp.toString())
      };
    });
  }

  /**
   * Get TLE (Two-Line Element) data for ISS
   */
  static async getTLEData(): Promise<{ line1: string; line2: string }> {
    return withRetry(async () => {
      const response = await httpClient.get(
        `${API_CONFIG.ISS_BASE_URL}/satellites/${ISS_SATELLITE_ID}/tles`
      );
      
      return {
        line1: response.data.line1,
        line2: response.data.line2
      };
    });
  }

  /**
   * Get ISS pass predictions for a location
   */
  static async getPassPredictions(
    latitude: number,
    longitude: number,
    altitude: number = 0,
    days: number = 10,
    minElevation: number = 10
  ): Promise<any[]> {
    return withRetry(async () => {
      const response = await httpClient.get(
        `${API_CONFIG.ISS_BASE_URL}/satellites/${ISS_SATELLITE_ID}/positions`,
        {
          params: {
            lat: latitude,
            lon: longitude,
            alt: altitude,
            days,
            min_elevation: minElevation
          }
        }
      );
      
      return response.data;
    });
  }
}

/**
 * Crew Data Service
 */
export class CrewDataService {
  /**
   * Get current crew information
   */
  static async getCurrentCrew(): Promise<CrewData> {
    return withRetry(async () => {
      const response: AxiosResponse<CrewData> = await httpClient.get(
        API_CONFIG.CREW_API_URL
      );
      
      return {
        people: response.data.people || [],
        number: response.data.number || 0,
        message: response.data.message || 'Success',
        lastUpdated: new Date()
      };
    });
  }

  /**
   * Get crew member by name
   */
  static async getCrewMember(name: string): Promise<any> {
    const crew = await this.getCurrentCrew();
    return crew.people.find(member => 
      member.name.toLowerCase().includes(name.toLowerCase())
    );
  }

  /**
   * Get crew by spacecraft
   */
  static async getCrewBySpacecraft(spacecraft: string): Promise<any[]> {
    const crew = await this.getCurrentCrew();
    return crew.people.filter(member => 
      member.craft.toLowerCase().includes(spacecraft.toLowerCase())
    );
  }
}

/**
 * Geocoding Service
 */
export class GeocodingService {
  /**
   * Search for locations
   */
  static async searchLocations(
    query: string,
    options: {
      limit?: number;
      countryCode?: string;
      boundingBox?: number[];
    } = {}
  ): Promise<SearchResult[]> {
    const { limit = 10, countryCode, boundingBox } = options;
    
    return withRetry(async () => {
      const params: any = {
        q: query,
        format: 'jsonv2',
        limit,
        addressdetails: 1,
        extratags: 1
      };

      if (countryCode) {
        params.countrycodes = countryCode;
      }

      if (boundingBox) {
        params.bounded = 1;
        params.viewbox = boundingBox.join(',');
      }

      const response = await httpClient.get(
        `${API_CONFIG.NOMINATIM_BASE_URL}/search`,
        { params }
      );

      return response.data.map((item: any) => ({
        display_name: item.display_name,
        name: item.name,
        lat: item.lat,
        lon: item.lon,
        type: item.type || item.class || 'location',
        importance: item.importance || 0,
        address: item.address || {},
        boundingbox: item.boundingbox || null
      }));
    });
  }

  /**
   * Reverse geocode coordinates to address
   */
  static async reverseGeocode(
    latitude: number,
    longitude: number
  ): Promise<string> {
    return withRetry(async () => {
      // Try primary service first
      try {
        const response = await httpClient.get(API_CONFIG.BIGDATA_CLOUD_URL, {
          params: {
            latitude,
            longitude,
            localityLanguage: 'en'
          }
        });

        const data = response.data;
        const city = data.city || data.locality || (data.localityInfo?.administrative?.[0]?.name) || '';
        const region = data.principalSubdivision || '';
        const country = data.countryName || '';

        if (city || region || country) {
          return [city, region, country].filter(Boolean).join(', ');
        } else if (data.localityInfo?.informative?.length) {
          return data.localityInfo.informative[0].name || 'Over ocean';
        } else {
          return 'Over ocean';
        }
      } catch (error) {
        // Fallback to Nominatim
        const response = await httpClient.get(
          `${API_CONFIG.NOMINATIM_BASE_URL}/reverse`,
          {
            params: {
              lat: latitude,
              lon: longitude,
              format: 'jsonv2',
              addressdetails: 1
            }
          }
        );

        const data = response.data;
        const address = data.address || {};
        const city = address.city || address.town || address.village || address.hamlet || '';
        const state = address.state || address.region || '';
        const country = address.country || '';

        return [city, state, country].filter(Boolean).join(', ') || 
               (data.display_name || 'Unknown location');
      }
    });
  }

  /**
   * Get location suggestions
   */
  static async getSuggestions(
    query: string,
    limit: number = 5
  ): Promise<SearchResult[]> {
    if (query.length < 2) {
      return [];
    }

    return this.searchLocations(query, { limit });
  }
}

/**
 * Weather Service (for future enhancement)
 */
export class WeatherService {
  /**
   * Get weather at ISS location
   */
  static async getWeatherAtLocation(
    latitude: number,
    longitude: number
  ): Promise<any> {
    // This would integrate with a weather API
    // For now, return mock data
    return {
      temperature: 20,
      humidity: 50,
      pressure: 1013,
      description: 'Clear sky'
    };
  }
}

/**
 * Analytics Service
 */
export class AnalyticsService {
  /**
   * Track user interaction
   */
  static trackEvent(event: string, properties: any = {}): void {
    console.log('📊 Analytics Event:', event, properties);
    // In a real application, this would send data to analytics service
  }

  /**
   * Track performance metrics
   */
  static trackPerformance(metrics: any): void {
    console.log('⚡ Performance Metrics:', metrics);
    // In a real application, this would send data to performance monitoring
  }

  /**
   * Track error
   */
  static trackError(error: Error, context: any = {}): void {
    console.error('🚨 Error Tracked:', error.message, context);
    // In a real application, this would send data to error tracking service
  }
}

/**
 * Cache Service
 */
export class CacheService {
  private static cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  /**
   * Set cache entry
   */
  static set(key: string, data: any, ttl: number = 300000): void { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Get cache entry
   */
  static get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Clear cache
   */
  static clear(): void {
    this.cache.clear();
  }

  /**
   * Clear expired entries
   */
  static clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Export all services
export const SpaceAPI = {
  ISS: ISSPositionService,
  Crew: CrewDataService,
  Geocoding: GeocodingService,
  Weather: WeatherService,
  Analytics: AnalyticsService,
  Cache: CacheService
};

// Export default
export default SpaceAPI;
