import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { dayKeyFromDate, todayKey } from '../data/workoutPlan';
import { useGamification } from './GamificationContext';
import { apiGet, apiPost } from '../lib/api';
import { CARDIO_ACTIVITIES } from '../components/cardio/ActivityCarousel';

export type CardioMode = 'cronometro' | 'definido';

export type CardioHistoryEntry = {
  date: string;
  dayKey: string;
  activityIndex: number;
  durationSeconds: number;
  targetSeconds: number;
};

export type CardioSessionResult = {
  durationSeconds: number;
  targetSeconds: number;
  diffSeconds: number;
};

type ApiCardioSession = {
  id: string;
  activity: string;
  durationSeconds: number;
  targetSeconds?: number | null;
  date: string;
};

function apiSessionToEntry(s: ApiCardioSession): CardioHistoryEntry {
  const activityIndex = Math.max(0, CARDIO_ACTIVITIES.findIndex((a) => a.label === s.activity));
  return {
    date: s.date,
    dayKey: dayKeyFromDate(new Date(s.date)),
    activityIndex,
    durationSeconds: s.durationSeconds,
    targetSeconds: s.targetSeconds ?? 0,
  };
}

type CardioTimerContextValue = {
  activityIndex: number;
  setActivityIndex: (index: number) => void;
  mode: CardioMode;
  setMode: (mode: CardioMode) => void;
  targetSeconds: number;
  setTargetSeconds: (seconds: number) => void;
  elapsedSeconds: number;
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
  history: CardioHistoryEntry[];
  finishSession: () => Promise<CardioSessionResult>;
};

const CardioTimerContext = createContext<CardioTimerContextValue | undefined>(
  undefined
);

export function CardioTimerProvider({ children }: { children: React.ReactNode }) {
  const { refresh: refreshGamification } = useGamification();
  const [activityIndex, setActivityIndex] = useState(0);
  const [mode, setModeState] = useState<CardioMode>('cronometro');
  const [targetSeconds, setTargetSecondsState] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [history, setHistory] = useState<CardioHistoryEntry[]>([]);

  useEffect(() => {
    apiGet<ApiCardioSession[]>('/cardio-sessions')
      .then((list) => setHistory(list.map(apiSessionToEntry)))
      .catch(() => {});
  }, []);

  // Um único interval, criado/limpo apenas quando isRunning ou mode mudam.
  useEffect(() => {
    if (!isRunning) return;

    const id = setInterval(() => {
      setElapsedSeconds((prev) => {
        if (mode === 'cronometro') return prev + 1;

        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [isRunning, mode]);

  const setMode = useCallback(
    (next: CardioMode) => {
      setModeState(next);
      setElapsedSeconds(next === 'cronometro' ? 0 : targetSeconds);
    },
    [targetSeconds]
  );

  const setTargetSeconds = useCallback((seconds: number) => {
    setTargetSecondsState(seconds);
    setElapsedSeconds(seconds);
  }, []);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setElapsedSeconds(mode === 'cronometro' ? 0 : targetSeconds);
  }, [mode, targetSeconds]);

  const reset = resetTimer;

  const finishSession = useCallback(async (): Promise<CardioSessionResult> => {
    const sessionTargetSeconds = mode === 'definido' ? targetSeconds : 0;
    const durationSeconds =
      mode === 'cronometro' ? elapsedSeconds : Math.max(0, targetSeconds - elapsedSeconds);

    const activityName = CARDIO_ACTIVITIES[activityIndex]?.label ?? 'Esteira';

    try {
      const created = await apiPost<ApiCardioSession>('/cardio-sessions', {
        activity: activityName,
        durationSeconds,
        targetSeconds: sessionTargetSeconds > 0 ? sessionTargetSeconds : undefined,
      });
      setHistory((prev) => [apiSessionToEntry(created), ...prev]);
    } catch {
      // Session still completes even if API call fails
    }

    resetTimer();
    await refreshGamification();

    return {
      durationSeconds,
      targetSeconds: sessionTargetSeconds,
      diffSeconds: durationSeconds - sessionTargetSeconds,
    };
  }, [mode, targetSeconds, elapsedSeconds, activityIndex, resetTimer, refreshGamification]);

  return (
    <CardioTimerContext.Provider
      value={{
        activityIndex,
        setActivityIndex,
        mode,
        setMode,
        targetSeconds,
        setTargetSeconds,
        elapsedSeconds,
        isRunning,
        start,
        pause,
        reset,
        history,
        finishSession,
      }}
    >
      {children}
    </CardioTimerContext.Provider>
  );
}

export function useCardioTimer() {
  const ctx = useContext(CardioTimerContext);
  if (!ctx)
    throw new Error('useCardioTimer precisa estar dentro de <CardioTimerProvider>');
  return ctx;
}
