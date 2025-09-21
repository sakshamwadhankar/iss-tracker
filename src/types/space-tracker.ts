/**
 * SpaceTracker Pro - Type Definitions
 * Core type definitions for the space tracking application
 */

// ISS Position Data
export interface ISSPositionData {
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  timestamp: number;
}

// Astronaut Information
export interface AstronautInfo {
  name: string;
  craft: string;
  nationality?: string;
  mission?: string;
}

// Crew Data
export interface CrewData {
  people: AstronautInfo[];
  number: number;
  message: string;
  lastUpdated?: Date;
}

// Orbit Point
export interface OrbitPoint {
  latitude: number;
  longitude: number;
  altitude: number;
  timestamp: number;
}

// User Location
export interface UserLocation {
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  accuracy: number | null;
  error: string | null;
}

// Search Result
export interface SearchResult {
  display_name: string;
  name: string;
  lat: string;
  lon: string;
  type: string;
  importance: number;
  address?: {
    house_number?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
  boundingbox?: number[];
}

// Layer Configuration
export interface LayerConfig {
  name: string;
  category: 'base' | 'overlay' | 'data' | 'setting' | 'debug';
  enabled: boolean;
  opacity: number;
  displayName?: string;
  description?: string;
}

// Application Settings
export interface AppSettings {
  showCoordinates: boolean;
  showCompass: boolean;
  showStars: boolean;
  showAtmosphere: boolean;
  autoRotate: boolean;
  rotationSpeed: number;
  animationSpeed: number;
  debugMode: boolean;
  theme: 'dark' | 'light' | 'auto';
  language: string;
}

// Prediction Request
export interface PredictionRequest {
  type: 'time' | 'location';
  date?: string;
  time?: string;
  latitude?: number;
  longitude?: number;
  country?: string;
  state?: string;
  city?: string;
  minElevation?: number;
  timeWindow?: number;
}

// Prediction Result
export interface PredictionResult {
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  location: string;
  timestamp: number;
}

// Pass Information
export interface PassInfo {
  aos: Date; // Acquisition of Signal
  tca: Date; // Time of Closest Approach
  los: Date; // Loss of Signal
  maxEl: number; // Maximum Elevation
  duration: number; // Duration in minutes
  observer: string; // Observer location
}

// API Response
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
  timestamp: number;
}

// Error Information
export interface ErrorInfo {
  message: string;
  code?: string;
  details?: any;
  timestamp: Date;
}

// Performance Metrics
export interface PerformanceMetrics {
  frameRate: number;
  layerCount: number;
  enabledLayers: number;
  memoryUsage?: {
    used: number;
    total: number;
    limit: number;
  };
  loadTime: number;
}

// Camera Position
export interface CameraPosition {
  latitude: number;
  longitude: number;
  altitude: number;
  heading: number;
  tilt: number;
  roll: number;
}

// Layer Statistics
export interface LayerStats {
  total: number;
  enabled: number;
  byCategory: {
    [category: string]: {
      total: number;
      enabled: number;
    };
  };
}

// Search Statistics
export interface SearchStats {
  totalResults: number;
  hasSelection: boolean;
  apiConfigured: boolean;
  lastSearch?: Date;
}

// Stream Configuration
export interface StreamConfig {
  videoId: string;
  autoplay: boolean;
  muteOnOpen: boolean;
  muteOnClose: boolean;
  quality: 'auto' | 'highres' | 'hd720' | 'medium';
}

// Stream Status
export interface StreamStatus {
  isOpen: boolean;
  isLoaded: boolean;
  videoId: string;
  isPlaying?: boolean;
  isMuted?: boolean;
}

// Event Types
export type AppEvent = 
  | 'iss_position_updated'
  | 'layer_toggled'
  | 'settings_changed'
  | 'search_performed'
  | 'prediction_calculated'
  | 'stream_opened'
  | 'stream_closed'
  | 'error_occurred';

// Event Handler
export type EventHandler<T = any> = (data: T) => void;

// Event Bus
export interface EventBus {
  on(event: AppEvent, handler: EventHandler): void;
  off(event: AppEvent, handler: EventHandler): void;
  emit(event: AppEvent, data?: any): void;
}

// Application State
export interface AppState {
  issPosition: ISSPositionData | null;
  userLocation: UserLocation | null;
  crewData: CrewData | null;
  settings: AppSettings;
  layers: LayerConfig[];
  searchResults: SearchResult[];
  selectedResult: SearchResult | null;
  streamStatus: StreamStatus;
  performance: PerformanceMetrics;
  errors: ErrorInfo[];
}

// Hook Return Types
export interface UseISSPositionReturn {
  position: ISSPositionData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export interface UseUserLocationReturn {
  location: UserLocation;
  requestLocation: () => void;
  clearLocation: () => void;
}

export interface UseLayersReturn {
  layers: LayerConfig[];
  toggleLayer: (layerId: string) => void;
  setLayerOpacity: (layerId: string, opacity: number) => void;
  refreshLayers: () => void;
}

export interface UseSettingsReturn {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  resetSettings: () => void;
  exportSettings: () => string;
  importSettings: (settingsJson: string) => boolean;
}

// Component Props
export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface DataPanelProps extends ComponentProps {
  issPosition: ISSPositionData | null;
  userLocation: UserLocation | null;
  showDistance?: boolean;
  showLocation?: boolean;
}

export interface LayerPanelProps extends ComponentProps {
  layers: LayerConfig[];
  onToggleLayer: (layerId: string) => void;
  onSetOpacity: (layerId: string, opacity: number) => void;
}

export interface SettingsPanelProps extends ComponentProps {
  settings: AppSettings;
  onUpdateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
}

// Service Interfaces
export interface ISSService {
  getCurrentPosition(): Promise<ISSPositionData>;
  getPositionAtTime(timestamp: number): Promise<ISSPositionData>;
  getOrbitData(): Promise<OrbitPoint[]>;
}

export interface GeocodingService {
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
  reverseGeocode(latitude: number, longitude: number): Promise<string>;
  getSuggestions(query: string, limit?: number): Promise<SearchResult[]>;
}

export interface PredictionService {
  predictPosition(request: PredictionRequest): Promise<PredictionResult>;
  findPasses(latitude: number, longitude: number, options?: PassOptions): Promise<PassInfo[]>;
}

export interface CrewService {
  getCurrentCrew(): Promise<CrewData>;
  getCrewHistory(): Promise<CrewData[]>;
}

// Service Options
export interface SearchOptions {
  limit?: number;
  countryCode?: string;
  boundingBox?: number[];
}

export interface PassOptions {
  minElevation?: number;
  timeWindow?: number; // hours
  stepSize?: number; // seconds
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Constants
export const ISS_SATELLITE_ID = 25544;
export const EARTH_RADIUS_KM = 6371;
export const ISS_ORBIT_ALTITUDE_KM = 400;

export const LAYER_CATEGORIES = {
  BASE: 'base',
  OVERLAY: 'overlay',
  DATA: 'data',
  SETTING: 'setting',
  DEBUG: 'debug'
} as const;

export const THEMES = {
  DARK: 'dark',
  LIGHT: 'light',
  AUTO: 'auto'
} as const;

export const STREAM_QUALITIES = {
  AUTO: 'auto',
  HIGH: 'highres',
  MEDIUM: 'hd720',
  LOW: 'medium'
} as const;
