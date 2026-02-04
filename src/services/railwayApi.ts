import type { Station, Route, RoutePath, RouteSegment } from '../types';
import { calculateDistance } from '../types';
import { doesSegmentCrossWater } from './waterDetection';

const API_BASE = 'https://api.railway-stations.org';
const CACHE_DB_NAME = 'pomodoro-railroad-cache';
const CACHE_DB_VERSION = 1;
const CACHE_STORE_NAME = 'stations';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Supported countries from the Railway Stations API
export interface Country {
  code: string;
  name: string;
  region: 'europe' | 'asia' | 'americas' | 'oceania';
  flag: string;
  active: boolean;
}

export const supportedCountries: Country[] = [
  // Europe
  { code: 'de', name: 'Germany', region: 'europe', flag: '🇩🇪', active: true },
  { code: 'at', name: 'Austria', region: 'europe', flag: '🇦🇹', active: true },
  { code: 'ch', name: 'Switzerland', region: 'europe', flag: '🇨🇭', active: true },
  { code: 'fr', name: 'France', region: 'europe', flag: '🇫🇷', active: true },
  { code: 'nl', name: 'Netherlands', region: 'europe', flag: '🇳🇱', active: true },
  { code: 'be', name: 'Belgium', region: 'europe', flag: '🇧🇪', active: true },
  { code: 'uk', name: 'United Kingdom', region: 'europe', flag: '🇬🇧', active: true },
  { code: 'es', name: 'Spain', region: 'europe', flag: '🇪🇸', active: true },
  { code: 'it', name: 'Italy', region: 'europe', flag: '🇮🇹', active: true },
  { code: 'pt', name: 'Portugal', region: 'europe', flag: '🇵🇹', active: true },
  { code: 'cz', name: 'Czech Republic', region: 'europe', flag: '🇨🇿', active: true },
  { code: 'pl', name: 'Poland', region: 'europe', flag: '🇵🇱', active: true },
  { code: 'hu', name: 'Hungary', region: 'europe', flag: '🇭🇺', active: true },
  { code: 'sk', name: 'Slovakia', region: 'europe', flag: '🇸🇰', active: true },
  { code: 'dk', name: 'Denmark', region: 'europe', flag: '🇩🇰', active: true },
  { code: 'no', name: 'Norway', region: 'europe', flag: '🇳🇴', active: true },
  { code: 'fi', name: 'Finland', region: 'europe', flag: '🇫🇮', active: true },
  { code: 'se', name: 'Sweden', region: 'europe', flag: '🇸🇪', active: true },
  { code: 'ie', name: 'Ireland', region: 'europe', flag: '🇮🇪', active: true },
  { code: 'ee', name: 'Estonia', region: 'europe', flag: '🇪🇪', active: true },
  { code: 'lt', name: 'Lithuania', region: 'europe', flag: '🇱🇹', active: true },
  { code: 'hr', name: 'Croatia', region: 'europe', flag: '🇭🇷', active: true },
  { code: 'ro', name: 'Romania', region: 'europe', flag: '🇷🇴', active: true },
  { code: 'ba', name: 'Bosnia', region: 'europe', flag: '🇧🇦', active: true },
  { code: 'al', name: 'Albania', region: 'europe', flag: '🇦🇱', active: true },
  { code: 'ua', name: 'Ukraine', region: 'europe', flag: '🇺🇦', active: true },
  { code: 'md', name: 'Moldova', region: 'europe', flag: '🇲🇩', active: true },
  { code: 'ru', name: 'Russia', region: 'europe', flag: '🇷🇺', active: true },
  // Asia
  { code: 'jp', name: 'Japan', region: 'asia', flag: '🇯🇵', active: true },
  { code: 'cn', name: 'China', region: 'asia', flag: '🇨🇳', active: true },
  { code: 'tw', name: 'Taiwan', region: 'asia', flag: '🇹🇼', active: true },
  { code: 'in', name: 'India', region: 'asia', flag: '🇮🇳', active: true },
  // Americas
  { code: 'us', name: 'United States', region: 'americas', flag: '🇺🇸', active: true },
  { code: 'ca', name: 'Canada', region: 'americas', flag: '🇨🇦', active: true },
  // Oceania
  { code: 'au', name: 'Australia', region: 'oceania', flag: '🇦🇺', active: true },
];

