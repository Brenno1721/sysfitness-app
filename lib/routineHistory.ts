import AsyncStorage from '@react-native-async-storage/async-storage';

export type RoutineHistoryEntry = { date: string; volume: number };

const historyKey = (routineId: string) => `routine:history:${routineId}`;

export async function getRoutineHistory(routineId: string): Promise<RoutineHistoryEntry[]> {
  const raw = await AsyncStorage.getItem(historyKey(routineId));
  return raw ? (JSON.parse(raw) as RoutineHistoryEntry[]) : [];
}

export async function addRoutineHistoryEntry(
  routineId: string,
  volume: number
): Promise<void> {
  const list = await getRoutineHistory(routineId);
  list.push({ date: new Date().toISOString(), volume });
  await AsyncStorage.setItem(historyKey(routineId), JSON.stringify(list.slice(-15)));
}