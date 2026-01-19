import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useStore } from '../store/useStore';
import { stations } from '../data/stations';
import { useSound } from '../hooks/useSound';

// This component now only handles sound/notification effects
// TrainCabin handles all visual display during active timer states
export function TimerDisplay() {
  const { timer } = useStore();
  const { playArrival, playDeparture } = useSound();
  const prevStatusRef = useRef(timer.status);

  // Sound and notification effects
  useEffect(() => {
    const prevStatus = prevStatusRef.current;
    prevStatusRef.current = timer.status;

    if (prevStatus === 'confirming' && timer.status === 'running') {
      // Journey started after ticket stamp
      playDeparture();
      const toStation = timer.currentRoute ? stations[timer.currentRoute.to] : null;
      if (toStation) {
        toast(`Departing for ${toStation.city}!`, { icon: '🚂' });
      }
    }

    if (prevStatus === 'running' && timer.status === 'break') {
      // Arrived at station
      playArrival();
      const toStation = timer.currentRoute ? stations[timer.currentRoute.to] : null;
      if (toStation) {
        toast.success(`Arrived at ${toStation.city}! Take a break.`);
      }
    }
  }, [timer.status, timer.currentRoute, playArrival, playDeparture]);

  // No visual rendering - TrainCabin handles display
  return null;
}
