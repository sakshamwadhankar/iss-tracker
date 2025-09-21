/**
 * Space Calculations Service - Mathematical calculations for space tracking
 * Handles orbital mechanics, distance calculations, and coordinate transformations
 */

import * as THREE from 'three';
import { 
  ISSPositionData, 
  UserLocation, 
  OrbitPoint, 
  PassInfo,
  EARTH_RADIUS_KM,
  ISS_ORBIT_ALTITUDE_KM 
} from '../types/space-tracker';

/**
 * Mathematical constants
 */
const MATH_CONSTANTS = {
  EARTH_RADIUS_KM: EARTH_RADIUS_KM,
  ISS_ORBIT_ALTITUDE_KM: ISS_ORBIT_ALTITUDE_KM,
  DEGREES_TO_RADIANS: Math.PI / 180,
  RADIANS_TO_DEGREES: 180 / Math.PI,
  KM_TO_MILES: 0.621371,
  MILES_TO_KM: 1.60934,
  KM_TO_FEET: 3280.84,
  FEET_TO_KM: 0.0003048
};

/**
 * Convert degrees to radians
 */
export function degreesToRadians(degrees: number): number {
  return degrees * MATH_CONSTANTS.DEGREES_TO_RADIANS;
}

/**
 * Convert radians to degrees
 */
export function radiansToDegrees(radians: number): number {
  return radians * MATH_CONSTANTS.RADIANS_TO_DEGREES;
}

/**
 * Convert spherical coordinates to Cartesian coordinates
 */
export function sphericalToCartesian(
  latitude: number,
  longitude: number,
  radius: number = MATH_CONSTANTS.EARTH_RADIUS_KM
): THREE.Vector3 {
  const phi = (90 - latitude) * MATH_CONSTANTS.DEGREES_TO_RADIANS;
  const theta = (longitude + 180) * MATH_CONSTANTS.DEGREES_TO_RADIANS;

  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return new THREE.Vector3(x, y, z);
}

/**
 * Convert Cartesian coordinates to spherical coordinates
 */
export function cartesianToSpherical(vector: THREE.Vector3): {
  latitude: number;
  longitude: number;
  radius: number;
} {
  const radius = vector.length();
  const latitude = 90 - Math.acos(vector.y / radius) * MATH_CONSTANTS.RADIANS_TO_DEGREES;
  const longitude = Math.atan2(vector.z, -vector.x) * MATH_CONSTANTS.RADIANS_TO_DEGREES - 180;

  return { latitude, longitude, radius };
}

/**
 * Calculate distance between two points on Earth's surface
 * Using Haversine formula for great circle distance
 */
