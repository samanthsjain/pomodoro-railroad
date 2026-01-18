# Zustand State Management

Zustand is a lightweight state management library for React. It's simpler than Redux while being powerful enough for complex applications.

## Why Zustand?

- **Minimal boilerplate**: No providers, reducers, or action creators
- **TypeScript-first**: Excellent type inference
- **Flexible**: Works outside React components
- **Small bundle**: ~1KB gzipped
- **Middleware support**: Persist, devtools, immer, etc.

## Core Concepts

### Creating a Store

```tsx
import { create } from 'zustand';

interface CounterState {
  count: number;
  increment: () => void;
  decrement: () => void;
}

const useCounter = create<CounterState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}));
```

### Using the Store

```tsx
function Counter() {
  const count = useCounter((state) => state.count);
  const increment = useCounter((state) => state.increment);

  return <button onClick={increment}>{count}</button>;
}
```

### Selector Pattern

Select only what you need to prevent unnecessary re-renders:

```tsx
// Good - only re-renders when count changes
const count = useStore((state) => state.count);

// Bad - re-renders on any state change
const { count, name, items } = useStore();
```

## Usage in This Project

### Store Structure (`useStore.ts`)

```tsx
interface AppStore {
  // Timer state
  timer: TimerState;

  // Selection state
  selectedDeparture: string | null;
  selectedDestination: string | null;
  hoveredStation: string | null;

  // UI state
  showSearch: boolean;
  showPresets: boolean;

  // User progress (persisted)
  progress: UserProgress;

  // Actions
  setSelectedDeparture: (id: string | null) => void;
  startJourney: () => void;
  pauseTimer: () => void;
  tick: () => void;
  // ...
}
```

### Timer State Machine

The timer has multiple states managed in Zustand:

```tsx
type TimerStatus = 'idle' | 'running' | 'paused' | 'break' | 'completed';

interface TimerState {
  status: TimerStatus;
  currentRoute: Route | null;
  elapsedSeconds: number;
  totalSeconds: number;
  trainPosition: number; // 0-1 for animation
}
```

### Actions

Actions modify state using the `set` function:

```tsx
const useStore = create<AppStore>((set, get) => ({
  // Start a journey
  startJourney: () => {
    const { selectedDeparture, selectedDestination } = get();
    const route = findRoute(selectedDeparture, selectedDestination);

    set({
      timer: {
        status: 'running',
        currentRoute: route,
        elapsedSeconds: 0,
        totalSeconds: route.travelTimeMinutes * 60,
        trainPosition: 0,
      },
    });
  },

  // Timer tick (called every second)
  tick: () => {
    const { timer } = get();
    if (timer.status !== 'running') return;

    const newElapsed = timer.elapsedSeconds + 1;
    const newPosition = newElapsed / timer.totalSeconds;

    if (newElapsed >= timer.totalSeconds) {
      // Journey complete - transition to break
      set({
        timer: { ...timer, status: 'break', trainPosition: 1 },
      });
    } else {
      set({
        timer: {
          ...timer,
          elapsedSeconds: newElapsed,
          trainPosition: newPosition,
        },
      });
    }
  },
}));
```

## Persistence Middleware

Zustand's persist middleware saves state to localStorage:

```tsx
import { persist } from 'zustand/middleware';

const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // ... store definition
    }),
    {
      name: 'pomodoro-railroad-storage',
      // Only persist progress, not ephemeral UI state
      partialize: (state) => ({ progress: state.progress }),
    }
  )
);
```

### What Gets Persisted

```tsx
interface UserProgress {
  visitedStations: string[];
  completedRoutes: string[];
  totalDistanceKm: number;
  totalTimeMinutes: number;
  countriesVisited: string[];
  sessionsCompleted: number;
}
```

## Accessing State Across Components

### In React Components

```tsx
function RoutePanel() {
  const selectedDeparture = useStore((s) => s.selectedDeparture);
  const startJourney = useStore((s) => s.startJourney);
  // ...
}
```

### In Three.js Components

Same pattern works inside R3F components:

```tsx
function StationMarker({ stationId }) {
  const setSelectedDeparture = useStore((s) => s.setSelectedDeparture);
  const timer = useStore((s) => s.timer);

  const handleClick = () => {
    if (timer.status === 'idle') {
      setSelectedDeparture(stationId);
    }
  };
}
```

## Key Files

- `src/store/useStore.ts` - Complete store definition

## Resources

- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Zustand Recipes](https://github.com/pmndrs/zustand#recipes)
