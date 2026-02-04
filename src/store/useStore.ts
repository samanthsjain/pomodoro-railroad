import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { useMemo } from 'react';
import type { TimerState, UserProgress, Journey, JourneySegment, PauseState, TrainClass, MapStyle, Station, Route, ApiLoadingState, SelectedSeat, RecentJourney } from '../types';
import { achievements } from '../types';
import { trainClasses, calculateDistance } from '../types';
import { findRoute as findLocalRoute } from '../data/stations';
import { fetchCountryStations, getRandomStation, selectCuratedStations, createCuratedRoutes, clearCaches, getSignificantStopIds } from '../services/railwayApi';

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
  mapStyle: MapStyle;
  showLabels: boolean;
  showCountrySelector: boolean;
  pomodoroViewMode: 'cabin' | 'map';
  mapOrientation: 'north' | 'direction';

  // API state
  selectedCountry: string | null;
  apiStations: Record<string, Station>;
  apiRoutes: Route[];
  currentStation: string | null;
  apiLoadingState: ApiLoadingState;
  apiError: string | null;

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
  setMapStyle: (style: MapStyle) => void;
  setShowLabels: (show: boolean) => void;
  setShowCountrySelector: (show: boolean) => void;
  setPomodoroViewMode: (mode: 'cabin' | 'map') => void;
  setMapOrientation: (orientation: 'north' | 'direction') => void;
  togglePomodoroViewMode: () => void;

  // Actions - API / Country selection
  selectCountry: (countryCode: string) => Promise<void>;
  pickRandomStation: () => void;
  setCurrentStation: (stationId: string | null) => void;
  loadConnectedStations: () => void;
  clearApiState: () => void;

  // Actions - Timer
  startJourney: () => void;
  selectSeat: (seat: SelectedSeat) => void;
  confirmSeatSelection: () => void;
  confirmTicket: () => void;
  cancelConfirmation: () => void;
  setTrainClass: (trainClass: TrainClass) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  endTrip: () => void; // Stops timer but keeps station selection for repicking
  tick: () => void;
  startBreak: () => void;
  endBreak: () => void;
  skipToNextStation: () => void;

  // Actions - Presets
  selectPreset: (stationIds: string[]) => void;

  // Computed helpers
  getCurrentRoute: () => { from: Station; to: Station; route: Route } | null;
  getAllStations: () => Record<string, Station>;
  getAllRoutes: () => Route[];
  findRoute: (fromId: string, toId: string) => Route | undefined;
}

const getTodayDate = () => new Date().toISOString().split('T')[0];

const initialProgress: UserProgress = {
  visitedStations: [],
  completedRoutes: [],
  totalDistanceKm: 0,
  totalTimeMinutes: 0,
  countriesVisited: [],
  sessionsCompleted: 0,
  createdAt: new Date().toISOString(),
  lastSessionAt: new Date().toISOString(),
  // Streak tracking
  currentStreak: 0,
  longestStreak: 0,
  lastStreakDate: '',
  // Daily goals
  dailyGoalMinutes: 25,
  todayMinutes: 0,
  todayDate: getTodayDate(),
  // Recent journeys
  recentJourneys: [],
  // Achievements
  unlockedAchievements: [],
};

