import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pause, Play, Square, Coffee, Train, Volume2, VolumeX } from 'lucide-react';
import { useStore } from '../store/useStore';
import { stations } from '../data/stations';
import { useSound } from '../hooks/useSound';
import { getBiomeConfig, type BiomeConfig } from '../data/biomes';

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Seeded random for consistent scenery
function seededRandom(seed: number) {
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

// Generate scenery based on biome
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

  // Special elements based on biome
  const specialElements = (biome.specialElements || []).map((type, i) => ({
    id: i,
    type,
    x: 20 + rng() * 160,
  }));

  return { trees, mountains, clouds, hills, specialElements };
}

function SceneryLayer({ speed, children, className = '' }: { speed: number; children: React.ReactNode; className?: string }) {
  return (
    <div className={`absolute inset-0 ${className}`}>
      <motion.div
        className="absolute h-full"
        style={{ width: '200%' }}
        animate={{ x: [0, '-50%'] }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        {children}
        <div className="absolute left-1/2 top-0 h-full w-1/2">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

// Tree rendering component
function TreeElement({ tree }: { tree: { type: string; height: number; color: string } }) {
  switch (tree.type) {
    case 'pine':
      return (
        <div className="relative flex flex-col items-center">
          <svg width="30" height={tree.height} viewBox="0 0 30 60">
            <polygon points="15,0 30,45 0,45" fill={tree.color} />
            <polygon points="15,15 28,50 2,50" fill={tree.color} opacity="0.8" />
            <rect x="12" y="45" width="6" height="15" fill="#5D4037" />
          </svg>
        </div>
      );
    case 'cherry':
      return (
        <div className="relative flex flex-col items-center">
          <svg width="40" height={tree.height} viewBox="0 0 40 50">
            <ellipse cx="20" cy="15" rx="18" ry="15" fill="#FFB7C5" />
            <ellipse cx="12" cy="20" rx="10" ry="10" fill="#FFC1CC" />
            <ellipse cx="28" cy="20" rx="10" ry="10" fill="#FFC1CC" />
            <rect x="18" y="28" width="4" height="22" fill="#8B4513" />
          </svg>
          {/* Falling petals */}
          <motion.div
            className="absolute -top-2 left-1/2"
            animate={{ y: [0, 40], x: [-5, 10], opacity: [1, 0], rotate: [0, 180] }}
            transition={{ duration: 3, repeat: Infinity, delay: Math.random() * 2 }}
          >
            <div className="w-2 h-2 bg-pink-200 rounded-full" />
          </motion.div>
        </div>
      );
    case 'palm':
      return (
        <div className="relative flex flex-col items-center">
          <svg width="40" height={tree.height} viewBox="0 0 40 60">
            <path d="M20,15 Q5,5 0,10 Q10,15 20,15" fill="#228B22" />
            <path d="M20,15 Q35,5 40,10 Q30,15 20,15" fill="#228B22" />
            <path d="M20,15 Q15,0 20,0 Q25,0 20,15" fill="#32CD32" />
            <path d="M20,15 Q0,15 5,20 Q15,18 20,15" fill="#2E8B57" />
            <path d="M20,15 Q40,15 35,20 Q25,18 20,15" fill="#2E8B57" />
            <path d="M18,15 Q17,40 19,60 L21,60 Q23,40 22,15" fill="#8B7355" />
          </svg>
        </div>
      );
    case 'birch':
      return (
        <div className="relative flex flex-col items-center">
          <svg width="30" height={tree.height} viewBox="0 0 30 60">
            <ellipse cx="15" cy="15" rx="12" ry="15" fill={tree.color} />
            <rect x="13" y="25" width="4" height="35" fill="#F5F5DC" />
            <rect x="14" y="30" width="2" height="3" fill="#333" />
            <rect x="14" y="40" width="2" height="2" fill="#333" />
            <rect x="14" y="48" width="2" height="3" fill="#333" />
          </svg>
        </div>
      );
    case 'cactus':
      return (
        <div className="relative flex flex-col items-center">
          <svg width="25" height={tree.height} viewBox="0 0 25 50">
            <rect x="10" y="10" width="5" height="40" rx="2" fill="#228B22" />
            <rect x="0" y="20" width="10" height="4" rx="2" fill="#228B22" />
            <rect x="0" y="15" width="4" height="12" rx="2" fill="#228B22" />
            <rect x="15" y="25" width="10" height="4" rx="2" fill="#228B22" />
            <rect x="21" y="18" width="4" height="14" rx="2" fill="#228B22" />
          </svg>
        </div>
      );
    default: // oak
      return (
        <div className="relative flex flex-col items-center">
          <div
            className="rounded-full"
            style={{
              width: tree.height * 0.6,
              height: tree.height * 0.7,
              backgroundColor: tree.color,
            }}
          />
          <div className="w-3 h-8 bg-amber-800 -mt-2" />
        </div>
      );
  }
}

// Special element rendering
function SpecialElement({ type }: { type: string }) {
  switch (type) {
    case 'pagoda':
      return (
        <svg width="60" height="80" viewBox="0 0 60 80" className="opacity-70">
          <rect x="20" y="60" width="20" height="20" fill="#8B4513" />
          <polygon points="10,60 50,60 45,50 15,50" fill="#C41E3A" />
          <polygon points="15,50 45,50 40,42 20,42" fill="#C41E3A" />
          <polygon points="20,42 40,42 35,35 25,35" fill="#C41E3A" />
          <polygon points="25,35 35,35 30,25" fill="#C41E3A" />
        </svg>
      );
    case 'windmill':
      return (
        <div className="relative">
          <svg width="40" height="70" viewBox="0 0 40 70">
            <rect x="17" y="20" width="6" height="50" fill="#D4A574" />
            <motion.g
              style={{ transformOrigin: '20px 20px' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            >
              <rect x="18" y="0" width="4" height="20" fill="#FFF" />
              <rect x="18" y="20" width="4" height="20" fill="#FFF" transform="rotate(90 20 20)" />
              <rect x="18" y="20" width="4" height="20" fill="#FFF" transform="rotate(180 20 20)" />
              <rect x="18" y="20" width="4" height="20" fill="#FFF" transform="rotate(270 20 20)" />
            </motion.g>
          </svg>
        </div>
      );
    case 'city_skyline':
      return (
        <svg width="120" height="100" viewBox="0 0 120 100" className="opacity-50">
          <rect x="5" y="40" width="15" height="60" fill="#4A5568" />
          <rect x="25" y="20" width="20" height="80" fill="#2D3748" />
          <rect x="50" y="30" width="12" height="70" fill="#4A5568" />
          <rect x="67" y="10" width="18" height="90" fill="#2D3748" />
          <rect x="90" y="35" width="15" height="65" fill="#4A5568" />
          <rect x="108" y="50" width="10" height="50" fill="#2D3748" />
          {/* Windows */}
          {[30, 40, 50, 60, 70].map((y, i) => (
            <rect key={i} x="70" y={y} width="3" height="4" fill="#FCD34D" opacity="0.6" />
          ))}
        </svg>
      );
    default:
      return null;
  }
}

export function TrainCabin() {
  const { timer, pauseTimer, resumeTimer, stopTimer, tick, endBreak } = useStore();
  const { playTrainChug } = useSound();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showControls, setShowControls] = useState(false);

  const fromStation = timer.currentRoute ? stations[timer.currentRoute.from] : null;
  const toStation = timer.currentRoute ? stations[timer.currentRoute.to] : null;

  // Get biome based on route
  const biome = useMemo(() => {
    if (!fromStation || !toStation) {
      return getBiomeConfig('US', 'US');
    }
    return getBiomeConfig(fromStation.countryCode, toStation.countryCode);
  }, [fromStation, toStation]);

  // Generate consistent scenery based on journey and biome
  const scenery = useMemo(() => {
    const seed = timer.journey?.id.charCodeAt(8) || 42;
    return generateScenery(seed, biome);
  }, [timer.journey?.id, biome]);

  // Timer tick
  useEffect(() => {
    if (timer.status !== 'running' && timer.status !== 'break') return;
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [timer.status, tick]);

  // Train sound effect (periodic)
  useEffect(() => {
    if (timer.status !== 'running' || !soundEnabled) return;
    const interval = setInterval(() => playTrainChug(), 4000);
    return () => clearInterval(interval);
  }, [timer.status, soundEnabled, playTrainChug]);

  if (timer.status !== 'running' && timer.status !== 'paused' && timer.status !== 'break') {
    return null;
  }

  const remaining = timer.totalSeconds - timer.elapsedSeconds;
  const progress = timer.elapsedSeconds / timer.totalSeconds;
  const isPaused = timer.status === 'paused';
  const isBreak = timer.status === 'break';

  // Calculate sky color based on progress and biome
  const getSkyStyle = () => {
    if (isBreak) {
      return `linear-gradient(to bottom, ${biome.sunsetGradient.top} 0%, ${biome.sunsetGradient.middle} 50%, ${biome.sunsetGradient.bottom} 100%)`;
    }
    // Interpolate between sky colors based on progress
    return `linear-gradient(to bottom, ${biome.skyGradient.top} 0%, ${biome.skyGradient.middle} 50%, ${biome.skyGradient.bottom} 100%)`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] bg-gray-900"
      >
        {/* Train cabin interior with subtle sway */}
        <div className={`relative w-full h-full overflow-hidden ${!isPaused ? 'train-sway' : ''}`}>
          {/* Cabin walls and ambient */}
          <div className="absolute inset-0 bg-gradient-to-b from-gray-800 via-gray-850 to-gray-900" />

          {/* Window frame */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85vw] max-w-[900px] h-[60vh] max-h-[500px]"
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
          >
            {/* Window outer frame - more realistic wood grain */}
            <div className="absolute -inset-5 rounded-lg shadow-2xl overflow-hidden">
              <div className="w-full h-full bg-gradient-to-b from-amber-900 via-amber-800 to-amber-900" />
              <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,rgba(0,0,0,0.1)_2px,rgba(0,0,0,0.1)_4px)]" />
            </div>
            <div className="absolute -inset-2 bg-gradient-to-b from-amber-800 to-amber-700 rounded-md shadow-inner" />

            {/* Window glass with scenery */}
            <div className="relative w-full h-full rounded overflow-hidden">
              {/* Sky gradient based on biome and progress */}
              <div
                className="absolute inset-0 transition-colors duration-[30000ms]"
                style={{ background: getSkyStyle() }}
              />

              {/* Sun/Moon */}
              <motion.div
                className="absolute w-16 h-16 rounded-full"
                style={{
                  background: isBreak
                    ? 'radial-gradient(circle, #ffcc80 0%, #ff9800 100%)'
                    : 'radial-gradient(circle, #fff9c4 0%, #ffeb3b 100%)',
                  boxShadow: isBreak
                    ? '0 0 60px #ff9800'
                    : '0 0 40px rgba(255,235,59,0.5)',
                  top: `${10 + Math.sin(progress * Math.PI) * 15}%`,
                  right: `${10 + progress * 50}%`,
                }}
              />

              {/* Clouds */}
              <SceneryLayer speed={isPaused ? 999999 : 80} className="opacity-70">
                <div className="relative w-full h-full">
                  {scenery.clouds.map((cloud) => (
                    <div
                      key={cloud.id}
                      className="absolute"
                      style={{
                        left: `${cloud.x}%`,
                        top: `${cloud.y}%`,
                        transform: `scale(${cloud.scale})`,
                      }}
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

              {/* Mountains (if biome has them) */}
              {scenery.mountains.length > 0 && (
                <SceneryLayer speed={isPaused ? 999999 : 50} className="bottom-0">
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

              {/* Hills - midground */}
              <SceneryLayer speed={isPaused ? 999999 : 30}>
                <div className="absolute bottom-[15%] w-full h-[35%]">
                  <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 200 100">
                    {scenery.hills.map((hill) => (
                      <ellipse
                        key={hill.id}
                        cx={`${hill.x}%`}
                        cy="100%"
                        rx={`${hill.width}%`}
                        ry={`${hill.height}%`}
                        fill={hill.color}
                      />
                    ))}
                  </svg>
                </div>
              </SceneryLayer>

              {/* Special elements layer */}
              {scenery.specialElements.length > 0 && (
                <SceneryLayer speed={isPaused ? 999999 : 20}>
                  <div className="absolute bottom-[12%] w-full h-[30%]">
                    {scenery.specialElements.map((el) => (
                      <div
                        key={el.id}
                        className="absolute bottom-0"
                        style={{ left: `${el.x}%` }}
                      >
                        <SpecialElement type={el.type} />
                      </div>
                    ))}
                  </div>
                </SceneryLayer>
              )}

              {/* Trees - foreground */}
              <SceneryLayer speed={isPaused ? 999999 : 12}>
                <div className="absolute bottom-[8%] w-full h-[40%]">
                  {scenery.trees.map((tree) => (
                    <div
                      key={tree.id}
                      className="absolute bottom-0"
                      style={{ left: `${tree.x}%` }}
                    >
                      <TreeElement tree={tree} />
                    </div>
                  ))}
                </div>
              </SceneryLayer>

              {/* Water layer (if biome has water) */}
              {biome.hasWater && (
                <SceneryLayer speed={isPaused ? 999999 : 15}>
                  <div className="absolute bottom-[5%] w-full h-[8%]">
                    <div className="w-full h-full bg-gradient-to-b from-blue-400/40 to-blue-600/60" />
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    />
                  </div>
                </SceneryLayer>
              )}

              {/* Ground - closest */}
              <SceneryLayer speed={isPaused ? 999999 : 6}>
                <div
                  className="absolute bottom-0 w-full h-[12%]"
                  style={{
                    background: `linear-gradient(to top, ${biome.groundColors[0]}, ${biome.groundColors[1]}, ${biome.groundColors[2] || biome.groundColors[1]})`,
                  }}
                />
              </SceneryLayer>

              {/* Railway tracks */}
              <div className="absolute bottom-0 w-full h-[6%] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-gray-600 to-gray-500" />
                <SceneryLayer speed={isPaused ? 999999 : 2}>
                  <div className="absolute inset-0 flex items-center">
                    {Array.from({ length: 40 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-4 h-full bg-amber-900/60 mr-8"
                        style={{ transform: 'skewX(-10deg)' }}
                      />
                    ))}
                  </div>
                </SceneryLayer>
              </div>

              {/* Window reflections */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
              <div className="absolute top-0 left-0 w-1/3 h-1/4 bg-gradient-to-br from-white/8 to-transparent pointer-events-none" />

              {/* Subtle dirt/water drops on window */}
              <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="absolute top-[20%] left-[30%] w-2 h-3 bg-gray-400/30 rounded-full blur-[1px]" />
                <div className="absolute top-[40%] right-[20%] w-1 h-2 bg-gray-400/20 rounded-full blur-[1px]" />
              </div>
            </div>

            {/* Window divider (cross) - wooden */}
            <div className="absolute top-0 left-1/2 w-4 h-full -translate-x-1/2 bg-gradient-to-r from-amber-800 via-amber-700 to-amber-800 shadow-lg" />
            <div className="absolute top-1/2 left-0 w-full h-4 -translate-y-1/2 bg-gradient-to-b from-amber-800 via-amber-700 to-amber-800 shadow-lg" />

            {/* Controls overlay */}
            <AnimatePresence>
              {showControls && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center rounded"
                >
                  <div className="flex items-center gap-4">
                    {!isBreak && (
                      <>
                        <button
                          onClick={isPaused ? resumeTimer : pauseTimer}
                          className="p-4 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all hover:scale-110"
                        >
                          {isPaused ? <Play className="w-8 h-8" /> : <Pause className="w-8 h-8" />}
                        </button>
                        <button
                          onClick={stopTimer}
                          className="p-4 rounded-full bg-red-500/30 hover:bg-red-500/50 text-white transition-all hover:scale-110"
                        >
                          <Square className="w-8 h-8" />
                        </button>
                      </>
                    )}
                    {isBreak && (
                      <button
                        onClick={endBreak}
                        className="p-4 rounded-full bg-green-500/30 hover:bg-green-500/50 text-white transition-all hover:scale-110"
                      >
                        <Coffee className="w-8 h-8" />
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Cabin interior details */}
          {/* Overhead luggage rack */}
          <div className="absolute top-[8%] left-[10%] right-[10%] h-10">
            <div className="w-full h-full bg-gradient-to-b from-amber-900 to-amber-800 rounded-b-lg shadow-lg" />
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-700" />
            {/* Luggage items */}
            <div className="absolute bottom-2 left-[20%] w-16 h-6 bg-gradient-to-b from-blue-800 to-blue-900 rounded" />
            <div className="absolute bottom-2 right-[25%] w-12 h-5 bg-gradient-to-b from-amber-700 to-amber-800 rounded" />
          </div>

          {/* Wall lamp (left) */}
          <div className="absolute top-[18%] left-[7%]">
            <div className="w-8 h-12 bg-gradient-to-b from-amber-200 to-amber-300 rounded-b-full opacity-70 blur-sm" />
            <div className="absolute top-0 left-1 w-6 h-4 bg-gradient-to-b from-amber-900 to-amber-800 rounded-t" />
          </div>

          {/* Wall lamp (right) */}
          <div className="absolute top-[18%] right-[7%]">
            <div className="w-8 h-12 bg-gradient-to-b from-amber-200 to-amber-300 rounded-b-full opacity-70 blur-sm" />
            <div className="absolute top-0 left-1 w-6 h-4 bg-gradient-to-b from-amber-900 to-amber-800 rounded-t" />
          </div>

          {/* Curtains (sides of window) */}
          <div className="absolute top-[15%] left-[6%] w-[4%] h-[50%] bg-gradient-to-b from-red-900 via-red-800 to-red-900 opacity-80 rounded-b" />
          <div className="absolute top-[15%] right-[6%] w-[4%] h-[50%] bg-gradient-to-b from-red-900 via-red-800 to-red-900 opacity-80 rounded-b" />

          {/* Seat back texture (bottom of screen) */}
          <div className="absolute bottom-0 left-0 right-0 h-36 bg-gradient-to-t from-gray-800 to-transparent">
            {/* Seat upholstery */}
            <div className="absolute bottom-4 left-[12%] right-[12%] h-24 bg-gradient-to-t from-red-900 via-red-800 to-red-900/50 rounded-t-xl">
              {/* Seat pattern/texture */}
              <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(0,0,0,0.1)_5px,rgba(0,0,0,0.1)_10px)]" />
            </div>
          </div>

          {/* Subtle cabin ambient lighting */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-1/2 h-1/3 bg-gradient-to-b from-amber-500/8 to-transparent" />
          </div>

          {/* Small tray table with items */}
          <div className="absolute bottom-28 right-[10%] hidden md:block">
            <div className="relative">
              {/* Tray table */}
              <div className="w-24 h-2 bg-gradient-to-r from-amber-800 to-amber-700 rounded shadow-lg" />
              {/* Coffee cup */}
              <div className="absolute -top-8 left-2">
                <div className="w-6 h-7 bg-gradient-to-b from-white to-gray-100 rounded-b-lg rounded-t-sm shadow" />
                <div className="absolute top-1 -right-2 w-3 h-4 border-2 border-gray-200 rounded-r-full" />
                <motion.div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 opacity-40"
                  animate={{ y: [-2, -8], opacity: [0.4, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="w-1 h-4 bg-gradient-to-t from-gray-400 to-transparent rounded-full" />
                </motion.div>
              </div>
              {/* Book */}
              <div className="absolute -top-4 right-2 w-10 h-6 bg-gradient-to-r from-blue-900 to-blue-800 rounded-sm shadow transform rotate-3" />
            </div>
          </div>

          {/* Timer display - top */}
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute top-6 left-1/2 -translate-x-1/2"
          >
            <div className="bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-gray-700/50 px-8 py-4 shadow-2xl">
              <div className="flex items-center gap-4">
                {isBreak ? (
                  <Coffee className="w-6 h-6 text-amber-400" />
                ) : (
                  <Train className="w-6 h-6 text-blue-400" />
                )}
                <div className="text-4xl font-mono font-bold text-white tabular-nums">
                  {formatTime(remaining)}
                </div>
              </div>
              {/* Biome indicator */}
              <p className="text-center text-gray-500 text-xs mt-1">{biome.name}</p>
            </div>
          </motion.div>

          {/* Route info - bottom */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2"
          >
            <div className="bg-gray-900/90 backdrop-blur-xl rounded-xl border border-gray-700/50 px-6 py-3 shadow-xl">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-gray-300">{fromStation?.city}</span>
                </div>

                {/* Progress bar */}
                <div className="w-32 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full ${isBreak ? 'bg-amber-500' : 'bg-gradient-to-r from-green-500 to-blue-500'}`}
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-gray-300">{toStation?.city}</span>
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                </div>
              </div>

              {/* Train type */}
              <p className="text-center text-gray-500 text-xs mt-1">
                {timer.currentRoute?.trainType}
              </p>

              {isBreak && (
                <p className="text-center text-amber-400 text-xs mt-1">
                  Station break - relax and recharge
                </p>
              )}
            </div>
          </motion.div>

          {/* Sound toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="absolute top-6 right-6 p-3 rounded-full bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {/* Paused indicator */}
          {isPaused && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            >
              <div className="bg-black/60 backdrop-blur-sm rounded-2xl px-8 py-4">
                <p className="text-white text-2xl font-bold">PAUSED</p>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
