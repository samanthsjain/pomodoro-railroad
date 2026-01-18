# Railroad Pomodoro Documentation

Welcome to the Railroad Pomodoro documentation. This folder contains guides for setting up and understanding the application.

## Getting Started

- **[Setup Guide](./setup.md)** - Installation, running, and project structure

## Concepts

Detailed explanations of the technologies and patterns used:

| Document | Description |
|----------|-------------|
| [Architecture](./concepts/architecture.md) | Overall app structure and data flow |
| [React Three Fiber](./concepts/react-three-fiber.md) | 3D rendering with React |
| [Globe Visualization](./concepts/globe-visualization.md) | Geographic calculations and rendering |
| [Zustand](./concepts/zustand.md) | State management patterns |
| [Pomodoro Timer](./concepts/pomodoro-timer.md) | Timer logic and state machine |
| [Framer Motion](./concepts/framer-motion.md) | UI animations |
| [Web Audio](./concepts/web-audio.md) | Sound effects with Web Audio API |

## Quick Reference

### Start Development
```bash
pnpm install
pnpm dev
```

### Key Files
- `src/components/Globe.tsx` - 3D globe and interactions
- `src/store/useStore.ts` - Application state
- `src/data/stations.ts` - Station and route data

### Adding a New Station

1. Add to `src/data/stations.ts`:
```tsx
'station-id': {
  id: 'station-id',
  name: 'Station Name',
  city: 'City',
  country: 'Country',
  countryCode: 'XX',
  coordinates: { lat: 0.0, lng: 0.0 },
  timezone: 'Region/City',
  funFacts: ['Fact 1', 'Fact 2'],
}
```

2. Add routes connecting to the station:
```tsx
{
  id: 'route-id',
  from: 'existing-station',
  to: 'station-id',
  travelTimeMinutes: 60,
  distanceKm: 100,
  trainType: 'Train Type',
}
```

### Tech Stack Summary
- React 19 + TypeScript
- Three.js + React Three Fiber
- Zustand (state)
- Framer Motion (animations)
- TailwindCSS (styling)
- Vite (build)
