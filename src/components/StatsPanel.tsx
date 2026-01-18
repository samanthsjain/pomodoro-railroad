import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, X, MapPin, Globe, Clock, Route, Flag } from 'lucide-react';
import { useStore } from '../store/useStore';
import { stations } from '../data/stations';

export function StatsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { progress } = useStore();

  const visitedStationsList = progress.visitedStations
    .map((id) => stations[id])
    .filter(Boolean);

  const countriesMap = new Map<string, number>();
  visitedStationsList.forEach((station) => {
    const count = countriesMap.get(station.country) || 0;
    countriesMap.set(station.country, count + 1);
  });

  return (
    <>
      {/* Stats button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 bg-gray-900/90 backdrop-blur-xl rounded-xl border border-gray-700/50 text-gray-300 hover:text-white hover:bg-gray-800/90 transition-colors"
      >
        <BarChart3 className="w-5 h-5" />
        <span>Stats</span>
      </motion.button>

      {/* Stats modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed bottom-[5%] right-6 z-50 w-full max-w-md"
            >
              <div className="bg-gray-900 rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
                  <h2 className="text-xl font-semibold text-white">Your Journey Stats</h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Stats grid */}
                <div className="p-4 grid grid-cols-2 gap-4">
                  <div className="bg-gray-800/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-blue-400 mb-2">
                      <Route className="w-5 h-5" />
                      <span className="text-sm font-medium">Distance</span>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {progress.totalDistanceKm.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-400">kilometers</p>
                  </div>

                  <div className="bg-gray-800/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-green-400 mb-2">
                      <Clock className="w-5 h-5" />
                      <span className="text-sm font-medium">Time</span>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {Math.floor(progress.totalTimeMinutes / 60)}h {progress.totalTimeMinutes % 60}m
                    </p>
                    <p className="text-sm text-gray-400">focused</p>
                  </div>

                  <div className="bg-gray-800/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-purple-400 mb-2">
                      <MapPin className="w-5 h-5" />
                      <span className="text-sm font-medium">Stations</span>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {progress.visitedStations.length}
                    </p>
                    <p className="text-sm text-gray-400">visited</p>
                  </div>

                  <div className="bg-gray-800/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-orange-400 mb-2">
                      <Flag className="w-5 h-5" />
                      <span className="text-sm font-medium">Countries</span>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {progress.countriesVisited.length}
                    </p>
                    <p className="text-sm text-gray-400">explored</p>
                  </div>
                </div>

                {/* Sessions */}
                <div className="px-4 pb-4">
                  <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-xl p-4 border border-green-600/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-400 mb-1">Sessions Completed</p>
                        <p className="text-3xl font-bold text-white">{progress.sessionsCompleted}</p>
                      </div>
                      <Globe className="w-12 h-12 text-green-500/30" />
                    </div>
                  </div>
                </div>

                {/* Countries visited */}
                {countriesMap.size > 0 && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-gray-400 mb-2">Countries Visited</p>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(countriesMap.entries()).map(([country, count]) => (
                        <span
                          key={country}
                          className="px-3 py-1 bg-gray-800 rounded-full text-sm text-white"
                        >
                          {country} ({count})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {progress.sessionsCompleted === 0 && (
                  <div className="px-4 pb-6 text-center">
                    <p className="text-gray-400">
                      Complete your first journey to start tracking your progress!
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
