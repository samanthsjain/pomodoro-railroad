import { motion } from 'framer-motion';
import { Train } from 'lucide-react';
import { useStore } from '../store/useStore';

export function Header() {
  const { timer } = useStore();

  // Hide during active journey to reduce clutter
  if (timer.status !== 'idle') return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-6 left-6 z-30"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
          <Train className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Railroad Pomodoro</h1>
          <p className="text-xs text-gray-400">Focus your way around the world</p>
        </div>
      </div>
    </motion.div>
  );
}