// Generic train service types based on distance
export interface TrainService {
  id: string;
  name: string;
  shortName: string;
  type: 'high-speed' | 'intercity' | 'regional' | 'local';
  color: string;
  speedKmh: number;
}

const trainServices: TrainService[] = [
  { id: 'high-speed', name: 'High-Speed', shortName: 'HS', type: 'high-speed', color: '#E31837', speedKmh: 250 },
  { id: 'intercity', name: 'Intercity', shortName: 'IC', type: 'intercity', color: '#003DA5', speedKmh: 160 },
  { id: 'regional', name: 'Regional', shortName: 'RE', type: 'regional', color: '#408335', speedKmh: 100 },
  { id: 'local', name: 'Local', shortName: 'S', type: 'local', color: '#6B6B6B', speedKmh: 70 },
];

export function getServiceForDistance(distanceKm: number): TrainService {
  if (distanceKm > 150) {
    return trainServices[0]; // High-Speed
  } else if (distanceKm > 80) {
    return trainServices[1]; // Intercity
  } else if (distanceKm > 30) {
    return trainServices[2]; // Regional
  } else {
    return trainServices[3]; // Local
  }
}

// Photo data from API
interface APIPhoto {
  id: number;
  path: string;
  photographer: string;
  license: string;
  createdAt: number;
  outdated?: boolean;
}

// Raw API response type
interface APIStation {
  country: string;
  id: string;
  title: string;
  lat: number;
  lon: number;
  shortCode?: string;
  inactive?: boolean;
  photos?: APIPhoto[];
}

// API response wrapper
interface APIResponse {
  stations: APIStation[];
  photoBaseUrl?: string;
  licenses?: unknown[];
  photographers?: unknown[];
}

// Cache entry type
interface CacheEntry {
  countryCode: string;
  stations: Station[];
  timestamp: number;
}

// ============================================================================
// IndexedDB Cache Layer
// ============================================================================

let dbPromise: Promise<IDBDatabase> | null = null;

function openCacheDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(CACHE_DB_NAME, CACHE_DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(CACHE_STORE_NAME)) {
        db.createObjectStore(CACHE_STORE_NAME, { keyPath: 'countryCode' });
      }
    };
  });

  return dbPromise;
}

