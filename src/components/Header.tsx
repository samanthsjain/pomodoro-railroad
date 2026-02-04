import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Train, Zap, Settings, Keyboard, X, Target } from 'lucide-react';
import { useStore } from '../store/useStore';
import { supportedCountries } from '../services/railwayApi';

function KeyboardShortcutsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const shortcuts = [
    { key: 'Space', description: 'Pause / Resume journey' },
    { key: 'M', description: 'Toggle map view' },
    { key: 'E', description: 'End trip early' },
    { key: 'Esc', description: 'Cancel / Close modal' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100]"
            style={{
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(4px)',
            }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed top-20 right-4 z-[101] w-72"
          >
            <div
              className="rounded-2xl border overflow-hidden"
              style={{
                background: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-separator)',
              }}
            >
              <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-separator)' }}>
                <div className="flex items-center gap-2">
                  <Keyboard className="w-4 h-4 text-[var(--color-accent-blue)]" />
                  <h3 className="text-subhead font-medium text-[var(--color-text-primary)]">Shortcuts</h3>
                </div>
                <button onClick={onClose} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-3 space-y-2">
                {shortcuts.map((shortcut) => (
                  <div key={shortcut.key} className="flex items-center justify-between py-1">
                    <span className="text-footnote text-[var(--color-text-secondary)]">{shortcut.description}</span>
                    <kbd className="ml-2">{shortcut.key}</kbd>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function Header() {
  const { timer, setShowCountrySelector, selectedCountry, progress } = useStore();
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Hide during active journey
  if (timer.status !== 'idle') return null;

  const countryName = selectedCountry
    ? supportedCountries.find(c => c.code === selectedCountry)?.name
    : null;

  const dailyProgress = progress.dailyGoalMinutes > 0
    ? Math.min((progress.todayMinutes || 0) / (progress.dailyGoalMinutes || 25) * 100, 100)
    : 0;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        className="fixed top-4 left-4 right-4 z-30 flex items-center justify-between"
      >
        {/* Left side - Logo and country */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-accent-blue)] to-[#0055cc] flex items-center justify-center shadow-lg">
            <Train className="w-5 h-5 text-white" />
          </div>

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

        {/* Right side - Streak, daily goal, settings */}
        <div className="flex items-center gap-2">
          {/* Daily goal mini progress */}
          {selectedCountry && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{
                background: 'var(--color-bg-glass)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <Target className="w-3.5 h-3.5 text-[var(--color-accent-green)]" />
              <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-fill-tertiary)' }}>
                <div
                  className="h-full rounded-full bg-[var(--color-accent-green)] transition-all duration-300"
                  style={{ width: `${dailyProgress}%` }}
                />
              </div>
              <span className="text-[10px] text-[var(--color-text-tertiary)] font-medium">
                {Math.round(dailyProgress)}%
              </span>
            </motion.div>
          )}

          {/* Streak badge */}
          {(progress.currentStreak || 0) > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{
                background: 'var(--color-accent-orange)',
              }}
            >
              <Zap className="w-3.5 h-3.5 text-white" />
              <span className="text-xs font-bold text-white">{progress.currentStreak}</span>
            </motion.div>
          )}

          {/* Settings button */}
          <button
            onClick={() => setShowShortcuts(!showShortcuts)}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-[var(--color-fill-tertiary)]"
          >
            <Settings className="w-4 h-4 text-[var(--color-text-secondary)]" />
          </button>
        </div>
      </motion.div>

      <KeyboardShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </>
  );
}
