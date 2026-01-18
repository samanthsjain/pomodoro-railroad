import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, MapPin, Train } from 'lucide-react';
import { useStore } from '../store/useStore';
import { stations, routes } from '../data/stations';

export function SearchPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { setSelectedDeparture, setSelectedDestination, timer } = useStore();

  const filteredStations = useMemo(() => {
    if (!query.trim()) return Object.values(stations).slice(0, 10);

    const lowerQuery = query.toLowerCase();
    return Object.values(stations)
      .filter(
        (s) =>
          s.name.toLowerCase().includes(lowerQuery) ||
          s.city.toLowerCase().includes(lowerQuery) ||
          s.country.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 10);
  }, [query]);

  const filteredRoutes = useMemo(() => {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase();
    return routes
      .filter((r) => {
        const from = stations[r.from];
        const to = stations[r.to];
        const routeText = `${from.city} to ${to.city} ${r.trainType} ${r.routeName || ''}`.toLowerCase();
        return routeText.includes(lowerQuery);
      })
      .slice(0, 5);
  }, [query]);

  const handleStationClick = (stationId: string) => {
    setSelectedDeparture(stationId);
    setIsOpen(false);
    setQuery('');
  };

  const handleRouteClick = (fromId: string, toId: string) => {
    setSelectedDeparture(fromId);
    setSelectedDestination(toId);
    setIsOpen(false);
    setQuery('');
  };

  if (timer.status !== 'idle') return null;

  return (
    <>
      {/* Search button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => setIsOpen(true)}
        className="fixed top-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 bg-gray-900/90 backdrop-blur-xl rounded-xl border border-gray-700/50 text-gray-300 hover:text-white hover:bg-gray-800/90 transition-colors"
      >
        <Search className="w-5 h-5" />
        <span>Search</span>
      </motion.button>

      {/* Search modal */}
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
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="fixed top-[10%] left-1/2 -translate-x-1/2 z-50 w-full max-w-xl"
            >
              <div className="bg-gray-900 rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden">
                {/* Search input */}
                <div className="flex items-center gap-3 p-4 border-b border-gray-700/50">
                  <Search className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search stations or routes..."
                    className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-lg"
                    autoFocus
                  />
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Results */}
                <div className="max-h-[60vh] overflow-y-auto">
                  {/* Routes */}
                  {filteredRoutes.length > 0 && (
                    <div className="p-2">
                      <p className="px-3 py-2 text-xs text-gray-500 uppercase tracking-wider">Routes</p>
                      {filteredRoutes.map((route) => {
                        const from = stations[route.from];
                        const to = stations[route.to];
                        return (
                          <button
                            key={route.id}
                            onClick={() => handleRouteClick(route.from, route.to)}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-800/50 transition-colors text-left"
                          >
                            <Train className="w-5 h-5 text-blue-400" />
                            <div className="flex-1">
                              <p className="text-white font-medium">
                                {from.city} → {to.city}
                              </p>
                              <p className="text-sm text-gray-400">
                                {route.trainType} • {route.travelTimeMinutes} min • {route.distanceKm} km
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Stations */}
                  <div className="p-2">
                    <p className="px-3 py-2 text-xs text-gray-500 uppercase tracking-wider">Stations</p>
                    {filteredStations.map((station) => (
                      <button
                        key={station.id}
                        onClick={() => handleStationClick(station.id)}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-800/50 transition-colors text-left"
                      >
                        <MapPin className="w-5 h-5 text-green-400" />
                        <div className="flex-1">
                          <p className="text-white font-medium">{station.name}</p>
                          <p className="text-sm text-gray-400">
                            {station.city}, {station.country}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {filteredStations.length === 0 && filteredRoutes.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                      No stations or routes found for "{query}"
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