async function getCachedStations(countryCode: string): Promise<Station[] | null> {
  try {
    const db = await openCacheDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(CACHE_STORE_NAME, 'readonly');
      const store = transaction.objectStore(CACHE_STORE_NAME);
      const request = store.get(countryCode);

      request.onsuccess = () => {
        const entry = request.result as CacheEntry | undefined;
        if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
          resolve(entry.stations);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function setCachedStations(countryCode: string, stations: Station[]): Promise<void> {
  try {
    const db = await openCacheDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(CACHE_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(CACHE_STORE_NAME);
      const entry: CacheEntry = {
        countryCode,
        stations,
        timestamp: Date.now(),
      };
      store.put(entry);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => resolve();
    });
  } catch {
    // Silently fail cache write
  }
}

// ============================================================================
// LRU Cache for Nearby Stations
// ============================================================================

interface LRUCacheEntry<T> {
  value: T;
  timestamp: number;
}

class LRUCache<T> {
  private cache = new Map<string, LRUCacheEntry<T>>();
  private maxSize: number;

  constructor(maxSize: number = 50) {
    this.maxSize = maxSize;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (entry) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, entry);
      return entry.value;
    }
    return null;
  }

  set(key: string, value: T): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(key, { value, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }
}

const nearbyStationsCache = new LRUCache<Station[]>(100);
const travelTimeCache = new LRUCache<{ station: Station; travelTime: number }[]>(100);

// ============================================================================
// Helper Functions
// ============================================================================

function getCountryName(code: string): string {
  const country = supportedCountries.find(c => c.code === code);
  return country?.name || code.toUpperCase();
}

function generateFunFacts(station: APIStation): string[] {
  const facts = [
    `Located in ${getCountryName(station.country)}`,
    `Station code: ${station.shortCode || station.id}`,
    `Coordinates: ${station.lat.toFixed(4)}, ${station.lon.toFixed(4)}`,
  ];
  return facts;
}

function getTimezone(countryCode: string): string {
  const timezones: Record<string, string> = {
    de: 'Europe/Berlin',
    at: 'Europe/Vienna',
    ch: 'Europe/Zurich',
    fr: 'Europe/Paris',
    nl: 'Europe/Amsterdam',
    be: 'Europe/Brussels',
    uk: 'Europe/London',
    es: 'Europe/Madrid',
    it: 'Europe/Rome',
    cz: 'Europe/Prague',
    pl: 'Europe/Warsaw',
    hu: 'Europe/Budapest',
    dk: 'Europe/Copenhagen',
    no: 'Europe/Oslo',
    fi: 'Europe/Helsinki',
    jp: 'Asia/Tokyo',
    in: 'Asia/Kolkata',
    au: 'Australia/Sydney',
    us: 'America/New_York',
    ca: 'America/Toronto',
    ru: 'Europe/Moscow',
    cn: 'Asia/Shanghai',
    tw: 'Asia/Taipei',
  };
  return timezones[countryCode] || 'UTC';
}

function transformStation(apiStation: APIStation, photoBaseUrl?: string): Station {
  // Get the first non-outdated photo, or fallback to any photo
  const photo = apiStation.photos?.find(p => !p.outdated) || apiStation.photos?.[0];
  const photoUrl = photo && photoBaseUrl
    ? `${photoBaseUrl}${photo.path}`
    : undefined;

  return {
    id: `api-${apiStation.country}-${apiStation.id}`,
    name: apiStation.title,
    city: apiStation.title.replace(/\s*(Hbf|Hauptbahnhof|Station|Central|Centraal|Gare|Bahnhof)\s*/gi, '').trim() || apiStation.title,
    country: getCountryName(apiStation.country),
    countryCode: apiStation.country.toUpperCase(),
    coordinates: {
      lat: apiStation.lat,
      lng: apiStation.lon,
    },
    timezone: getTimezone(apiStation.country),
    funFacts: generateFunFacts(apiStation),
    photoUrl,
    photographer: photo?.photographer,
  };
}

// ============================================================================
// API Functions
// ============================================================================

export async function fetchCountryStations(countryCode: string): Promise<Station[]> {
  // Check cache first
  const cached = await getCachedStations(countryCode);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(`${API_BASE}/photoStationsByCountry/${countryCode.toLowerCase()}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch stations: ${response.statusText}`);
    }
    const data: APIResponse = await response.json();
    const stations = data.stations || [];
    const photoBaseUrl = data.photoBaseUrl || 'https://api.railway-stations.org/photos';

    const transformedStations = stations
      .filter(s => !s.inactive)
      .map(s => transformStation(s, photoBaseUrl));

    // Cache the results
    await setCachedStations(countryCode, transformedStations);

    return transformedStations;
  } catch (error) {
    console.error('Error fetching stations:', error);
    throw error;
  }
}

export function getRandomStation(stations: Station[]): Station | null {
  if (stations.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * stations.length);
  return stations[randomIndex];
}

// ============================================================================
// Nearby Stations with LRU Cache
// ============================================================================

export function findNearbyStations(
  station: Station,
  allStations: Station[],
  maxDistanceKm: number = 300
): Station[] {
  const cacheKey = `${station.id}-${maxDistanceKm}`;
  const cached = nearbyStationsCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const nearby = allStations
    .filter(s => s.id !== station.id)
    .map(s => ({
      station: s,
      distance: calculateDistance(
        station.coordinates.lat,
        station.coordinates.lng,
        s.coordinates.lat,
        s.coordinates.lng
      ),
    }))
    .filter(item => item.distance <= maxDistanceKm)
    .sort((a, b) => a.distance - b.distance)
    .map(item => item.station);

  nearbyStationsCache.set(cacheKey, nearby);
  return nearby;
}

// ============================================================================
// Travel Time Calculation
// ============================================================================

function calculateTravelTime(distanceKm: number, isHighSpeed: boolean = false): number {
  const avgSpeed = isHighSpeed ? 200 : 80; // km/h
  const timeHours = distanceKm / avgSpeed;
  return Math.round(timeHours * 60); // Convert to minutes
}

