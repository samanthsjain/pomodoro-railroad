import { useCallback, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';

// Train audio system with continuous sounds and announcements
export function useTrainAudio() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const trainLoopRef = useRef<number | null>(null);
  const isPlayingRef = useRef(false);
  const announcementVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  const timer = useStore((state) => state.timer);
  const apiStations = useStore((state) => state.apiStations);

  // Initialize audio context
  const getContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  // Find a good voice for announcements
  useEffect(() => {
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      // Prefer English voices, female for station announcements
      const preferred = voices.find(v =>
        v.lang.startsWith('en') && v.name.toLowerCase().includes('female')
      ) || voices.find(v =>
        v.lang.startsWith('en')
      ) || voices[0];
      announcementVoiceRef.current = preferred;
    };

    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // Play train horn (departure/arrival)
  const playHorn = useCallback(() => {
    try {
      const ctx = getContext();
      const now = ctx.currentTime;

      // Train horn - two overlapping tones
      const createHornTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, start);
        osc.frequency.linearRampToValueAtTime(freq * 0.98, start + duration);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, start);

        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.15, start + 0.1);
        gain.gain.setValueAtTime(0.15, start + duration - 0.2);
        gain.gain.linearRampToValueAtTime(0, start + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + duration);
      };

      // Two-tone horn
      createHornTone(277, now, 0.8); // C#4
      createHornTone(370, now, 0.8); // F#4

      // Second blast
      setTimeout(() => {
        const ctx2 = getContext();
        const now2 = ctx2.currentTime;
        createHornTone(277, now2, 0.6);
        createHornTone(370, now2, 0.6);
      }, 900);
    } catch {
      // Audio not available
    }
  }, [getContext]);

  // Play wheel clickety-clack rhythm
  const playWheelSound = useCallback(() => {
    try {
      const ctx = getContext();
      const now = ctx.currentTime;

      const createClick = (time: number, volume: number) => {
        const bufferSize = Math.floor(ctx.sampleRate * 0.03);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
          const decay = Math.exp(-i / (bufferSize * 0.15));
          data[i] = (Math.random() * 2 - 1) * decay;
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800 + Math.random() * 400, time);
        filter.Q.setValueAtTime(2, time);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(volume * 0.08, time);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        source.start(time);
        source.stop(time + 0.03);
      };

      // Clickety-clack pattern (4 clicks per cycle)
      createClick(now, 1.0);
      createClick(now + 0.12, 0.7);
      createClick(now + 0.25, 0.9);
      createClick(now + 0.37, 0.6);
    } catch {
      // Audio not available
    }
  }, [getContext]);

  // Start continuous train rhythm
  const startTrainLoop = useCallback(() => {
    if (isPlayingRef.current) return;
    isPlayingRef.current = true;

    const loop = () => {
      if (!isPlayingRef.current) return;
      playWheelSound();
      trainLoopRef.current = window.setTimeout(loop, 500); // Rhythm every 500ms
    };

    loop();
  }, [playWheelSound]);

  // Stop train rhythm
  const stopTrainLoop = useCallback(() => {
    isPlayingRef.current = false;
    if (trainLoopRef.current) {
      clearTimeout(trainLoopRef.current);
      trainLoopRef.current = null;
    }
  }, []);

  // Station announcement using TTS
  const announceStation = useCallback((stationName: string, type: 'arriving' | 'departing') => {
    try {
      // Cancel any ongoing speech
      speechSynthesis.cancel();

      const text = type === 'arriving'
        ? `Now arriving at ${stationName}`
        : `Now departing from ${stationName}`;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;

      if (announcementVoiceRef.current) {
        utterance.voice = announcementVoiceRef.current;
      }

      speechSynthesis.speak(utterance);
    } catch {
      // TTS not available
    }
  }, []);

  // Play arrival chime
  const playArrivalChime = useCallback(() => {
    try {
      const ctx = getContext();
      const now = ctx.currentTime;

      const playNote = (freq: number, time: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.2, time + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, time + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + duration);
      };

      // Classic three-note chime (G-B-D)
      playNote(784, now, 0.4);        // G5
      playNote(988, now + 0.15, 0.4); // B5
      playNote(1175, now + 0.3, 0.6); // D6
    } catch {
      // Audio not available
    }
  }, [getContext]);

  // Auto-manage train sounds based on journey state
  useEffect(() => {
    const isRunning = timer.status === 'running';
    const isPaused = timer.status === 'paused';
    const pauseState = timer.journey?.pauseState;

    if (isRunning && !pauseState) {
      startTrainLoop();
    } else {
      stopTrainLoop();
    }

    // Handle station arrival
    if (pauseState && pauseState.remainingPauseSeconds === pauseState.totalPauseSeconds) {
      playArrivalChime();
      const station = apiStations[pauseState.stationId];
      if (station) {
        setTimeout(() => {
          announceStation(station.name, 'arriving');
        }, 500);
      }
    }

    return () => {
      if (!isRunning && !isPaused) {
        stopTrainLoop();
      }
    };
  }, [timer.status, timer.journey?.pauseState, startTrainLoop, stopTrainLoop, playArrivalChime, announceStation, apiStations]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTrainLoop();
      speechSynthesis.cancel();
    };
  }, [stopTrainLoop]);

  return {
    playHorn,
    playWheelSound,
    playArrivalChime,
    announceStation,
    startTrainLoop,
    stopTrainLoop,
  };
}
