// Map Style Types
export type MapStyle = 'standard' | 'satellite' | 'terrain' | 'monochrome';

export interface MapStyleConfig {
  id: MapStyle;
  name: string;
  description: string;
  icon: string;
}

export const mapStyles: MapStyleConfig[] = [
  {
    id: 'standard',
    name: 'Standard',
    description: 'Default Google Maps view',
    icon: '🗺️',
  },
  {
    id: 'satellite',
    name: 'Satellite',
    description: 'Satellite imagery',
    icon: '🛰️',
  },
  {
    id: 'terrain',
    name: 'Terrain',
    description: 'Topographic elevation view',
    icon: '🏔️',
  },
  {
    id: 'monochrome',
    name: 'Monochrome',
    description: 'Dark grayscale theme',
    icon: '🖤',
  },
];

// Station and Route Types

export interface Station {
  id: string;
  name: string;
  city: string;
  country: string;
  countryCode: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  timezone: string;
  funFacts: string[];
  isApiStation?: boolean; // True if loaded from Railway Stations API
}

// API loading state
export type ApiLoadingState = 'idle' | 'loading' | 'success' | 'error';

// Route segment for multi-stop journeys
export interface RouteSegment {
  from: string;
  to: string;
  distanceKm: number;
  timeMinutes: number;
}

// Full route path with intermediate stations
export interface RoutePath {
  stations: string[];           // All station IDs in order
  segments: RouteSegment[];     // Details for each segment
  totalDistanceKm: number;
  totalTimeMinutes: number;
}

export interface Route {
  id: string;
  from: string; // Station ID
  to: string; // Station ID
  travelTimeMinutes: number;
  distanceKm: number;
  trainType: string;
  routeName?: string; // e.g., "Shinkansen Nozomi", "Eurostar"
  path?: RoutePath; // Multi-stop path with intermediate stations
  // Enhanced route info
  stops?: number; // Number of intermediate stops
  service?: {
    id: string;
    name: string;
    shortName: string;
    color: string;
    type: 'high-speed' | 'intercity' | 'regional' | 'local';
  };
}

// Journey segment with pre-computed timing
export interface JourneySegment {
  fromStation: string;
  toStation: string;
  distanceKm: number;
  timeSeconds: number;
  startProgress: number;  // Overall progress where segment starts (0-1)
  endProgress: number;    // Overall progress where segment ends (0-1)
}

// Pause state for station arrivals
export interface PauseState {
  stationId: string;
  stationName: string;
  remainingPauseSeconds: number;
  totalPauseSeconds: number;
}

export interface Journey {
  id: string;
  stations: string[];              // Full path of station IDs (ALL stations for smooth movement)
  significantStopIds: Set<string>; // Only major stops where train pauses (15km+ apart)
  currentSegmentIndex: number;     // Which segment we're on (0 to n-1)
  segmentProgress: number;         // 0-1 within current segment
  segments: JourneySegment[];      // Pre-computed segment data
  totalDistanceKm: number;
  totalTimeMinutes: number;
  pauseState: PauseState | null;   // Station arrival pause
}

// Train class options
export type TrainClass = 'economy' | 'business' | 'first';

export interface TrainClassConfig {
  id: TrainClass;
  name: string;
  description: string;
  timeMultiplier: number; // e.g., 1.0 for economy, 0.85 for business, 0.75 for first
  cabinStyle: 'standard' | 'comfortable' | 'luxury';
}

export const trainClasses: TrainClassConfig[] = [
  {
    id: 'economy',
    name: 'Economy',
    description: 'Standard seating with window views',
    timeMultiplier: 1.0,
    cabinStyle: 'standard',
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Extra legroom and quieter cabin',
    timeMultiplier: 0.85,
    cabinStyle: 'comfortable',
  },
  {
    id: 'first',
    name: 'First Class',
    description: 'Premium experience with luxury amenities',
    timeMultiplier: 0.75,
    cabinStyle: 'luxury',
  },
];

// Seat selection type
export interface SelectedSeat {
  car: number;    // Car/coach number (1-4)
  row: number;    // Row number (1-8)
  seat: string;   // Seat letter (A, B, C, D)
  isWindow: boolean;
}

export interface TimerState {
  status: 'idle' | 'selecting-seat' | 'confirming' | 'running' | 'paused' | 'break' | 'completed';
  currentRoute: Route | null;
  journey: Journey | null;
  elapsedSeconds: number;
  totalSeconds: number;
  trainPosition: number; // 0-1 progress along current route
  ticketStamped: boolean; // Whether the ticket has been stamped
  selectedClass: TrainClass; // Selected train class
  selectedSeat: SelectedSeat | null; // Selected seat in the train
}

export interface UserProgress {
  visitedStations: string[]; // Station IDs
  completedRoutes: string[]; // Route IDs
  totalDistanceKm: number;
  totalTimeMinutes: number;
  countriesVisited: string[]; // Country codes
  sessionsCompleted: number;
  createdAt: string;
  lastSessionAt: string;
}

export interface AppState {
  stations: Record<string, Station>;
  routes: Route[];
  timer: TimerState;
  progress: UserProgress;
  selectedDeparture: string | null;
  selectedDestination: string | null;
  hoveredStation: string | null;
  showSearch: boolean;
  searchQuery: string;
}

// Preset route templates
export interface PresetRoute {
  id: string;
  name: string;
  description: string;
  category: 'short' | 'medium' | 'long' | 'epic';
  stationIds: string[];
}

// For 3D globe calculations
export interface GlobePoint {
  x: number;
  y: number;
  z: number;
}

// Convert lat/lng to 3D point on sphere
export function latLngToPoint(lat: number, lng: number, radius: number = 1): GlobePoint {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  return {
    x: -(radius * Math.sin(phi) * Math.cos(theta)),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta),
  };
}

// Calculate distance between two coordinates using Haversine formula
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Interpolate between two points on the globe for animation
export function interpolateGreatCircle(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  t: number // 0-1
): { lat: number; lng: number } {
  const lat1 = start.lat * (Math.PI / 180);
  const lng1 = start.lng * (Math.PI / 180);
  const lat2 = end.lat * (Math.PI / 180);
  const lng2 = end.lng * (Math.PI / 180);

  const d = 2 * Math.asin(
    Math.sqrt(
      Math.pow(Math.sin((lat2 - lat1) / 2), 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin((lng2 - lng1) / 2), 2)
    )
  );

  if (d === 0) return start;

  const A = Math.sin((1 - t) * d) / Math.sin(d);
  const B = Math.sin(t * d) / Math.sin(d);

  const x = A * Math.cos(lat1) * Math.cos(lng1) + B * Math.cos(lat2) * Math.cos(lng2);
  const y = A * Math.cos(lat1) * Math.sin(lng1) + B * Math.cos(lat2) * Math.sin(lng2);
  const z = A * Math.sin(lat1) + B * Math.sin(lat2);

  const lat = Math.atan2(z, Math.sqrt(x * x + y * y)) * (180 / Math.PI);
  const lng = Math.atan2(y, x) * (180 / Math.PI);

  return { lat, lng };
}
