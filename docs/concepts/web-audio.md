# Web Audio API

This project uses the Web Audio API to generate sound effects without loading audio files.

## Why Web Audio?

- **No external files**: Sounds generated programmatically
- **Small bundle**: No audio assets to download
- **Customizable**: Easy to tweak frequencies and timing
- **Cross-browser**: Well supported in modern browsers

## How It Works

### AudioContext

The AudioContext is the main interface for managing audio:

```tsx
const audioContext = new AudioContext();
```

### Oscillator

Generates sound waves at a specific frequency:

```tsx
const oscillator = audioContext.createOscillator();
oscillator.type = 'sine';  // or 'square', 'triangle', 'sawtooth'
oscillator.frequency.setValueAtTime(440, audioContext.currentTime);  // A4 note
```

### Gain Node

Controls volume:

```tsx
const gainNode = audioContext.createGain();
gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);  // 50% volume
```

### Connecting Nodes

Audio flows through a chain of nodes:

```
Oscillator → Gain → Destination (speakers)
```

```tsx
oscillator.connect(gainNode);
gainNode.connect(audioContext.destination);
```

## Implementation in This Project

### useSound Hook

Located in `src/hooks/useSound.ts`:

```tsx
export function useSound() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  }, []);

  const playTone = useCallback((
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine'
  ) => {
    const ctx = getContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    // Fade in and out to avoid clicks
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }, [getContext]);

  // ...
}
```

### Sound Effects

#### Departure Sound
Two descending tones mimicking a train whistle:

```tsx
const playDeparture = useCallback(() => {
  playTone(880, 0.3, 'sine');  // High note
  setTimeout(() => playTone(660, 0.4, 'sine'), 300);  // Lower note
}, [playTone]);
```

#### Arrival Chime
Pleasant ascending chord (C-E-G):

```tsx
const playArrival = useCallback(() => {
  playTone(523, 0.15, 'sine');  // C5
  setTimeout(() => playTone(659, 0.15, 'sine'), 150);  // E5
  setTimeout(() => playTone(784, 0.3, 'sine'), 300);  // G5
}, [playTone]);
```

#### Break End Reminder
Gentle triangle wave:

```tsx
const playBreakEnd = useCallback(() => {
  playTone(440, 0.2, 'triangle');
  setTimeout(() => playTone(550, 0.2, 'triangle'), 200);
}, [playTone]);
```

## Musical Note Frequencies

| Note | Frequency (Hz) |
|------|----------------|
| C4 | 261.63 |
| D4 | 293.66 |
| E4 | 329.63 |
| F4 | 349.23 |
| G4 | 392.00 |
| A4 | 440.00 |
| B4 | 493.88 |
| C5 | 523.25 |

## Oscillator Types

| Type | Sound Character |
|------|-----------------|
| `sine` | Pure, smooth tone |
| `square` | Hollow, buzzy |
| `triangle` | Softer than square |
| `sawtooth` | Bright, buzzy |

## Fade In/Out (Envelope)

To avoid clicking sounds, we ramp the volume:

```tsx
// Start at 0 volume
gainNode.gain.setValueAtTime(0, ctx.currentTime);

// Fade in over 50ms
gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);

// Fade out by end of duration
gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
```

## Browser Considerations

### Autoplay Policy

Browsers require user interaction before playing audio:

```tsx
// AudioContext may start in 'suspended' state
if (audioContext.state === 'suspended') {
  audioContext.resume();
}
```

In this app, sounds only play after user actions (starting a journey, arriving at a station), so this isn't an issue.

### Cleanup

AudioContext should be reused, not recreated. The hook stores it in a ref:

```tsx
const audioContextRef = useRef<AudioContext | null>(null);
```

## Key Files

- `src/hooks/useSound.ts` - Sound generation hook
- `src/components/TimerDisplay.tsx` - Sound effect triggers

## Resources

- [Web Audio API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Oscillator MDN](https://developer.mozilla.org/en-US/docs/Web/API/OscillatorNode)
- [Audio Worklet](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet) (for advanced use)
