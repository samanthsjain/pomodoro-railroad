import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, X, Clock, Zap, Flame, Rocket } from 'lucide-react';
import { useStore } from '../store/useStore';
import { presetRoutes, calculateJourneyTime, calculateJourneyDistance } from '../data/stations';

const categoryIcons = {
  short: Zap,
  medium: Clock,
  long: Flame,
  epic: Rocket,
};

const categoryColors = {
  short: 'text-green-400',
  medium: 'text-blue-400',
  long: 'text-orange-400',
  epic: 'text-purple-400',
};

const categoryLabels = {
  short: 'Quick (15-30 min)',
  medium: 'Medium (45-90 min)',
  long: 'Long (90-180 min)',
  epic: 'Epic Journey',
};

export function PresetsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { selectPreset, timer } = useStore();

  const handlePresetClick = (stationIds: string[]) => {
    selectPreset(stationIds);
    setIsOpen(false);
  };

  if (timer.status !== 'idle') return null;

  const groupedPresets = {
    short: presetRoutes.filter((p) => p.category === 'short'),
    medium: presetRoutes.filter((p) => p.category === 'medium'),
    long: presetRoutes.filter((p) => p.category === 'long'),
    epic: presetRoutes.filter((p) => p.category === 'epic'),
  };

  return (
    <>
      {/* Presets button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => setIsOpen(true)}
        className="fixed top-6 right-32 z-40 flex items-center gap-2 px-4 py-2.5 bg-gray-900/90 backdrop-blur-xl rounded-xl border border-gray-700/50 text-gray-300 hover:text-white hover:bg-gray-800/90 transition-colors"
      >
        <Bookmark className="w-5 h-5" />
        <span>Presets</span>
      </motion.button>

      {/* Presets modal */}
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
              className="fixed top-[5%] left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl max-h-[90vh] overflow-hidden"
            >
              <div className="bg-gray-900 rounded-2xl border border-gray-700/50 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
                  <h2 className="text-xl font-semibold text-white">Preset Journeys</h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-4 space-y-6">
                  {Object.entries(groupedPresets).map(([category, presets]) => {
                    if (presets.length === 0) return null;
                    const Icon = categoryIcons[category as keyof typeof categoryIcons];
                    const colorClass = categoryColors[category as keyof typeof categoryColors];
                    const label = categoryLabels[category as keyof typeof categoryLabels];

                    return (
                      <div key={category}>
                        <div className="flex items-center gap-2 mb-3">
                          <Icon className={`w-5 h-5 ${colorClass}`} />
                          <h3 className="text-lg font-medium text-white">{label}</h3>
                        </div>
                        <div className="grid gap-3">
                          {presets.map((preset) => {
                            const totalTime = calculateJourneyTime(preset.stationIds);
                            const totalDistance = calculateJourneyDistance(preset.stationIds);

                            return (
                              <button
                                key={preset.id}
                                onClick={() => handlePresetClick(preset.stationIds)}
                                className="w-full text-left p-4 rounded-xl bg-gray-800/50 hover:bg-gray-800 border border-gray-700/30 hover:border-gray-600/50 transition-all"
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <h4 className="text-white font-medium mb-1">{preset.name}</h4>
                                    <p className="text-sm text-gray-400 mb-2">{preset.description}</p>
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                      <span>{preset.stationIds.length} stations</span>
                                      <span>{totalTime} min</span>
                                      <span>{totalDistance} km</span>
                                    </div>
                                  </div>
                                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${colorClass} bg-current/10`}>
                                    {Math.floor(totalTime / 60)}h {totalTime % 60}m
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