function getTrainType(distanceKm: number, countryCode: string): string {
  const trainTypes: Record<string, { regional: string; express: string; highSpeed: string }> = {
    DE: { regional: 'Regional Express', express: 'IC', highSpeed: 'ICE' },
    AT: { regional: 'REX', express: 'IC', highSpeed: 'Railjet' },
    CH: { regional: 'S-Bahn', express: 'IC', highSpeed: 'ICE/TGV' },
    FR: { regional: 'TER', express: 'Intercites', highSpeed: 'TGV' },
    NL: { regional: 'Sprinter', express: 'Intercity', highSpeed: 'Thalys' },
    BE: { regional: 'L-Train', express: 'IC', highSpeed: 'Thalys' },
    UK: { regional: 'Regional', express: 'CrossCountry', highSpeed: 'Avanti' },
    ES: { regional: 'Regional', express: 'Alvia', highSpeed: 'AVE' },
    IT: { regional: 'Regionale', express: 'Intercity', highSpeed: 'Frecciarossa' },
    JP: { regional: 'Local', express: 'Limited Express', highSpeed: 'Shinkansen' },
    DEFAULT: { regional: 'Regional', express: 'Express', highSpeed: 'High-Speed' },
  };

  const types = trainTypes[countryCode] || trainTypes.DEFAULT;

  if (distanceKm < 50) return types.regional;
  if (distanceKm < 150) return types.express;
  return types.highSpeed;
}

// ============================================================================
// Route Pathfinding - Maximum Station Hopping Algorithm
// ============================================================================

// Cache for computed paths to prevent flickering
const pathCache = new LRUCache<string[]>(200);

// Calculate bearing between two points (in degrees, 0 = north, 90 = east)
function calculateBearing(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;

  const y = Math.sin(dLng) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);

  const bearing = Math.atan2(y, x) * 180 / Math.PI;
  return (bearing + 360) % 360;
}

// Calculate angular difference between two bearings (0-180)
function bearingDifference(bearing1: number, bearing2: number): number {
  let diff = Math.abs(bearing1 - bearing2);
  if (diff > 180) diff = 360 - diff;
  return diff;
}

// Maximum station hopping - tries to visit as many stations as possible along the route
function greedyHopPath(
  fromStation: Station,
  toStation: Station,
  allStations: Station[]
): Station[] {
  const path: Station[] = [fromStation];
  const visited = new Set<string>([fromStation.id]);
  let current = fromStation;

  // Allow lots of iterations - we want maximum station coverage
  const maxIterations = 2000;
  let iterations = 0;

  while (current.id !== toStation.id && iterations < maxIterations) {
    iterations++;

    const distanceToGoal = calculateDistance(
      current.coordinates.lat, current.coordinates.lng,
      toStation.coordinates.lat, toStation.coordinates.lng
    );

    // If very close to destination, go directly
    if (distanceToGoal < 1) {
      path.push(toStation);
      break;
    }

    const bearingToGoal = calculateBearing(
      current.coordinates.lat, current.coordinates.lng,
      toStation.coordinates.lat, toStation.coordinates.lng
    );

    let bestCandidate: Station | null = null;
    let bestDist = Infinity;

    // First pass: Find ALL stations that make forward progress
    // Use very relaxed bearing constraint (90 degrees) to catch more stations
    const forwardStations: { station: Station; dist: number; distToGoal: number }[] = [];

    for (const station of allStations) {
      if (visited.has(station.id)) continue;
      if (station.id === current.id) continue;

      const distFromCurrent = calculateDistance(
        current.coordinates.lat, current.coordinates.lng,
        station.coordinates.lat, station.coordinates.lng
      );

      const stationDistToGoal = calculateDistance(
        station.coordinates.lat, station.coordinates.lng,
        toStation.coordinates.lat, toStation.coordinates.lng
      );

      // Must make forward progress toward goal
      if (stationDistToGoal >= distanceToGoal) continue;

      const bearing = calculateBearing(
        current.coordinates.lat, current.coordinates.lng,
        station.coordinates.lat, station.coordinates.lng
      );

      // Very relaxed bearing - allow 130 degrees off course to catch more stations
      const bearingDiff = bearingDifference(bearing, bearingToGoal);
      if (bearingDiff > 130) continue;

      forwardStations.push({ station, dist: distFromCurrent, distToGoal: stationDistToGoal });
    }

    // Sort by distance from current position (closest first)
    forwardStations.sort((a, b) => a.dist - b.dist);

    // Pick the CLOSEST station that makes progress - maximum hopping
    if (forwardStations.length > 0) {
      // Always pick the absolute closest station for maximum density
      bestCandidate = forwardStations[0].station;
      bestDist = forwardStations[0].dist;
    }

    // If no forward station found with relaxed bearing, try with any direction
    // as long as it gets us closer
    if (!bestCandidate) {
      for (const station of allStations) {
        if (visited.has(station.id)) continue;
        if (station.id === current.id) continue;

        const distFromCurrent = calculateDistance(
          current.coordinates.lat, current.coordinates.lng,
          station.coordinates.lat, station.coordinates.lng
        );

        const stationDistToGoal = calculateDistance(
          station.coordinates.lat, station.coordinates.lng,
          toStation.coordinates.lat, toStation.coordinates.lng
        );

        // Must make forward progress
        if (stationDistToGoal >= distanceToGoal) continue;

        // Pick closest
        if (distFromCurrent < bestDist) {
          bestDist = distFromCurrent;
          bestCandidate = station;
        }
      }
    }

    if (bestCandidate) {
      path.push(bestCandidate);
      visited.add(bestCandidate.id);
      current = bestCandidate;
    } else {
      // No more intermediate stations, go directly to destination
      path.push(toStation);
      break;
    }
  }

  if (path[path.length - 1].id !== toStation.id) {
    path.push(toStation);
  }

  return path;
}

