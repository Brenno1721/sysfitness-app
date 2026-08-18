import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import {
  computeXP,
  getLevelInfo,
  computeStreak,
  checkAndUnlockAchievements,
  getUnlockedAchievementIds,
  Achievement,
  LevelInfo,
} from '../lib/gamification';

type LevelProgress = { current: LevelInfo; next: LevelInfo | null; progress: number };

type GamificationContextValue = {
  xp: number;
  levelInfo: LevelProgress;
  streak: { current: number; longest: number };
  unlockedAchievements: string[];
  celebrationQueue: Achievement[];
  dismissCelebration: () => void;
  refresh: () => Promise<void>;
};

const GamificationContext = createContext<GamificationContextValue | undefined>(undefined);

export function GamificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [xp, setXp] = useState(0);
  const [levelInfo, setLevelInfo] = useState<LevelProgress>(() => getLevelInfo(0));
  const [streak, setStreak] = useState({ current: 0, longest: 0 });
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [celebrationQueue, setCelebrationQueue] = useState<Achievement[]>([]);

  const refresh = useCallback(async () => {
    if (!userId) return;

    const [nextXp, nextStreak, newlyUnlocked] = await Promise.all([
      computeXP(userId),
      computeStreak(userId),
      checkAndUnlockAchievements(userId),
    ]);
    const allUnlocked = await getUnlockedAchievementIds(userId);

    setXp(nextXp);
    setLevelInfo(getLevelInfo(nextXp));
    setStreak(nextStreak);
    setUnlockedAchievements(allUnlocked);

    if (newlyUnlocked.length > 0) {
      setCelebrationQueue((prev) => [...prev, ...newlyUnlocked]);
    }
  }, [userId]);

  const dismissCelebration = useCallback(() => {
    setCelebrationQueue((prev) => prev.slice(1));
  }, []);

  // Troca de conta (login/logout/outra conta no mesmo aparelho): zera o estado em
  // memória da conta anterior antes de buscar os dados da conta atual — sem isso o
  // app continuaria mostrando o XP/conquistas de quem estava logado antes.
  useEffect(() => {
    setXp(0);
    setLevelInfo(getLevelInfo(0));
    setStreak({ current: 0, longest: 0 });
    setUnlockedAchievements([]);
    setCelebrationQueue([]);
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return (
    <GamificationContext.Provider
      value={{
        xp,
        levelInfo,
        streak,
        unlockedAchievements,
        celebrationQueue,
        dismissCelebration,
        refresh,
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const ctx = useContext(GamificationContext);
  if (!ctx) throw new Error('useGamification precisa estar dentro de <GamificationProvider>');
  return ctx;
}
