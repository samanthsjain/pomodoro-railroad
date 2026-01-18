# Pomodoro Timer System

This document explains the timer architecture and how travel times drive the Pomodoro sessions.

## Traditional Pomodoro vs Railroad Pomodoro

### Traditional Pomodoro
- Fixed 25-minute work sessions
- 5-minute short breaks
- 15-minute long breaks after 4 sessions

### Railroad Pomodoro
- **Dynamic durations**: Based on real train travel times
- Work session = Journey time between stations
- Break = Station stop (5 minutes)
- Sessions vary from 15 minutes to several hours

## Timer State Machine

The timer operates as a finite state machine:

```
┌─────────┐     start      ┌─────────┐
│  IDLE   │ ─────────────► │ RUNNING │
└─────────┘                └─────────┘
     ▲                          │
     │                          │ pause
     │ stop                     ▼
     │                    ┌─────────┐
     │                    │ PAUSED  │
     │                    └─────────┘
     │                          │
     │                          │ resume
     │                          ▼
     │                    ┌─────────┐
     │ end break          │ RUNNING │
     │ ◄──────────────────┤         │
     │                    └─────────┘
     │                          │
     │                          │ complete
     │                          ▼
     │                    ┌─────────┐
     └────────────────────┤  BREAK  │
                          └─────────┘
```

## State Interface

```tsx
interface TimerState {
  status: 'idle' | 'running' | 'paused' | 'break' | 'completed';
  currentRoute: Route | null;
  journey: Journey | null;
  elapsedSeconds: number;
  totalSeconds: number;
  trainPosition: number; // 0-1 for animation
}
```

## Timer Actions

### Starting a Journey

```tsx
startJourney: () => {
  const { selectedDeparture, selectedDestination } = get();
  const route = findRoute(selectedDeparture, selectedDestination);

  if (!route) return;

  set({
    timer: {
      status: 'running',
      currentRoute: route,
      elapsedSeconds: 0,
      totalSeconds: route.travelTimeMinutes * 60,
      trainPosition: 0,
    },
  });
}
```

### Tick (Every Second)

```tsx
tick: () => {
  const { timer, progress } = get();
  if (timer.status !== 'running') return;

  const newElapsed = timer.elapsedSeconds + 1;
  const newPosition = newElapsed / timer.totalSeconds;

  if (newElapsed >= timer.totalSeconds) {
    // Journey complete - transition to break
    set({
      timer: {
        ...timer,
        status: 'break',
        elapsedSeconds: 0,
        totalSeconds: 300, // 5 minute break
        trainPosition: 1,
      },
      progress: {
        ...progress,
        sessionsCompleted: progress.sessionsCompleted + 1,
        totalDistanceKm: progress.totalDistanceKm + route.distanceKm,
        // ... update other stats
      },
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
}
```

## React Integration

### Timer Effect

The timer tick is driven by a React effect:

```tsx
function TimerDisplay() {
  const { timer, tick } = useStore();

  useEffect(() => {
    if (timer.status !== 'running' && timer.status !== 'break') return;

    const interval = setInterval(() => {
      tick();
    }, 1000);

    return () => clearInterval(interval);
  }, [timer.status, tick]);

  // ... render
}
```

### Train Position Animation

The `trainPosition` (0-1) drives the train marker on the globe:

```tsx
function Train() {
  const { timer } = useStore();

  const position = useMemo(() => {
    if (!timer.currentRoute) return null;

    const { lat, lng } = interpolateGreatCircle(
      from.coordinates,
      to.coordinates,
      timer.trainPosition  // 0 at start, 1 at destination
    );

    return latLngToPoint(lat, lng, altitude);
  }, [timer.trainPosition]);

  return <mesh position={position}>...</mesh>;
}
```

## Travel Time Data

Routes store real travel times:

```tsx
const routes: Route[] = [
  {
    id: 'tokyo-kyoto',
    from: 'tokyo',
    to: 'kyoto',
    travelTimeMinutes: 135, // 2h 15m Shinkansen
    distanceKm: 476,
    trainType: 'Shinkansen Nozomi',
  },
  {
    id: 'paris-london',
    from: 'paris-nord',
    to: 'london-stpancras',
    travelTimeMinutes: 135, // 2h 15m Eurostar
    distanceKm: 459,
    trainType: 'Eurostar',
  },
  // ...
];
```

## Time Display Formatting

```tsx
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Examples:
// 3661 seconds → "1:01:01"
// 125 seconds → "02:05"
```

## Notifications

Sound and toast notifications on state changes:

```tsx
useEffect(() => {
  if (prevStatus === 'idle' && timer.status === 'running') {
    playDeparture();
    toast(`Departing for ${destination}!`, { icon: '🚂' });
  }

  if (prevStatus === 'running' && timer.status === 'break') {
    playArrival();
    toast.success(`Arrived at ${destination}! Take a break.`);
  }
}, [timer.status]);
```

## Progress Tracking

Completed journeys update user progress:

```tsx
interface UserProgress {
  visitedStations: string[];    // Station IDs visited
  completedRoutes: string[];    // Route IDs completed
  totalDistanceKm: number;      // Cumulative distance
  totalTimeMinutes: number;     // Cumulative focus time
  countriesVisited: string[];   // Country codes
  sessionsCompleted: number;    // Total sessions
}
```

## Key Files

- `src/store/useStore.ts` - Timer state and actions
- `src/components/TimerDisplay.tsx` - Timer UI and tick effect
- `src/data/stations.ts` - Route travel times

## Resources

- [Pomodoro Technique](https://en.wikipedia.org/wiki/Pomodoro_Technique)
- [React useEffect](https://react.dev/reference/react/useEffect)
