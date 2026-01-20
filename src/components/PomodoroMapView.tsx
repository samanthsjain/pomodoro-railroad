import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';
import { Pause, Play, Navigation, Compass, Train, Coffee, LogOut } from 'lucide-react';
import { useStore, useMergedStations } from '../store/useStore';
import type { Station } from '../types';
import { interpolateGreatCircle } from '../types';

const containerStyle = {
  width: '100%',
  height: '100%',
};

// Dark style for the map
const darkStyle: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#1d1d1d' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1d1d1d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#2c2c2c' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e0e0e' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function PomodoroMapView() {
  const {
    timer,
    pauseTimer,
    resumeTimer,
    endTrip,
    endBreak,
    tick,
    mapOrientation,
    setMapOrientation,
    togglePomodoroViewMode,
  } = useStore();

  const stations = useMergedStations();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const lastHeadingRef = useRef<number>(0);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  // Tick timer
  useEffect(() => {
    if (timer.status !== 'running' && timer.status !== 'break') return;
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [timer.status, tick]);

  // Get journey stations
  const journeyStations = useMemo(() => {
    if (!timer.journey) return [];
    return timer.journey.stations
      .map(id => stations[id])
      .filter((s): s is Station => Boolean(s));
  }, [timer.journey, stations]);

  // Build the full route path
  const fullRoutePath = useMemo(() => {
    return journeyStations.map(s => ({
      lat: s.coordinates.lat,
      lng: s.coordinates.lng,
    }));
  }, [journeyStations]);

  // Calculate train position using segment-aware interpolation
  const trainPosition = useMemo(() => {
    const journey = timer.journey;
    if (!journey || journey.segments.length === 0) return null;

    const currentSegment = journey.segments[journey.currentSegmentIndex];
    if (!currentSegment) return null;

    const fromStation = stations[currentSegment.fromStation];
    const toStation = stations[currentSegment.toStation];
    if (!fromStation || !toStation) return null;

    return interpolateGreatCircle(
      fromStation.coordinates,
      toStation.coordinates,
      journey.segmentProgress
    );
  }, [timer.journey, stations]);

  // Calculate the snake trail path (smooth interpolated path from start to train)
  const snakeTrailPath = useMemo(() => {
    const journey = timer.journey;
    if (!journey || !trainPosition) return [];

    const path: { lat: number; lng: number }[] = [];
    const POINTS_PER_SEGMENT = 20; // More points = smoother snake

    // Add interpolated points for all completed segments
    for (let i = 0; i < journey.currentSegmentIndex; i++) {
      const segment = journey.segments[i];
      const fromStation = stations[segment?.fromStation];
      const toStation = stations[segment?.toStation];
      if (!fromStation || !toStation) continue;

      // Interpolate points along this completed segment
      for (let p = 0; p < POINTS_PER_SEGMENT; p++) {
        const t = p / POINTS_PER_SEGMENT;
        const point = interpolateGreatCircle(fromStation.coordinates, toStation.coordinates, t);
        path.push(point);
      }
    }

    // Add interpolated points for current segment up to train position
    const currentSegment = journey.segments[journey.currentSegmentIndex];
    if (currentSegment) {
      const fromStation = stations[currentSegment.fromStation];
      const toStation = stations[currentSegment.toStation];
      if (fromStation && toStation) {
        const pointsInCurrentSegment = Math.floor(POINTS_PER_SEGMENT * journey.segmentProgress);
        for (let p = 0; p <= pointsInCurrentSegment; p++) {
          const t = (p / POINTS_PER_SEGMENT) * journey.segmentProgress;
          const point = interpolateGreatCircle(fromStation.coordinates, toStation.coordinates, t);
          path.push(point);
        }
      }
    }

    // Add the exact train position at the end
    path.push(trainPosition);

    return path;
  }, [timer.journey, trainPosition, stations]);

  // Calculate heading for direction-based orientation
  const heading = useMemo(() => {
    const journey = timer.journey;
    if (!journey || mapOrientation === 'north') return 0;

    const currentSegment = journey.segments[journey.currentSegmentIndex];
    if (!currentSegment) return lastHeadingRef.current;

    const fromStation = stations[currentSegment.fromStation];
    const toStation = stations[currentSegment.toStation];
    if (!fromStation || !toStation) return lastHeadingRef.current;

    // Calculate bearing
    const lat1 = fromStation.coordinates.lat * Math.PI / 180;
    const lat2 = toStation.coordinates.lat * Math.PI / 180;
    const dLng = (toStation.coordinates.lng - fromStation.coordinates.lng) * Math.PI / 180;

    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    const bearing = Math.atan2(y, x) * 180 / Math.PI;

    // Normalize to 0-360
    const normalizedBearing = (bearing + 360) % 360;
    lastHeadingRef.current = normalizedBearing;
    return normalizedBearing;
  }, [timer.journey, stations, mapOrientation]);

  // Pan/rotate map to follow train
  useEffect(() => {
    if (!map || !trainPosition) return;

    if (mapOrientation === 'direction') {
      // Rotate map to face direction of travel (train faces up)
      // setHeading() rotates the map so the specified compass direction faces up
      map.setHeading(heading);
      map.setTilt(45); // Add some tilt for 3D effect
      map.setZoom(15); // Zoom in a bit more for direction mode
    } else {
      map.setHeading(0);
      map.setTilt(0);
      map.setZoom(14);
    }

    map.panTo(trainPosition);
  }, [map, trainPosition, heading, mapOrientation]);

  // Update map type when orientation changes
  useEffect(() => {
    if (!map) return;
    if (mapOrientation === 'direction') {
      map.setMapTypeId('hybrid');
    } else {
      map.setMapTypeId('roadmap');
      map.setOptions({ styles: darkStyle });
    }
  }, [map, mapOrientation]);

  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    mapInstance.setZoom(14);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const mapOptions = useMemo((): google.maps.MapOptions => ({
    disableDefaultUI: true,
    zoomControl: false,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    gestureHandling: 'none', // Disable user interaction
    // Use hybrid map type when direction-oriented for heading/tilt support
    mapTypeId: mapOrientation === 'direction' ? 'hybrid' : 'roadmap',
    styles: mapOrientation === 'direction' ? undefined : darkStyle, // Styles only work on roadmap
    minZoom: 10,
    maxZoom: 16,
  }), [mapOrientation]);

  if (!isLoaded) return null;
  if (timer.status !== 'running' && timer.status !== 'paused' && timer.status !== 'break') {
    return null;
  }

  const remaining = timer.totalSeconds - timer.elapsedSeconds;
  const isPaused = timer.status === 'paused';
  const isBreak = timer.status === 'break';
  const isAtStation = timer.journey?.pauseState !== null;

  const fromStation = journeyStations[0];
  const toStation = journeyStations[journeyStations.length - 1];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90]"
      >
        {/* Map */}
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={trainPosition || { lat: 0, lng: 0 }}
          zoom={14}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={mapOptions}
        >
          {/* Full route path (faded) */}
          <Polyline
            path={fullRoutePath}
            options={{
              strokeColor: '#48484A',
              strokeOpacity: 0.5,
              strokeWeight: 4,
              geodesic: true,
            }}
          />

          {/* Snake trail path (bright, expanding from start) */}
          {snakeTrailPath.length >= 2 && (
            <Polyline
              path={snakeTrailPath}
              options={{
                strokeColor: '#007AFF',
                strokeOpacity: 1,
                strokeWeight: 5,
                geodesic: true,
              }}
            />
          )}

          {/* Station markers */}
          {journeyStations.map((station, idx) => {
            const isStart = idx === 0;
            const isEnd = idx === journeyStations.length - 1;
            const isPassed = timer.journey
              ? idx <= timer.journey.currentSegmentIndex
              : false;

            return (
              <Marker
                key={station.id}
                position={{ lat: station.coordinates.lat, lng: station.coordinates.lng }}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  fillColor: isStart
                    ? '#34C759'
                    : isEnd
                      ? '#FF9500'
                      : isPassed
                        ? '#34C759'
                        : '#8E8E93',
                  fillOpacity: 1,
                  strokeColor: '#ffffff',
                  strokeWeight: 2,
                  scale: isStart || isEnd ? 10 : 6,
                }}
              />
            );
          })}

          {/* Train marker */}
          {trainPosition && (
            <Marker
              position={trainPosition}
              icon={{
                path: 'M12 2L4 6v12l8 4 8-4V6l-8-4zm0 2.18l6 3v9.64l-6 3-6-3V7.18l6-3z',
                fillColor: '#007AFF',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
                scale: 1.5,
                anchor: new google.maps.Point(12, 12),
                rotation: mapOrientation === 'direction' ? 0 : heading,
              }}
            />
          )}
        </GoogleMap>

        {/* Timer overlay - top */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="glass rounded-2xl px-8 py-4 text-center"
          >
            <div className="text-4xl font-light tracking-tight text-white tabular-nums">
              {formatTime(remaining)}
            </div>
            {isBreak && (
              <p className="text-sm text-[var(--color-accent-orange)] mt-1">Break Time</p>
            )}
            {isAtStation && timer.journey?.pauseState && (
              <p className="text-sm text-[var(--color-accent-orange)] mt-1">
                Arriving at {timer.journey.pauseState.stationName}
              </p>
            )}
          </motion.div>
        </div>

        {/* Route info - bottom */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="glass rounded-2xl px-6 py-3"
          >
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[var(--color-accent-green)]" />
                <span className="text-[var(--color-text-secondary)]">{fromStation?.city}</span>
              </div>
              <div className="w-8 h-px bg-[var(--color-separator)]" />
              <div className="flex items-center gap-2">
                <span className="text-[var(--color-text-secondary)]">{toStation?.city}</span>
                <div className="w-2 h-2 rounded-full bg-[var(--color-accent-orange)]" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Controls - right side panel */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-3">
          {/* Pause/Play button */}
          {!isBreak && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={isPaused ? resumeTimer : pauseTimer}
              className="w-12 h-12 rounded-full glass flex items-center justify-center"
              title={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? (
                <Play className="w-5 h-5 text-white" />
              ) : (
                <Pause className="w-5 h-5 text-white" />
              )}
            </motion.button>
          )}

          {/* End break button */}
          {isBreak && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={endBreak}
              className="w-12 h-12 rounded-full glass flex items-center justify-center bg-[var(--color-accent-green)]/30"
              title="End break"
            >
              <Coffee className="w-5 h-5 text-[var(--color-accent-green)]" />
            </motion.button>
          )}

          {/* End trip button */}
          {!isBreak && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={endTrip}
              className="w-12 h-12 rounded-full glass flex items-center justify-center"
              title="End trip and pick new destination"
            >
              <LogOut className="w-5 h-5 text-[var(--color-accent-orange)]" />
            </motion.button>
          )}

          {/* Separator */}
          <div className="w-8 h-px bg-white/20 mx-auto" />

          {/* Orientation toggle */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setMapOrientation(mapOrientation === 'north' ? 'direction' : 'north')}
            className="w-12 h-12 rounded-full glass flex items-center justify-center"
            title={mapOrientation === 'north' ? 'Face direction of travel' : 'Face north'}
          >
            {mapOrientation === 'north' ? (
              <Compass className="w-5 h-5 text-white" />
            ) : (
              <Navigation className="w-5 h-5 text-[var(--color-accent-blue)]" />
            )}
          </motion.button>

          {/* View toggle */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={togglePomodoroViewMode}
            className="w-12 h-12 rounded-full glass flex items-center justify-center"
            title="Switch to cabin view"
          >
            <Train className="w-5 h-5 text-white" />
          </motion.button>
        </div>

        {/* Paused indicator */}
        {isPaused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none"
          >
            <div className="glass rounded-2xl px-8 py-4">
              <p className="text-xl font-medium text-white">PAUSED</p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
