import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, X, MapPin, Globe, Clock, Route, Flag, Zap, Target, Trophy } from 'lucide-react';
import { useStore } from '../store/useStore';
import { achievements } from '../types';

export function StatsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements'>('overview');
  const { progress, timer } = useStore();

  // Don't show during journey
  if (timer.status !== 'idle') return null;

  const dailyProgress = progress.dailyGoalMinutes > 0
    ? Math.min((progress.todayMinutes / progress.dailyGoalMinutes) * 100, 100)
    : 0;

  const unlockedCount = (progress.unlockedAchievements || []).length;
  const totalAchievements = achievements.length;

  return (
    <>
      {/* Stats button with streak indicator */}
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-40 flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-colors"
        style={{
          background: 'var(--color-bg-glass)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderColor: 'var(--color-separator)',
        }}
      >
        <BarChart3 className="w-5 h-5 text-[var(--color-accent-blue)]" />
        <span className="text-[var(--color-text-primary)]">Stats</span>
        {progress.currentStreak > 0 && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--color-accent-orange)]/20">
            <Zap className="w-3 h-3 text-[var(--color-accent-orange)]" />
            <span className="text-xs font-bold text-[var(--color-accent-orange)]">{progress.currentStreak}</span>
          </div>
        )}
      </motion.button>

      {/* Stats modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-50"
              style={{
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
              }}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed bottom-[5%] left-6 z-50 w-full max-w-md"
            >
              <div
                className="rounded-2xl border overflow-hidden"
                style={{
                  background: 'var(--color-bg-secondary)',
                  borderColor: 'var(--color-separator)',
                  boxShadow: 'var(--shadow-xl)',
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-separator)' }}>
                  <h2 className="text-title-lg text-[var(--color-text-primary)]">Your Journey</h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-fill-tertiary)] transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Tab bar */}
                <div className="flex p-1 mx-4 mt-3 rounded-lg" style={{ background: 'var(--color-fill-tertiary)' }}>
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`flex-1 py-2 px-4 rounded-md text-subhead font-medium transition-all ${
                      activeTab === 'overview'
                        ? 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] shadow-sm'
                        : 'text-[var(--color-text-secondary)]'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('achievements')}
                    className={`flex-1 py-2 px-4 rounded-md text-subhead font-medium transition-all flex items-center justify-center gap-2 ${
                      activeTab === 'achievements'
                        ? 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] shadow-sm'
                        : 'text-[var(--color-text-secondary)]'
                    }`}
                  >
                    Achievements
                    <span className="text-caption text-[var(--color-accent-purple)]">{unlockedCount}/{totalAchievements}</span>
                  </button>
                </div>

                {activeTab === 'overview' ? (
                  <>
                    {/* Daily goal card */}
                    <div className="p-4">
                      <div className="p-4 rounded-xl" style={{ background: 'var(--color-fill-tertiary)' }}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Target className="w-5 h-5 text-[var(--color-accent-green)]" />
                            <span className="text-subhead font-medium text-[var(--color-text-primary)]">Daily Goal</span>
                          </div>
                          <span className="text-caption text-[var(--color-text-secondary)]">
                            {progress.todayMinutes || 0} / {progress.dailyGoalMinutes || 25} min
                          </span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-fill-secondary)' }}>
                          <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-[var(--color-accent-green)] to-[var(--color-accent-teal)]"
                            initial={{ width: 0 }}
                            animate={{ width: `${dailyProgress}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                          />
                        </div>
                        {dailyProgress >= 100 && (
                          <p className="mt-2 text-caption text-[var(--color-accent-green)] font-medium">
                            Goal completed! Great focus today.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Streak card */}
                    <div className="px-4 pb-4">
                      <div className="p-4 rounded-xl bg-gradient-to-br from-[var(--color-accent-orange)]/20 to-[var(--color-accent-red)]/10 border border-[var(--color-accent-orange)]/30">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Zap className="w-5 h-5 text-[var(--color-accent-orange)]" />
                              <span className="text-subhead font-medium text-[var(--color-text-primary)]">Current Streak</span>
                            </div>
                            <p className="text-display-sm text-[var(--color-accent-orange)]">{progress.currentStreak || 0} days</p>
                          </div>
                          <div className="text-right">
                            <p className="text-caption text-[var(--color-text-tertiary)]">Longest</p>
                            <p className="text-title-md text-[var(--color-text-secondary)]">{progress.longestStreak || 0} days</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stats grid */}
                    <div className="p-4 pt-0 grid grid-cols-2 gap-3">
                      <div className="p-4 rounded-xl" style={{ background: 'var(--color-fill-tertiary)' }}>
                        <div className="flex items-center gap-2 text-[var(--color-accent-blue)] mb-2">
                          <Route className="w-4 h-4" />
                          <span className="text-caption font-medium">Distance</span>
                        </div>
                        <p className="text-title-lg text-[var(--color-text-primary)]">
                          {progress.totalDistanceKm.toLocaleString()}
                        </p>
                        <p className="text-caption text-[var(--color-text-tertiary)]">kilometers</p>
                      </div>

                      <div className="p-4 rounded-xl" style={{ background: 'var(--color-fill-tertiary)' }}>
                        <div className="flex items-center gap-2 text-[var(--color-accent-green)] mb-2">
                          <Clock className="w-4 h-4" />
                          <span className="text-caption font-medium">Focus Time</span>
                        </div>
                        <p className="text-title-lg text-[var(--color-text-primary)]">
                          {Math.floor(progress.totalTimeMinutes / 60)}h {progress.totalTimeMinutes % 60}m
                        </p>
                        <p className="text-caption text-[var(--color-text-tertiary)]">total</p>
                      </div>

                      <div className="p-4 rounded-xl" style={{ background: 'var(--color-fill-tertiary)' }}>
                        <div className="flex items-center gap-2 text-[var(--color-accent-purple)] mb-2">
                          <MapPin className="w-4 h-4" />
                          <span className="text-caption font-medium">Stations</span>
                        </div>
                        <p className="text-title-lg text-[var(--color-text-primary)]">
                          {progress.visitedStations.length}
                        </p>
                        <p className="text-caption text-[var(--color-text-tertiary)]">visited</p>
                      </div>

                      <div className="p-4 rounded-xl" style={{ background: 'var(--color-fill-tertiary)' }}>
                        <div className="flex items-center gap-2 text-[var(--color-accent-pink)] mb-2">
                          <Flag className="w-4 h-4" />
                          <span className="text-caption font-medium">Countries</span>
                        </div>
                        <p className="text-title-lg text-[var(--color-text-primary)]">
                          {progress.countriesVisited.length}
                        </p>
                        <p className="text-caption text-[var(--color-text-tertiary)]">explored</p>
                      </div>
                    </div>

                    {/* Sessions badge */}
                    <div className="px-4 pb-4">
                      <div className="p-4 rounded-xl bg-gradient-to-r from-[var(--color-accent-green)]/20 to-[var(--color-accent-teal)]/10 border border-[var(--color-accent-green)]/30">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-caption text-[var(--color-accent-green)] mb-1">Journeys Completed</p>
                            <p className="text-display-sm text-[var(--color-text-primary)]">{progress.sessionsCompleted}</p>
                          </div>
                          <Globe className="w-12 h-12 text-[var(--color-accent-green)]/30" />
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Achievements tab */
                  <div className="p-4 max-h-[50vh] overflow-y-auto">
                    <div className="space-y-2">
                      {achievements.map((achievement) => {
                        const isUnlocked = (progress.unlockedAchievements || []).includes(achievement.id);
                        return (
                          <div
                            key={achievement.id}
                            className={`p-3 rounded-xl flex items-center gap-3 transition-all ${
                              isUnlocked
                                ? 'bg-gradient-to-r from-[var(--color-accent-purple)]/20 to-transparent border border-[var(--color-accent-purple)]/30'
                                : 'bg-[var(--color-fill-tertiary)] opacity-60'
                            }`}
                          >
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                                isUnlocked ? '' : 'grayscale'
                              }`}
                              style={{ background: isUnlocked ? 'var(--color-fill-tertiary)' : 'var(--color-fill-secondary)' }}
                            >
                              {achievement.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-subhead font-medium ${
                                isUnlocked ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'
                              }`}>
                                {achievement.name}
                              </p>
                              <p className="text-caption text-[var(--color-text-tertiary)] truncate">
                                {achievement.description}
                              </p>
                            </div>
                            {isUnlocked && (
                              <Trophy className="w-4 h-4 text-[var(--color-accent-purple)] shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {progress.sessionsCompleted === 0 && activeTab === 'overview' && (
                  <div className="px-4 pb-6 text-center">
                    <p className="text-[var(--color-text-secondary)]">
                      Complete your first journey to start tracking your progress!
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
