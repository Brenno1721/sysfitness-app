import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useAuth } from './AuthContext';
import { useGamification } from './GamificationContext';
import { usePlan } from './PlanContext';
import { markRoutineEdited } from '../lib/gamification';
import { apiGet, apiPost, apiPatch, apiDelete } from '../lib/api';
import { DAY_ORDER } from '../data/workoutPlan';
import type { DayPlan, Group } from '../data/workoutPlan';

export type WorkoutRoutine = {
  id: string;
  name: string;
  goal: string;
  days: Record<string, DayPlan>;
};

// Internal shapes matching the API response
type ApiExercise = {
  name: string;
  setsLabel: string;
  restSeconds: number | null;
  notes: string | null;
  order: number;
};
type ApiGroup = { name: string; order: number; exercises: ApiExercise[] };
type ApiDay = {
  dayKey: string;
  label: string;
  full: string | null;
  tag: string | null;
  isRest: boolean;
  groups: ApiGroup[];
};
type ApiRoutine = { id: string; name: string; goal: string; days: ApiDay[] };

const DAY_LABELS: Record<string, string> = {
  seg: 'Segunda', ter: 'Terça', qua: 'Quarta', qui: 'Quinta',
  sex: 'Sexta', sab: 'Sábado', dom: 'Domingo',
};

function apiToLocal(r: ApiRoutine): WorkoutRoutine {
  const days: Record<string, DayPlan> = {};
  for (const day of r.days) {
    if (day.isRest) {
      days[day.dayKey] = { label: day.label, rest: true };
    } else {
      days[day.dayKey] = {
        label: day.label,
        full: day.full ?? '',
        tag: day.tag ?? '',
        groups: day.groups.map((g) => ({
          name: g.name,
          exercises: g.exercises.map((ex) => ({
            name: ex.name,
            sets: ex.setsLabel,
            restSeconds: ex.restSeconds ?? undefined,
            notes: ex.notes ?? undefined,
          })),
        })),
      };
    }
  }
  return { id: r.id, name: r.name, goal: r.goal, days };
}

function localToApiPayload(routine: WorkoutRoutine) {
  return {
    name: routine.name,
    goal: routine.goal,
    days: DAY_ORDER.map((dayKey) => {
      const day = routine.days[dayKey];
      if (!day || 'rest' in day) {
        return {
          dayKey,
          label: (day as any)?.label ?? DAY_LABELS[dayKey] ?? dayKey,
          isRest: true,
          groups: [],
        };
      }
      const workoutDay = day as Extract<DayPlan, { groups: Group[] }>;
      return {
        dayKey,
        label: workoutDay.label,
        full: workoutDay.full,
        tag: workoutDay.tag,
        isRest: false,
        groups: workoutDay.groups.map((g, gi) => ({
          name: g.name,
          order: gi,
          exercises: g.exercises.map((ex, ei) => ({
            name: ex.name,
            setsLabel: ex.sets,
            restSeconds: ex.restSeconds ?? null,
            notes: ex.notes ?? null,
            order: ei,
          })),
        })),
      };
    }),
  };
}

type RoutineContextValue = {
  routines: WorkoutRoutine[];
  activeRoutineId: string | null;
  activeRoutine: WorkoutRoutine | null;
  isLoading: boolean;
  error: string | null;
  addRoutine: (routine: WorkoutRoutine) => Promise<void>;
  updateRoutine: (id: string, changes: Partial<WorkoutRoutine>) => Promise<void>;
  deleteRoutine: (id: string) => void;
  setActiveRoutineId: (id: string) => void;
};

const RoutineContext = createContext<RoutineContextValue | undefined>(undefined);

export function RoutineProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const { refresh: refreshGamification } = useGamification();
  const { hasFeature } = usePlan();
  const [routines, setRoutines] = useState<WorkoutRoutine[]>([]);
  const [activeRoutineId, setActiveRoutineIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRoutines = useCallback(async () => {
    if (!userId) {
      setRoutines([]);
      setActiveRoutineIdState(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const summaries = await apiGet<{ id: string }[]>('/routines');
      const full = await Promise.all(
        summaries.map((s) => apiGet<ApiRoutine>(`/routines/${s.id}`))
      );
      setRoutines(full.map(apiToLocal));

      try {
        const active = await apiGet<ApiRoutine>('/routines/active');
        setActiveRoutineIdState(active.id);
      } catch {
        setActiveRoutineIdState(null);
      }
    } catch {
      setError('Não foi possível carregar suas rotinas.');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    let cancelled = false;

    setRoutines([]);
    setActiveRoutineIdState(null);
    setError(null);

    if (!userId) {
      setIsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setIsLoading(true);

    (async () => {
      try {
        const summaries = await apiGet<{ id: string }[]>('/routines');
        const full = await Promise.all(
          summaries.map((s) => apiGet<ApiRoutine>(`/routines/${s.id}`))
        );

        if (cancelled) return;
        setRoutines(full.map(apiToLocal));

        try {
          const active = await apiGet<ApiRoutine>('/routines/active');
          if (!cancelled) setActiveRoutineIdState(active.id);
        } catch {
          if (!cancelled) setActiveRoutineIdState(null);
        }

        if (!cancelled) setError(null);
      } catch {
        if (!cancelled) setError('Não foi possível carregar suas rotinas.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const setActiveRoutineId = useCallback((id: string) => {
    apiPost(`/routines/${id}/activate`, undefined).catch(() => {});
    setActiveRoutineIdState(id);
  }, []);

  const addRoutine = useCallback(
    async (routine: WorkoutRoutine) => {
      const maxRoutines = hasFeature('maxRoutines');
      if (maxRoutines !== null && routines.length >= maxRoutines) return;
      const result = await apiPost<ApiRoutine>('/routines', localToApiPayload(routine));
      setRoutines((prev) => [...prev, apiToLocal(result)]);
      await refreshGamification();
    },
    [routines, refreshGamification, hasFeature]
  );

  const updateRoutine = useCallback(
    async (id: string, changes: Partial<WorkoutRoutine>) => {
      const existing = routines.find((r) => r.id === id);
      if (!existing) return;
      const merged = { ...existing, ...changes };
      const result = await apiPatch<ApiRoutine>(`/routines/${id}`, localToApiPayload(merged));
      setRoutines((prev) => prev.map((r) => (r.id === id ? apiToLocal(result) : r)));
      if (user) await markRoutineEdited(user.id);
      await refreshGamification();
    },
    [routines, refreshGamification, user]
  );

  const deleteRoutine = useCallback(
    (id: string) => {
      apiDelete(`/routines/${id}`).catch(() => {});
      setRoutines((prev) => {
        const list = prev.filter((r) => r.id !== id);
        if (activeRoutineId === id) {
          setActiveRoutineIdState(list[0]?.id ?? null);
        }
        return list;
      });
    },
    [activeRoutineId]
  );

  const activeRoutine = routines.find((r) => r.id === activeRoutineId) ?? null;

  return (
    <RoutineContext.Provider
      value={{
        routines,
        activeRoutineId,
        activeRoutine,
        isLoading,
        error,
        addRoutine,
        updateRoutine,
        deleteRoutine,
        setActiveRoutineId,
      }}
    >
      {children}
    </RoutineContext.Provider>
  );
}

export function useRoutine() {
  const ctx = useContext(RoutineContext);
  if (!ctx) throw new Error('useRoutine precisa estar dentro de <RoutineProvider>');
  return ctx;
}
