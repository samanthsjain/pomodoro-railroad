import { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pause, Play, Coffee, Volume2, VolumeX, Map, LogOut, Quote } from 'lucide-react';
import { useStore, useMergedStations } from '../store/useStore';
import { useTrainAudio } from '../hooks/useTrainAudio';
import { getBiomeConfig, type BiomeConfig } from '../data/biomes';
import { getRandomQuote } from '../data/quotes';

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function seededRandom(seed: number) {
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

function generateScenery(seed: number, biome: BiomeConfig) {
  const rng = seededRandom(seed);

  const trees = Array.from({ length: 35 }, (_, i) => ({
    id: i,
    x: rng() * 200,
    height: 30 + rng() * 50,
    type: biome.treeTypes[Math.floor(rng() * biome.treeTypes.length)],
    color: biome.treeColors[Math.floor(rng() * biome.treeColors.length)],
  }));

  const mountains = biome.mountainColors.length > 0
    ? Array.from({ length: 6 }, (_, i) => ({
        id: i,
        x: i * 40 + rng() * 20,
        height: 60 + rng() * 80,
        width: 50 + rng() * 70,
        color: biome.mountainColors[Math.floor(rng() * biome.mountainColors.length)],
        hasSnowCap: biome.hasSnow && rng() > 0.3,
      }))
    : [];

  const clouds = Array.from({ length: 10 }, (_, i) => ({
    id: i,
    x: rng() * 200,
    y: 5 + rng() * 25,
    scale: 0.4 + rng() * 0.6,
  }));

  const hills = Array.from({ length: 5 }, (_, i) => ({
    id: i,
    x: i * 50 + rng() * 30,
    width: 35 + rng() * 45,
    height: 80 + rng() * 60,
    color: biome.hillColors[Math.floor(rng() * biome.hillColors.length)],
  }));

  return { trees, mountains, clouds, hills };
}

function SceneryLayer({ speed, children, className = '' }: { speed: number; children: React.ReactNode; className?: string }) {
  return (
    <div className={`absolute inset-0 ${className}`}>
      <motion.div
        className="absolute h-full"
        style={{ width: '200%' }}
        animate={{ x: [0, '-50%'] }}
        transition={{ duration: speed, repeat: Infinity, ease: 'linear' }}
      >
        {children}
        <div className="absolute left-1/2 top-0 h-full w-1/2">{children}</div>
      </motion.div>
    </div>
  );
}

function TreeElement({ tree }: { tree: { type: string; height: number; color: string } }) {
  switch (tree.type) {
    case 'pine':
      return (
        <svg width="30" height={tree.height} viewBox="0 0 30 60">
          <polygon points="15,0 30,45 0,45" fill={tree.color} />
          <polygon points="15,15 28,50 2,50" fill={tree.color} opacity="0.8" />
          <rect x="12" y="45" width="6" height="15" fill="#5D4037" />
        </svg>
      );
    case 'palm':
      return (
        <svg width="40" height={tree.height} viewBox="0 0 40 60">
          <path d="M20,15 Q5,5 0,10 Q10,15 20,15" fill="#228B22" />
          <path d="M20,15 Q35,5 40,10 Q30,15 20,15" fill="#228B22" />
          <path d="M18,15 Q17,40 19,60 L21,60 Q23,40 22,15" fill="#8B7355" />
        </svg>
      );
    default:
      return (
        <div className="flex flex-col items-center">
          <div
            className="rounded-full"
            style={{ width: tree.height * 0.6, height: tree.height * 0.7, backgroundColor: tree.color }}
          />
          <div className="w-3 h-8 bg-amber-800 -mt-2" />
        </div>
      );
  }
}

export function TrainCabin() {
  const { timer, pauseTimer, resumeTimer, endTrip, tick, endBreak, togglePomodoroViewMode } = useStore();
  const stations = useMergedStations();
  const { playHorn, startTrainLoop, stopTrainLoop } = useTrainAudio();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const hasPlayedDepartureHorn = useRef(false);
  const [currentQuote] = useState(() => getRandomQuote());

  const fromStation = timer.currentRoute ? stations[timer.currentRoute.from] : null;
  const toStation = timer.currentRoute ? stations[timer.currentRoute.to] : null;

  // Get current pause state (arriving at station)
  const pauseState = timer.journey?.pauseState || null;
  const isAtStation = pauseState !== null;

  // Get next station info
  const nextStationInfo = useMemo(() => {
    const journey = timer.journey;
    if (!journey || journey.segments.length === 0) return null;

    const currentIdx = journey.currentSegmentIndex;
    const currentSegment = journey.segments[currentIdx];
    if (!currentSegment) return null;

    // If we're paused at a station, the "next" is the upcoming segment's destination
    // Otherwise, it's the current segment's destination
    const nextStationId = currentSegment.toStation;
    const nextStation = stations[nextStationId];
    if (!nextStation) return null;

    // Calculate time remaining to next station
    const segmentTimeRemaining = Math.round(currentSegment.timeSeconds * (1 - journey.segmentProgress));

    // Check if there are more stations after this one
    const totalStops = journey.stations.length;
    const stopsRemaining = totalStops - currentIdx - 2; // -2 because current segment end + final destination

    return {
      name: nextStation.name || nextStation.city,
      city: nextStation.city,
      timeRemaining: segmentTimeRemaining,
      stopsRemaining,
      isFinalDestination: currentIdx >= journey.segments.length - 1,
    };
  }, [timer.journey, stations]);

  const biome = useMemo(() => {
    if (!fromStation || !toStation) return getBiomeConfig('US', 'US');
    return getBiomeConfig(fromStation.countryCode, toStation.countryCode);
  }, [fromStation, toStation]);

  const scenery = useMemo(() => {
    const seed = timer.journey?.id.charCodeAt(8) || 42;
    return generateScenery(seed, biome);
  }, [timer.journey?.id, biome]);

  useEffect(() => {
    if (timer.status !== 'running' && timer.status !== 'break') return;
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [timer.status, tick]);

  // Play departure horn when journey starts
  useEffect(() => {
    if (timer.status === 'running' && !hasPlayedDepartureHorn.current && soundEnabled) {
      hasPlayedDepartureHorn.current = true;
      playHorn();
    }
    if (timer.status === 'idle') {
      hasPlayedDepartureHorn.current = false;
    }
  }, [timer.status, soundEnabled, playHorn]);

  // Manage train wheel sounds based on sound toggle
  useEffect(() => {
    if (soundEnabled && timer.status === 'running' && !timer.journey?.pauseState) {
      startTrainLoop();
    } else {
      stopTrainLoop();
    }
    return () => stopTrainLoop();
  }, [timer.status, timer.journey?.pauseState, soundEnabled, startTrainLoop, stopTrainLoop]);

  if (timer.status !== 'running' && timer.status !== 'paused' && timer.status !== 'break') {
    return null;
  }

  const remaining = timer.totalSeconds - timer.elapsedSeconds;
  const progress = timer.elapsedSeconds / timer.totalSeconds;
  const isPaused = timer.status === 'paused';
  const isBreak = timer.status === 'break';
  const shouldPauseScenery = isPaused || isAtStation;

  const getSkyStyle = () => {
    if (isBreak) {
      return `linear-gradient(to bottom, ${biome.sunsetGradient.top} 0%, ${biome.sunsetGradient.middle} 50%, ${biome.sunsetGradient.bottom} 100%)`;
    }
    return `linear-gradient(to bottom, ${biome.skyGradient.top} 0%, ${biome.skyGradient.middle} 50%, ${biome.skyGradient.bottom} 100%)`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90]"
        style={{ background: 'var(--color-bg-primary)' }}
      >
        <div className={`relative w-full h-full overflow-hidden ${!isPaused ? 'train-sway' : ''}`}>
          {/* Window frame - cleaner, minimal */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[1000px] h-[55vh] max-h-[450px]"
          >
            {/* Minimal frame */}
            <div
              className="absolute -inset-3 rounded-2xl"
              style={{ background: 'var(--color-bg-tertiary)' }}
            />

            {/* Window glass */}
            <div className="relative w-full h-full rounded-xl overflow-hidden">
              {/* Sky */}
              <div className="absolute inset-0" style={{ background: getSkyStyle() }} />

              {/* Sun */}
              <motion.div
                className="absolute w-14 h-14 rounded-full"
                style={{
                  background: isBreak
                    ? 'radial-gradient(circle, #ffcc80 0%, #ff9800 100%)'
                    : 'radial-gradient(circle, #fff9c4 0%, #ffeb3b 100%)',
                  boxShadow: isBreak ? '0 0 60px #ff9800' : '0 0 40px rgba(255,235,59,0.5)',
                  top: `${10 + Math.sin(progress * Math.PI) * 15}%`,
                  right: `${10 + progress * 50}%`,
                }}
              />

              {/* Clouds */}
              <SceneryLayer speed={shouldPauseScenery ? 999999 : 80} className="opacity-70">
                <div className="relative w-full h-full">
                  {scenery.clouds.map((cloud) => (
                    <div
                      key={cloud.id}
                      className="absolute"
                      style={{ left: `${cloud.x}%`, top: `${cloud.y}%`, transform: `scale(${cloud.scale})` }}
                    >
                      <div className="flex gap-1">
                        <div className="w-14 h-9 bg-white/80 rounded-full blur-[1px]" />
                        <div className="w-18 h-11 bg-white/90 rounded-full -ml-5 -mt-2 blur-[1px]" />
                        <div className="w-12 h-8 bg-white/70 rounded-full -ml-4 mt-1 blur-[1px]" />
                      </div>
                    </div>
                  ))}
                </div>
              </SceneryLayer>

              {/* Mountains */}
              {scenery.mountains.length > 0 && (
                <SceneryLayer speed={shouldPauseScenery ? 999999 : 50} className="bottom-0">
                  <svg className="absolute bottom-[20%] w-full h-[45%]" preserveAspectRatio="none">
                    {scenery.mountains.map((m) => (
                      <g key={m.id}>
                        <polygon
                          points={`${m.x}%,100% ${m.x + m.width / 2}%,${100 - m.height}% ${m.x + m.width}%,100%`}
                          fill={m.color}
                        />
                        {m.hasSnowCap && (
                          <polygon
                            points={`${m.x + m.width * 0.35}%,${100 - m.height + 15}% ${m.x + m.width / 2}%,${100 - m.height}% ${m.x + m.width * 0.65}%,${100 - m.height + 15}%`}
                            fill="#FFFFFF"
                          />
                        )}
                      </g>
                    ))}
                  </svg>
                </SceneryLayer>
              )}

              {/* Hills */}
              <SceneryLayer speed={shouldPauseScenery ? 999999 : 30}>
                <div className="absolute bottom-[15%] w-full h-[35%]">
                  <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 200 100">
                    {scenery.hills.map((hill) => (
                      <ellipse key={hill.id} cx={`${hill.x}%`} cy="100%" rx={`${hill.width}%`} ry={`${hill.height}%`} fill={hill.color} />
                    ))}
                  </svg>
                </div>
              </SceneryLayer>

              {/* Trees */}
              <SceneryLayer speed={shouldPauseScenery ? 999999 : 12}>
                <div className="absolute bottom-[8%] w-full h-[40%]">
                  {scenery.trees.map((tree) => (
                    <div key={tree.id} className="absolute bottom-0" style={{ left: `${tree.x}%` }}>
                      <TreeElement tree={tree} />
                    </div>
                  ))}
                </div>
              </SceneryLayer>

              {/* Ground */}
              <SceneryLayer speed={shouldPauseScenery ? 999999 : 6}>
                <div
                  className="absolute bottom-0 w-full h-[12%]"
                  style={{ background: `linear-gradient(to top, ${biome.groundColors[0]}, ${biome.groundColors[1]})` }}
                />
              </SceneryLayer>

              {/* Tracks */}
              <div className="absolute bottom-0 w-full h-[6%] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-gray-600 to-gray-500" />
                <SceneryLayer speed={shouldPauseScenery ? 999999 : 2}>
                  <div className="absolute inset-0 flex items-center">
                    {Array.from({ length: 40 }).map((_, i) => (
                      <div key={i} className="w-4 h-full bg-amber-900/60 mr-8" style={{ transform: 'skewX(-10deg)' }} />
                    ))}
                  </div>
                </SceneryLayer>
              </div>

              {/* Window reflection */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Single divider line */}
            <div
              className="absolute top-1/2 left-0 w-full h-px -translate-y-1/2"
              style={{ background: 'var(--color-separator)' }}
            />
          </div>

          {/* Large centered timer */}
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute top-8 left-1/2 -translate-x-1/2"
          >
            <div className="text-center">
              <div className="timer-display text-[var(--color-text-primary)]">
                {formatTime(remaining)}
              </div>
              {isBreak && (
                <p className="text-subhead text-[var(--color-accent-orange)] mt-2">Break Time</p>
              )}
            </div>
          </motion.div>

          {/* Motivational quote during break */}
          <AnimatePresence>
            {isBreak && currentQuote && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: 0.5 }}
                className="absolute top-44 left-1/2 -translate-x-1/2 max-w-md px-4"
              >
                <div className="glass-elevated rounded-2xl p-6 text-center">
                  <Quote className="w-6 h-6 text-[var(--color-accent-orange)] mx-auto mb-3 opacity-50" />
                  <p className="text-body text-[var(--color-text-primary)] mb-2 italic">
                    "{currentQuote.text}"
                  </p>
                  <p className="text-caption text-[var(--color-text-tertiary)]">
                    — {currentQuote.author}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Minimal progress bar */}
          <div className="absolute top-32 left-1/2 -translate-x-1/2 w-48">
            <div className="progress-minimal">
              <div className="progress-minimal-fill" style={{ width: `${progress * 100}%` }} />
            </div>
          </div>

          {/* Next station ETA (when there are intermediate stops) */}
          {!isBreak && !isAtStation && nextStationInfo && !nextStationInfo.isFinalDestination && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-40 left-1/2 -translate-x-1/2"
            >
              <div className="flex items-center gap-2 text-sm">
                <span className="text-[var(--color-text-tertiary)]">Next:</span>
                <span className="text-[var(--color-text-secondary)] font-medium">
                  {nextStationInfo.city}
                </span>
                <span className="text-[var(--color-accent-blue)]">
                  {nextStationInfo.timeRemaining < 60
                    ? `${nextStationInfo.timeRemaining}s`
                    : `${Math.floor(nextStationInfo.timeRemaining / 60)}m ${nextStationInfo.timeRemaining % 60}s`}
                </span>
              </div>
            </motion.div>
          )}

          {/* Arrival announcement overlay */}
          <AnimatePresence>
            {isAtStation && pauseState && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50"
              >
                {(() => {
                  const arrivalStation = stations[pauseState.stationId];
                  return (
                    <div
                      className="rounded-3xl text-center overflow-hidden"
                      style={{
                        background: 'rgba(30, 30, 30, 0.9)',
                        backdropFilter: 'blur(20px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        width: arrivalStation?.photoUrl ? '320px' : 'auto',
                      }}
                    >
                      {/* Station photo */}
                      {arrivalStation?.photoUrl && (
                        <div className="relative w-full h-40 overflow-hidden">
                          <img
                            src={arrivalStation.photoUrl}
                            alt={pauseState.stationName}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                          {arrivalStation.photographer && (
                            <p className="absolute bottom-1 right-2 text-[10px] text-white/50">
                              {arrivalStation.photographer}
                            </p>
                          )}
                        </div>
                      )}

                      <div className={arrivalStation?.photoUrl ? 'px-10 py-5' : 'px-10 py-6'}>
                        <p className="text-sm uppercase tracking-widest text-[var(--color-accent-orange)] font-medium mb-2">
                          Arriving at
                        </p>
                        <p className="text-2xl font-semibold text-white mb-4">
                          {pauseState.stationName}
                        </p>
                        {/* Countdown dots */}
                        <div className="flex items-center justify-center gap-2">
                          {Array.from({ length: pauseState.totalPauseSeconds }).map((_, i) => (
                            <div
                              key={i}
                              className="w-2.5 h-2.5 rounded-full transition-colors duration-200"
                              style={{
                                backgroundColor: i < pauseState.totalPauseSeconds - pauseState.remainingPauseSeconds
                                  ? 'var(--color-accent-orange)'
                                  : 'rgba(255, 255, 255, 0.2)',
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Route info - bottom */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <div className="flex items-center gap-6 text-subhead">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[var(--color-accent-green)]" />
                <span className="text-[var(--color-text-secondary)]">{fromStation?.city}</span>
              </div>
              <div className="w-16 h-px bg-[var(--color-separator)]" />
              <div className="flex items-center gap-2">
                <span className="text-[var(--color-text-secondary)]">{toStation?.city}</span>
                <div className="w-2 h-2 rounded-full bg-[var(--color-accent-red)]" />
              </div>
            </div>
          </motion.div>

          {/* Side panel controls */}
          <div className="absolute right-6 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-3">
            {/* Pause/Play button */}
            {!isBreak && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={isPaused ? resumeTimer : pauseTimer}
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: 'var(--color-fill-tertiary)' }}
                title={isPaused ? 'Resume' : 'Pause'}
              >
                {isPaused ? (
                  <Play className="w-5 h-5 text-white" />
                ) : (
                  <Pause className="w-5 h-5 text-white" />
                )}
              </motion.button>
            )}

            {/* End break button */}
            {isBreak && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={endBreak}
                className="w-12 h-12 rounded-full flex items-center justify-center bg-[var(--color-accent-green)]/30"
                title="End break"
              >
                <Coffee className="w-5 h-5 text-[var(--color-accent-green)]" />
              </motion.button>
            )}

            {/* End trip button */}
            {!isBreak && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={endTrip}
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: 'var(--color-fill-tertiary)' }}
                title="End trip and pick new destination"
              >
                <LogOut className="w-5 h-5 text-[var(--color-accent-orange)]" />
              </motion.button>
            )}

            {/* Separator */}
            <div className="w-8 h-px bg-white/20 mx-auto" />

            {/* Map view toggle */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={togglePomodoroViewMode}
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: 'var(--color-fill-tertiary)' }}
              title="Switch to map view"
            >
              <Map className="w-5 h-5 text-[var(--color-text-secondary)]" />
            </motion.button>

            {/* Sound toggle */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: 'var(--color-fill-tertiary)' }}
              title={soundEnabled ? 'Mute sound' : 'Enable sound'}
            >
              {soundEnabled ? (
                <Volume2 className="w-5 h-5 text-[var(--color-text-secondary)]" />
              ) : (
                <VolumeX className="w-5 h-5 text-[var(--color-text-secondary)]" />
              )}
            </motion.button>
          </div>

          {/* Paused indicator */}
          {isPaused && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            >
              <div className="glass rounded-2xl px-8 py-4">
                <p className="text-title-lg text-[var(--color-text-primary)]">PAUSED</p>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
