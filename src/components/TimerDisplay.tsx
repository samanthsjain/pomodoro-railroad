import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, Coffee, SkipForward, Train } from 'lucide-react';
import toast from 'react-hot-toast';
import { useStore } from '../store/useStore';
import { stations } from '../data/stations';
import { useSound } from '../hooks/useSound';

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function TimerDisplay() {
  const { timer, pauseTimer, resumeTimer, stopTimer, tick, endBreak } = useStore();
  const { playArrival, playDeparture } = useSound();
  const prevStatusRef = useRef(timer.status);

  // Sound and notification effects
  useEffect(() => {
    const prevStatus = prevStatusRef.current;
    prevStatusRef.current = timer.status;

    if (prevStatus === 'idle' && timer.status === 'running') {
      // Journey started
      playDeparture();
      const toStation = timer.currentRoute ? stations[timer.currentRoute.to] : null;
      if (toStation) {
        toast(`Departing for ${toStation.city}!`, { icon: '🚂' });
      }
    }

    if (prevStatus === 'running' && timer.status === 'break') {
      // Arrived at station
      playArrival();
      const toStation = timer.currentRoute ? stations[timer.currentRoute.to] : null;
      if (toStation) {
        toast.success(`Arrived at ${toStation.city}! Take a break.`);
      }
    }
  }, [timer.status, timer.currentRoute, playArrival, playDeparture]);

  // Timer tick effect
  useEffect(() => {
    if (timer.status !== 'running' && timer.status !== 'break') return;

    const interval = setInterval(() => {
      tick();
    }, 1000);

    return () => clearInterval(interval);
  }, [timer.status, tick]);

  if (timer.status === 'idle') return null;

  const remaining = timer.totalSeconds - timer.elapsedSeconds;
  const progress = timer.elapsedSeconds / timer.totalSeconds;

  const fromStation = timer.currentRoute ? stations[timer.currentRoute.from] : null;
  const toStation = timer.currentRoute ? stations[timer.currentRoute.to] : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
      >
        <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl p-6 min-w-[400px]">
          {/* Route info */}
          {fromStation && toStation && (
            <div className="flex items-center justify-between mb-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-white font-medium">{fromStation.city}</span>
              </div>
              <div className="flex-1 mx-4 h-px bg-gradient-to-r from-green-500 via-yellow-500 to-red-500" />
              <div className="flex items-center gap-2">
                <span className="text-white font-medium">{toStation.city}</span>
                <div className="w-3 h-3 rounded-full bg-red-500" />
              </div>
            </div>
          )}

          {/* Timer display */}
          <div className="text-center mb-4">
            {timer.status === 'break' ? (
              <div className="flex items-center justify-center gap-2 text-amber-400 mb-2">
                <Coffee className="w-5 h-5" />
                <span className="text-lg font-medium">Station Break</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-blue-400 mb-2">
                <Train className="w-5 h-5" />
                <span className="text-lg font-medium">
                  {timer.currentRoute?.trainType || 'Express'}
                </span>
              </div>
            )}
            <div className="text-5xl font-mono font-bold text-white tabular-nums">
              {formatTime(remaining)}
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden mb-4">
            <motion.div
              className={`h-full ${timer.status === 'break' ? 'bg-amber-500' : 'bg-gradient-to-r from-green-500 via-blue-500 to-red-500'}`}
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.5, ease: 'linear' }}
            />
          </div>

          {/* Distance and time info */}
          {timer.currentRoute && timer.status !== 'break' && (
            <div className="flex justify-center gap-6 mb-4 text-sm text-gray-400">
              <span>{timer.currentRoute.distanceKm} km</span>
              <span>{timer.currentRoute.travelTimeMinutes} min total</span>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            {timer.status === 'running' && (
              <button
                onClick={pauseTimer}
                className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors"
              >
                <Pause className="w-6 h-6" />
              </button>
            )}

            {timer.status === 'paused' && (
              <button
                onClick={resumeTimer}
                className="p-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white transition-colors"
              >
                <Play className="w-6 h-6" />
              </button>
            )}

            {timer.status === 'break' && (
              <>
                <button
                  onClick={endBreak}
                  className="p-3 rounded-full bg-green-600 hover:bg-green-500 text-white transition-colors"
                >
                  <SkipForward className="w-6 h-6" />
                </button>
                <span className="text-gray-400 text-sm">End Break</span>
              </>
            )}

            {(timer.status === 'running' || timer.status === 'paused') && (
              <button
                onClick={stopTimer}
                className="p-3 rounded-full bg-red-600/20 hover:bg-red-600/40 text-red-400 transition-colors"
              >
                <Square className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
