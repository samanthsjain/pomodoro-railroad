import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Train, MapPin, Clock, X, Armchair } from 'lucide-react';
import { useStore } from '../store/useStore';
import { stations } from '../data/stations';
import { useSound } from '../hooks/useSound';
import { trainClasses } from '../types';

export function TicketStamp() {
  const { timer, confirmTicket, cancelConfirmation } = useStore();
  const { playStamp } = useSound();
  const [isStamping, setIsStamping] = useState(false);
  const [isStamped, setIsStamped] = useState(false);

  // Reset stamp state when entering confirming state (new journey)
  useEffect(() => {
    if (timer.status === 'confirming') {
      setIsStamping(false);
      setIsStamped(false);
    }
  }, [timer.status, timer.journey?.id]);

  const fromStation = timer.currentRoute ? stations[timer.currentRoute.from] : null;
  const toStation = timer.currentRoute ? stations[timer.currentRoute.to] : null;

  const handleStamp = useCallback(() => {
    if (isStamping || isStamped) return;

    setIsStamping(true);
    playStamp();

    // Stamp animation duration
    setTimeout(() => {
      setIsStamped(true);
      setIsStamping(false);

      // Start the journey after a brief moment to appreciate the stamp
      setTimeout(() => {
        confirmTicket();
      }, 800);
    }, 300);
  }, [isStamping, isStamped, playStamp, confirmTicket]);

  if (timer.status !== 'confirming') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      >
        {/* Cancel button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          onClick={cancelConfirmation}
          className="absolute top-6 right-6 p-2 rounded-full bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </motion.button>

        {/* Ticket */}
        <motion.div
          initial={{ scale: 0.8, rotateX: -20, y: 50 }}
          animate={{ scale: 1, rotateX: 0, y: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          className="relative perspective-1000"
        >
          <div className="relative bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg shadow-2xl overflow-hidden w-[420px]">
            {/* Ticket perforated edge */}
            <div className="absolute left-0 top-0 bottom-0 w-4 flex flex-col justify-around">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="w-4 h-4 rounded-full bg-black/80" />
              ))}
            </div>

            {/* Ticket content */}
            <div className="ml-6 p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Train className="w-6 h-6 text-amber-800" />
                  <span className="font-bold text-amber-900 text-lg tracking-wider">RAIL PASS</span>
                </div>
                <div className="text-xs text-amber-700 font-mono">
                  #{Math.random().toString(36).substring(2, 8).toUpperCase()}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t-2 border-dashed border-amber-300 my-4" />

              {/* Route details */}
              <div className="space-y-4">
                {/* From */}
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 mt-1.5 rounded-full bg-green-600 ring-2 ring-green-600/30" />
                  <div>
                    <p className="text-xs text-amber-600 uppercase tracking-wider font-medium">Departure</p>
                    <p className="text-amber-900 font-bold text-lg">{fromStation?.city}</p>
                    <p className="text-amber-700 text-sm">{fromStation?.name}</p>
                  </div>
                </div>

                {/* Connection */}
                <div className="flex items-center gap-3 pl-1">
                  <div className="w-0.5 h-8 bg-amber-300 ml-1" />
                  <div className="flex items-center gap-4 text-amber-600 text-sm">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{timer.currentRoute?.travelTimeMinutes} min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{timer.currentRoute?.distanceKm} km</span>
                    </div>
                  </div>
                </div>

                {/* To */}
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 mt-1.5 rounded-full bg-red-600 ring-2 ring-red-600/30" />
                  <div>
                    <p className="text-xs text-amber-600 uppercase tracking-wider font-medium">Arrival</p>
                    <p className="text-amber-900 font-bold text-lg">{toStation?.city}</p>
                    <p className="text-amber-700 text-sm">{toStation?.name}</p>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t-2 border-dashed border-amber-300 my-4" />

              {/* Train type, class, and seat */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-xs text-amber-600 uppercase tracking-wider">Train</p>
                  <p className="text-amber-900 font-bold text-sm">{timer.currentRoute?.trainType}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-amber-600 uppercase tracking-wider">Class</p>
                  <div className="flex items-center gap-1 justify-center">
                    <Armchair className="w-3 h-3 text-amber-700" />
                    <p className="text-amber-900 font-bold text-sm">
                      {trainClasses.find(c => c.id === timer.selectedClass)?.name || 'Economy'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-amber-600 uppercase tracking-wider">Seat</p>
                  <p className="text-amber-900 font-bold text-sm">
                    {timer.selectedSeat
                      ? `${timer.selectedSeat.car}-${timer.selectedSeat.row}${timer.selectedSeat.seat}`
                      : '—'}
                  </p>
                  {timer.selectedSeat?.isWindow && (
                    <p className="text-[10px] text-amber-500">Window</p>
                  )}
                </div>
              </div>

              {/* Stamp area */}
              <motion.div
                onClick={handleStamp}
                whileHover={!isStamped ? { scale: 1.02 } : {}}
                whileTap={!isStamped ? { scale: 0.98 } : {}}
                className={`relative h-24 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors ${
                  isStamped
                    ? 'border-green-500 bg-green-50'
                    : 'border-amber-400 bg-amber-50/50 hover:bg-amber-100/50'
                }`}
              >
                {!isStamped && !isStamping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center"
                  >
                    <p className="text-amber-600 font-medium">Click to Stamp Ticket</p>
                    <p className="text-amber-500 text-sm">Confirm your journey</p>
                  </motion.div>
                )}

                {/* Stamp animation */}
                <AnimatePresence>
                  {(isStamping || isStamped) && (
                    <motion.div
                      initial={{ scale: 2, opacity: 0, rotate: -15 }}
                      animate={{ scale: 1, opacity: 1, rotate: -8 }}
                      transition={{ type: 'spring', damping: 15, stiffness: 400 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div className="relative">
                        {/* Stamp background */}
                        <div className="w-28 h-28 rounded-full border-4 border-red-600 flex items-center justify-center bg-red-50/80">
                          <div className="text-center">
                            <p className="text-red-600 font-black text-sm tracking-wider">VALIDATED</p>
                            <p className="text-red-500 text-xs font-bold">
                              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                            <Train className="w-6 h-6 text-red-600 mx-auto mt-1" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Decorative patterns */}
            <div className="absolute top-2 right-2 opacity-10">
              <Train className="w-16 h-16 text-amber-900" />
            </div>
          </div>

          {/* Instructions */}
          {!isStamped && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-center text-gray-400 mt-6 text-sm"
            >
              Stamp your ticket to board the train
            </motion.p>
          )}

          {isStamped && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-green-400 mt-6 text-sm font-medium"
            >
              All aboard! Your journey begins...
            </motion.p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