// Filter path to get only significant stops for display (not all the tiny ones)
// Returns indices of stations that should be shown as "stops"
function getSignificantStops(path: Station[], minDistanceKm: number = 15): number[] {
  if (path.length <= 2) return [0, path.length - 1];

  const significantIndices: number[] = [0]; // Always include start
  let lastSignificantIdx = 0;

  for (let i = 1; i < path.length - 1; i++) {
    const distFromLast = calculateDistance(
      path[lastSignificantIdx].coordinates.lat,
      path[lastSignificantIdx].coordinates.lng,
      path[i].coordinates.lat,
      path[i].coordinates.lng
    );

    if (distFromLast >= minDistanceKm) {
      significantIndices.push(i);
      lastSignificantIdx = i;
    }
  }

  significantIndices.push(path.length - 1); // Always include end
  return significantIndices;
}

// Export version that works with station IDs and a station map
export function getSignificantStopIds(
  stationIds: string[],
  stationMap: Record<string, Station>,
  minDistanceKm: number = 15
): Set<string> {
  const stations = stationIds.map(id => stationMap[id]).filter(Boolean);
  const indices = getSignificantStops(stations, minDistanceKm);
  return new Set(indices.map(i => stationIds[i]));
}

// Main pathfinding function
function findPathGreedy(
  fromStation: Station,
  toStation: Station,
  allStations: Station[]
): Station[] {
  const cacheKey = `path-${fromStation.id}-${toStation.id}`;
  const cached = pathCache.get(cacheKey);
  if (cached) {
    const stationMap = new Map(allStations.map(s => [s.id, s]));
    const cachedPath = cached.map(id => stationMap.get(id)!).filter(Boolean);
    if (cachedPath.length >= 2) return cachedPath;
  }

  const path = greedyHopPath(fromStation, toStation, allStations);
  pathCache.set(cacheKey, path.map(s => s.id));

  return path;
}

