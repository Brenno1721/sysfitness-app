import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoutine } from './RoutineContext';
import { useGamification } from './GamificationContext';
import { apiGet, apiPost } from '../lib/api';
import { DayPlan, todayKey } from '../data/workoutPlan';
import type { WeightRecord } from '../lib/exerciseWeights';

export type SetLog = { reps: string; weight: string };
export type ExEntry = { done: boolean; setsLog: SetLog[]; finishedEarly?: boolean };
export type DayState = Record<string, ExEntry>; // key: "groupIndex-exIndex"

export type HistoryEntry = {
  date: string; // ISO
  dayKey: string;
  full: string;
  completed: number;
  total: number;
  durationSeconds?: number;
  hadEarlyFinish?: boolean;
};

const CUSTOM_ORDER_KEY = 'workout:customOrder';

const DAY_LABELS_PT: Record<string, string> = {
  seg: 'Segunda', ter: 'Terça', qua: 'Quarta', qui: 'Quinta',
  sex: 'Sexta', sab: 'Sábado', dom: 'Domingo',
};

// Internal shape for the sessions API response
type ApiSetLog = { exerciseName: string; setNumber: number; reps: number; weight: number };
type ApiSession = {
  id: string;
  routineId?: string | null;
  dayKey: string;
  date: string;
  durationSeconds: number;
  totalVolume: number;
  completedExercises: number;
  totalExercises: number;
  setLogs?: ApiSetLog[];
};

type WorkoutLogContextValue = {
  currentDay: string;
  setCurrentDay: (d: string) => void;
  dayState: DayState;
  toggleExercise: (key: string) => void;
  logSet: (key: string, set: SetLog, totalSets: number) => void;
  updateSetLog: (key: string, index: number, set: SetLog) => void;
  finishExerciseEarly: (key: string) => void;
  customOrder: string[] | null;
  setCustomOrder: (orderedKeys: string[]) => void;
  resetDay: () => Promise<void>;
  finishWorkout: (plan: DayPlan, durationSeconds?: number) => Promise<void>;
  history: HistoryEntry[];
  weekProgress: boolean[];
  exerciseHistory: Record<string, WeightRecord[]>;
  volumeByRoutine: Record<string, number[]>;
};

const WorkoutLogContext = createContext<WorkoutLogContextValue | undefined>(
  undefined
);

