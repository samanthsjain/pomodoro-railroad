import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Train, Play, Shuffle, ChevronRight, Zap, History } from 'lucide-react';
import { useStore } from '../store/useStore';
import { trainClasses } from '../types';
import { FloatingOrbs } from './AmbientParticles';

export function RoutePanel() {
  const {
    selectedDeparture,
    selectedDestination,
    setSelectedDestination,
    clearSelection,
    startJourney,
    setTrainClass,
    timer,
    getAllStations,
    findRoute,
    selectedCountry,
    currentStation,
    apiRoutes,
    pickRandomStation,
    setShowCountrySelector,
    apiLoadingState,
    progress,
    setCurrentStation,
  } = useStore();

  // Get recent journeys for quick-start
  const recentJourneys = (progress.recentJourneys || [])
    .filter(j => j.countryCode === selectedCountry)
    .slice(0, 3);

  const allStations = getAllStations();
  const toStation = selectedDestination ? allStations[selectedDestination] : null;
  const route = selectedDeparture && selectedDestination
    ? findRoute(selectedDeparture, selectedDestination)
    : null;

  // Don't show when timer is active
  if (timer.status !== 'idle') return null;

  // Welcome screen - no country selected
  if (!selectedCountry) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        className="fixed inset-0 z-40 flex items-center justify-center"
        style={{ background: 'var(--color-bg-primary)' }}
      >
        {/* Ambient floating orbs */}
        <FloatingOrbs />

        <div className="text-center relative z-10">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            {/* Animated logo with glow */}
            <motion.div
              className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-[var(--color-accent-blue)] to-[#0055cc] flex items-center justify-center mb-6 relative"
              animate={{
                boxShadow: [
                  '0 0 30px rgba(0, 122, 255, 0.3)',
                  '0 0 50px rgba(0, 122, 255, 0.5)',
                  '0 0 30px rgba(0, 122, 255, 0.3)',
                ]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Train className="w-12 h-12 text-white" />
              <motion.div
                className="absolute inset-0 rounded-3xl"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%)' }}
              />
            </motion.div>

            <h1 className="text-display-md text-[var(--color-text-primary)] mb-2">
              Pomodoro Railroad
            </h1>
            <p className="text-body text-[var(--color-text-secondary)] max-w-sm mx-auto mb-4">
              Focus your way around the world's railway networks
            </p>

            {/* Streak indicator on welcome */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-center gap-2 text-sm"
            >
              <Zap className="w-4 h-4 text-[var(--color-accent-orange)]" />
              <span className="text-[var(--color-text-tertiary)]">
                Start focusing to build your streak
              </span>
            </motion.div>
          </motion.div>

          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            onClick={() => setShowCountrySelector(true)}
            whileTap={{ scale: 0.97 }}
            className="btn-apple btn-primary px-8 py-4 text-lg relative overflow-hidden group"
          >
            <span className="relative z-10">Choose a Country</span>
            <motion.div
              className="absolute inset-0 bg-white/10"
              initial={{ x: '-100%' }}
              whileHover={{ x: '100%' }}
              transition={{ duration: 0.5 }}
            />
          </motion.button>

          {/* Keyboard hint */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 text-caption text-[var(--color-text-tertiary)]"
          >
            Press <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-fill-tertiary)] text-[var(--color-text-secondary)] font-mono text-xs">Space</kbd> to pause during journeys
          </motion.p>
        </div>
      </motion.div>
    );
  }

  // Country selected, showing current station and connections
  if (selectedCountry && currentStation && !selectedDestination) {
    const currentStationData = allStations[currentStation];

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className="fixed top-20 left-4 z-40 w-80"
        >
          <div className="card-glass overflow-hidden">
            {/* Current station - large typography */}
            {currentStationData && (
              <div className="p-5">
                <p className="text-caption text-[var(--color-accent-green)] uppercase tracking-wider mb-1">
                  Your Location
                </p>
                <h2 className="text-title-lg text-[var(--color-text-primary)] mb-1">
                  {currentStationData.name}
                </h2>
                <p className="text-subhead text-[var(--color-text-secondary)]">
                  {currentStationData.city}
                </p>

                <button
                  onClick={pickRandomStation}
                  className="mt-3 flex items-center gap-2 text-[var(--color-accent-blue)] text-sm font-medium hover:opacity-80 transition-opacity"
                >
                  <Shuffle className="w-4 h-4" />
                  Random Station
                </button>
              </div>
            )}

            <div className="divider" />

            {/* Loading state */}
            {apiLoadingState === 'loading' && (
              <div className="p-6 text-center">
                <div className="w-6 h-6 border-2 border-[var(--color-accent-blue)] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-footnote text-[var(--color-text-secondary)]">Finding connections...</p>
              </div>
            )}

            {/* Quick start - Recent journeys */}
            {recentJourneys.length > 0 && apiLoadingState !== 'loading' && (
              <div className="p-3 pb-0">
                <p className="text-caption text-[var(--color-text-tertiary)] uppercase tracking-wider mb-2 px-2 flex items-center gap-2">
                  <History className="w-3 h-3" />
                  Quick Start
                </p>
                <div className="space-y-1">
                  {recentJourneys.map((journey, idx) => {
                    const fromStation = allStations[journey.fromStation];
                    const toStation = allStations[journey.toStation];
                    if (!fromStation || !toStation) return null;

                    return (
                      <motion.button
                        key={idx}
                        onClick={() => {
                          setCurrentStation(journey.fromStation);
                          setTimeout(() => setSelectedDestination(journey.toStation), 100);
                        }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full p-2 rounded-xl text-left transition-all bg-[var(--color-accent-blue)]/10 hover:bg-[var(--color-accent-blue)]/20 border border-[var(--color-accent-blue)]/20 group flex items-center gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-footnote text-[var(--color-accent-blue)] truncate">
                            {fromStation.city} → {toStation.city}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[var(--color-accent-blue)] shrink-0" />
                      </motion.button>
                    );
                  })}
                </div>
                <div className="divider my-3" />
              </div>
            )}

            {/* Destinations list */}
            {apiLoadingState !== 'loading' && apiRoutes.length > 0 && (
              <div className="p-3">
                <p className="text-caption text-[var(--color-text-tertiary)] uppercase tracking-wider mb-2 px-2">
                  Destinations
                </p>
                <div className="space-y-1 max-h-72 overflow-y-auto">
                  {apiRoutes.map((r) => {
                    const destStation = allStations[r.to];
                    if (!destStation) return null;

                    return (
                      <motion.button
                        key={r.id}
                        onClick={() => setSelectedDestination(r.to)}
                        whileTap={{ scale: 0.98 }}
                        className="w-full p-2 rounded-xl text-left transition-all hover:bg-[var(--color-fill-tertiary)] group flex items-center gap-3"
                      >
                        {/* Station photo thumbnail */}
                        {destStation.photoUrl ? (
                          <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0">
                            <img
                              src={destStation.photoUrl}
                              alt={destStation.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-[var(--color-fill-tertiary)] shrink-0 flex items-center justify-center">
                            <Train className="w-6 h-6 text-[var(--color-text-tertiary)]" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-subhead font-medium text-[var(--color-text-primary)] truncate group-hover:text-[var(--color-accent-blue)]">
                              {destStation.name}
                            </p>
                            {r.service && (
                              <span
                                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md text-white shrink-0"
                                style={{ backgroundColor: r.service.color }}
                              >
                                {r.service.shortName}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-caption text-[var(--color-accent-blue)] font-semibold">
                              {r.travelTimeMinutes} min
                            </span>
                            <span className="text-caption text-[var(--color-text-tertiary)]">
                              {r.distanceKm} km
                            </span>
                            {r.stops !== undefined && r.stops > 0 && (
                              <span className="text-caption text-[var(--color-accent-orange)]">
                                {r.stops} {r.stops === 1 ? 'stop' : 'stops'}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[var(--color-text-tertiary)] group-hover:text-[var(--color-accent-blue)] shrink-0" />
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* No connections */}
            {apiLoadingState !== 'loading' && apiRoutes.length === 0 && (
              <div className="p-6 text-center">
                <p className="text-subhead text-[var(--color-text-secondary)] mb-3">
                  No nearby stations found
                </p>
                <button
                  onClick={pickRandomStation}
                  className="btn-apple btn-secondary"
                >
                  <Shuffle className="w-4 h-4" />
                  Try Another
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Destination selected - show journey card
  if (selectedDestination && route) {
    const classConfig = trainClasses.find(c => c.id === timer.selectedClass);
    const adjustedTime = Math.round(route.travelTimeMinutes * (classConfig?.timeMultiplier || 1));

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[90vw] max-w-md"
        >
          <div className="card-glass overflow-hidden">
            {/* Destination photo header */}
            {toStation?.photoUrl && (
              <div className="relative w-full h-32 overflow-hidden">
                <img
                  src={toStation.photoUrl}
                  alt={toStation.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-5 right-5">
                  <p className="text-caption text-white/70 uppercase tracking-wider mb-0.5">
                    Destination
                  </p>
                  <h2 className="text-title-lg text-white">
                    {toStation.name}
                  </h2>
                </div>
                <button
                  onClick={clearSelection}
                  className="absolute top-3 right-3 text-white/70 hover:text-white text-sm bg-black/30 px-2 py-1 rounded-lg"
                >
                  Cancel
                </button>
                {toStation.photographer && (
                  <p className="absolute bottom-1 right-2 text-[10px] text-white/50">
                    {toStation.photographer}
                  </p>
                )}
              </div>
            )}

            {/* Journey header (no photo fallback) */}
            {!toStation?.photoUrl && (
              <div className="p-5 pb-0">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-caption text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1">
                      Journey
                    </p>
                    <h2 className="text-title-lg text-[var(--color-text-primary)]">
                      {toStation?.name}
                    </h2>
                  </div>
                  <button
                    onClick={clearSelection}
                    className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className={toStation?.photoUrl ? 'p-5' : 'px-5 pb-5'}>

              {/* Route info */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[var(--color-accent-blue)]" />
                  <span className="text-title-md text-[var(--color-accent-blue)]">
                    {adjustedTime} min
                  </span>
                </div>
                <span className="text-subhead text-[var(--color-text-tertiary)]">
                  {route.distanceKm} km
                </span>
                {route.stops !== undefined && route.stops > 0 && (
                  <span className="text-subhead text-[var(--color-accent-orange)] font-medium">
                    {route.stops} {route.stops === 1 ? 'stop' : 'stops'}
                  </span>
                )}
              </div>

              {/* Train service badge */}
              {route.service && (
                <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-[var(--color-fill-tertiary)]">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: route.service.color }}
                  />
                  <span className="text-subhead font-medium text-[var(--color-text-primary)]">
                    {route.service.name}
                  </span>
                  <span className="text-caption text-[var(--color-text-tertiary)] capitalize">
                    {route.service.type.replace('-', ' ')}
                  </span>
                </div>
              )}

              {/* Class selector */}
              <div className="flex gap-2 mb-4">
                {trainClasses.map((cls) => {
                  const isSelected = timer.selectedClass === cls.id;
                  return (
                    <button
                      key={cls.id}
                      onClick={() => setTrainClass(cls.id)}
                      className={`flex-1 py-2 px-3 rounded-xl text-center transition-all ${
                        isSelected
                          ? 'bg-[var(--color-accent-blue)] text-white'
                          : 'bg-[var(--color-fill-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-fill-secondary)]'
                      }`}
                    >
                      <p className="text-footnote font-medium">{cls.name}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Start button */}
            <motion.button
              onClick={startJourney}
              whileTap={{ scale: 0.98 }}
              className="w-full p-4 bg-[var(--color-accent-green)] text-white font-semibold flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              Start Journey
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return null;
}
