import { useCallback, useMemo, useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline, OverlayView } from '@react-google-maps/api';
import { useStore, useMergedStations } from '../store/useStore';
import type { MapStyle, Route } from '../types';
import { interpolateGreatCircle } from '../types';

const containerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 48.8566,
  lng: 2.3522,
};

// Monochrome dark style for Google Maps
const monochromeStyle: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#1d1d1d' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1d1d1d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  {
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [{ color: '#757575' }],
  },
  {
    featureType: 'administrative.country',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9e9e9e' }],
  },
  {
    featureType: 'administrative.land_parcel',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#bdbdbd' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#757575' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#181818' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#616161' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.fill',
    stylers: [{ color: '#2c2c2c' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8a8a8a' }],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry',
    stylers: [{ color: '#373737' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#3c3c3c' }],
  },
  {
    featureType: 'road.highway.controlled_access',
    elementType: 'geometry',
    stylers: [{ color: '#4e4e4e' }],
  },
  {
    featureType: 'road.local',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#616161' }],
  },
  {
    featureType: 'transit',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#757575' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0e0e0e' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#3d3d3d' }],
  },
];

const noLabelsStyle: google.maps.MapTypeStyle[] = [
  {
    featureType: 'all',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
];

function getMapOptions(mapStyle: MapStyle, showLabels: boolean): google.maps.MapOptions {
  const baseOptions: google.maps.MapOptions = {
    disableDefaultUI: true,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    gestureHandling: 'greedy',
    minZoom: 2,
    maxZoom: 18,
  };

  let styles: google.maps.MapTypeStyle[] = [];
  let mapTypeId: google.maps.MapTypeId = google.maps.MapTypeId.ROADMAP;

  switch (mapStyle) {
    case 'satellite':
      mapTypeId = google.maps.MapTypeId.SATELLITE;
      break;
    case 'terrain':
      mapTypeId = google.maps.MapTypeId.TERRAIN;
      break;
    case 'monochrome':
      styles = [...monochromeStyle];
      break;
    case 'standard':
    default:
      mapTypeId = google.maps.MapTypeId.ROADMAP;
      break;
  }

  if (!showLabels) {
    styles = [...styles, ...noLabelsStyle];
  }

  return {
    ...baseOptions,
    mapTypeId,
    styles: styles.length > 0 ? styles : undefined,
  };
}

const createMarkerIcon = (color: string, isSelected: boolean) => ({
  path: google.maps.SymbolPath.CIRCLE,
  fillColor: color,
  fillOpacity: 1,
  strokeColor: isSelected ? '#ffffff' : color,
  strokeWeight: isSelected ? 3 : 1,
  scale: isSelected ? 10 : 7,
});

export function MapView() {
  const {
    selectedDeparture,
    selectedDestination,
    setSelectedDeparture,
    setSelectedDestination,
    setHoveredStation,
    timer,
    mapStyle,
    showLabels,
    findRoute,
    selectedCountry,
    currentStation,
    apiRoutes,
  } = useStore();

  // Use memoized merged stations
  const stations = useMergedStations();

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [hoveredStationId, setHoveredStationId] = useState<string | null>(null);

  // Use API routes
  const routes: Route[] = useMemo(() => {
    return apiRoutes;
  }, [apiRoutes]);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Center map on current station when in API mode
  useEffect(() => {
    if (map && currentStation && stations[currentStation]) {
      const station = stations[currentStation];
      map.panTo({ lat: station.coordinates.lat, lng: station.coordinates.lng });
      map.setZoom(9);
    }
  }, [map, currentStation, stations]);

  // Fit bounds to show all API stations when country changes
  useEffect(() => {
    if (map && selectedCountry && Object.keys(stations).length > 0) {
      const apiStations = Object.values(stations).filter(s => s.isApiStation);
      if (apiStations.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        apiStations.forEach(station => {
          bounds.extend({ lat: station.coordinates.lat, lng: station.coordinates.lng });
        });
        map.fitBounds(bounds, 50);
      }
    }
  }, [map, selectedCountry]);

  // Get connected station IDs (only these are shown on the map)
  const connectedIds = useMemo(() => {
    const ids = new Set<string>();
    if (currentStation) {
      ids.add(currentStation);
    }
    routes.forEach(r => {
      ids.add(r.from);
      ids.add(r.to);
    });
    return ids;
  }, [routes, currentStation]);

  // Filter stations to only show connected ones (no greyed out markers)
  const visibleStations = useMemo(() => {
    const allStationsList = Object.values(stations);

    // If no stations, return empty
    if (allStationsList.length === 0) return [];

    // If no country selected, show nothing
    if (!selectedCountry) return [];

    // Only show stations that are connected (current + destinations)
    const connectedStations = allStationsList.filter(s => connectedIds.has(s.id));

    return connectedStations;
  }, [stations, selectedCountry, connectedIds]);

  // Get the active route for highlighting
  const activeRoute = useMemo(() => {
    if (timer.currentRoute) {
      return { from: timer.currentRoute.from, to: timer.currentRoute.to, route: timer.currentRoute };
    }
    if (selectedDeparture && selectedDestination) {
      const route = findRoute(selectedDeparture, selectedDestination);
      if (route) {
        return { from: selectedDeparture, to: selectedDestination, route };
      }
    }
    return null;
  }, [timer.currentRoute, selectedDeparture, selectedDestination, findRoute]);

  // Handle station click
  const handleStationClick = (stationId: string) => {
    if (timer.status !== 'idle') return;

    if (selectedCountry && currentStation) {
      if (stationId === currentStation) {
        return;
      } else {
        const route = findRoute(currentStation, stationId);
        if (route) {
          setSelectedDestination(stationId);
        }
      }
      return;
    }

    if (!selectedDeparture) {
      setSelectedDeparture(stationId);
    } else if (selectedDeparture === stationId) {
      setSelectedDeparture(null);
    } else if (!selectedDestination) {
      setSelectedDestination(stationId);
    } else {
      setSelectedDestination(stationId);
    }
  };

  // Calculate train position for animation (segment-aware with great circle interpolation)
  const trainPosition = useMemo(() => {
    if (!timer.currentRoute || timer.status === 'idle') return null;
    const journey = timer.journey;

    // If we have segment data, use segment-aware positioning
    if (journey && journey.segments.length > 0) {
      const currentSegment = journey.segments[journey.currentSegmentIndex];
      if (!currentSegment) return null;

      const fromStation = stations[currentSegment.fromStation];
      const toStation = stations[currentSegment.toStation];
      if (!fromStation || !toStation) return null;

      // Use great circle interpolation for curved path
      const position = interpolateGreatCircle(
        fromStation.coordinates,
        toStation.coordinates,
        journey.segmentProgress
      );

      return position;
    }

    // Fallback to direct interpolation
    const from = stations[timer.currentRoute.from];
    const to = stations[timer.currentRoute.to];
    if (!from || !to) return null;

    const position = interpolateGreatCircle(
      from.coordinates,
      to.coordinates,
      timer.trainPosition
    );

    return position;
  }, [timer.currentRoute, timer.trainPosition, timer.status, timer.journey, stations]);

  // Get travel info for hovered station (for hover card)
  const getHoveredStationInfo = useCallback((stationId: string) => {
    if (!currentStation || stationId === currentStation) return null;

    const route = routes.find(r =>
      (r.from === currentStation && r.to === stationId) ||
      (r.to === currentStation && r.from === stationId)
    );

    if (!route) return null;

    return {
      travelTime: route.travelTimeMinutes,
      distance: route.distanceKm,
      stops: route.path ? route.path.stations.length - 2 : 0,
    };
  }, [currentStation, routes]);

  const mapOptions = useMemo(() => {
    if (!isLoaded) return {};
    return getMapOptions(mapStyle, showLabels);
  }, [isLoaded, mapStyle, showLabels]);

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <p className="text-red-400 text-lg">Failed to load Google Maps</p>
          <p className="text-gray-500 text-sm mt-2">Please check your API key configuration</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 mt-4">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={defaultCenter}
      zoom={4}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={mapOptions}
    >
      {/* Render route lines - segment by segment for proper station-to-station drawing */}
      {routes.map((route) => {
        const isActive =
          (activeRoute?.from === route.from && activeRoute?.to === route.to) ||
          (activeRoute?.from === route.to && activeRoute?.to === route.from);

        // Get the station IDs for this route's path
        const pathStationIds = route.path?.stations || [route.from, route.to];

        // Draw individual segments between consecutive stations
        const segments: React.ReactNode[] = [];

        for (let i = 0; i < pathStationIds.length - 1; i++) {
          const fromStation = stations[pathStationIds[i]];
          const toStation = stations[pathStationIds[i + 1]];

          // Skip if either station doesn't exist
          if (!fromStation || !toStation) continue;

          // Validate coordinates
          if (!fromStation.coordinates || !toStation.coordinates) continue;
          if (isNaN(fromStation.coordinates.lat) || isNaN(fromStation.coordinates.lng)) continue;
          if (isNaN(toStation.coordinates.lat) || isNaN(toStation.coordinates.lng)) continue;

          segments.push(
            <Polyline
              key={`${route.id}-segment-${i}`}
              path={[
                { lat: fromStation.coordinates.lat, lng: fromStation.coordinates.lng },
                { lat: toStation.coordinates.lat, lng: toStation.coordinates.lng },
              ]}
              options={{
                strokeColor: isActive ? '#007AFF' : '#48484A',
                strokeOpacity: isActive ? 0.9 : 0.4,
                strokeWeight: isActive ? 4 : 2,
                geodesic: true,
              }}
            />
          );
        }

        return segments.length > 0 ? <>{segments}</> : null;
      })}

      {/* Render intermediate station markers along the route */}
      {activeRoute?.route?.path && activeRoute.route.path.stations.length > 2 && (
        activeRoute.route.path.stations.slice(1, -1).map((stationId) => {
          const station = stations[stationId];
          if (!station) return null;

          // During journey: color based on progress
          // Before journey: grey dots
          let fillColor = '#6B6B6B'; // Default grey
          let scale = 4;

          if (timer.journey) {
            const stationIndexInJourney = timer.journey.stations.indexOf(stationId);
            const isPassed = stationIndexInJourney < timer.journey.currentSegmentIndex + 1;
            const isNext = stationIndexInJourney === timer.journey.currentSegmentIndex + 1;
            fillColor = isPassed ? '#34C759' : isNext ? '#FF9500' : '#8E8E93';
            scale = 5;
          }

          return (
            <Marker
              key={`intermediate-${stationId}`}
              position={{ lat: station.coordinates.lat, lng: station.coordinates.lng }}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                fillColor,
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 1.5,
                scale,
              }}
            />
          );
        })
      )}

      {/* Render visible station markers (only connected stations) */}
      {visibleStations.map((station) => {
        const isCurrent = currentStation === station.id;
        const isDeparture = selectedDeparture === station.id;
        const isDestination = selectedDestination === station.id;
        const isSelected = isDeparture || isDestination || isCurrent;
        const isHovered = hoveredStationId === station.id;

        const color = isCurrent
          ? '#34C759' // Apple green - current location
          : isDestination
            ? '#FF9500' // Apple orange - selected destination
            : isHovered
              ? '#007AFF' // Apple blue - hovered
              : '#5E5CE6'; // Apple indigo - available destinations

        return (
          <Marker
            key={station.id}
            position={{ lat: station.coordinates.lat, lng: station.coordinates.lng }}
            icon={createMarkerIcon(color, isSelected || isHovered)}
            onClick={() => handleStationClick(station.id)}
            onMouseOver={() => {
              setHoveredStationId(station.id);
              setHoveredStation(station.id);
            }}
            onMouseOut={() => {
              setHoveredStationId(null);
              setHoveredStation(null);
            }}
          />
        );
      })}

      {/* Apple-style glass hover card */}
      {timer.status === 'idle' && hoveredStationId && stations[hoveredStationId] && (
        <OverlayView
          position={{
            lat: stations[hoveredStationId].coordinates.lat,
            lng: stations[hoveredStationId].coordinates.lng,
          }}
          mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
        >
          <div
            className="transform -translate-x-1/2 -translate-y-full -mt-4 animate-in fade-in zoom-in-95 duration-150"
            style={{ pointerEvents: 'none' }}
          >
            <div
              className="px-4 py-3 rounded-2xl shadow-2xl min-w-[180px]"
              style={{
                background: 'rgba(30, 30, 30, 0.85)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <p className="font-semibold text-white text-sm">
                {stations[hoveredStationId].name}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {stations[hoveredStationId].city}
              </p>

              {currentStation === hoveredStationId ? (
                <div className="mt-2 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-xs text-green-400">Your Location</span>
                </div>
              ) : selectedDestination === hoveredStationId ? (
                <div className="mt-2 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                  <span className="text-xs text-orange-400">Selected Destination</span>
                </div>
              ) : (() => {
                const info = getHoveredStationInfo(hoveredStationId);
                if (!info) return null;
                return (
                  <div className="mt-2 pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Travel time</span>
                      <span className="text-blue-400 font-medium">
                        {info.travelTime < 60
                          ? `${info.travelTime}m`
                          : `${Math.floor(info.travelTime / 60)}h ${info.travelTime % 60}m`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-1">
                      <span className="text-gray-400">Distance</span>
                      <span className="text-gray-300">{info.distance} km</span>
                    </div>
                    {info.stops > 0 && (
                      <div className="flex items-center justify-between text-xs mt-1">
                        <span className="text-gray-400">Stops</span>
                        <span className="text-gray-300">{info.stops} station{info.stops > 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
            {/* Arrow pointer */}
            <div
              className="w-3 h-3 mx-auto -mt-1.5 rotate-45"
              style={{
                background: 'rgba(30, 30, 30, 0.85)',
                borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            />
          </div>
        </OverlayView>
      )}

      {/* Train marker during journey */}
      {trainPosition && (
        <Marker
          position={trainPosition}
          icon={{
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            fillColor: '#007AFF',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 6,
            rotation: 0,
          }}
        />
      )}
    </GoogleMap>
  );
}

export default MapView;
