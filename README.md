# Pomodoro Railroad

A train-themed pomodoro timer app that lets you focus your way around the world's railway networks. Select a country, pick a station, choose a destination, and watch your train travel through real railway stations as you work.

## Features

### Core Experience
- **Country Selection** - 35+ countries supported via Railway Stations API (Europe, Asia, Americas, Oceania)
- **Real Station Data** - Stations loaded from [api.railway-stations.org](https://api.railway-stations.org)
- **Accurate Pathfinding** - Routes follow actual railway stations, no water crossings
- **Seat Selection** - Pick your seat (window/aisle) before the journey starts
- **Ticket Stamping** - Satisfying ticket validation animation
- **Train Cabin View** - Immersive cabin experience during focus sessions
- **Map View** - Google Maps integration showing your journey progress

### Train Classes
| Class | Time Multiplier | Description |
|-------|----------------|-------------|
| Economy | 1.0x | Standard seating with window views |
| Business | 0.85x | Extra legroom and quieter cabin |
| First | 0.75x | Premium experience with luxury amenities |

### Service Types (Auto-selected by distance)
| Service | Distance | Speed | Color |
|---------|----------|-------|-------|
| High-Speed | >150km | 250 km/h | Red |
| Intercity | 80-150km | 160 km/h | Blue |
| Regional | 30-80km | 100 km/h | Green |
| Local | <30km | 70 km/h | Gray |

## Architecture

### Tech Stack
- **React 19** + **TypeScript**
- **Vite** for bundling
- **Zustand** for state management (with persistence)
- **Framer Motion** for animations
- **Google Maps API** for map rendering
- **Tailwind CSS** for styling

### Key Files

```
src/
├── components/
│   ├── MapView.tsx          # Google Maps with route/train rendering
│   ├── TrainCabin.tsx       # Immersive cabin view during journey
│   ├── RoutePanel.tsx       # Destination selection UI
│   ├── SeatSelector.tsx     # Seat selection before journey
│   ├── TicketStamp.tsx      # Ticket validation overlay
│   ├── CountrySelector.tsx  # Country picker modal
│   └── TimerDisplay.tsx     # Timer controls
├── services/
│   └── railwayApi.ts        # API client + pathfinding algorithm
├── store/
│   └── useStore.ts          # Zustand state management
├── types/
│   └── index.ts             # TypeScript interfaces
└── data/
    └── stations.ts          # Fallback station data
```

## Pathfinding Algorithm

### How it Works

The app uses a **greedy hop algorithm** to find realistic train routes:

1. **Station Loading** - Fetches all stations for selected country from API
2. **Corridor Calculation** - Defines search area between start and destination
3. **Greedy Hopping** - From current position, finds the closest station that:
   - Is within search radius (starts at 2km, expands to 100km)
   - Makes forward progress toward destination
   - Is roughly in the right direction (within 55 degrees)
4. **Dense Path** - Collects ALL stations along route for accurate line drawing

### Search Radii
```javascript
[2, 4, 6, 10, 15, 20, 30, 45, 60, 80, 100] // km
```

### Significant Stops
- Full path may have 200+ stations for accurate map drawing
- Only "significant stops" (15km+ apart) trigger announcements
- Train moves smoothly through all stations but only pauses at major stops

## Journey Flow

```
1. Select Country
   └── Loads stations from API (cached 24h in IndexedDB)

2. Random Station Assigned
   └── Curated destinations calculated (5-180 min travel times)

3. Select Destination
   └── Path computed through all intermediate stations
   └── Shows: distance, time, stops count, service type

4. Select Train Class
   └── Affects journey duration (time multiplier)

5. Select Seat
   └── 4 cars, 8 rows, 4 seats per row (A-B | C-D)
   └── Window seats marked with indicator

6. Stamp Ticket
   └── Validates journey, shows seat on ticket

7. Journey Begins
   └── Train moves through all stations
   └── Pauses only at significant stops (5 sec each)
   └── Cabin view or map view available

8. Journey Complete
   └── Stats updated, break period offered
   └── New destinations loaded from arrival station
```

## State Persistence

Persisted to localStorage:
- User progress (visited stations, completed routes, stats)
- Map style preference
- Selected country
- Current station
- Active journey state (survives page refresh)

NOT persisted (regenerated fresh):
- API routes (to avoid stale path data)
- Selected destination

## API Integration

### Railway Stations API

Base URL: `https://api.railway-stations.org`

**Endpoints Used:**
- `/photoStationsByCountry/{country}` - Get all stations for a country
- `/stats?country={country}` - Get station counts

**Station Data:**
```typescript
interface APIStation {
  country: string;
  id: string;
  title: string;
  lat: number;
  lon: number;
  shortCode?: string;
  inactive?: boolean;
}
```

### Caching
- **IndexedDB** - Stations cached for 24 hours per country
- **LRU Cache** - Nearby stations, travel times, computed paths

## Environment Variables

```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## Development

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Supported Countries

### Europe (28)
Germany, Austria, Switzerland, France, Netherlands, Belgium, UK, Spain, Italy, Portugal, Czech Republic, Poland, Hungary, Slovakia, Denmark, Norway, Finland, Sweden, Ireland, Estonia, Lithuania, Croatia, Romania, Bosnia, Albania, Ukraine, Moldova, Russia

### Asia (4)
Japan, China, Taiwan, India

### Americas (2)
United States, Canada

### Oceania (1)
Australia

## Notes

### Why Dense Pathfinding?
- Ensures routes follow actual railway corridors
- Prevents impossible paths (crossing water, mountains)
- More realistic journey visualization

### Performance Considerations
- Large countries (Germany, France) may have 5000+ stations
- Pathfinding capped at 1000 iterations
- Only significant stops rendered in journey UI
- Map renders all path stations for smooth blue line

### Known Limitations
- API doesn't provide actual train schedules or operators
- Service types (High-Speed, etc.) are estimated by distance
- Some regions have sparse station coverage
