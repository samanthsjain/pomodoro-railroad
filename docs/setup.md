# Setup and Running Guide

## Prerequisites

- **Node.js** 18+ (recommended: 20+)
- **pnpm** (recommended) or npm/yarn
- A modern browser with WebGL support

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pomodoro-railroad
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Start the development server**
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:5173`

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server with hot reload |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build locally |
| `pnpm lint` | Run ESLint for code quality |

## Production Build

```bash
pnpm build
```

This creates an optimized build in the `dist/` folder. The build includes:
- Minified JavaScript bundles
- Tree-shaken unused code
- Optimized assets

## Project Structure

```
pomodoro-railroad/
├── src/
│   ├── components/     # React components
│   │   ├── Globe.tsx       # 3D globe visualization
│   │   ├── TimerDisplay.tsx # Timer UI
│   │   ├── RoutePanel.tsx   # Route selection
│   │   ├── SearchPanel.tsx  # Station search
│   │   ├── PresetsPanel.tsx # Preset routes
│   │   └── StatsPanel.tsx   # User statistics
│   ├── data/
│   │   └── stations.ts  # Station and route data
│   ├── hooks/
│   │   └── useSound.ts  # Audio feedback
│   ├── store/
│   │   └── useStore.ts  # Zustand state management
│   ├── types/
│   │   └── index.ts     # TypeScript definitions
│   ├── App.tsx          # Main application
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
├── docs/                # Documentation
├── public/              # Static assets
└── package.json
```

## Tech Stack

| Technology | Purpose |
|------------|---------|
| React 19 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool and dev server |
| Three.js | 3D graphics |
| React Three Fiber | React renderer for Three.js |
| Zustand | State management |
| Framer Motion | Animations |
| TailwindCSS | Styling |

## Browser Support

The app requires WebGL support. Compatible browsers:
- Chrome 80+
- Firefox 75+
- Safari 14+
- Edge 80+

## Troubleshooting

### Globe not rendering
- Ensure WebGL is enabled in your browser
- Check console for Three.js errors
- Try refreshing the page

### Timer not ticking
- Check if the browser tab is in focus
- Some browsers throttle background tabs

### localStorage not persisting
- Ensure cookies/storage are enabled
- Check if private/incognito mode is blocking storage
