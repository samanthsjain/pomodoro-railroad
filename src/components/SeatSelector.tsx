import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Train, X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useStore } from '../store/useStore';

const ROWS_PER_CAR = 8;
const SEATS_PER_ROW = ['A', 'B', 'C', 'D'] as const;

export function SeatSelector() {
  const { timer, selectSeat, confirmSeatSelection, cancelConfirmation } = useStore();
  const [currentCar, setCurrentCar] = useState(1);
  const selectedSeat = timer.selectedSeat;

  if (timer.status !== 'selecting-seat') return null;

  const handleSeatClick = (row: number, seat: string) => {
    const isWindow = seat === 'A' || seat === 'D';
    selectSeat({
      car: currentCar,
      row,
      seat,
      isWindow,
    });
  };

  const isSeatSelected = (row: number, seat: string) => {
    return (
      selectedSeat?.car === currentCar &&
      selectedSeat?.row === row &&
      selectedSeat?.seat === seat
    );
  };

  // Generate some "occupied" seats for visual interest (deterministic based on car number)
  const getOccupiedSeats = (car: number): Set<string> => {
    const occupied = new Set<string>();
    const seed = car * 17;
    for (let i = 0; i < 6; i++) {
      const row = ((seed + i * 7) % ROWS_PER_CAR) + 1;
      const seatIdx = (seed + i * 3) % 4;
      occupied.add(`${row}-${SEATS_PER_ROW[seatIdx]}`);
    }
    return occupied;
  };

  const occupiedSeats = getOccupiedSeats(currentCar);

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

        <motion.div
          initial={{ scale: 0.9, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          className="w-full max-w-lg px-4"
        >
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Train className="w-6 h-6 text-[var(--color-accent-blue)]" />
              <h2 className="text-xl font-bold text-white">Select Your Seat</h2>
            </div>
            <p className="text-gray-400 text-sm">
              Choose where you'd like to sit for your journey
            </p>
          </div>

          {/* Car selector */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <button
              onClick={() => setCurrentCar(c => Math.max(1, c - 1))}
              disabled={currentCar === 1}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="bg-gray-800 px-6 py-2 rounded-lg">
              <span className="text-white font-semibold">Car {currentCar}</span>
            </div>
            <button
              onClick={() => setCurrentCar(c => Math.min(4, c + 1))}
              disabled={currentCar === 4}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Train car layout */}
          <div className="rounded-2xl p-6 border" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-separator)' }}>
            {/* Front of car indicator */}
            <div className="flex justify-center mb-4">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-8 h-1 bg-gray-700 rounded" />
                <span>Front</span>
                <div className="w-8 h-1 bg-gray-700 rounded" />
              </div>
            </div>

            {/* Seat grid */}
            <div className="space-y-2">
              {Array.from({ length: ROWS_PER_CAR }, (_, i) => i + 1).map((row) => (
                <div key={row} className="flex items-center justify-center gap-2">
                  {/* Left side (Window A, Aisle B) */}
                  <div className="flex gap-1">
                    {['A', 'B'].map((seat) => {
                      const isOccupied = occupiedSeats.has(`${row}-${seat}`);
                      const isSelected = isSeatSelected(row, seat);
                      const isWindow = seat === 'A';

                      return (
                        <motion.button
                          key={`${row}-${seat}`}
                          onClick={() => !isOccupied && handleSeatClick(row, seat)}
                          disabled={isOccupied}
                          whileHover={!isOccupied ? { scale: 1.1 } : {}}
                          whileTap={!isOccupied ? { scale: 0.95 } : {}}
                          className={`w-10 h-10 rounded-lg text-xs font-bold transition-all relative ${
                            isOccupied
                              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                              : isSelected
                              ? 'bg-[var(--color-accent-blue)] text-white shadow-lg shadow-blue-500/30'
                              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          {row}{seat}
                          {isWindow && !isOccupied && !isSelected && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full" title="Window" />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Aisle */}
                  <div className="w-8 flex items-center justify-center">
                    <span className="text-gray-600 text-xs">{row}</span>
                  </div>

                  {/* Right side (Aisle C, Window D) */}
                  <div className="flex gap-1">
                    {['C', 'D'].map((seat) => {
                      const isOccupied = occupiedSeats.has(`${row}-${seat}`);
                      const isSelected = isSeatSelected(row, seat);
                      const isWindow = seat === 'D';

                      return (
                        <motion.button
                          key={`${row}-${seat}`}
                          onClick={() => !isOccupied && handleSeatClick(row, seat)}
                          disabled={isOccupied}
                          whileHover={!isOccupied ? { scale: 1.1 } : {}}
                          whileTap={!isOccupied ? { scale: 0.95 } : {}}
                          className={`w-10 h-10 rounded-lg text-xs font-bold transition-all relative ${
                            isOccupied
                              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                              : isSelected
                              ? 'bg-[var(--color-accent-blue)] text-white shadow-lg shadow-blue-500/30'
                              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          {row}{seat}
                          {isWindow && !isOccupied && !isSelected && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full" title="Window" />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Rear of car indicator */}
            <div className="flex justify-center mt-4">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-8 h-1 bg-gray-700 rounded" />
                <span>Rear</span>
                <div className="w-8 h-1 bg-gray-700 rounded" />
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-6 mt-4 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-800 border border-gray-600" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-700" />
              <span>Occupied</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Window</span>
            </div>
          </div>

          {/* Selected seat display and confirm button */}
          <div className="mt-6">
            {selectedSeat ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-4 p-4 rounded-xl bg-gradient-to-r from-[var(--color-accent-blue)]/20 to-[var(--color-accent-purple)]/10 border border-[var(--color-accent-blue)]/30"
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-[var(--color-accent-blue)]" />
                  <p className="text-[var(--color-text-secondary)] text-sm">Your seat</p>
                </div>
                <p className="text-white text-2xl font-bold">
                  Car {selectedSeat.car} - Seat {selectedSeat.row}{selectedSeat.seat}
                </p>
                {selectedSeat.isWindow && (
                  <p className="text-amber-400 text-sm mt-1 flex items-center justify-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    Window Seat
                  </p>
                )}
              </motion.div>
            ) : (
              <p className="text-center text-[var(--color-text-tertiary)] mb-4">
                Tap a seat to select it
              </p>
            )}

            <motion.button
              onClick={confirmSeatSelection}
              disabled={!selectedSeat}
              whileHover={selectedSeat ? { scale: 1.02 } : {}}
              whileTap={selectedSeat ? { scale: 0.98 } : {}}
              className={`w-full py-4 rounded-xl font-semibold text-lg transition-all relative overflow-hidden ${
                selectedSeat
                  ? 'bg-[var(--color-accent-green)] text-white'
                  : 'bg-[var(--color-fill-tertiary)] text-[var(--color-text-tertiary)] cursor-not-allowed'
              }`}
            >
              <span className="relative z-10">{selectedSeat ? 'Continue to Ticket' : 'Select a Seat'}</span>
              {selectedSeat && (
                <motion.div
                  className="absolute inset-0 bg-white/10"
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                />
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
