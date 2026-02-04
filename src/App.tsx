import { useEffect, useState, useRef } from 'react';
import { Toaster } from 'react-hot-toast';
import MapView from './components/MapView';
import { TimerDisplay } from './components/TimerDisplay';
import { RoutePanel } from './components/RoutePanel';
import { StationSearch } from './components/StationSearch';
import { StatsPanel } from './components/StatsPanel';
import { StationTooltip } from './components/StationTooltip';
import { Header } from './components/Header';
import { TicketStamp } from './components/TicketStamp';
import { SeatSelector } from './components/SeatSelector';
import { TrainCabin } from './components/TrainCabin';
import { PomodoroMapView } from './components/PomodoroMapView';
import { MapStyleToggle } from './components/MapStyleToggle';
import { CountrySelector } from './components/CountrySelector';
import { Confetti } from './components/Confetti';
import { useStore } from './store/useStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

function App() {
  const pomodoroViewMode = useStore((state) => state.pomodoroViewMode);
  const currentStation = useStore((state) => state.currentStation);
  const apiRoutes = useStore((state) => state.apiRoutes);
  const loadConnectedStations = useStore((state) => state.loadConnectedStations);
  const timerStatus = useStore((state) => state.timer.status);
  const [showConfetti, setShowConfetti] = useState(false);
  const prevStatus = useRef(timerStatus);

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  // Trigger confetti when journey completes (entering break)
  useEffect(() => {
    if (prevStatus.current === 'running' && timerStatus === 'break') {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
    prevStatus.current = timerStatus;
  }, [timerStatus]);

  // Regenerate routes after page reload if we have a station but no routes
  useEffect(() => {
    if (currentStation && apiRoutes.length === 0) {
      loadConnectedStations();
    }
  }, [currentStation, apiRoutes.length, loadConnectedStations]);

  return (
    <div className="w-full h-screen overflow-hidden grain-overlay" style={{ background: 'var(--color-bg-primary)' }}>
      {/* Google Maps */}
      <MapView />

      {/* UI Overlays */}
      <Header />
      <RoutePanel />
      <TimerDisplay />
      <StationSearch />
      <StatsPanel />
      <StationTooltip />
      <MapStyleToggle />

      {/* Country selector modal */}
      <CountrySelector />

      {/* Seat selection overlay */}
      <SeatSelector />

      {/* Ticket stamping overlay */}
      <TicketStamp />

      {/* Pomodoro experience - cabin or map view */}
      {pomodoroViewMode === 'cabin' ? <TrainCabin /> : <PomodoroMapView />}

      {/* Confetti celebration on journey completion */}
      <Confetti isActive={showConfetti} />

      {/* Toast notifications - Apple style */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--color-bg-glass)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-separator)',
            borderRadius: '12px',
            fontFamily: 'var(--font-text)',
            fontSize: '15px',
          },
          success: {
            iconTheme: {
              primary: 'var(--color-accent-green)',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: 'var(--color-accent-red)',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
}

export default App;