export function calculateSurfaceDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = MATH_CONSTANTS.EARTH_RADIUS_KM;
  const dLat = degreesToRadians(lat2 - lat1);
  const dLon = degreesToRadians(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degreesToRadians(lat1)) * Math.cos(degreesToRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

/**
 * Calculate 3D distance between two points in space
 * Accounts for altitude differences
 */
export function calculate3DDistance(
  lat1: number,
  lon1: number,
  alt1: number,
  lat2: number,
  lon2: number,
  alt2: number
): number {
  const point1 = sphericalToCartesian(lat1, lon1, MATH_CONSTANTS.EARTH_RADIUS_KM + alt1);
  const point2 = sphericalToCartesian(lat2, lon2, MATH_CONSTANTS.EARTH_RADIUS_KM + alt2);
  
  return point1.distanceTo(point2);
}

/**
 * Calculate distance from ISS to user location
 */
export function calculateISSDistance(
  issPosition: ISSPositionData,
  userLocation: UserLocation
): number | null {
  if (!userLocation.latitude || !userLocation.longitude) {
    return null;
  }

  return calculate3DDistance(
    issPosition.latitude,
    issPosition.longitude,
    issPosition.altitude,
    userLocation.latitude,
    userLocation.longitude,
    userLocation.altitude || 0
  );
}

/**
 * Calculate bearing from one point to another
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLon = degreesToRadians(lon2 - lon1);
  const lat1Rad = degreesToRadians(lat1);
  const lat2Rad = degreesToRadians(lat2);

  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);

  let bearing = Math.atan2(y, x) * MATH_CONSTANTS.RADIANS_TO_DEGREES;
  bearing = (bearing + 360) % 360;

  return bearing;
}

/**
 * Calculate elevation angle from observer to ISS
 */
export function calculateElevationAngle(
  observerLat: number,
  observerLon: number,
  observerAlt: number,
  issLat: number,
  issLon: number,
  issAlt: number
): number {
  const R = MATH_CONSTANTS.EARTH_RADIUS_KM;
  const observerPoint = sphericalToCartesian(observerLat, observerLon, R + observerAlt);
  const issPoint = sphericalToCartesian(issLat, issLon, R + issAlt);
  
  const distance = observerPoint.distanceTo(issPoint);
  const horizontalDistance = calculateSurfaceDistance(observerLat, observerLon, issLat, issLon);
  const verticalDistance = issAlt - observerAlt;
  
  const elevationAngle = Math.atan2(verticalDistance, horizontalDistance) * MATH_CONSTANTS.RADIANS_TO_DEGREES;
  
  return elevationAngle;
}

/**
 * Calculate azimuth angle from observer to ISS
 */
export function calculateAzimuthAngle(
  observerLat: number,
  observerLon: number,
  issLat: number,
  issLon: number
): number {
  return calculateBearing(observerLat, observerLon, issLat, issLon);
}

/**
 * Check if ISS is visible from observer location
 */
export function isISSVisible(
  observerLat: number,
  observerLon: number,
  observerAlt: number,
  issLat: number,
  issLon: number,
  issAlt: number,
  minElevation: number = 10
): boolean {
  const elevation = calculateElevationAngle(
    observerLat, observerLon, observerAlt,
    issLat, issLon, issAlt
  );
  
  return elevation >= minElevation;
}

/**
 * Calculate ISS orbital period (approximate)
 */
export function calculateOrbitalPeriod(altitude: number = MATH_CONSTANTS.ISS_ORBIT_ALTITUDE_KM): number {
  const R = MATH_CONSTANTS.EARTH_RADIUS_KM;
  const a = R + altitude; // Semi-major axis
  const GM = 3.986004418e5; // Earth's gravitational parameter (km³/s²)
  
  const period = 2 * Math.PI * Math.sqrt(Math.pow(a, 3) / GM);
  
  return period; // in seconds
}

/**
 * Calculate ISS orbital velocity
 */
export function calculateOrbitalVelocity(altitude: number = MATH_CONSTANTS.ISS_ORBIT_ALTITUDE_KM): number {
  const R = MATH_CONSTANTS.EARTH_RADIUS_KM;
  const a = R + altitude;
  const GM = 3.986004418e5;
  
  const velocity = Math.sqrt(GM / a);
  
  return velocity; // in km/s
}

/**
 * Convert speed units
 */
export function convertSpeed(
  value: number,
  fromUnit: 'km/h' | 'm/s' | 'mph' | 'knots',
  toUnit: 'km/h' | 'm/s' | 'mph' | 'knots'
): number {
  const conversions: { [key: string]: number } = {
    'km/h': 1,
    'm/s': 0.277778,
    'mph': 0.621371,
    'knots': 0.539957
  };

  const fromFactor = conversions[fromUnit] || 1;
  const toFactor = conversions[toUnit] || 1;

  return (value / fromFactor) * toFactor;
}

/**
 * Convert distance units
 */
export function convertDistance(
  value: number,
  fromUnit: 'km' | 'm' | 'miles' | 'feet' | 'nautical_miles',
  toUnit: 'km' | 'm' | 'miles' | 'feet' | 'nautical_miles'
): number {
  const conversions: { [key: string]: number } = {
    'km': 1,
    'm': 1000,
    'miles': MATH_CONSTANTS.KM_TO_MILES,
    'feet': MATH_CONSTANTS.KM_TO_FEET,
    'nautical_miles': 0.539957
  };

  const fromFactor = conversions[fromUnit] || 1;
  const toFactor = conversions[toUnit] || 1;

  return (value / fromFactor) * toFactor;
}

/**
 * Format distance with appropriate units
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${(distanceKm * 1000).toFixed(0)} m`;
  } else if (distanceKm < 1000) {
    return `${distanceKm.toFixed(2)} km`;
  } else {
    return `${(distanceKm / 1000).toFixed(2)} Mm`;
  }
}

/**
 * Format speed with appropriate units
 */
export function formatSpeed(speedKmh: number): string {
  if (speedKmh < 1) {
    return `${(speedKmh * 1000).toFixed(0)} m/h`;
  } else if (speedKmh < 1000) {
    return `${speedKmh.toFixed(2)} km/h`;
  } else {
    return `${(speedKmh / 1000).toFixed(2)} Mm/h`;
  }
}

/**
 * Calculate time until next ISS pass
 */
export function calculateTimeToNextPass(
  currentTime: Date,
  passes: PassInfo[]
): number | null {
  const now = currentTime.getTime();
  const futurePasses = passes.filter(pass => pass.aos.getTime() > now);
  
  if (futurePasses.length === 0) {
    return null;
  }

  const nextPass = futurePasses[0];
  return nextPass.aos.getTime() - now;
}

/**
 * Calculate pass duration
 */
export function calculatePassDuration(pass: PassInfo): number {
  return (pass.los.getTime() - pass.aos.getTime()) / (1000 * 60); // in minutes
}

/**
 * Calculate ISS visibility percentage
 */
export function calculateVisibilityPercentage(
  observerLat: number,
  observerLon: number,
  observerAlt: number,
  passes: PassInfo[]
): number {
  if (passes.length === 0) {
    return 0;
  }

  const totalDuration = passes.reduce((sum, pass) => sum + calculatePassDuration(pass), 0);
  const maxPossibleDuration = 24 * 60; // 24 hours in minutes
  
  return Math.min((totalDuration / maxPossibleDuration) * 100, 100);
}

/**
 * Calculate solar angle for ISS
 */
export function calculateSolarAngle(
  issLat: number,
  issLon: number,
  issAlt: number,
  sunLat: number,
  sunLon: number
): number {
  const issPoint = sphericalToCartesian(issLat, issLon, MATH_CONSTANTS.EARTH_RADIUS_KM + issAlt);
  const sunPoint = sphericalToCartesian(sunLat, sunLon, 149600000); // Sun distance in km
  
  const angle = issPoint.angleTo(sunPoint) * MATH_CONSTANTS.RADIANS_TO_DEGREES;
  
  return angle;
}

/**
 * Check if ISS is in sunlight
 */
export function isISSInSunlight(
  issLat: number,
  issLon: number,
  issAlt: number,
  sunLat: number,
  sunLon: number
): boolean {
  const solarAngle = calculateSolarAngle(issLat, issLon, issAlt, sunLat, sunLon);
  return solarAngle < 90; // ISS is in sunlight if angle to sun is less than 90 degrees
}

/**
 * Calculate ground track speed
 */
export function calculateGroundTrackSpeed(
  issPosition: ISSPositionData,
  timeInterval: number = 1000 // milliseconds
): number {
  // This is a simplified calculation
  // In reality, you'd need two position points to calculate actual speed
  const orbitalVelocity = calculateOrbitalVelocity(issPosition.altitude);
  const groundSpeed = orbitalVelocity * (MATH_CONSTANTS.EARTH_RADIUS_KM / (MATH_CONSTANTS.EARTH_RADIUS_KM + issPosition.altitude));
  
  return groundSpeed * 3600; // Convert to km/h
}

/**
 * Calculate ISS angular velocity
 */
export function calculateAngularVelocity(altitude: number = MATH_CONSTANTS.ISS_ORBIT_ALTITUDE_KM): number {
  const period = calculateOrbitalPeriod(altitude);
  return (2 * Math.PI) / period; // radians per second
}

/**
 * Calculate ISS position after time delta
 */
export function calculatePositionAfterTime(
  currentLat: number,
  currentLon: number,
  currentAlt: number,
  timeDelta: number // seconds
): { latitude: number; longitude: number; altitude: number } {
  const angularVelocity = calculateAngularVelocity(currentAlt);
  const longitudeDelta = angularVelocity * timeDelta * MATH_CONSTANTS.RADIANS_TO_DEGREES;
  
  return {
    latitude: currentLat, // Latitude doesn't change significantly in short time
    longitude: (currentLon + longitudeDelta) % 360,
    altitude: currentAlt
  };
}

// Export all calculation functions
export const SpaceCalculations = {
  // Coordinate conversions
  degreesToRadians,
  radiansToDegrees,
  sphericalToCartesian,
  cartesianToSpherical,
  
  // Distance calculations
  calculateSurfaceDistance,
  calculate3DDistance,
  calculateISSDistance,
  
  // Angular calculations
  calculateBearing,
  calculateElevationAngle,
  calculateAzimuthAngle,
  
  // Visibility calculations
  isISSVisible,
  calculateVisibilityPercentage,
  
  // Orbital mechanics
  calculateOrbitalPeriod,
  calculateOrbitalVelocity,
  calculateAngularVelocity,
  calculatePositionAfterTime,
  
  // Solar calculations
  calculateSolarAngle,
  isISSInSunlight,
  
  // Utility functions
  convertSpeed,
  convertDistance,
  formatDistance,
  formatSpeed,
  calculateTimeToNextPass,
  calculatePassDuration,
  calculateGroundTrackSpeed
};

// Export default
export default SpaceCalculations;
