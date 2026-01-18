# Application Architecture

This document provides an overview of the Railroad Pomodoro application architecture.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         App.tsx                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    UI Layer                              │ │
│  │  ┌─────────┐ ┌──────────┐ ┌────────┐ ┌───────┐         │ │
│  │  │ Header  │ │RoutePanel│ │ Search │ │Presets│         │ │
│  │  └─────────┘ └──────────┘ └────────┘ └───────┘         │ │
│  │  ┌─────────────┐ ┌──────────────┐ ┌─────────────┐      │ │
│  │  │TimerDisplay │ │ StatsPanel   │ │StationTooltip│     │ │
│  │  └─────────────┘ └──────────────┘ └─────────────┘      │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                   3D Layer (Globe)                       │ │
│  │  ┌───────┐ ┌──────────────┐ ┌──────────┐ ┌───────┐     │ │
│  │  │ Earth │ │StationMarkers│ │RouteArcs │ │ Train │     │ │
│  │  └───────┘ └──────────────┘ └──────────┘ └───────┘     │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      State Layer                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    Zustand Store                         │ │
│  │  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌──────────┐  │ │
│  │  │  Timer   │ │ Selection │ │ UI State │ │ Progress │  │ │
│  │  └──────────┘ └───────────┘ └──────────┘ └──────────┘  │ │
│  └─────────────────────────────────────────────────────────┘ │
│                              │                               │
│                              ▼                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    localStorage                          │ │
│  │                  (Progress Persistence)                  │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  stations.ts                                             │ │
│  │  ┌──────────┐ ┌────────┐ ┌─────────┐ ┌─────────────┐   │ │
│  │  │ Stations │ │ Routes │ │ Presets │ │   Helpers   │   │ │
│  │  └──────────┘ └────────┘ └─────────┘ └─────────────┘   │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

### App.tsx
- Root component
- Composes all UI components
- Provides toast notification container

### Globe.tsx
- 3D scene rendering with React Three Fiber
- Earth sphere with procedural texture
- Station markers (interactive)
- Route arc visualizations
- Animated train marker
- Camera controls and auto-rotation

### TimerDisplay.tsx
- Timer UI (countdown display)
- Play/pause/stop controls
- Progress bar
- Sound effects on state changes
- Toast notifications

### RoutePanel.tsx
- Departure/destination display
- Route information (time, distance, train type)
- Start journey button
- Visible only when timer is idle

### SearchPanel.tsx
- Station and route search
- Filter results as user types
- Quick selection modal

### PresetsPanel.tsx
- Curated route presets
- Categorized by duration
- One-click route selection

### StatsPanel.tsx
- User progress display
- Distance, time, stations, countries
- Sessions completed

## Data Flow

### User Selects Station

```
Click Station → StationMarker.handleClick()
                      │
                      ▼
              useStore.setSelectedDeparture()
                      │
                      ▼
              State Update (Zustand)
                      │
                      ▼
         Components Re-render
         • RoutePanel shows selection
         • Globe highlights station
         • Camera moves to station
```

### Starting a Journey

```
Click "Start Journey" → RoutePanel
                             │
                             ▼
                    useStore.startJourney()
                             │
                             ▼
         ┌───────────────────┴───────────────────┐
         │                                        │
         ▼                                        ▼
   Timer state → 'running'              Route info populated
         │                                        │
         └───────────────────┬────────────────────┘
                             │
                             ▼
         ┌───────────────────┴───────────────────┐
         │                                        │
         ▼                                        ▼
   TimerDisplay appears              Train starts moving
   with countdown                    on globe
```

### Timer Tick

```
setInterval (1 second) → tick()
                           │
                           ▼
                 elapsedSeconds++
                 trainPosition = elapsed/total
                           │
                           ▼
         ┌─────────────────┴─────────────────┐
         │                                    │
         ▼                                    ▼
  If elapsed < total              If elapsed >= total
  Update position                 Transition to 'break'
         │                        Update progress stats
         │                        Play arrival sound
         ▼                                    │
  Train moves on globe                        ▼
  Timer counts down                  Break timer starts
```

## File Structure

```
src/
├── components/
│   ├── Globe.tsx           # 3D visualization
│   ├── TimerDisplay.tsx    # Timer UI
│   ├── RoutePanel.tsx      # Route selection
│   ├── SearchPanel.tsx     # Search modal
│   ├── PresetsPanel.tsx    # Presets modal
│   ├── StatsPanel.tsx      # Statistics
│   ├── StationTooltip.tsx  # Hover info
│   └── Header.tsx          # App branding
│
├── store/
│   └── useStore.ts         # Zustand store
│
├── data/
│   └── stations.ts         # Static data
│
├── types/
│   └── index.ts            # TypeScript types + geo utils
│
├── hooks/
│   └── useSound.ts         # Audio feedback
│
├── App.tsx                 # Root component
├── main.tsx                # Entry point
└── index.css               # Global styles
```

## State Shape

```tsx
{
  // Timer
  timer: {
    status: 'idle' | 'running' | 'paused' | 'break',
    currentRoute: Route | null,
    elapsedSeconds: number,
    totalSeconds: number,
    trainPosition: number,
  },

  // Selection
  selectedDeparture: string | null,
  selectedDestination: string | null,
  hoveredStation: string | null,

  // UI
  showSearch: boolean,
  showPresets: boolean,

  // Progress (persisted)
  progress: {
    visitedStations: string[],
    completedRoutes: string[],
    totalDistanceKm: number,
    totalTimeMinutes: number,
    countriesVisited: string[],
    sessionsCompleted: number,
  }
}
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| UI Framework | React 19 |
| Type System | TypeScript |
| Build Tool | Vite |
| 3D Rendering | Three.js + React Three Fiber |
| State Management | Zustand |
| Animations | Framer Motion |
| Styling | TailwindCSS |
| Notifications | react-hot-toast |
| Icons | Lucide React |

## Key Design Decisions

### Why Zustand over Redux?
- Simpler API for this app size
- Less boilerplate
- Built-in persistence middleware
- Works easily with R3F components

### Why Procedural Earth Texture?
- No external assets to load
- Consistent styling with app theme
- Smaller bundle size
- Easy to customize

### Why Real Travel Times?
- Educational value
- Meaningful session durations
- Variety in session lengths
- Gamification through exploration

### Why React Three Fiber?
- React component model for 3D
- Declarative scene composition
- Easy integration with React state
- Large ecosystem (drei helpers)
