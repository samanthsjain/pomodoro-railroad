import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, Info } from 'lucide-react';
import { useStore } from '../store/useStore';
import { stations, getConnectedStations } from '../data/stations';

export function StationTooltip() {
  const { hoveredStation, selectedDeparture, selectedDestination, timer } = useStore();

  // Don't show during journey
  if (timer.status !== 'idle') return null;

  // Don't show if station is already selected (it shows in RoutePanel)
  if (hoveredStation === selectedDeparture || hoveredStation === selectedDestination) {
    return null;
  }

  const station = hoveredStation ? stations[hoveredStation] : null;
  if (!station) return null;

  const connectedIds = getConnectedStations(hoveredStation!);
  const connectedStations = connectedIds.map((id) => stations[id]).filter(Boolean);

  return (
    <AnimatePresence>
      <motion.div
        key={hoveredStation}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="fixed top-6 right-6 z-30 w-72"
      >
        <div className="bg-gray-900/95 backdrop-blur-xl rounded-xl border border-gray-700/50 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-700/30">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">{station.city}</h3>
            </div>
            <p className="text-sm text-gray-400">{station.name}</p>
            <p className="text-xs text-gray-500">{station.country}</p>
          </div>

          {/* Fun facts */}
          {station.funFacts.length > 0 && (
            <div className="p-4 border-b border-gray-700/30">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-gray-300">Did you know?</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                {station.funFacts[Math.floor(Math.random() * station.funFacts.length)]}
              </p>
            </div>
          )}

          {/* Connected stations */}
          {connectedStations.length > 0 && (
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium text-gray-300">Direct connections</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {connectedStations.slice(0, 5).map((s) => (
                  <span
                    key={s.id}
                    className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-300"
                  >
                    {s.city}
                  </span>
                ))}
                {connectedStations.length > 5 && (
                  <span className="px-2 py-1 text-xs text-gray-500">
                    +{connectedStations.length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
