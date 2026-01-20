import { useStore } from '../store/useStore';
import { supportedCountries } from '../services/railwayApi';
import { X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Country flag emoji mapping
const countryFlags: Record<string, string> = {
  de: 'DE', at: 'AT', ch: 'CH', fr: 'FR', nl: 'NL', be: 'BE', uk: 'GB',
  es: 'ES', it: 'IT', cz: 'CZ', pl: 'PL', hu: 'HU', dk: 'DK', no: 'NO',
  fi: 'FI', jp: 'JP', in: 'IN', au: 'AU', us: 'US', ca: 'CA', ru: 'RU',
  cn: 'CN', tw: 'TW',
};

// Group countries by region
const regions = [
  { name: 'Europe', countries: ['de', 'at', 'ch', 'fr', 'nl', 'be', 'uk', 'es', 'it', 'cz', 'pl', 'hu', 'dk', 'no', 'fi'] },
  { name: 'Asia', countries: ['jp', 'in', 'cn', 'tw', 'ru'] },
  { name: 'Americas', countries: ['us', 'ca'] },
  { name: 'Oceania', countries: ['au'] },
];

const getFlagEmoji = (code: string) => {
  const countryCode = countryFlags[code] || code.toUpperCase();
  return countryCode.split('').map((char) =>
    String.fromCodePoint(char.charCodeAt(0) + 127397)
  ).join('');
};

export function CountrySelector() {
  const {
    showCountrySelector,
    setShowCountrySelector,
    selectCountry,
    apiLoadingState,
    selectedCountry,
  } = useStore();

  if (!showCountrySelector) return null;

  const handleSelectCountry = async (countryCode: string) => {
    await selectCountry(countryCode);
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 sheet-backdrop z-50"
        onClick={() => setShowCountrySelector(false)}
      />

      {/* Sheet Modal */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] rounded-t-3xl overflow-hidden"
        style={{ background: 'var(--color-bg-secondary)' }}
      >
        {/* Drag handle */}
        <div className="drag-handle" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-4">
          <h2 className="text-title-lg text-[var(--color-text-primary)]">
            Choose a Country
          </h2>
          <button
            onClick={() => setShowCountrySelector(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'var(--color-fill-tertiary)' }}
          >
            <X className="w-4 h-4 text-[var(--color-text-secondary)]" />
          </button>
        </div>

        {/* Loading state */}
        {apiLoadingState === 'loading' && (
          <div className="p-12 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 text-[var(--color-accent-blue)] animate-spin" />
            <p className="text-[var(--color-text-secondary)]">Loading stations...</p>
          </div>
        )}

        {/* Country grid */}
        {apiLoadingState !== 'loading' && (
          <div className="px-4 pb-8 overflow-y-auto max-h-[70vh]">
            {regions.map((region) => (
              <div key={region.name} className="mb-6">
                <h3 className="text-caption text-[var(--color-text-tertiary)] uppercase tracking-wider mb-3 px-2">
                  {region.name}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {region.countries.map((code) => {
                    const country = supportedCountries.find((c) => c.code === code);
                    if (!country) return null;
                    const isSelected = selectedCountry === code;

                    return (
                      <motion.button
                        key={code}
                        onClick={() => handleSelectCountry(code)}
                        whileTap={{ scale: 0.97 }}
                        className={`
                          p-4 rounded-2xl flex items-center gap-3 transition-all
                          ${isSelected
                            ? 'bg-[var(--color-accent-blue)] text-white'
                            : 'bg-[var(--color-fill-tertiary)] text-[var(--color-text-primary)] hover:bg-[var(--color-fill-secondary)]'
                          }
                        `}
                      >
                        <span className="text-2xl">{getFlagEmoji(code)}</span>
                        <span className="text-subhead font-medium truncate">{country.name}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Info text */}
            <div className="mt-4 p-4 rounded-2xl" style={{ background: 'var(--color-fill-tertiary)' }}>
              <p className="text-footnote text-[var(--color-text-secondary)]">
                Select a country to explore its railway network. You'll be placed at a random station with curated connections based on travel time.
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
