import AsyncStorage from '@react-native-async-storage/async-storage';

const WEIGHTS_KEY = 'exercise:lastweights';
const HISTORY_KEY = 'exercise:history';

export type ExerciseRecord = { reps: number; weight: number };

export async function getLastRecord(exerciseName: string): Promise<ExerciseRecord | null> {
  const raw = await AsyncStorage.getItem(WEIGHTS_KEY);
  if (!raw) return null;
  const map: Record<string, ExerciseRecord> = JSON.parse(raw);
  return map[exerciseName] ?? null;
}

export async function saveLastRecord(
  exerciseName: string,
  record: ExerciseRecord
): Promise<void> {
  const raw = await AsyncStorage.getItem(WEIGHTS_KEY);
  const map: Record<string, ExerciseRecord> = raw ? JSON.parse(raw) : {};
  map[exerciseName] = record;
  await AsyncStorage.setItem(WEIGHTS_KEY, JSON.stringify(map));
}

export type WeightRecord = { reps: number; weight: number; date: string };

export type Trend = 'up' | 'down' | 'same' | 'new';

export type TrackedExercise = { name: string; category: string; history: WeightRecord[] };

// Nada escreve nessa chave ainda (a conexão fica pra depois, junto com o
// isolamento multi-tenant) — getHistory/getAllHistories sempre retornam vazio
// na prática por enquanto, mas a API já existe e compila pros consumidores atuais.
async function readHistoryMap(): Promise<Record<string, WeightRecord[]>> {
  const raw = await AsyncStorage.getItem(HISTORY_KEY);
  return raw ? JSON.parse(raw) : {};
}

export async function getHistory(exerciseName: string): Promise<WeightRecord[]> {
  const map = await readHistoryMap();
  return map[exerciseName] ?? [];
}

export async function getAllHistories(): Promise<Record<string, WeightRecord[]>> {
  return readHistoryMap();
}

export function computeTrend(history: WeightRecord[]): {
  direction: Trend;
  delta: number;
  currentWeight: number;
} {
  const currentWeight = history.length > 0 ? history[history.length - 1].weight : 0;

  if (history.length < 2) {
    return { direction: 'new', delta: 0, currentWeight };
  }

  const previousWeight = history[history.length - 2].weight;
  const delta = currentWeight - previousWeight;
  const direction: Trend = delta > 0 ? 'up' : delta < 0 ? 'down' : 'same';

  return { direction, delta, currentWeight };
}
