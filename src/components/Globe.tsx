import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';
import { stations, routes } from '../data/stations';
import { latLngToPoint, interpolateGreatCircle } from '../types';
import { useStore } from '../store/useStore';

const GLOBE_RADIUS = 2;

// Procedural Earth with continents
function Earth() {
  const meshRef = useRef<THREE.Mesh>(null);

  // Create a procedural earth texture
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Ocean gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0a1628');
    gradient.addColorStop(0.5, '#0d1f3c');
    gradient.addColorStop(1, '#0a1628');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add subtle grid lines
    ctx.strokeStyle = 'rgba(100, 150, 255, 0.1)';
    ctx.lineWidth = 1;

    // Latitude lines
    for (let lat = -80; lat <= 80; lat += 20) {
      const y = ((90 - lat) / 180) * canvas.height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Longitude lines
    for (let lng = -180; lng <= 180; lng += 30) {
      const x = ((lng + 180) / 360) * canvas.width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }, []);

  // Slow rotation
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.02;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
      <meshStandardMaterial
        map={texture}
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  );
}

// Atmosphere glow effect
function Atmosphere() {
  return (
    <mesh>
      <sphereGeometry args={[GLOBE_RADIUS * 1.02, 64, 64]} />
      <meshBasicMaterial
        color="#4a9eff"
        transparent
        opacity={0.1}
        side={THREE.BackSide}
      />
    </mesh>
  );
}

// Station marker component
function StationMarker({ stationId }: { stationId: string }) {
  const station = stations[stationId];
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const {
    selectedDeparture,
    selectedDestination,
    setSelectedDeparture,
    setSelectedDestination,
    setHoveredStation,
    timer,
  } = useStore();

  const isSelected = selectedDeparture === stationId || selectedDestination === stationId;
  const isDeparture = selectedDeparture === stationId;
  const isDestination = selectedDestination === stationId;

  const position = useMemo(() => {
    const point = latLngToPoint(station.coordinates.lat, station.coordinates.lng, GLOBE_RADIUS * 1.01);
    return new THREE.Vector3(point.x, point.y, point.z);
  }, [station.coordinates]);

  // Pulsing animation for selected stations
  useFrame((state) => {
    if (meshRef.current) {
      const scale = isSelected
        ? 1.5 + Math.sin(state.clock.elapsedTime * 3) * 0.3
        : hovered
          ? 1.3
          : 1;
      meshRef.current.scale.setScalar(scale);
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (timer.status !== 'idle') return; // Don't allow selection during journey

    if (!selectedDeparture) {
      setSelectedDeparture(stationId);
    } else if (selectedDeparture === stationId) {
      setSelectedDeparture(null);
    } else if (!selectedDestination) {
      setSelectedDestination(stationId);
    } else {
      // Both selected, replace destination
      setSelectedDestination(stationId);
    }
  };

  const color = isDeparture
    ? '#22c55e' // Green for departure
    : isDestination
      ? '#ef4444' // Red for destination
      : hovered
        ? '#fbbf24' // Yellow on hover
        : '#60a5fa'; // Blue default

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerEnter={(e) => {
          e.stopPropagation();
          setHovered(true);
          setHoveredStation(stationId);
          document.body.style.cursor = 'pointer';
        }}
        onPointerLeave={() => {
          setHovered(false);
          setHoveredStation(null);
          document.body.style.cursor = 'auto';
        }}
      >
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* Glow ring for selected stations */}
      {isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.05, 0.07, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Station label on hover or selection */}
      {(hovered || isSelected) && (
        <Html
          position={[0, 0.1, 0]}
          style={{
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <div className="bg-gray-900/90 backdrop-blur-sm text-white px-2 py-1 rounded text-xs font-medium shadow-lg border border-gray-700">
            {station.city}
            {isDeparture && <span className="ml-1 text-green-400">(Departure)</span>}
            {isDestination && <span className="ml-1 text-red-400">(Arrival)</span>}
          </div>
        </Html>
      )}
    </group>
  );
}

// Route arc between two stations
function RouteArc({ fromId, toId, isActive = false }: { fromId: string; toId: string; isActive?: boolean }) {
  const from = stations[fromId];
  const to = stations[toId];
  const lineRef = useRef<THREE.Line>(null);

  const points = useMemo(() => {
    const segments = 64;
    const curvePoints: THREE.Vector3[] = [];

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const { lat, lng } = interpolateGreatCircle(
        from.coordinates,
        to.coordinates,
        t
      );
      // Raise the arc slightly above the globe surface
      const altitude = GLOBE_RADIUS * 1.01 + Math.sin(t * Math.PI) * 0.15;
      const point = latLngToPoint(lat, lng, altitude);
      curvePoints.push(new THREE.Vector3(point.x, point.y, point.z));
    }

    return curvePoints;
  }, [from.coordinates, to.coordinates]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    return geo;
  }, [points]);

  // Animation for active routes
  useFrame((state) => {
    if (lineRef.current && isActive) {
      const material = lineRef.current.material as THREE.LineBasicMaterial;
      material.opacity = 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.3;
    }
  });

  const material = useMemo(() => {
    return new THREE.LineBasicMaterial({
      color: isActive ? '#fbbf24' : '#3b82f6',
      transparent: true,
      opacity: isActive ? 0.8 : 0.4,
    });
  }, [isActive]);

  const line = useMemo(() => {
    const l = new THREE.Line(geometry, material);
    return l;
  }, [geometry, material]);

  return <primitive ref={lineRef} object={line} />;
}

