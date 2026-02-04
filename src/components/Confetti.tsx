import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  rotation: number;
  delay: number;
  size: number;
}

interface ConfettiProps {
  isActive: boolean;
  duration?: number;
}

const colors = [
  '#FF3B30', // red
  '#FF9500', // orange
  '#FFCC00', // yellow
  '#34C759', // green
  '#007AFF', // blue
  '#AF52DE', // purple
  '#FF2D55', // pink
  '#5AC8FA', // teal
];

export function Confetti({ isActive, duration = 3000 }: ConfettiProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isActive) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), duration);
      return () => clearTimeout(timer);
    }
  }, [isActive, duration]);

  const pieces = useMemo<ConfettiPiece[]>(() => {
    return Array.from({ length: 100 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      delay: Math.random() * 0.5,
      size: Math.random() * 8 + 4,
    }));
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
          {pieces.map((piece) => (
            <motion.div
              key={piece.id}
              className="absolute"
              style={{
                left: `${piece.x}%`,
                top: -20,
                width: piece.size,
                height: piece.size * 1.5,
                backgroundColor: piece.color,
                borderRadius: piece.size > 8 ? '50%' : 2,
              }}
              initial={{
                y: -20,
                rotate: piece.rotation,
                opacity: 1,
              }}
              animate={{
                y: window.innerHeight + 50,
                rotate: piece.rotation + 720,
                opacity: [1, 1, 0],
              }}
              transition={{
                duration: 3 + Math.random(),
                delay: piece.delay,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              exit={{ opacity: 0 }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

export function JourneyCompleteOverlay({ isVisible, onDismiss }: { isVisible: boolean; onDismiss: () => void }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <>
          <Confetti isActive={isVisible} />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[150] flex items-center justify-center pointer-events-auto"
            onClick={onDismiss}
          >
            <motion.div
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              className="glass-elevated rounded-3xl p-8 text-center max-w-sm mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[var(--color-accent-green)] to-[var(--color-accent-teal)] flex items-center justify-center"
              >
                <span className="text-4xl">🎉</span>
              </motion.div>
              <h2 className="text-display-sm text-[var(--color-text-primary)] mb-2">
                Journey Complete!
              </h2>
              <p className="text-body text-[var(--color-text-secondary)] mb-6">
                Great focus session! Take a well-deserved break.
              </p>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onDismiss}
                className="btn-apple btn-primary px-8"
              >
                Continue
              </motion.button>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
