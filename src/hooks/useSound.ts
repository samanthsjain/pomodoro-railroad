import { useCallback, useRef } from 'react';

// Simple synth sounds using Web Audio API
export function useSound() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  }, []);

  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine') => {
    try {
      const ctx = getContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

      // Fade in and out
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch {
      // Audio might not be available
    }
  }, [getContext]);

  const playDeparture = useCallback(() => {
    // Train whistle sound - two tones
    playTone(880, 0.3, 'sine');
    setTimeout(() => playTone(660, 0.4, 'sine'), 300);
  }, [playTone]);

  const playArrival = useCallback(() => {
    // Pleasant arrival chime
    playTone(523, 0.15, 'sine'); // C
    setTimeout(() => playTone(659, 0.15, 'sine'), 150); // E
    setTimeout(() => playTone(784, 0.3, 'sine'), 300); // G
  }, [playTone]);

  const playBreakEnd = useCallback(() => {
    // Gentle reminder
    playTone(440, 0.2, 'triangle');
    setTimeout(() => playTone(550, 0.2, 'triangle'), 200);
  }, [playTone]);

  const playClick = useCallback(() => {
    playTone(600, 0.05, 'sine');
  }, [playTone]);

  return {
    playDeparture,
    playArrival,
    playBreakEnd,
    playClick,
  };
}
