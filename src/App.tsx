import { Toaster } from 'react-hot-toast';
import Globe from './components/Globe';
import { TimerDisplay } from './components/TimerDisplay';
import { RoutePanel } from './components/RoutePanel';
import { SearchPanel } from './components/SearchPanel';
import { PresetsPanel } from './components/PresetsPanel';
import { StatsPanel } from './components/StatsPanel';
import { StationTooltip } from './components/StationTooltip';
import { Header } from './components/Header';

function App() {
  return (
    <div className="w-full h-screen bg-black overflow-hidden">
      {/* 3D Globe */}
      <Globe />

      {/* UI Overlays */}
      <Header />
      <RoutePanel />
      <TimerDisplay />
      <SearchPanel />
      <PresetsPanel />
      <StatsPanel />
      <StationTooltip />

      {/* Toast notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1f2937',
            color: '#fff',
            border: '1px solid #374151',
          },
        }}
      />
    </div>
  );
}

export default App;
