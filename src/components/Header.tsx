import { motion } from 'framer-motion';
import { Train } from 'lucide-react';
import { useStore } from '../store/useStore';
import { supportedCountries } from '../services/railwayApi';

export function Header() {
  const { timer, setShowCountrySelector, selectedCountry } = useStore();

  // Hide during active journey
  if (timer.status !== 'idle') return null;

  const countryName = selectedCountry
    ? supportedCountries.find(c => c.code === selectedCountry)?.name
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className="fixed top-4 left-4 z-30"
    >
      <div className="flex items-center gap-3">
        {/* Minimal logo */}
        <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-blue)] flex items-center justify-center">
          <Train className="w-5 h-5 text-white" />
        </div>

        {/* Country name or app name */}
        <div className="flex items-center gap-3">
          {selectedCountry ? (
            <>
              <span className="text-[var(--color-text-primary)] font-semibold">
                {countryName}
              </span>
              <button
                onClick={() => setShowCountrySelector(true)}
                className="text-[var(--color-accent-blue)] text-sm font-medium hover:opacity-80 transition-opacity"
              >
                Change
              </button>
            </>
          ) : (
            <span className="text-[var(--color-text-secondary)] text-sm">
              Pomodoro Railroad
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
