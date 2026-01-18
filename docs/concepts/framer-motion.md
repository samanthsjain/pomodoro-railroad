# Framer Motion Animations

Framer Motion is a production-ready animation library for React. This project uses it for smooth UI transitions and micro-interactions.

## Why Framer Motion?

- **Declarative**: Animations defined as props
- **Gesture support**: Drag, hover, tap interactions
- **Layout animations**: Automatic animations when layout changes
- **AnimatePresence**: Animate elements entering/leaving the DOM
- **Spring physics**: Natural-feeling motion

## Core Concepts

### Basic Animation

```tsx
import { motion } from 'framer-motion';

function FadeIn() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      Content fades in
    </motion.div>
  );
}
```

### Animation Props

| Prop | Description |
|------|-------------|
| `initial` | Starting state |
| `animate` | Target state |
| `exit` | State when removed |
| `transition` | Timing and easing |
| `whileHover` | State on hover |
| `whileTap` | State when pressed |

## Usage in This Project

### Panel Slide-In (RoutePanel)

```tsx
<motion.div
  initial={{ opacity: 0, x: -50 }}
  animate={{ opacity: 1, x: 0 }}
  exit={{ opacity: 0, x: -50 }}
  className="fixed top-6 left-6"
>
  {/* Panel content */}
</motion.div>
```

### Timer Display Rise-Up

```tsx
<motion.div
  initial={{ opacity: 0, y: 50 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: 50 }}
  className="fixed bottom-6"
>
  {/* Timer content */}
</motion.div>
```

### Modal Entrance (SearchPanel)

```tsx
// Backdrop fade
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  className="fixed inset-0 bg-black/60"
/>

// Modal scale + slide
<motion.div
  initial={{ opacity: 0, scale: 0.95, y: -20 }}
  animate={{ opacity: 1, scale: 1, y: 0 }}
  exit={{ opacity: 0, scale: 0.95, y: -20 }}
>
  {/* Modal content */}
</motion.div>
```

## AnimatePresence

Required to animate elements being removed from the DOM:

```tsx
import { AnimatePresence } from 'framer-motion';

function Modal({ isOpen }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}  // This only works inside AnimatePresence
        >
          Modal content
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

## Progress Bar Animation

Smooth width transitions for the timer progress:

```tsx
<motion.div
  className="h-full bg-gradient-to-r from-green-500 to-red-500"
  initial={{ width: 0 }}
  animate={{ width: `${progress * 100}%` }}
  transition={{ duration: 0.5, ease: 'linear' }}
/>
```

## Button Interactions

Scale effects on hover and tap:

```tsx
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
>
  Click me
</motion.button>
```

## Transition Types

### Tween (Default)

```tsx
transition={{ duration: 0.3, ease: 'easeOut' }}
```

### Spring

```tsx
transition={{ type: 'spring', stiffness: 300, damping: 20 }}
```

### Inertia (for drag)

```tsx
transition={{ type: 'inertia', velocity: 50 }}
```

## Common Easing Functions

| Name | Use case |
|------|----------|
| `linear` | Progress bars, timers |
| `easeIn` | Elements leaving |
| `easeOut` | Elements entering |
| `easeInOut` | General purpose |

## Stagger Children

Animate list items sequentially:

```tsx
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

function List() {
  return (
    <motion.ul variants={container} initial="hidden" animate="show">
      {items.map((item) => (
        <motion.li key={item.id} variants={item}>
          {item.name}
        </motion.li>
      ))}
    </motion.ul>
  );
}
```

## Performance Tips

1. **Use `layout` prop sparingly**: Can be expensive
2. **Prefer transforms**: `x`, `y`, `scale`, `rotate` are GPU-accelerated
3. **Avoid animating `width`/`height`**: Use `scale` instead when possible
4. **Use `willChange`**: Framer adds this automatically

## Key Files

- `src/components/RoutePanel.tsx` - Panel slide animation
- `src/components/TimerDisplay.tsx` - Timer rise animation
- `src/components/SearchPanel.tsx` - Modal animations
- `src/components/PresetsPanel.tsx` - Modal animations
- `src/components/StatsPanel.tsx` - Panel animations

## Resources

- [Framer Motion Docs](https://www.framer.com/motion/)
- [Animation Examples](https://www.framer.com/motion/examples/)
- [AnimatePresence](https://www.framer.com/motion/animate-presence/)
