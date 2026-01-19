import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, Tag, EyeOff } from 'lucide-react';
import { useStore } from '../store/useStore';
import { mapStyles } from '../types';

export function MapStyleToggle() {
  const { mapStyle, setMapStyle, showLabels, setShowLabels, timer } = useStore();
  const [isOpen, setIsOpen] = useState(false);

  // Don't show during active journey
  if (timer.status !== 'idle') return null;

  const currentStyle = mapStyles.find(s => s.id === mapStyle);

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      {/* Label toggle button */}
      <motion.button
        onClick={() => setShowLabels(!showLabels)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border shadow-lg transition-all ${
          showLabels
            ? 'bg-gray-900/90 border-gray-700/50 text-gray-300 hover:text-white hover:border-gray-600'
            : 'bg-gray-800/90 border-gray-600/50 text-gray-400'
        }`}
        title={showLabels ? 'Hide labels' : 'Show labels'}
      >
        {showLabels ? (
          <Tag className="w-4 h-4" />
        ) : (
          <EyeOff className="w-4 h-4" />
        )}
        <span className="text-xs font-medium">Labels {showLabels ? 'On' : 'Off'}</span>
      </motion.button>

      {/* Style selector */}
      <div className="relative">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="absolute bottom-full right-0 mb-2 w-56"
            >
              <div className="bg-gray-900/95 backdrop-blur-xl rounded-xl border border-gray-700/50 shadow-2xl overflow-hidden">
                <div className="p-3 border-b border-gray-700/50">
                  <h3 className="text-sm font-medium text-gray-300">Map Style</h3>
                </div>
                <div className="p-2 space-y-1">
                  {mapStyles.map((style) => {
                    const isSelected = mapStyle === style.id;
                    return (
                      <button
                        key={style.id}
                        onClick={() => {
                          setMapStyle(style.id);
                          setIsOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all ${
                          isSelected
                            ? 'bg-blue-500/20 border border-blue-500/50'
                            : 'hover:bg-gray-800/50 border border-transparent'
                        }`}
                      >
                        <span className="text-xl">{style.icon}</span>
                        <div className="flex-1 text-left">
                          <p className={`text-sm font-medium ${isSelected ? 'text-blue-300' : 'text-white'}`}>
                            {style.name}
                          </p>
                          <p className="text-xs text-gray-500">{style.description}</p>
                        </div>
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-blue-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border shadow-lg transition-all ${
            isOpen
              ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
              : 'bg-gray-900/90 border-gray-700/50 text-gray-300 hover:text-white hover:border-gray-600'
          }`}
        >
          <span className="text-lg">{currentStyle?.icon}</span>
          <span className="text-sm font-medium">{currentStyle?.name}</span>
          <ChevronUp className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </motion.button>
      </div>
    </div>
  );
}