export function WorkoutLogProvider({ children }: { children: React.ReactNode }) {
  const { activeRoutineId, routines } = useRoutine();
  const { refresh: refreshGamification } = useGamification();
  const [currentDay, setCurrentDayState] = useState(todayKey());
  const [dayState, setDayState] = useState<DayState>({});
  const [sessions, setSessions] = useState<ApiSession[]>([]);
  const [customOrder, setCustomOrderState] = useState<string[] | null>(null);

  const loadSessions = useCallback(async () => {
    try {
      const data = await apiGet<ApiSession[]>('/sessions');
      setSessions(data);
    } catch {
      // Network error on load: keep empty list, won't crash
    }
  }, []);

  const loadDay = useCallback(async (day: string) => {
    const raw = await AsyncStorage.getItem(`checklist:${day}`);
    setDayState(raw ? JSON.parse(raw) : {});
  }, []);

  const loadCustomOrder = useCallback(async () => {
    const raw = await AsyncStorage.getItem(CUSTOM_ORDER_KEY);
    setCustomOrderState(raw ? JSON.parse(raw) : null);
  }, []);

  useEffect(() => {
    loadDay(currentDay);
  }, [currentDay, loadDay]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    loadCustomOrder();
  }, [loadCustomOrder]);

  const setCurrentDay = (d: string) => setCurrentDayState(d);

  const persist = async (day: string, data: DayState) => {
    setDayState(data);
    await AsyncStorage.setItem(`checklist:${day}`, JSON.stringify(data));
  };

  const toggleExercise = (key: string) => {
    const entry = dayState[key] || { done: false, setsLog: [] };
    persist(currentDay, { ...dayState, [key]: { ...entry, done: !entry.done } });
  };

  const logSet = (key: string, set: SetLog, totalSets: number) => {
    const entry = dayState[key] || { done: false, setsLog: [] };
    const setsLog = [...entry.setsLog, set];
    const done = setsLog.length >= totalSets;
    persist(currentDay, { ...dayState, [key]: { done, setsLog } });
  };

  const updateSetLog = (key: string, index: number, set: SetLog) => {
    const entry = dayState[key];
    if (!entry) return;
    const setsLog = entry.setsLog.map((s, i) => (i === index ? set : s));
    persist(currentDay, { ...dayState, [key]: { ...entry, setsLog } });
  };

  const finishExerciseEarly = (key: string) => {
    const entry = dayState[key] || { done: false, setsLog: [] };
    persist(currentDay, { ...dayState, [key]: { ...entry, done: true, finishedEarly: true } });
  };

  const setCustomOrder = (orderedKeys: string[]) => {
    setCustomOrderState(orderedKeys);
    AsyncStorage.setItem(CUSTOM_ORDER_KEY, JSON.stringify(orderedKeys));
  };

  const resetDay = async () => {
    setDayState({});
    setCustomOrderState(null);
    await Promise.all([
      AsyncStorage.setItem(`checklist:${currentDay}`, JSON.stringify({})),
      AsyncStorage.removeItem(CUSTOM_ORDER_KEY),
    ]);
  };

  const finishWorkout = async (plan: DayPlan, durationSeconds?: number) => {
    if ('rest' in plan) return;

    let total = 0;
    let completed = 0;
    let hadEarlyFinish = false;
    const setLogs: ApiSetLog[] = [];

    plan.groups.forEach((g, gi) =>
      g.exercises.forEach((ex, ei) => {
        total++;
        const exEntry = dayState[`${gi}-${ei}`];
        if (exEntry?.done) completed++;
        if (exEntry?.finishedEarly) hadEarlyFinish = true;
        exEntry?.setsLog.forEach((s, si) => {
          setLogs.push({
            exerciseName: ex.name,
            setNumber: si + 1,
            reps: parseFloat(s.reps) || 0,
            weight: parseFloat(s.weight) || 0,
          });
        });
      })
    );

    try {
      const created = await apiPost<ApiSession>('/sessions', {
        routineId: activeRoutineId ?? undefined,
        dayKey: currentDay,
        durationSeconds: durationSeconds ?? 0,
        completedExercises: completed,
        totalExercises: total,
        setLogs,
      });
      setSessions((prev) => [created, ...prev]);
    } catch {
      // Best effort: if session fails to save, workout still finishes
    }

    await refreshGamification();
  };

  // Derive HistoryEntry list from sessions + routines for the "full" label
  const history: HistoryEntry[] = sessions.map((s) => {
    let full = DAY_LABELS_PT[s.dayKey] ?? s.dayKey;
    if (s.routineId) {
      const routine = routines.find((r) => r.id === s.routineId);
      if (routine) {
        const day = routine.days[s.dayKey];
        if (day && !('rest' in day)) full = day.full || full;
      }
    }
    return {
      date: s.date,
      dayKey: s.dayKey,
      full,
      completed: s.completedExercises,
      total: s.totalExercises,
      durationSeconds: s.durationSeconds,
    };
  });

  // Build exercise weight history from finished sessions (last set per exercise per session)
  const exerciseHistory: Record<string, WeightRecord[]> = (() => {
    const map: Record<string, WeightRecord[]> = {};
    const sorted = [...sessions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    for (const session of sorted) {
      if (!session.setLogs?.length) continue;
      // Take the last set by setNumber per exercise in this session
      const perExercise: Record<string, ApiSetLog> = {};
      for (const log of session.setLogs) {
        if (!perExercise[log.exerciseName] || log.setNumber > perExercise[log.exerciseName].setNumber) {
          perExercise[log.exerciseName] = log;
        }
      }
      for (const [name, log] of Object.entries(perExercise)) {
        if (!map[name]) map[name] = [];
        map[name].push({ reps: log.reps, weight: log.weight, date: session.date });
      }
    }
    return map;
  })();

  // Volume history per routine for the mini chart
  const volumeByRoutine: Record<string, number[]> = (() => {
    const map: Record<string, number[]> = {};
    const sorted = [...sessions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    for (const s of sorted) {
      if (!s.routineId) continue;
      if (!map[s.routineId]) map[s.routineId] = [];
      map[s.routineId].push(s.totalVolume);
    }
    return map;
  })();

  const weekProgress = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'].map(
    (d) => history.some((h) => h.dayKey === d)
  );

  return (
    <WorkoutLogContext.Provider
      value={{
        currentDay,
        setCurrentDay,
        dayState,
        toggleExercise,
        logSet,
        updateSetLog,
        finishExerciseEarly,
        customOrder,
        setCustomOrder,
        resetDay,
        finishWorkout,
        history,
        weekProgress,
        exerciseHistory,
        volumeByRoutine,
      }}
    >
      {children}
    </WorkoutLogContext.Provider>
  );
}

export function useWorkoutLog() {
  const ctx = useContext(WorkoutLogContext);
  if (!ctx)
    throw new Error(
      'useWorkoutLog precisa estar dentro de <WorkoutLogProvider>'
    );
  return ctx;
}