// Train moving along the route
function Train() {
  const { timer } = useStore();
  const trainRef = useRef<THREE.Mesh>(null);

  const position = useMemo(() => {
    if (!timer.currentRoute || timer.status === 'idle') return null;

    const from = stations[timer.currentRoute.from];
    const to = stations[timer.currentRoute.to];

    const { lat, lng } = interpolateGreatCircle(
      from.coordinates,
      to.coordinates,
      timer.trainPosition
    );

    const altitude = GLOBE_RADIUS * 1.01 + Math.sin(timer.trainPosition * Math.PI) * 0.15;
    const point = latLngToPoint(lat, lng, altitude);
    return new THREE.Vector3(point.x, point.y, point.z);
  }, [timer.currentRoute, timer.trainPosition, timer.status]);

  // Pulsing animation
  useFrame((state) => {
    if (trainRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 5) * 0.2;
      trainRef.current.scale.setScalar(pulse);
    }
  });

  if (!position) return null;

  return (
    <group position={position}>
      <mesh ref={trainRef}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial color="#fbbf24" />
      </mesh>
      {/* Trail effect */}
      <pointLight color="#fbbf24" intensity={0.5} distance={0.3} />
    </group>
  );
}

// Camera controller to focus on selected route
function CameraController() {
  const { camera } = useThree();
  const { selectedDeparture, selectedDestination, timer } = useStore();
  const targetRef = useRef(new THREE.Vector3(0, 0, 5));

  useFrame(() => {
    // Smoothly interpolate camera position
    camera.position.lerp(targetRef.current, 0.02);
    camera.lookAt(0, 0, 0);
  });

  useEffect(() => {
    if (timer.currentRoute && timer.status === 'running') {
      // During journey, follow the train roughly
      const from = stations[timer.currentRoute.from];
      const to = stations[timer.currentRoute.to];
      const midLat = (from.coordinates.lat + to.coordinates.lat) / 2;
      const midLng = (from.coordinates.lng + to.coordinates.lng) / 2;
      const point = latLngToPoint(midLat, midLng, 5);
      targetRef.current.set(point.x, point.y, point.z);
    } else if (selectedDeparture && selectedDestination) {
      // When both stations selected, position camera to see both
      const from = stations[selectedDeparture];
      const to = stations[selectedDestination];
      const midLat = (from.coordinates.lat + to.coordinates.lat) / 2;
      const midLng = (from.coordinates.lng + to.coordinates.lng) / 2;
      const point = latLngToPoint(midLat, midLng, 5);
      targetRef.current.set(point.x, point.y, point.z);
    } else if (selectedDeparture) {
      // Focus on selected departure
      const station = stations[selectedDeparture];
      const point = latLngToPoint(station.coordinates.lat, station.coordinates.lng, 5);
      targetRef.current.set(point.x, point.y, point.z);
    }
  }, [selectedDeparture, selectedDestination, timer.currentRoute, timer.status]);

  return null;
}

// Main Globe component
function GlobeScene() {
  const { selectedDeparture, selectedDestination, timer } = useStore();

  // Determine which route to show as active
  const activeRoute = useMemo(() => {
    if (timer.currentRoute) {
      return { from: timer.currentRoute.from, to: timer.currentRoute.to };
    }
    if (selectedDeparture && selectedDestination) {
      return { from: selectedDeparture, to: selectedDestination };
    }
    return null;
  }, [timer.currentRoute, selectedDeparture, selectedDestination]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <directionalLight position={[-5, 5, 5]} intensity={0.3} />

      <Stars radius={100} depth={50} count={3000} factor={4} fade speed={1} />

      <Earth />
      <Atmosphere />

      {/* Render all station markers */}
      {Object.keys(stations).map((stationId) => (
        <StationMarker key={stationId} stationId={stationId} />
      ))}

      {/* Render all available routes (faded) */}
      {routes.map((route) => (
        <RouteArc
          key={route.id}
          fromId={route.from}
          toId={route.to}
          isActive={
            activeRoute?.from === route.from && activeRoute?.to === route.to ||
            activeRoute?.from === route.to && activeRoute?.to === route.from
          }
        />
      ))}

      {/* Render train during journey */}
      <Train />

      <CameraController />

      <OrbitControls
        enableZoom={true}
        enablePan={false}
        enableRotate={true}
        minDistance={3}
        maxDistance={10}
        autoRotate={timer.status === 'idle' && !selectedDeparture}
        autoRotateSpeed={0.3}
      />
    </>
  );
}

export function Globe() {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
      <GlobeScene />
    </Canvas>
  );
}

export default Globe;
