import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Alert, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const SESSION_STORAGE_KEY = 'workout:session';

type SessionData = {
  isActive: boolean;
  startedAt: number | null;
  dayKey: string | null;
};

type WorkoutSessionContextValue = {
  isActive: boolean;
  startedAt: number | null;
  dayKey: string | null;
  elapsedSeconds: number;
  startSession: (dayKey: string) => void;
  endSession: () => void;
};

const WorkoutSessionContext = createContext<WorkoutSessionContextValue | undefined>(
  undefined
);

export function WorkoutSessionProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [dayKey, setDayKey] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  // Ref keeps isActive readable inside the AppState closure without stale capture.
  const isActiveRef = useRef(false);
  useEffect(() => { isActiveRef.current = isActive; }, [isActive]);

  // Restaura a sessão salva ao montar (app fechado/reaberto continua de onde parou).
  useEffect(() => {
    AsyncStorage.getItem(SESSION_STORAGE_KEY).then((raw) => {
      if (!raw) return;
      const data: SessionData = JSON.parse(raw);
      if (data.isActive && data.startedAt) {
        setIsActive(true);
        setStartedAt(data.startedAt);
        setDayKey(data.dayKey);
      }
    });
  }, []);

  // Recalcula a partir do timestamp — nunca acumula +1, então sobrevive ao app
  // ir pro background (um contador incremental perderia os segundos suspensos).
  useEffect(() => {
    if (!isActive || startedAt === null) {
      setElapsedSeconds(0);
      return;
    }
    const tick = () => setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isActive, startedAt]);

  const persist = useCallback((data: SessionData) => {
    AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
  }, []);

  const startSession = useCallback(
    (day: string) => {
      const now = Date.now();
      setIsActive(true);
      setStartedAt(now);
      setDayKey(day);
      persist({ isActive: true, startedAt: now, dayKey: day });
    },
    [persist]
  );

  const endSession = useCallback(() => {
    setIsActive(false);
    setStartedAt(null);
    setDayKey(null);
    persist({ isActive: false, startedAt: null, dayKey: null });
  }, [persist]);

  // Detecta retorno ao foreground durante treino ativo e oferece continuar ou encerrar.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && isActiveRef.current) {
        Alert.alert(
          'Treino em andamento',
          'Você ainda está em um treino. Deseja continuar ou encerrar?',
          [
            {
              text: 'Encerrar',
              style: 'destructive',
              onPress: () => {
                setIsActive(false);
                setStartedAt(null);
                setDayKey(null);
                persist({ isActive: false, startedAt: null, dayKey: null });
                router.replace('/(tabs)');
              },
            },
            { text: 'Continuar', style: 'cancel' },
          ]
        );
      }
    });
    return () => sub.remove();
  }, [persist]);

  return (
    <WorkoutSessionContext.Provider
      value={{ isActive, startedAt, dayKey, elapsedSeconds, startSession, endSession }}
    >
      {children}
    </WorkoutSessionContext.Provider>
  );
}

export function useWorkoutSession() {
  const ctx = useContext(WorkoutSessionContext);
  if (!ctx)
    throw new Error('useWorkoutSession precisa estar dentro de <WorkoutSessionProvider>');
  return ctx;
}
