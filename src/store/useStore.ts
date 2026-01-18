import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TimerState, UserProgress, Journey } from '../types';
import { stations, routes, findRoute, calculateJourneyDistance, calculateJourneyTime } from '../data/stations';

interface AppStore {
  // Timer state
  timer: TimerState;

  // Selection state
  selectedDeparture: string | null;
  selectedDestination: string | null;
  hoveredStation: string | null;

  // UI state
  showSearch: boolean;
  searchQuery: string;
  showPresets: boolean;

  // User progress (persisted)
  progress: UserProgress;

  // Actions - Selection
  setSelectedDeparture: (stationId: string | null) => void;
  setSelectedDestination: (stationId: string | null) => void;
  setHoveredStation: (stationId: string | null) => void;
  clearSelection: () => void;

  // Actions - UI
  setShowSearch: (show: boolean) => void;
  setSearchQuery: (query: string) => void;
  setShowPresets: (show: boolean) => void;

  // Actions - Timer
  startJourney: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  tick: () => void;
  startBreak: () => void;
  endBreak: () => void;
  skipToNextStation: () => void;

  // Actions - Presets
  selectPreset: (stationIds: string[]) => void;

  // Computed helpers
  getCurrentRoute: () => { from: typeof stations[string]; to: typeof stations[string]; route: typeof routes[0] } | null;
}

const initialProgress: UserProgress = {
  visitedStations: [],
  completedRoutes: [],
  totalDistanceKm: 0,
  totalTimeMinutes: 0,
  countriesVisited: [],
  sessionsCompleted: 0,
  createdAt: new Date().toISOString(),
  lastSessionAt: new Date().toISOString(),
};

const initialTimer: TimerState = {
  status: 'idle',
  currentRoute: null,
  journey: null,
  elapsedSeconds: 0,
  totalSeconds: 0,
  trainPosition: 0,
};

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state
      timer: initialTimer,
      selectedDeparture: null,
      selectedDestination: null,
      hoveredStation: null,
      showSearch: false,
      searchQuery: '',
      showPresets: false,
      progress: initialProgress,

      // Selection actions
      setSelectedDeparture: (stationId) => {
        const current = get();
        // If clicking same station, deselect
        if (current.selectedDeparture === stationId) {
          set({ selectedDeparture: null });
        } else {
          set({ selectedDeparture: stationId });
        }
      },

      setSelectedDestination: (stationId) => {
        const current = get();
        if (current.selectedDestination === stationId) {
          set({ selectedDestination: null });
        } else {
          set({ selectedDestination: stationId });
        }
      },

      setHoveredStation: (stationId) => set({ hoveredStation: stationId }),

      clearSelection: () => set({
        selectedDeparture: null,
        selectedDestination: null,
      }),

      // UI actions
      setShowSearch: (show) => set({ showSearch: show }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setShowPresets: (show) => set({ showPresets: show }),

      // Timer actions
      startJourney: () => {
        const { selectedDeparture, selectedDestination } = get();
        if (!selectedDeparture || !selectedDestination) return;

        const route = findRoute(selectedDeparture, selectedDestination);
        if (!route) return;

        // Determine direction (route might be stored in reverse)
        const isReversed = route.from !== selectedDeparture;
        const actualFrom = isReversed ? route.to : route.from;
        const actualTo = isReversed ? route.from : route.to;

        const journey: Journey = {
          id: `journey-${Date.now()}`,
          stations: [actualFrom, actualTo],
          currentStationIndex: 0,
          totalDistanceKm: route.distanceKm,
          totalTimeMinutes: route.travelTimeMinutes,
        };

        set({
          timer: {
            status: 'running',
            currentRoute: {
              ...route,
              from: actualFrom,
              to: actualTo,
            },
            journey,
            elapsedSeconds: 0,
            totalSeconds: route.travelTimeMinutes * 60,
            trainPosition: 0,
          },
        });
      },

      pauseTimer: () => {
        const { timer } = get();
        if (timer.status === 'running') {
          set({ timer: { ...timer, status: 'paused' } });
        }
      },

      resumeTimer: () => {
        const { timer } = get();
        if (timer.status === 'paused') {
          set({ timer: { ...timer, status: 'running' } });
        }
      },

      stopTimer: () => {
        set({
          timer: initialTimer,
          selectedDeparture: null,
          selectedDestination: null,
        });
      },

      tick: () => {
        const { timer, progress } = get();
        if (timer.status !== 'running') return;

        const newElapsed = timer.elapsedSeconds + 1;
        const newPosition = Math.min(newElapsed / timer.totalSeconds, 1);

        if (newElapsed >= timer.totalSeconds) {
          // Journey complete - start break
          const route = timer.currentRoute;
          if (route) {
            const newVisitedStations = [...new Set([...progress.visitedStations, route.from, route.to])];
            const newCompletedRoutes = [...new Set([...progress.completedRoutes, route.id])];
            const fromStation = stations[route.from];
            const toStation = stations[route.to];
            const newCountries = [...new Set([
              ...progress.countriesVisited,
              fromStation?.countryCode,
              toStation?.countryCode,
            ].filter(Boolean) as string[])];

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
                visitedStations: newVisitedStations,
                completedRoutes: newCompletedRoutes,
                totalDistanceKm: progress.totalDistanceKm + route.distanceKm,
                totalTimeMinutes: progress.totalTimeMinutes + route.travelTimeMinutes,
                countriesVisited: newCountries,
                sessionsCompleted: progress.sessionsCompleted + 1,
                lastSessionAt: new Date().toISOString(),
              },
            });
          }
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

      startBreak: () => {
        const { timer } = get();
        set({
          timer: {
            ...timer,
            status: 'break',
            elapsedSeconds: 0,
            totalSeconds: 300,
          },
        });
      },

      endBreak: () => {
        set({
          timer: initialTimer,
          selectedDeparture: null,
          selectedDestination: null,
        });
      },

      skipToNextStation: () => {
        const { timer } = get();
        if (timer.journey && timer.journey.currentStationIndex < timer.journey.stations.length - 2) {
          // Move to next leg of journey
          const nextIndex = timer.journey.currentStationIndex + 1;
          const fromStation = timer.journey.stations[nextIndex];
          const toStation = timer.journey.stations[nextIndex + 1];
          const route = findRoute(fromStation, toStation);

          if (route) {
            set({
              timer: {
                ...timer,
                status: 'running',
                currentRoute: route,
                journey: {
                  ...timer.journey,
                  currentStationIndex: nextIndex,
                },
                elapsedSeconds: 0,
                totalSeconds: route.travelTimeMinutes * 60,
                trainPosition: 0,
              },
            });
          }
        } else {
          // Journey complete
          get().endBreak();
        }
      },

      // Preset selection
      selectPreset: (stationIds) => {
        if (stationIds.length >= 2) {
          set({
            selectedDeparture: stationIds[0],
            selectedDestination: stationIds[stationIds.length - 1],
            showPresets: false,
          });
        }
      },

      // Computed
      getCurrentRoute: () => {
        const { selectedDeparture, selectedDestination } = get();
        if (!selectedDeparture || !selectedDestination) return null;

        const route = findRoute(selectedDeparture, selectedDestination);
        if (!route) return null;

        const from = stations[selectedDeparture];
        const to = stations[selectedDestination];
        if (!from || !to) return null;

        return { from, to, route };
      },
    }),
    {
      name: 'pomodoro-railroad-storage',
      partialize: (state) => ({ progress: state.progress }),
    }
  )
);
