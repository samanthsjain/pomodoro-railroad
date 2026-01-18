# React Three Fiber

React Three Fiber (R3F) is a React renderer for Three.js that lets you build 3D scenes using React components.

## Why React Three Fiber?

- **Declarative**: Write 3D scenes as JSX components
- **React ecosystem**: Use hooks, context, and component patterns
- **Automatic disposal**: R3F handles memory cleanup
- **Performance**: Efficient reconciliation and render loop

## Core Concepts

### Canvas

The `<Canvas>` component creates the WebGL context and render loop:

```tsx
import { Canvas } from '@react-three/fiber';

function App() {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
      {/* 3D scene goes here */}
    </Canvas>
  );
}
```

### Meshes

A mesh combines geometry and material:

```tsx
function Sphere() {
  return (
    <mesh position={[0, 0, 0]}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial color="blue" />
    </mesh>
  );
}
```

### useFrame Hook

Access the render loop for animations:

```tsx
import { useFrame } from '@react-three/fiber';

function RotatingBox() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta;
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry />
      <meshStandardMaterial />
    </mesh>
  );
}
```

### useThree Hook

Access Three.js internals:

```tsx
import { useThree } from '@react-three/fiber';

function CameraController() {
  const { camera, gl } = useThree();
  // Manipulate camera or renderer
}
```

## Usage in This Project

### Globe Component (`Globe.tsx`)

The globe uses several R3F features:

```tsx
// Canvas setup with camera
<Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
  <GlobeScene />
</Canvas>

// Earth sphere with procedural texture
function Earth() {
  const meshRef = useRef<THREE.Mesh>(null);

  // Slow rotation animation
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.02;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[2, 64, 64]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
}
```

### Station Markers

Each station is a small sphere positioned on the globe surface:

```tsx
function StationMarker({ stationId }) {
  const position = latLngToPoint(lat, lng, radius);

  return (
    <mesh position={position} onClick={handleClick}>
      <sphereGeometry args={[0.03, 16, 16]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}
```

### Route Arcs

Routes use Three.js Line with BufferGeometry:

```tsx
function RouteArc({ fromId, toId }) {
  const points = calculateArcPoints(from, to);
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color: '#3b82f6' });
  const line = new THREE.Line(geometry, material);

  return <primitive object={line} />;
}
```

## React Three Drei

Drei is a helper library with useful abstractions:

```tsx
import { OrbitControls, Stars, Html } from '@react-three/drei';

// Orbit controls for camera manipulation
<OrbitControls
  enableZoom={true}
  enablePan={false}
  minDistance={3}
  maxDistance={10}
/>

// Starfield background
<Stars radius={100} count={3000} fade />

// HTML overlay in 3D space
<Html position={[0, 1, 0]}>
  <div className="tooltip">Station Name</div>
</Html>
```

## Key Files

- `src/components/Globe.tsx` - Main 3D globe implementation
- Uses: Canvas, useFrame, useThree, OrbitControls, Stars, Html

## Resources

- [React Three Fiber Docs](https://docs.pmnd.rs/react-three-fiber)
- [Three.js Docs](https://threejs.org/docs/)
- [Drei Helpers](https://github.com/pmndrs/drei)
