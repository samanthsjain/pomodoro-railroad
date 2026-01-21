import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, MapPin, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { fetchCountryStations, supportedCountries, type Country } from '../services/railwayApi';
import type { Station } from '../types';

export function StationSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searchCountry, setSearchCountry] = useState<Country | null>(null);
  const [searchResults, setSearchResults] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadedCountries, setLoadedCountries] = useState<Record<string, Station[]>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<number | null>(null);

  const timer = useStore((state) => state.timer);
  const selectedCountry = useStore((state) => state.selectedCountry);
  const apiStations = useStore((state) => state.apiStations);
  const setCurrentStation = useStore((state) => state.setCurrentStation);
  const selectCountry = useStore((state) => state.selectCountry);

  // Initialize search country to selected country
  useEffect(() => {
    if (selectedCountry && !searchCountry) {
      const country = supportedCountries.find(c => c.code === selectedCountry);
      if (country) setSearchCountry(country);
    }
  }, [selectedCountry, searchCountry]);

  // Group countries by region
  const countryGroups = useMemo(() => {
    const groups: Record<string, Country[]> = {
      europe: [],
      asia: [],
      americas: [],
      oceania: [],
    };
    supportedCountries.forEach(country => {
      groups[country.region].push(country);
    });
    return groups;
  }, []);

  // Load stations for a country if not already loaded
  const loadCountryStations = useCallback(async (countryCode: string) => {
    // Check if we already have this country's stations in the store
    if (selectedCountry === countryCode && Object.keys(apiStations).length > 0) {
      const stationsList = Object.values(apiStations);
      setLoadedCountries(prev => ({ ...prev, [countryCode]: stationsList }));
      return stationsList;
    }

    // Check local cache
    if (loadedCountries[countryCode]) {
      return loadedCountries[countryCode];
    }

    // Fetch from API
    setIsLoading(true);
    try {
      const stations = await fetchCountryStations(countryCode);
      setLoadedCountries(prev => ({ ...prev, [countryCode]: stations }));
      return stations;
    } catch (error) {
      console.error('Failed to load stations:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [selectedCountry, apiStations, loadedCountries]);

  // Search stations with debounce
  useEffect(() => {
    if (!searchCountry || !query.trim()) {
      setSearchResults([]);
      return;
    }

    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce the search
    debounceRef.current = window.setTimeout(async () => {
      const stations = await loadCountryStations(searchCountry.code);
      const lowerQuery = query.toLowerCase();

      const results = stations
        .filter(s =>
          s.name.toLowerCase().includes(lowerQuery) ||
          s.city.toLowerCase().includes(lowerQuery)
        )
        .sort((a, b) => {
          // Prioritize exact matches
          const aExact = a.name.toLowerCase().startsWith(lowerQuery) || a.city.toLowerCase().startsWith(lowerQuery);
          const bExact = b.name.toLowerCase().startsWith(lowerQuery) || b.city.toLowerCase().startsWith(lowerQuery);
          if (aExact && !bExact) return -1;
          if (!aExact && bExact) return 1;
          return a.name.localeCompare(b.name);
        })
        .slice(0, 15);

      setSearchResults(results);
    }, 200);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, searchCountry, loadCountryStations]);

  // Handle station selection
  const handleStationSelect = useCallback(async (station: Station) => {
    const countryCode = station.countryCode.toLowerCase();

    // If selecting a station from a different country, switch countries first
    if (countryCode !== selectedCountry) {
      // Select the new country (this will load its stations)
      await selectCountry(countryCode);
    }

    // Set this station as the current station
    // This will also trigger loadConnectedStations
    setCurrentStation(station.id);

    // Close modal
    setIsOpen(false);
    setQuery('');
    setSearchResults([]);
  }, [setCurrentStation, selectCountry, selectedCountry]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Don't show during journey
  if (timer.status !== 'idle') return null;

  return (
    <>
      {/* Search button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => setIsOpen(true)}
        className="fixed top-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors"
        style={{
          background: 'var(--color-bg-glass)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid var(--color-separator)',
        }}
      >
        <Search className="w-5 h-5 text-[var(--color-text-secondary)]" />
        <span className="text-[var(--color-text-secondary)]">Find Station</span>
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
              className="fixed inset-0 z-50"
              style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="fixed top-[10%] left-1/2 -translate-x-1/2 z-50 w-full max-w-xl"
            >
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-separator)',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                }}
              >
                {/* Header with country selector */}
                <div className="p-4 border-b" style={{ borderColor: 'var(--color-separator)' }}>
                  <div className="flex items-center gap-3 mb-3">
                    <Search className="w-5 h-5 text-[var(--color-text-tertiary)]" />
                    <input
                      ref={inputRef}
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search stations..."
                      className="flex-1 bg-transparent outline-none text-lg"
                      style={{ color: 'var(--color-text-primary)' }}
                    />
                    {isLoading && (
                      <Loader2 className="w-5 h-5 text-[var(--color-text-tertiary)] animate-spin" />
                    )}
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <X className="w-5 h-5 text-[var(--color-text-tertiary)]" />
                    </button>
                  </div>

                  {/* Country tabs */}
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {Object.entries(countryGroups).map(([region, countries]) => (
                      countries.length > 0 && (
                        <div key={region} className="flex gap-1">
                          {countries.slice(0, region === 'europe' ? 10 : 4).map(country => (
                            <button
                              key={country.code}
                              onClick={() => setSearchCountry(country)}
                              className={`px-2 py-1 rounded-lg text-sm whitespace-nowrap transition-all ${
                                searchCountry?.code === country.code
                                  ? 'bg-[var(--color-accent-blue)] text-white'
                                  : 'bg-white/5 text-[var(--color-text-secondary)] hover:bg-white/10'
                              }`}
                            >
                              {country.flag}
                            </button>
                          ))}
                        </div>
                      )
                    ))}
                  </div>

                  {/* Selected country name */}
                  {searchCountry && (
                    <p className="text-xs text-[var(--color-text-tertiary)] mt-2">
                      Searching in {searchCountry.name}
                    </p>
                  )}
                </div>

                {/* Results */}
                <div className="max-h-[50vh] overflow-y-auto">
                  {!query.trim() && !searchResults.length && (
                    <div className="p-6 text-center">
                      <p className="text-[var(--color-text-secondary)]">
                        Type to search for a station
                      </p>
                      <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
                        Select a country flag above to search different regions
                      </p>
                    </div>
                  )}

                  {query.trim() && searchResults.length === 0 && !isLoading && (
                    <div className="p-6 text-center">
                      <p className="text-[var(--color-text-secondary)]">
                        No stations found for "{query}"
                      </p>
                    </div>
                  )}

                  {searchResults.length > 0 && (
                    <div className="p-2">
                      {searchResults.map((station) => (
                        <button
                          key={station.id}
                          onClick={() => handleStationSelect(station)}
                          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-colors text-left"
                        >
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{ background: 'var(--color-accent-blue)/20' }}
                          >
                            <MapPin className="w-5 h-5 text-[var(--color-accent-blue)]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                              {station.name}
                            </p>
                            <p className="text-sm truncate" style={{ color: 'var(--color-text-tertiary)' }}>
                              {station.city}, {station.country}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer hint */}
                <div
                  className="px-4 py-3 text-xs text-center"
                  style={{
                    borderTop: '1px solid var(--color-separator)',
                    color: 'var(--color-text-tertiary)',
                  }}
                >
                  Start your journey from any station in 35+ countries
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
