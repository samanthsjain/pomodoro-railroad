/**
 * Water Detection Service
 *
 * Uses a simplified approach to detect if routes cross major open water.
 * Only blocks routes that would require crossing significant ocean/sea distances.
 * Coastal routes and routes near shorelines are allowed.
 */

// Major open water areas that railways definitely cannot cross
// These are conservative - only the deep ocean/sea areas far from any coast
// Format: { center: [lat, lng], radius in km, name }
const MAJOR_OPEN_WATER: { center: [number, number]; radiusKm: number; name: string }[] = [
  // Atlantic Ocean - only the deep central parts
  { center: [35, -45], radiusKm: 800, name: 'Central Atlantic' },
  { center: [45, -30], radiusKm: 500, name: 'North Atlantic' },

  // Pacific Ocean - central areas
  { center: [20, -150], radiusKm: 1000, name: 'Central Pacific' },
  { center: [0, 180], radiusKm: 800, name: 'Western Pacific' },

  // Indian Ocean - central area
  { center: [-10, 75], radiusKm: 600, name: 'Central Indian Ocean' },

  // Mediterranean - only the central deep parts (not coastal)
  { center: [36, 18], radiusKm: 150, name: 'Central Mediterranean' },
  { center: [35, 5], radiusKm: 100, name: 'Western Mediterranean Deep' },

  // Baltic Sea - only the very center
  { center: [58, 20], radiusKm: 80, name: 'Central Baltic' },

  // North Sea - central area only
  { center: [56, 3], radiusKm: 100, name: 'Central North Sea' },
];

// Minimum water crossing distance (km) to trigger a block
// Routes with less than this distance over water are allowed (bridges, tunnels, ferries exist)
const MIN_WATER_CROSSING_KM = 50;

/**
 * Haversine distance in km between two points
 */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check if a point is in open water (far from any coast)
 */
function isPointInOpenWater(lat: number, lng: number): boolean {
  // Normalize longitude
  while (lng > 180) lng -= 360;
  while (lng < -180) lng += 360;

  for (const water of MAJOR_OPEN_WATER) {
    const dist = haversineDistance(lat, lng, water.center[0], water.center[1]);
    if (dist < water.radiusKm) {
      return true;
    }
  }

  return false;
}

/**
 * Interpolate between two points
 */
function interpolate(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  t: number
): { lat: number; lng: number } {
  return {
    lat: from.lat + (to.lat - from.lat) * t,
    lng: from.lng + (to.lng - from.lng) * t,
  };
}

/**
 * Check if a route segment crosses significant open water
 *
 * Returns true ONLY if the route would cross a large body of open water
 * that has no rail infrastructure (bridges, tunnels, ferries).
 *
 * This is conservative - it only blocks obviously impossible routes.
 */
export function doesSegmentCrossWater(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): boolean {
  const distance = haversineDistance(from.lat, from.lng, to.lat, to.lng);

  // Short distances are always fine - bridges and tunnels exist
  if (distance < MIN_WATER_CROSSING_KM) {
    return false;
  }

  // For longer distances, sample points and check for open water
  const sampleCount = Math.min(Math.ceil(distance / 20), 30);
  let consecutiveWaterPoints = 0;
  let maxConsecutiveWater = 0;

  for (let i = 1; i < sampleCount; i++) {
    const t = i / sampleCount;
    const point = interpolate(from, to, t);

    if (isPointInOpenWater(point.lat, point.lng)) {
      consecutiveWaterPoints++;
      maxConsecutiveWater = Math.max(maxConsecutiveWater, consecutiveWaterPoints);
    } else {
      consecutiveWaterPoints = 0;
    }
  }

  // Only block if we have a significant stretch of open water
  // (more than 30% of sample points consecutively in open water)
  const waterThreshold = Math.max(3, Math.floor(sampleCount * 0.3));
  return maxConsecutiveWater >= waterThreshold;
}

/**
 * Check if an entire route path crosses significant open water
 */
export function doesPathCrossWater(
  stations: { lat: number; lng: number }[]
): boolean {
  for (let i = 0; i < stations.length - 1; i++) {
    if (doesSegmentCrossWater(stations[i], stations[i + 1])) {
      return true;
    }
  }
  return false;
}

/**
 * Filter out candidate stations that would require crossing significant open water
 */
export function filterWaterCrossings<T extends { coordinates: { lat: number; lng: number } }>(
  currentStation: { coordinates: { lat: number; lng: number } },
  candidates: T[]
): T[] {
  return candidates.filter(candidate => {
    return !doesSegmentCrossWater(currentStation.coordinates, candidate.coordinates);
  });
}
