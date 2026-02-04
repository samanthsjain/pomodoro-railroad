import { useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';

export function useKeyboardShortcuts() {
  const {
    timer,
    pauseTimer,
    resumeTimer,
    endTrip,
    endBreak,
    cancelConfirmation,
    togglePomodoroViewMode,
  } = useStore();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    // Space bar - pause/resume
    if (e.code === 'Space' && (timer.status === 'running' || timer.status === 'paused')) {
      e.preventDefault();
      if (timer.status === 'paused') {
        resumeTimer();
      } else {
        pauseTimer();
      }
    }

    // Escape - cancel or end
    if (e.code === 'Escape') {
      if (timer.status === 'selecting-seat' || timer.status === 'confirming') {
        cancelConfirmation();
      } else if (timer.status === 'break') {
        endBreak();
      }
    }

    // M - toggle map view
    if (e.code === 'KeyM' && (timer.status === 'running' || timer.status === 'paused' || timer.status === 'break')) {
      togglePomodoroViewMode();
    }

    // E - end trip early
    if (e.code === 'KeyE' && (timer.status === 'running' || timer.status === 'paused')) {
      endTrip();
    }
  }, [timer.status, pauseTimer, resumeTimer, endTrip, endBreak, cancelConfirmation, togglePomodoroViewMode]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