// Main pathfinding function - creates a realistic multi-stop route
export function findRoutePath(
  fromStation: Station,
  toStation: Station,
  allStations: Station[]
): RoutePath {
  const directDistance = calculateDistance(
    fromStation.coordinates.lat, fromStation.coordinates.lng,
    toStation.coordinates.lat, toStation.coordinates.lng
  );

  // For very short routes (< 5km), return direct path
  if (directDistance < 5) {
    const travelTime = calculateTravelTime(directDistance, false);
    return {
      stations: [fromStation.id, toStation.id],
      segments: [{
        from: fromStation.id,
        to: toStation.id,
        distanceKm: Math.round(directDistance),
        timeMinutes: travelTime,
      }],
      totalDistanceKm: Math.round(directDistance),
      totalTimeMinutes: travelTime,
    };
  }

  // Use greedy hop algorithm to find path through railway network
  const pathStations = findPathGreedy(fromStation, toStation, allStations);

  // If only 2 stations (direct path), just return that
  if (pathStations.length <= 2) {
    const travelTime = calculateTravelTime(directDistance, directDistance > 100);
    return {
      stations: [fromStation.id, toStation.id],
      segments: [{
        from: fromStation.id,
        to: toStation.id,
        distanceKm: Math.round(directDistance),
        timeMinutes: travelTime,
      }],
      totalDistanceKm: Math.round(directDistance),
      totalTimeMinutes: travelTime,
    };
  }

  const stationIds = pathStations.map(s => s.id);

  // Build segments
  const segments: RouteSegment[] = [];
  let totalDistance = 0;
  let totalTime = 0;

  for (let i = 0; i < pathStations.length - 1; i++) {
    const from = pathStations[i];
    const to = pathStations[i + 1];
    const segmentDistance = calculateDistance(
      from.coordinates.lat, from.coordinates.lng,
      to.coordinates.lat, to.coordinates.lng
    );
    const isHighSpeed = segmentDistance > 100;
    const segmentTime = calculateTravelTime(segmentDistance, isHighSpeed);

    segments.push({
      from: from.id,
      to: to.id,
      distanceKm: Math.round(segmentDistance),
      timeMinutes: segmentTime,
    });

    totalDistance += segmentDistance;
    totalTime += segmentTime;
  }

  return {
    stations: stationIds,
    segments,
    totalDistanceKm: Math.round(totalDistance),
    totalTimeMinutes: totalTime,
  };
}

// ============================================================================
// Curated Station Selection with Travel Time Buckets
// ============================================================================

interface TravelTimeBucket {
  minMinutes: number;
  maxMinutes: number;
  count: number;
}

const TRAVEL_TIME_BUCKETS: TravelTimeBucket[] = [
  { minMinutes: 5, maxMinutes: 15, count: 3 },   // Quick pomodoros
  { minMinutes: 15, maxMinutes: 30, count: 3 },  // Standard sessions
  { minMinutes: 30, maxMinutes: 60, count: 2 },  // Extended work
  { minMinutes: 60, maxMinutes: 120, count: 2 }, // Long sessions
  { minMinutes: 120, maxMinutes: 180, count: 1 }, // Epic focus
];

export function selectCuratedStations(
  fromStation: Station,
  allStations: Station[],
  countryCode: string
): { station: Station; travelTime: number; distanceKm: number }[] {
  const cacheKey = `curated-${fromStation.id}-${countryCode}`;
  const cached = travelTimeCache.get(cacheKey);
  if (cached) {
    return cached.map(item => {
      const distanceKm = Math.round(calculateDistance(
        fromStation.coordinates.lat,
        fromStation.coordinates.lng,
        item.station.coordinates.lat,
        item.station.coordinates.lng
      ));
      return { ...item, distanceKm };
    });
  }

  // Calculate travel times for all stations
  const stationsWithTimes = allStations
    .filter(s => s.id !== fromStation.id)
    .map(s => {
      const distanceKm = calculateDistance(
        fromStation.coordinates.lat,
        fromStation.coordinates.lng,
        s.coordinates.lat,
        s.coordinates.lng
      );
      const isHighSpeed = distanceKm > 100;
      const travelTime = calculateTravelTime(distanceKm, isHighSpeed);

      return { station: s, travelTime, distanceKm: Math.round(distanceKm) };
    })
    .filter(item => item.travelTime >= 5 && item.travelTime <= 180);

  // Fill buckets
  const selectedStations: { station: Station; travelTime: number; distanceKm: number }[] = [];
  const usedStationIds = new Set<string>();

  for (const bucket of TRAVEL_TIME_BUCKETS) {
    const eligibleStations = stationsWithTimes.filter(
      item =>
        item.travelTime >= bucket.minMinutes &&
        item.travelTime < bucket.maxMinutes &&
        !usedStationIds.has(item.station.id)
    );

    // Shuffle and pick random stations for this bucket
    const shuffled = eligibleStations.sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, bucket.count);

    picked.forEach(item => {
      selectedStations.push(item);
      usedStationIds.add(item.station.id);
    });
  }

  // Cache the results
  travelTimeCache.set(cacheKey, selectedStations.map(s => ({ station: s.station, travelTime: s.travelTime })));

  return selectedStations;
}

