import { useCallback, useMemo, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline, InfoWindow } from '@react-google-maps/api';
import { stations, routes, findRoute } from '../data/stations';
import { useStore } from '../store/useStore';
import type { MapStyle } from '../types';

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

// Style to hide all labels
const noLabelsStyle: google.maps.MapTypeStyle[] = [
  {
    featureType: 'all',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
];

// Get map options based on style and labels
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

// Custom marker icon SVGs
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
  } = useStore();

  const [, setMap] = useState<google.maps.Map | null>(null);
  const [hoveredStationId, setHoveredStationId] = useState<string | null>(null);

  // Load Google Maps API
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Get the active route for highlighting
  const activeRoute = useMemo(() => {
    if (timer.currentRoute) {
      return { from: timer.currentRoute.from, to: timer.currentRoute.to };
    }
    if (selectedDeparture && selectedDestination) {
      const route = findRoute(selectedDeparture, selectedDestination);
      if (route) {
        return { from: selectedDeparture, to: selectedDestination };
      }
    }
    return null;
  }, [timer.currentRoute, selectedDeparture, selectedDestination]);

  // Handle station click
  const handleStationClick = (stationId: string) => {
    if (timer.status !== 'idle') return;

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

  // Calculate train position for animation
  const trainPosition = useMemo(() => {
    if (!timer.currentRoute || timer.status === 'idle') return null;

    const from = stations[timer.currentRoute.from];
    const to = stations[timer.currentRoute.to];

    const lat = from.coordinates.lat + (to.coordinates.lat - from.coordinates.lat) * timer.trainPosition;
    const lng = from.coordinates.lng + (to.coordinates.lng - from.coordinates.lng) * timer.trainPosition;

    return { lat, lng };
  }, [timer.currentRoute, timer.trainPosition, timer.status]);

  // Map options
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
      {/* Render all routes */}
      {routes.map((route) => {
        const from = stations[route.from];
        const to = stations[route.to];
        const isActive =
          (activeRoute?.from === route.from && activeRoute?.to === route.to) ||
          (activeRoute?.from === route.to && activeRoute?.to === route.from);

        return (
          <Polyline
            key={route.id}
            path={[
              { lat: from.coordinates.lat, lng: from.coordinates.lng },
              { lat: to.coordinates.lat, lng: to.coordinates.lng },
            ]}
            options={{
              strokeColor: isActive ? '#fbbf24' : '#3b82f6',
              strokeOpacity: isActive ? 0.9 : 0.4,
              strokeWeight: isActive ? 4 : 2,
              geodesic: true,
            }}
          />
        );
      })}

      {/* Render all station markers */}
      {Object.values(stations).map((station) => {
        const isDeparture = selectedDeparture === station.id;
        const isDestination = selectedDestination === station.id;
        const isSelected = isDeparture || isDestination;
        const isHovered = hoveredStationId === station.id;

        const color = isDeparture
          ? '#22c55e'
          : isDestination
            ? '#ef4444'
            : isHovered
              ? '#fbbf24'
              : '#60a5fa';

        return (
          <Marker
            key={station.id}
            position={{ lat: station.coordinates.lat, lng: station.coordinates.lng }}
            icon={createMarkerIcon(color, isSelected)}
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

      {/* Info window for hovered station */}
      {timer.status === 'idle' && hoveredStationId && (
        <InfoWindow
          position={{
            lat: stations[hoveredStationId].coordinates.lat,
            lng: stations[hoveredStationId].coordinates.lng,
          }}
          options={{
            pixelOffset: new google.maps.Size(0, -15),
            disableAutoPan: true,
          }}
        >
          <div className="p-1">
            <p className="font-medium text-gray-900">{stations[hoveredStationId].city}</p>
            <p className="text-xs text-gray-600">
              {selectedDeparture === hoveredStationId && '(Departure)'}
              {selectedDestination === hoveredStationId && '(Arrival)'}
            </p>
          </div>
        </InfoWindow>
      )}

      {/* Train marker during journey */}
      {trainPosition && (
        <Marker
          position={trainPosition}
          icon={{
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            fillColor: '#fbbf24',
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
