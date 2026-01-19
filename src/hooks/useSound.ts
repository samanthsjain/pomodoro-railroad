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

  const playStamp = useCallback(() => {
    // Satisfying stamp/thunk sound
    try {
      const ctx = getContext();

      // Create noise for the thunk
      const bufferSize = ctx.sampleRate * 0.1;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        // Decaying noise with low frequency emphasis
        const decay = Math.exp(-i / (bufferSize * 0.05));
        data[i] = (Math.random() * 2 - 1) * decay;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      // Low pass filter for thunk
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200, ctx.currentTime);
      filter.Q.setValueAtTime(1, ctx.currentTime);

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

      noise.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      noise.start(ctx.currentTime);
      noise.stop(ctx.currentTime + 0.15);

      // Add a subtle impact tone
      playTone(80, 0.1, 'sine');
    } catch {
      // Audio might not be available
    }
  }, [getContext, playTone]);

  const playTrainChug = useCallback(() => {
    // Rhythmic train chugging sound
    try {
      const ctx = getContext();

      const createChug = (time: number) => {
        const bufferSize = ctx.sampleRate * 0.08;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
          const decay = Math.exp(-i / (bufferSize * 0.3));
          data[i] = (Math.random() * 2 - 1) * decay * 0.3;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(150, time);

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.15, time);

        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        noise.start(time);
        noise.stop(time + 0.08);
      };

      // Create rhythmic pattern
      createChug(ctx.currentTime);
      createChug(ctx.currentTime + 0.15);
    } catch {
      // Audio might not be available
    }
  }, [getContext]);

  return {
    playDeparture,
    playArrival,
    playBreakEnd,
    playClick,
    playStamp,
    playTrainChug,
  };
}