const initialTimer: TimerState = {
  status: 'idle',
  currentRoute: null,
  journey: null,
  elapsedSeconds: 0,
  totalSeconds: 0,
  trainPosition: 0,
  ticketStamped: false,
  selectedClass: 'economy',
  selectedSeat: null,
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
      mapStyle: 'monochrome' as MapStyle,
      showLabels: true,
      showCountrySelector: false,
      pomodoroViewMode: 'cabin' as 'cabin' | 'map',
      mapOrientation: 'north' as 'north' | 'direction',
      progress: initialProgress,

      // API state
      selectedCountry: null,
      apiStations: {},
      apiRoutes: [],
      currentStation: null,
      apiLoadingState: 'idle' as ApiLoadingState,
      apiError: null,

      // Selection actions
      setSelectedDeparture: (stationId) => {
        const current = get();
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

      clearSelection: () => {
        const { currentStation } = get();
        set({
          selectedDeparture: currentStation, // Keep current station as departure
          selectedDestination: null,
        });
        // Reload connected stations to ensure routes are fresh
        if (currentStation) {
          get().loadConnectedStations();
        }
      },

      // UI actions
      setShowSearch: (show) => set({ showSearch: show }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setShowPresets: (show) => set({ showPresets: show }),
      setMapStyle: (style) => set({ mapStyle: style }),
      setShowLabels: (show) => set({ showLabels: show }),
      setShowCountrySelector: (show) => set({ showCountrySelector: show }),
      setPomodoroViewMode: (mode) => set({ pomodoroViewMode: mode }),
      setMapOrientation: (orientation) => set({ mapOrientation: orientation }),
      togglePomodoroViewMode: () => {
        const current = get().pomodoroViewMode;
        set({ pomodoroViewMode: current === 'cabin' ? 'map' : 'cabin' });
      },

      // API / Country selection actions
      selectCountry: async (countryCode: string) => {
        set({
          apiLoadingState: 'loading',
          apiError: null,
          selectedCountry: countryCode,
          showCountrySelector: false,
        });

        try {
          const stations = await fetchCountryStations(countryCode);
          const stationsRecord: Record<string, Station> = {};
          stations.forEach(s => {
            stationsRecord[s.id] = { ...s, isApiStation: true };
          });

          set({
            apiStations: stationsRecord,
            apiLoadingState: 'success',
          });

          // Auto-pick a random station
          get().pickRandomStation();
        } catch (error) {
          set({
            apiLoadingState: 'error',
            apiError: error instanceof Error ? error.message : 'Failed to load stations',
          });
        }
      },

      pickRandomStation: () => {
        const { apiStations } = get();
        const stationsList = Object.values(apiStations);
        const randomStation = getRandomStation(stationsList);

        if (randomStation) {
          set({
            currentStation: randomStation.id,
            selectedDeparture: randomStation.id,
            selectedDestination: null,
          });
          get().loadConnectedStations();
        }
      },

      setCurrentStation: (stationId: string | null) => {
        // Clear caches when changing stations
        clearCaches();
        set({
          currentStation: stationId,
          selectedDeparture: stationId,
          selectedDestination: null,
          apiRoutes: [], // Clear old routes
        });
        if (stationId) {
          get().loadConnectedStations();
        }
      },

      loadConnectedStations: () => {
        const { currentStation, apiStations, selectedCountry } = get();
        if (!currentStation || !selectedCountry) return;

        const station = apiStations[currentStation];
        if (!station) return;

        // Clear path and travel time caches to ensure fresh route calculations
        clearCaches();

        const stationsList = Object.values(apiStations);

        // Use curated station selection with travel time buckets
        const curatedStations = selectCuratedStations(station, stationsList, selectedCountry);
        // Pass allStations for pathfinding through intermediate stations
        const routes = createCuratedRoutes(station, curatedStations, stationsList);

        // Clear old destination when loading new connections
        set({ apiRoutes: routes, selectedDestination: null });
      },

      clearApiState: () => {
        set({
          selectedCountry: null,
          apiStations: {},
          apiRoutes: [],
          currentStation: null,
          apiLoadingState: 'idle',
          apiError: null,
          selectedDeparture: null,
          selectedDestination: null,
        });
      },

      // Timer actions
      startJourney: () => {
        const { selectedDeparture, selectedDestination, timer, apiStations } = get();
        if (!selectedDeparture || !selectedDestination) return;

        const route = get().findRoute(selectedDeparture, selectedDestination);
        if (!route) return;

        const isReversed = route.from !== selectedDeparture;
        const actualFrom = isReversed ? route.to : route.from;
        const actualTo = isReversed ? route.from : route.to;

        const classConfig = trainClasses.find(c => c.id === timer.selectedClass);
        const timeMultiplier = classConfig?.timeMultiplier || 1.0;

        // Get station path (may have intermediate stations)
        let stationIds: string[];
        if (route.path) {
          stationIds = isReversed ? [...route.path.stations].reverse() : route.path.stations;
        } else {
          stationIds = [actualFrom, actualTo];
        }

        // Compute significant stops (15km+ apart) - only these will trigger pauses
        const significantStopIds = getSignificantStopIds(stationIds, apiStations, 15);

        // Pre-compute journey segments with timing boundaries
        const segments: JourneySegment[] = [];
        let totalTimeSeconds = 0;

        for (let i = 0; i < stationIds.length - 1; i++) {
          const fromStation = apiStations[stationIds[i]];
          const toStation = apiStations[stationIds[i + 1]];

          if (fromStation && toStation) {
            const distanceKm = calculateDistance(
              fromStation.coordinates.lat, fromStation.coordinates.lng,
              toStation.coordinates.lat, toStation.coordinates.lng
            );
            // Apply time multiplier to segment time
            const isHighSpeed = distanceKm > 100;
            const avgSpeed = isHighSpeed ? 200 : 80;
            const rawTimeSeconds = (distanceKm / avgSpeed) * 3600;
            const timeSeconds = Math.round(rawTimeSeconds * timeMultiplier);

            segments.push({
              fromStation: stationIds[i],
              toStation: stationIds[i + 1],
              distanceKm: Math.round(distanceKm),
              timeSeconds,
              startProgress: 0, // Will be computed below
              endProgress: 0,
            });
            totalTimeSeconds += timeSeconds;
          }
        }

        // Compute progress boundaries for each segment
        let cumulativeProgress = 0;
        for (const segment of segments) {
          segment.startProgress = cumulativeProgress;
          const segmentFraction = segment.timeSeconds / totalTimeSeconds;
          cumulativeProgress += segmentFraction;
          segment.endProgress = cumulativeProgress;
        }

        const adjustedTimeMinutes = Math.round(totalTimeSeconds / 60);

        const journey: Journey = {
          id: `journey-${Date.now()}`,
          stations: stationIds,
          significantStopIds, // Only pause at these major stops
          currentSegmentIndex: 0,
          segmentProgress: 0,
          segments,
          totalDistanceKm: route.path?.totalDistanceKm || route.distanceKm,
          totalTimeMinutes: adjustedTimeMinutes,
          pauseState: null,
        };

        set({
          timer: {
            ...timer,
            status: 'selecting-seat',
            currentRoute: {
              ...route,
              from: actualFrom,
              to: actualTo,
              travelTimeMinutes: adjustedTimeMinutes,
            },
            journey,
            elapsedSeconds: 0,
            totalSeconds: totalTimeSeconds,
            trainPosition: 0,
            ticketStamped: false,
            selectedSeat: null,
          },
        });
      },

      selectSeat: (seat: SelectedSeat) => {
        const { timer } = get();
        if (timer.status !== 'selecting-seat') return;
        set({
          timer: {
            ...timer,
            selectedSeat: seat,
          },
        });
      },

      confirmSeatSelection: () => {
        const { timer } = get();
        if (timer.status !== 'selecting-seat' || !timer.selectedSeat) return;
        set({
          timer: {
            ...timer,
            status: 'confirming',
          },
        });
      },

      setTrainClass: (trainClass) => {
        const { timer } = get();
        if (timer.status !== 'idle') return;
        set({
          timer: {
            ...timer,
            selectedClass: trainClass,
          },
        });
      },

      confirmTicket: () => {
        const { timer } = get();
        if (timer.status !== 'confirming') return;

        set({
          timer: {
            ...timer,
            status: 'running',
            ticketStamped: true,
          },
        });
      },

      cancelConfirmation: () => {
        const { currentStation } = get();
        set({
          timer: initialTimer,
          selectedDeparture: currentStation, // Keep current station as departure
          selectedDestination: null,
        });
        // Reload connected stations if we have a current station
        if (currentStation) {
          get().loadConnectedStations();
        }
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

      endTrip: () => {
        // End trip but keep current station so user can repick destination
        const { timer, selectedCountry, currentStation } = get();
        const lastStation = timer.journey?.stations[timer.journey.currentSegmentIndex] ||
                           timer.currentRoute?.from ||
                           currentStation;

        set({
          timer: initialTimer,
          selectedDestination: null,
        });

        // If we have a valid station, set it as current and load new connections
        if (lastStation && selectedCountry) {
          set({
            currentStation: lastStation,
            selectedDeparture: lastStation,
          });
          setTimeout(() => get().loadConnectedStations(), 100);
        }
      },

      tick: () => {
        const { timer, progress, apiStations } = get();
        if (timer.status !== 'running') return;

        const journey = timer.journey;
        if (!journey) return;

        // Handle station pause (arriving at intermediate station)
        if (journey.pauseState) {
          const newRemaining = journey.pauseState.remainingPauseSeconds - 1;

          if (newRemaining <= 0) {
            // Pause complete, move to next segment
            const nextSegmentIndex = journey.currentSegmentIndex + 1;

            set({
              timer: {
                ...timer,
                journey: {
                  ...journey,
                  currentSegmentIndex: nextSegmentIndex,
                  segmentProgress: 0,
                  pauseState: null,
                },
              },
            });
          } else {
            // Continue pause countdown
            set({
              timer: {
                ...timer,
                journey: {
                  ...journey,
                  pauseState: {
                    ...journey.pauseState,
                    remainingPauseSeconds: newRemaining,
                  },
                },
              },
            });
          }
          return;
        }

        // Normal tick - advance time
        const newElapsed = timer.elapsedSeconds + 1;
        const currentSegment = journey.segments[journey.currentSegmentIndex];

        if (!currentSegment) return;

        // Calculate segment-local elapsed time
        let segmentStartTime = 0;
        for (let i = 0; i < journey.currentSegmentIndex; i++) {
          segmentStartTime += journey.segments[i].timeSeconds;
        }
        const segmentElapsed = newElapsed - segmentStartTime;
        const newSegmentProgress = Math.min(segmentElapsed / currentSegment.timeSeconds, 1);

        // Calculate overall train position
        const overallProgress = currentSegment.startProgress +
          (currentSegment.endProgress - currentSegment.startProgress) * newSegmentProgress;

        // Check if current segment is complete
        if (newSegmentProgress >= 1) {
          const isLastSegment = journey.currentSegmentIndex >= journey.segments.length - 1;

          if (isLastSegment) {
            // Journey complete - transition to break
            const route = timer.currentRoute;
            if (route) {
              const allStations = get().getAllStations();
              const visitedStationIds = journey.stations;
              const newVisitedStations = [...new Set([...progress.visitedStations, ...visitedStationIds])];
              const newCompletedRoutes = [...new Set([...progress.completedRoutes, route.id])];

              const newCountries = [...new Set([
                ...progress.countriesVisited,
                ...visitedStationIds
                  .map(id => allStations[id]?.countryCode)
                  .filter(Boolean) as string[],
              ])];

              const { selectedCountry } = get();

              // Update streak tracking
              const today = getTodayDate();
              const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
              let newStreak = progress.currentStreak;
              let newLongestStreak = progress.longestStreak;
              let newTodayMinutes = progress.todayMinutes;
              let newTodayDate = progress.todayDate;

              // Reset daily minutes if it's a new day
              if (newTodayDate !== today) {
                newTodayMinutes = 0;
                newTodayDate = today;
              }
              newTodayMinutes += journey.totalTimeMinutes;

              // Update streak
              if (progress.lastStreakDate === yesterday) {
                newStreak = progress.currentStreak + 1;
              } else if (progress.lastStreakDate !== today) {
                newStreak = 1;
              }
              newLongestStreak = Math.max(newLongestStreak, newStreak);

              // Add to recent journeys
              const newRecentJourney: RecentJourney = {
                fromStation: route.from,
                toStation: route.to,
                countryCode: selectedCountry || '',
                completedAt: new Date().toISOString(),
              };
              const newRecentJourneys = [
                newRecentJourney,
                ...(progress.recentJourneys || []).slice(0, 4)
              ];

              // Check for new achievements
              const updatedProgress = {
                ...progress,
                visitedStations: newVisitedStations,
                completedRoutes: newCompletedRoutes,
                totalDistanceKm: progress.totalDistanceKm + journey.totalDistanceKm,
                totalTimeMinutes: progress.totalTimeMinutes + journey.totalTimeMinutes,
                countriesVisited: newCountries,
                sessionsCompleted: progress.sessionsCompleted + 1,
                lastSessionAt: new Date().toISOString(),
                currentStreak: newStreak,
                longestStreak: newLongestStreak,
                lastStreakDate: today,
                dailyGoalMinutes: progress.dailyGoalMinutes || 25,
                todayMinutes: newTodayMinutes,
                todayDate: newTodayDate,
                recentJourneys: newRecentJourneys,
                unlockedAchievements: progress.unlockedAchievements || [],
              };

              // Check for newly unlocked achievements
              const newlyUnlocked = achievements
                .filter(a => !updatedProgress.unlockedAchievements.includes(a.id))
                .filter(a => a.requirement(updatedProgress))
                .map(a => a.id);

              updatedProgress.unlockedAchievements = [
                ...updatedProgress.unlockedAchievements,
                ...newlyUnlocked,
              ];

              set({
                timer: {
                  ...timer,
                  status: 'break',
                  elapsedSeconds: 0,
                  totalSeconds: 300,
                  trainPosition: 1,
                  journey: {
                    ...journey,
                    currentSegmentIndex: journey.segments.length - 1,
                    segmentProgress: 1,
                    pauseState: null,
                  },
                },
                progress: updatedProgress,
                ...(selectedCountry ? {
                  currentStation: route.to,
                  selectedDeparture: route.to,
                  selectedDestination: null,
                } : {}),
              });

              if (selectedCountry) {
                setTimeout(() => get().loadConnectedStations(), 100);
              }
            }
          } else {
            // Intermediate station reached
            const nextStationId = currentSegment.toStation;
            const isSignificantStop = journey.significantStopIds.has(nextStationId);

            if (isSignificantStop) {
              // Major stop - pause and announce
              const nextStation = apiStations[nextStationId];
              const stationName = nextStation?.name || nextStation?.city || 'Station';

              const pauseState: PauseState = {
                stationId: nextStationId,
                stationName,
                remainingPauseSeconds: 5,
                totalPauseSeconds: 5,
              };

              set({
                timer: {
                  ...timer,
                  elapsedSeconds: newElapsed,
                  trainPosition: overallProgress,
                  journey: {
                    ...journey,
                    segmentProgress: 1,
                    pauseState,
                  },
                },
              });
            } else {
              // Minor stop - just move to next segment without pausing
              set({
                timer: {
                  ...timer,
                  elapsedSeconds: newElapsed,
                  trainPosition: overallProgress,
                  journey: {
                    ...journey,
                    currentSegmentIndex: journey.currentSegmentIndex + 1,
                    segmentProgress: 0,
                    pauseState: null,
                  },
                },
              });
            }
          }
        } else {
          // Normal progress within segment
          set({
            timer: {
              ...timer,
              elapsedSeconds: newElapsed,
              trainPosition: overallProgress,
              journey: {
                ...journey,
                segmentProgress: newSegmentProgress,
              },
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
        const { selectedCountry, currentStation } = get();

        if (selectedCountry && currentStation) {
          set({
            timer: initialTimer,
            selectedDeparture: currentStation,
            selectedDestination: null,
          });
        } else {
          set({
            timer: initialTimer,
            selectedDeparture: null,
            selectedDestination: null,
          });
        }
      },

      skipToNextStation: () => {
        const { timer } = get();
        if (timer.journey && timer.journey.currentSegmentIndex < timer.journey.segments.length - 1) {
          const nextSegmentIndex = timer.journey.currentSegmentIndex + 1;
          const nextSegment = timer.journey.segments[nextSegmentIndex];

          if (nextSegment) {
            set({
              timer: {
                ...timer,
                status: 'running',
                journey: {
                  ...timer.journey,
                  currentSegmentIndex: nextSegmentIndex,
                  segmentProgress: 0,
                  pauseState: null,
                },
                trainPosition: nextSegment.startProgress,
              },
            });
          }
        } else {
          get().endBreak();
        }
      },

      selectPreset: (stationIds) => {
        if (stationIds.length >= 2) {
          set({
            selectedDeparture: stationIds[0],
            selectedDestination: stationIds[stationIds.length - 1],
            showPresets: false,
          });
        }
      },

      // Computed helpers - Country-first flow: return empty when no country selected
      getAllStations: () => {
        const { selectedCountry, apiStations } = get();
        // If no country selected, return empty (country-first flow)
        if (!selectedCountry) {
          return {};
        }
        // Return API stations for the selected country
        return apiStations;
      },

      getAllRoutes: () => {
        const { selectedCountry, apiRoutes } = get();
        // If no country selected, return empty (country-first flow)
        if (!selectedCountry) {
          return [];
        }
        return apiRoutes;
      },

      findRoute: (fromId: string, toId: string) => {
        const { apiRoutes, selectedCountry } = get();

        if (selectedCountry) {
          // API mode
          const apiRoute = apiRoutes.find(
            r => (r.from === fromId && r.to === toId) || (r.from === toId && r.to === fromId)
          );
          if (apiRoute) return apiRoute;
        }

        // Fall back to local routes only if no country selected
        if (!selectedCountry) {
          return findLocalRoute(fromId, toId);
        }

        return undefined;
      },

      getCurrentRoute: () => {
        const { selectedDeparture, selectedDestination } = get();
        if (!selectedDeparture || !selectedDestination) return null;

        const route = get().findRoute(selectedDeparture, selectedDestination);
        if (!route) return null;

        const allStations = get().getAllStations();
        const from = allStations[selectedDeparture];
        const to = allStations[selectedDestination];
        if (!from || !to) return null;

        return { from, to, route };
      },
    }),
    {
      name: 'pomodoro-railroad-storage',
      partialize: (state) => ({
        progress: state.progress,
        mapStyle: state.mapStyle,
        showLabels: state.showLabels,
        selectedCountry: state.selectedCountry,
        pomodoroViewMode: state.pomodoroViewMode,
        mapOrientation: state.mapOrientation,
        // Persist timer/journey state for reload recovery
        timer: state.timer,
        currentStation: state.currentStation,
        apiStations: state.apiStations,
        // Don't persist: selectedDeparture, selectedDestination, apiRoutes
        // These should be regenerated fresh to avoid stale path data
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Pause any running timer
          if (state.timer.status === 'running') {
            state.timer = { ...state.timer, status: 'paused' };
          }
          // Clear any stale route selection - routes will be regenerated
          state.selectedDestination = null;
          state.selectedDeparture = state.currentStation;
          state.apiRoutes = [];
          // Clear path cache on reload
          clearCaches();
        }
      },
    }
  )
);

// Memoized selectors using useShallow for better performance
export function useTimerState() {
  return useStore(useShallow((state) => ({
    timer: state.timer,
    tick: state.tick,
    pauseTimer: state.pauseTimer,
    resumeTimer: state.resumeTimer,
    stopTimer: state.stopTimer,
    endTrip: state.endTrip,
    endBreak: state.endBreak,
  })));
}

export function useSelectionState() {
  return useStore(useShallow((state) => ({
    selectedDeparture: state.selectedDeparture,
    selectedDestination: state.selectedDestination,
    hoveredStation: state.hoveredStation,
    setSelectedDeparture: state.setSelectedDeparture,
    setSelectedDestination: state.setSelectedDestination,
    setHoveredStation: state.setHoveredStation,
    clearSelection: state.clearSelection,
  })));
}

export function useCountryState() {
  return useStore(useShallow((state) => ({
    selectedCountry: state.selectedCountry,
    currentStation: state.currentStation,
    apiStations: state.apiStations,
    apiRoutes: state.apiRoutes,
    apiLoadingState: state.apiLoadingState,
    apiError: state.apiError,
    showCountrySelector: state.showCountrySelector,
    selectCountry: state.selectCountry,
    pickRandomStation: state.pickRandomStation,
    setCurrentStation: state.setCurrentStation,
    setShowCountrySelector: state.setShowCountrySelector,
    clearApiState: state.clearApiState,
  })));
}

export function useMapState() {
  return useStore(useShallow((state) => ({
    mapStyle: state.mapStyle,
    showLabels: state.showLabels,
    setMapStyle: state.setMapStyle,
    setShowLabels: state.setShowLabels,
  })));
}

// Hook for merged stations with memoization
export function useMergedStations() {
  const apiStations = useStore((state) => state.apiStations);
  const selectedCountry = useStore((state) => state.selectedCountry);

  return useMemo(() => {
    if (!selectedCountry) {
      return {};
    }
    return apiStations;
  }, [apiStations, selectedCountry]);
}
