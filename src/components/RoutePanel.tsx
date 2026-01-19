import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Ruler, Train, X, Play, Armchair } from 'lucide-react';
import { useStore } from '../store/useStore';
import { stations, findRoute } from '../data/stations';
import { trainClasses } from '../types';

export function RoutePanel() {
  const {
    selectedDeparture,
    selectedDestination,
    clearSelection,
    startJourney,
    setTrainClass,
    timer,
  } = useStore();

  const fromStation = selectedDeparture ? stations[selectedDeparture] : null;
  const toStation = selectedDestination ? stations[selectedDestination] : null;
  const route = selectedDeparture && selectedDestination
    ? findRoute(selectedDeparture, selectedDestination)
    : null;

  // Don't show when timer is active (confirming, running, paused, break)
  if (timer.status !== 'idle') return null;

  // Show prompt when nothing is selected
  if (!selectedDeparture && !selectedDestination) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-6 left-1/2 -translate-x-1/2 z-40"
      >
        <div className="bg-gray-900/90 backdrop-blur-xl rounded-xl border border-gray-700/50 px-6 py-3 text-center">
          <p className="text-gray-300">
            Click a station on the globe to select your departure point
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        className="fixed top-6 left-6 z-40 w-80"
      >
        <div className="bg-gray-900/95 backdrop-blur-xl rounded-xl border border-gray-700/50 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
            <h2 className="text-lg font-semibold text-white">Plan Your Journey</h2>
            <button
              onClick={clearSelection}
              className="p-1 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Departure station */}
          <div className="p-4 border-b border-gray-700/30">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-green-500 ring-4 ring-green-500/20" />
              <div className="flex-1">
                <p className="text-xs text-gray-400 uppercase tracking-wider">Departure</p>
                {fromStation ? (
                  <>
                    <p className="text-white font-medium">{fromStation.name}</p>
                    <p className="text-sm text-gray-400">{fromStation.city}, {fromStation.country}</p>
                  </>
                ) : (
                  <p className="text-gray-500 italic">Select a station...</p>
                )}
              </div>
            </div>
          </div>

          {/* Connection line */}
          {fromStation && (
            <div className="flex items-stretch">
              <div className="w-4 ml-[22px] border-l-2 border-dashed border-gray-600" />
              <div className="flex-1 py-2 px-4">
                {route ? (
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{route.travelTimeMinutes} min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Ruler className="w-4 h-4" />
                      <span>{route.distanceKm} km</span>
                    </div>
                  </div>
                ) : toStation ? (
                  <p className="text-sm text-amber-400">No direct route available</p>
                ) : (
                  <p className="text-sm text-gray-500">Select destination...</p>
                )}
              </div>
            </div>
          )}

          {/* Destination station */}
          <div className="p-4 border-b border-gray-700/30">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-red-500 ring-4 ring-red-500/20" />
              <div className="flex-1">
                <p className="text-xs text-gray-400 uppercase tracking-wider">Arrival</p>
                {toStation ? (
                  <>
                    <p className="text-white font-medium">{toStation.name}</p>
                    <p className="text-sm text-gray-400">{toStation.city}, {toStation.country}</p>
                  </>
                ) : (
                  <p className="text-gray-500 italic">Select a station...</p>
                )}
              </div>
            </div>
          </div>

          {/* Route details */}
          {route && (
            <div className="p-4 bg-gray-800/50 border-b border-gray-700/30">
              <div className="flex items-center gap-2 mb-2">
                <Train className="w-4 h-4 text-blue-400" />
                <span className="text-white font-medium">{route.trainType}</span>
              </div>
              {route.routeName && (
                <p className="text-sm text-gray-400">{route.routeName}</p>
              )}
            </div>
          )}

          {/* Train class selector */}
          {route && (
            <div className="p-4 border-b border-gray-700/30">
              <div className="flex items-center gap-2 mb-3">
                <Armchair className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-gray-300">Select Class</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {trainClasses.map((cls) => {
                  const isSelected = timer.selectedClass === cls.id;
                  const adjustedTime = Math.round(route.travelTimeMinutes * cls.timeMultiplier);
                  return (
                    <button
                      key={cls.id}
                      onClick={() => setTrainClass(cls.id)}
                      className={`p-2 rounded-lg border transition-all text-center ${
                        isSelected
                          ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                          : 'border-gray-600 bg-gray-800/50 text-gray-400 hover:border-gray-500 hover:text-gray-300'
                      }`}
                    >
                      <p className="text-xs font-medium">{cls.name}</p>
                      <p className="text-[10px] opacity-70">{adjustedTime} min</p>
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-gray-500 mt-2 text-center">
                {trainClasses.find(c => c.id === timer.selectedClass)?.description}
              </p>
            </div>
          )}

          {/* Start button */}
          {route && (
            <div className="p-4">
              {(() => {
                const classConfig = trainClasses.find(c => c.id === timer.selectedClass);
                const adjustedTime = Math.round(route.travelTimeMinutes * (classConfig?.timeMultiplier || 1));
                return (
                  <button
                    onClick={startJourney}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Play className="w-5 h-5" />
                    Start Journey ({adjustedTime} min)
                  </button>
                );
              })()}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
