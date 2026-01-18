# Globe Visualization & Geographic Calculations

This document explains the math and techniques used to render a 3D globe with accurate station positions and route arcs.

## Coordinate Systems

### Geographic Coordinates (Lat/Lng)

Real-world locations use latitude and longitude:
- **Latitude**: -90° (South Pole) to +90° (North Pole)
- **Longitude**: -180° to +180° (Prime Meridian = 0°)

```tsx
interface Coordinates {
  lat: number;  // -90 to 90
  lng: number;  // -180 to 180
}

// Example: Tokyo Station
const tokyo = { lat: 35.6812, lng: 139.7671 };
```

### 3D Cartesian Coordinates

Three.js uses X, Y, Z coordinates:
- **X**: Left (-) to Right (+)
- **Y**: Down (-) to Up (+)
- **Z**: Back (-) to Front (+)

## Converting Lat/Lng to 3D Points

### The Math

To place a point on a sphere surface:

1. Convert degrees to radians
2. Calculate spherical coordinates (φ, θ)
3. Convert to Cartesian (x, y, z)

```tsx
function latLngToPoint(lat: number, lng: number, radius: number = 1) {
  // Convert to radians
  const phi = (90 - lat) * (Math.PI / 180);   // Polar angle from top
  const theta = (lng + 180) * (Math.PI / 180); // Azimuthal angle

  // Spherical to Cartesian conversion
  return {
    x: -(radius * Math.sin(phi) * Math.cos(theta)),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta),
  };
}
```

### Why the Negative X?

The negative X flips the globe so it renders with the correct orientation (Americas on left, Asia on right when viewed from front).

### Visual Representation

```
        Y (North Pole)
        |
        |
        +------ X (90°E longitude)
       /
      /
     Z (0° longitude, Prime Meridian)
```

## Great Circle Interpolation

### What is a Great Circle?

A great circle is the shortest path between two points on a sphere. It's the path airplanes and ships follow.

### Interpolating Along a Great Circle

To animate a train moving between stations, we need intermediate points:

```tsx
function interpolateGreatCircle(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  t: number // 0 to 1
): { lat: number; lng: number } {
  // Convert to radians
  const lat1 = start.lat * (Math.PI / 180);
  const lng1 = start.lng * (Math.PI / 180);
  const lat2 = end.lat * (Math.PI / 180);
  const lng2 = end.lng * (Math.PI / 180);

  // Angular distance between points
  const d = 2 * Math.asin(
    Math.sqrt(
      Math.pow(Math.sin((lat2 - lat1) / 2), 2) +
      Math.cos(lat1) * Math.cos(lat2) *
      Math.pow(Math.sin((lng2 - lng1) / 2), 2)
    )
  );

  // Interpolation factors
  const A = Math.sin((1 - t) * d) / Math.sin(d);
  const B = Math.sin(t * d) / Math.sin(d);

  // Interpolated Cartesian coordinates
  const x = A * Math.cos(lat1) * Math.cos(lng1) +
            B * Math.cos(lat2) * Math.cos(lng2);
  const y = A * Math.cos(lat1) * Math.sin(lng1) +
            B * Math.cos(lat2) * Math.sin(lng2);
  const z = A * Math.sin(lat1) + B * Math.sin(lat2);

  // Convert back to lat/lng
  const lat = Math.atan2(z, Math.sqrt(x * x + y * y)) * (180 / Math.PI);
  const lng = Math.atan2(y, x) * (180 / Math.PI);

  return { lat, lng };
}
```

## Route Arc Rendering

### Creating the Arc Geometry

Routes are rendered as curved lines above the globe surface:

```tsx
function RouteArc({ fromId, toId }) {
  const points = useMemo(() => {
    const segments = 64;
    const curvePoints: THREE.Vector3[] = [];

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;

      // Get interpolated position on great circle
      const { lat, lng } = interpolateGreatCircle(from, to, t);

      // Add altitude for arc effect (highest at middle)
      const altitude = GLOBE_RADIUS * 1.01 +
                       Math.sin(t * Math.PI) * 0.15;

      const point = latLngToPoint(lat, lng, altitude);
      curvePoints.push(new THREE.Vector3(point.x, point.y, point.z));
    }

    return curvePoints;
  }, [from, to]);

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const line = new THREE.Line(geometry, material);

  return <primitive object={line} />;
}
```

### Arc Height Formula

```
altitude = baseHeight + sin(t * π) * maxArcHeight
```

- At t=0 (start): sin(0) = 0, altitude = baseHeight
- At t=0.5 (middle): sin(π/2) = 1, altitude = baseHeight + maxArcHeight
- At t=1 (end): sin(π) = 0, altitude = baseHeight

## Haversine Distance Formula

Calculate the distance between two points on Earth:

```tsx
function calculateDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371; // Earth's radius in km

  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) *
            Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in km
}
```

## Procedural Earth Texture

Instead of loading an image, we generate a texture programmatically:

```tsx
const texture = useMemo(() => {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Ocean gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#0a1628');
  gradient.addColorStop(0.5, '#0d1f3c');
  gradient.addColorStop(1, '#0a1628');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Grid lines
  ctx.strokeStyle = 'rgba(100, 150, 255, 0.1)';
  for (let lat = -80; lat <= 80; lat += 20) {
    const y = ((90 - lat) / 180) * canvas.height;
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
  }
  ctx.stroke();

  return new THREE.CanvasTexture(canvas);
}, []);
```

## Key Files

- `src/types/index.ts` - latLngToPoint, interpolateGreatCircle, calculateDistance
- `src/components/Globe.tsx` - Earth, RouteArc, StationMarker components

## Resources

- [Great Circle Navigation](https://en.wikipedia.org/wiki/Great-circle_navigation)
- [Haversine Formula](https://en.wikipedia.org/wiki/Haversine_formula)
- [Spherical Coordinates](https://en.wikipedia.org/wiki/Spherical_coordinate_system)