// ============================================================================
// Route Creation
// ============================================================================

export function createRoutesToNearby(
  fromStation: Station,
  nearbyStations: Station[],
  maxRoutes: number = 5
): Route[] {
  return nearbyStations.slice(0, maxRoutes).map(toStation => {
    const distanceKm = Math.round(calculateDistance(
      fromStation.coordinates.lat,
      fromStation.coordinates.lng,
      toStation.coordinates.lat,
      toStation.coordinates.lng
    ));

    const isHighSpeed = distanceKm > 100;
    const trainType = getTrainType(distanceKm, fromStation.countryCode);

    return {
      id: `route-${fromStation.id}-${toStation.id}`,
      from: fromStation.id,
      to: toStation.id,
      travelTimeMinutes: calculateTravelTime(distanceKm, isHighSpeed),
      distanceKm,
      trainType,
      routeName: `${fromStation.city} - ${toStation.city}`,
    };
  });
}

export function createCuratedRoutes(
  fromStation: Station,
  curatedStations: { station: Station; travelTime: number; distanceKm: number }[],
  allStations: Station[]
): Route[] {
  // Create station lookup map for significant stops calculation
  const stationMap = new Map(allStations.map(s => [s.id, s]));

  const validRoutes: Route[] = [];

  for (const { station: toStation } of curatedStations) {
    // Find full path through ALL intermediate stations (for accurate line drawing)
    const path = findRoutePath(fromStation, toStation, allStations);

    // Get the actual station objects for significant stops calculation
    const pathStations = path.stations
      .map(id => stationMap.get(id))
      .filter((s): s is Station => s !== undefined);

    // Validate that the computed path doesn't cross water
    let routeCrossesWater = false;
    for (let i = 0; i < pathStations.length - 1; i++) {
      if (doesSegmentCrossWater(pathStations[i].coordinates, pathStations[i + 1].coordinates)) {
        routeCrossesWater = true;
        break;
      }
    }

    // Skip routes that would cross water
    if (routeCrossesWater) {
      continue;
    }

    // Count ALL intermediate stops (excluding start and end)
    const totalStops = pathStations.length > 2 ? pathStations.length - 2 : 0;

    // Get appropriate train service type based on distance
    const service = getServiceForDistance(path.totalDistanceKm);

    validRoutes.push({
      id: `route-${fromStation.id}-${toStation.id}`,
      from: fromStation.id,
      to: toStation.id,
      travelTimeMinutes: path.totalTimeMinutes,
      distanceKm: path.totalDistanceKm,
      trainType: service.name,
      routeName: `${fromStation.city} - ${toStation.city}`,
      path, // Full path with ALL stations for accurate line drawing
      stops: totalStops, // Actual number of intermediate stops
      service: {
        id: service.id,
        name: service.name,
        shortName: service.shortName,
        color: service.color,
        type: service.type,
      },
    });
  }

  return validRoutes;
}

// ============================================================================
// Stats
// ============================================================================

export async function fetchCountryStats(countryCode: string): Promise<{ total: number; withPhotos: number }> {
  try {
    const response = await fetch(`${API_BASE}/stats?country=${countryCode.toLowerCase()}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch stats: ${response.statusText}`);
    }
    const data = await response.json();
    return {
      total: data.total || 0,
      withPhotos: data.withPhoto || 0,
    };
  } catch (error) {
    console.error('Error fetching country stats:', error);
    return { total: 0, withPhotos: 0 };
  }
}

// Clear caches (useful for testing or forced refresh)
export function clearCaches(): void {
  nearbyStationsCache.clear();
  travelTimeCache.clear();
  pathCache.clear();
}
