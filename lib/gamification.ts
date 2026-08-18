import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAllHistories, computeTrend, WeightRecord } from './exerciseWeights';
import { getBodyMetrics, BodyMetricEntry } from './bodyMetrics';
import { brazilDateKey } from '../data/workoutPlan';

// Chaves espelham as já usadas em WorkoutLogContext/CardioTimerContext/RoutineContext —
// não há getter compartilhado pra elas hoje, então lemos direto (mesmo padrão de
// lib/exerciseWeights.ts, que também hardcoda sua própria chave).
// Todas namespaced por userId — dados locais, sem isso vazam entre contas no mesmo aparelho.
const workoutHistoryKey = (userId: string) => `workout:history:${userId}`;
const cardioHistoryKey = (userId: string) => `cardio:history:${userId}`;
const routinesKey = (userId: string) => `routines:list:${userId}`;

const unlockedKey = (userId: string) => `gamification:unlocked:${userId}`;
// Flags simples (não é uma "tabela de eventos"): sinalizam uma ação pontual que não
// dá pra derivar só olhando o estado atual dos dados (editar perfil, comparar fotos,
// editar rotina, trocar tema).
const profileEditedKey = (userId: string) => `gamification:profileEdited:${userId}`;
const photoComparedKey = (userId: string) => `gamification:photoCompared:${userId}`;
const routineEditedKey = (userId: string) => `gamification:hasEditedRoutine:${userId}`;
const themeSwitchedKey = (userId: string) => `gamification:hasSwitchedTheme:${userId}`;

const LONG_CARDIO_SECONDS = 30 * 60;
const BODY_TRANSFORMATION_KG = 5;

export type AchievementCategory =
  | 'consistencia'
  | 'treino'
  | 'cardio'
  | 'evolucao'
  | 'corpo'
  | 'organizacao';

export type Achievement = {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  icon: string; // nome de ícone Ionicons
};

export const ACHIEVEMENTS: Achievement[] = [
  // Consistência
  { id: 'streak-1', title: 'Primeira Chama', description: 'Treinou pela primeira vez', category: 'consistencia', icon: 'flame-outline' },
  { id: 'streak-3', title: 'Sequência de 3', description: '3 dias seguidos de treino', category: 'consistencia', icon: 'flame' },
  { id: 'streak-7', title: 'Sequência de 7', description: '7 dias seguidos de treino', category: 'consistencia', icon: 'flame' },
  { id: 'streak-14', title: 'Sequência de 14', description: '14 dias seguidos de treino', category: 'consistencia', icon: 'flame' },
  { id: 'streak-30', title: 'Sequência de 30', description: '30 dias seguidos de treino', category: 'consistencia', icon: 'flame' },
  { id: 'streak-100', title: 'Sequência de 100', description: '100 dias seguidos de treino', category: 'consistencia', icon: 'flame' },
  // Treino
  { id: 'workout-1', title: 'Primeiro Treino', description: 'Completou o primeiro treino', category: 'treino', icon: 'barbell-outline' },
  { id: 'workout-10', title: '10 Treinos', description: 'Completou 10 treinos', category: 'treino', icon: 'barbell' },
  { id: 'workout-50', title: '50 Treinos', description: 'Completou 50 treinos', category: 'treino', icon: 'barbell' },
  { id: 'workout-100', title: '100 Treinos', description: 'Completou 100 treinos', category: 'treino', icon: 'barbell' },
  { id: 'workout-marathon', title: 'Maratonista', description: 'Um treino com mais de 90 minutos', category: 'treino', icon: 'time-outline' },
  { id: 'perfect-session', title: 'Treino Perfeito', description: 'Completou todas as séries de todos os exercícios sem finalizar nenhum antecipadamente', category: 'treino', icon: 'checkmark-done-outline' },
  { id: 'volume-1000', title: 'Mil Quilos', description: 'Levantou 1.000kg de volume total acumulado', category: 'treino', icon: 'barbell' },
  { id: 'volume-10000', title: 'Dez Mil Quilos', description: 'Levantou 10.000kg de volume total acumulado', category: 'treino', icon: 'trophy' },
  // Cardio
  { id: 'cardio-1', title: 'Primeiro Cardio', description: 'Completou a primeira sessão de cardio', category: 'cardio', icon: 'walk-outline' },
  { id: 'cardio-10', title: '10 Sessões de Cardio', description: 'Completou 10 sessões de cardio', category: 'cardio', icon: 'walk' },
  { id: 'cardio-5h', title: '5 Horas de Cardio', description: 'Somou 5 horas de cardio no total', category: 'cardio', icon: 'time' },
  { id: 'cardio-multi', title: 'Multiatividade', description: 'Usou esteira, ar livre, escada e bicicleta', category: 'cardio', icon: 'shuffle-outline' },
  { id: 'cardio-30min', title: 'Fôlego de Ferro', description: 'Uma sessão de cardio de 30 minutos sem parar', category: 'cardio', icon: 'pulse-outline' },
  // Evolução
  { id: 'pr-1', title: 'Primeiro Recorde', description: 'Bateu o primeiro recorde pessoal', category: 'evolucao', icon: 'trophy-outline' },
  { id: 'pr-5', title: '5 Recordes', description: 'Bateu 5 recordes pessoais', category: 'evolucao', icon: 'trophy' },
  { id: 'pr-20', title: '20 Recordes', description: 'Bateu 20 recordes pessoais', category: 'evolucao', icon: 'trophy' },
  { id: 'trending-5', title: 'Evoluindo', description: '5 exercícios em tendência de alta ao mesmo tempo', category: 'evolucao', icon: 'trending-up' },
  { id: 'no-decline', title: 'Sem Estagnação', description: 'Nenhum exercício em queda de carga no momento (todos subindo ou estáveis)', category: 'evolucao', icon: 'shield-checkmark-outline' },
  // Corpo
  { id: 'body-1', title: 'Primeira Medida', description: 'Registrou a primeira medida corporal', category: 'corpo', icon: 'body-outline' },
  { id: 'body-5', title: 'Registrando o Progresso', description: '5 registros de medidas corporais', category: 'corpo', icon: 'body' },
  { id: 'photo-compare', title: 'Antes e Depois', description: 'Fez a primeira comparação de fotos', category: 'corpo', icon: 'images-outline' },
  { id: 'body-transformation', title: 'Transformação', description: 'Registrou uma mudança de 5kg ou mais desde a primeira medida', category: 'corpo', icon: 'sparkles-outline' },
  // Organização
  { id: 'routine-1', title: 'Arquiteto', description: 'Criou a primeira rotina de treino', category: 'organizacao', icon: 'construct-outline' },
  { id: 'routine-3', title: 'Multiplano', description: 'Tem 3 ou mais rotinas criadas', category: 'organizacao', icon: 'layers-outline' },
  { id: 'profile-edit', title: 'Personalizado', description: 'Editou o perfil pela primeira vez', category: 'organizacao', icon: 'person-circle-outline' },
  { id: 'routine-edit', title: 'Editor', description: 'Editou uma rotina de treino já existente', category: 'organizacao', icon: 'create-outline' },
  { id: 'theme-switch', title: 'Estilo Próprio', description: 'Trocou o tema do app pelo menos uma vez', category: 'organizacao', icon: 'contrast-outline' },
];

export type LevelInfo = { level: number; title: string; minXP: number };

export const LEVELS: LevelInfo[] = [
  { level: 1, title: 'Iniciante', minXP: 0 },
  { level: 2, title: 'Aprendiz', minXP: 150 },
  { level: 3, title: 'Dedicado', minXP: 400 },
  { level: 4, title: 'Consistente', minXP: 800 },
  { level: 5, title: 'Avançado', minXP: 1500 },
  { level: 6, title: 'Elite', minXP: 2500 },
  { level: 7, title: 'Lenda SysFitness', minXP: 4000 },
];

type StoredWorkoutEntry = {
  date: string;
  durationSeconds?: number;
  completed?: number;
  total?: number;
  hadEarlyFinish?: boolean;
};
type StoredCardioEntry = { date: string; activityIndex: number; durationSeconds: number };

async function readWorkoutHistory(userId: string): Promise<StoredWorkoutEntry[]> {
  const raw = await AsyncStorage.getItem(workoutHistoryKey(userId));
  return raw ? JSON.parse(raw) : [];
}

async function readCardioHistory(userId: string): Promise<StoredCardioEntry[]> {
  const raw = await AsyncStorage.getItem(cardioHistoryKey(userId));
  return raw ? JSON.parse(raw) : [];
}

async function readRoutineCount(userId: string): Promise<number> {
  const raw = await AsyncStorage.getItem(routinesKey(userId));
  return raw ? (JSON.parse(raw) as unknown[]).length : 0;
}

// Conta, andando em ordem cronológica, quantos registros bateram o peso máximo de
// todos os registros anteriores DAQUELE exercício (o primeiro registro nunca conta,
// já que não existe nada anterior pra ele bater).
function countPersonalRecords(map: Record<string, WeightRecord[]>): number {
  let count = 0;
  Object.values(map).forEach((history) => {
    let maxSoFar = -Infinity;
    history.forEach((record, i) => {
      if (i > 0 && record.weight > maxSoFar) count++;
      maxSoFar = Math.max(maxSoFar, record.weight);
    });
  });
  return count;
}

function countTrendingUp(map: Record<string, WeightRecord[]>): number {
  return Object.values(map).filter((history) => computeTrend(history).direction === 'up').length;
}

function countTrendingDown(map: Record<string, WeightRecord[]>): number {
  return Object.values(map).filter((history) => computeTrend(history).direction === 'down').length;
}

// Volume total "de verdade" (routine:history:*) é capado nas últimas 15 sessões POR
// rotina e não é enumerável sem varrer rotinas já excluídas — usamos exercise:history
// (reps × peso de todo registro salvo) como proxy, mesma limitação de cap que já afeta
// a contagem de PRs e tendências.
function sumTotalVolume(map: Record<string, WeightRecord[]>): number {
  return Object.values(map)
    .flat()
    .reduce((sum, record) => sum + record.reps * record.weight, 0);
}

function isLastWorkoutPerfect(entries: StoredWorkoutEntry[]): boolean {
  const last = entries[0];
  if (!last || last.completed === undefined || last.total === undefined || last.total === 0) {
    return false;
  }
  return last.completed === last.total && !last.hadEarlyFinish;
}

// "Primeiro e último registro" ao pé da letra — bodyMetrics vem do mais recente pro
// mais antigo (getBodyMetrics), então invertemos os extremos.
function hasBodyTransformation(bodyMetrics: BodyMetricEntry[]): boolean {
  if (bodyMetrics.length < 2) return false;
  const mostRecent = bodyMetrics[0];
  const oldest = bodyMetrics[bodyMetrics.length - 1];
  if (mostRecent.weight === undefined || oldest.weight === undefined) return false;
  return Math.abs(mostRecent.weight - oldest.weight) >= BODY_TRANSFORMATION_KG;
}

function previousDateKey(key: string): string {
  const date = new Date(`${key}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

export async function computeStreak(userId: string): Promise<{ current: number; longest: number }> {
  const history = await readWorkoutHistory(userId);
  const trainedDays = new Set(history.map((h) => brazilDateKey(new Date(h.date))));

  if (trainedDays.size === 0) return { current: 0, longest: 0 };

  const sortedKeys = [...trainedDays].sort();
  let longest = 0;
  let run = 0;
  let prevDate: Date | null = null;
  for (const key of sortedKeys) {
    const d = new Date(`${key}T00:00:00`);
    run = prevDate && d.getTime() - prevDate.getTime() === 86400000 ? run + 1 : 1;
    longest = Math.max(longest, run);
    prevDate = d;
  }

  // Sequência atual: começa hoje; se hoje ainda não treinou, dá o benefício da
  // dúvida e começa de ontem (o dia não acabou, então a sequência não "quebrou" ainda).
  let current = 0;
  let cursorKey = brazilDateKey(new Date());
  if (!trainedDays.has(cursorKey)) {
    cursorKey = previousDateKey(cursorKey);
  }
  while (trainedDays.has(cursorKey)) {
    current++;
    cursorKey = previousDateKey(cursorKey);
  }

  return { current, longest };
}

export async function computeXP(userId: string): Promise<number> {
  const [workoutHistory, cardioHistory, exerciseHistoryMap, bodyMetrics, routineCount] = await Promise.all([
    readWorkoutHistory(userId),
    readCardioHistory(userId),
    getAllHistories(),
    getBodyMetrics(userId),
    readRoutineCount(userId),
  ]);

  const totalSetEntries = Object.values(exerciseHistoryMap).reduce((sum, list) => sum + list.length, 0);
  const prCount = countPersonalRecords(exerciseHistoryMap);

  return (
    workoutHistory.length * 50 +
    cardioHistory.length * 20 +
    totalSetEntries * 2 +
    bodyMetrics.length * 15 +
    routineCount * 25 +
    prCount * 30
  );
}

export function getLevelInfo(xp: number): {
  current: LevelInfo;
  next: LevelInfo | null;
  progress: number;
} {
  let current = LEVELS[0];
  for (const level of LEVELS) {
    if (xp >= level.minXP) current = level;
  }

  const next = LEVELS[LEVELS.indexOf(current) + 1] ?? null;
  const progress = next
    ? Math.min(1, Math.max(0, (xp - current.minXP) / (next.minXP - current.minXP)))
    : 1;

  return { current, next, progress };
}

export async function getUnlockedAchievementIds(userId: string): Promise<string[]> {
  const raw = await AsyncStorage.getItem(unlockedKey(userId));
  return raw ? JSON.parse(raw) : [];
}

export async function markProfileEdited(userId: string): Promise<void> {
  await AsyncStorage.setItem(profileEditedKey(userId), 'true');
}

export async function markPhotosCompared(userId: string): Promise<void> {
  await AsyncStorage.setItem(photoComparedKey(userId), 'true');
}

export async function markRoutineEdited(userId: string): Promise<void> {
  await AsyncStorage.setItem(routineEditedKey(userId), 'true');
}

export async function markThemeSwitched(userId: string): Promise<void> {
  await AsyncStorage.setItem(themeSwitchedKey(userId), 'true');
}

function evaluateAchievement(
  id: string,
  stats: {
    workoutCount: number;
    cardioCount: number;
    cardioTotalSeconds: number;
    cardioActivities: Set<number>;
    longestWorkoutSeconds: number;
    hasLongCardioSession: boolean;
    prCount: number;
    trendingUpCount: number;
    trendingDownCount: number;
    trackedExerciseCount: number;
    totalVolume: number;
    lastWorkoutPerfect: boolean;
    bodyCount: number;
    bodyTransformation: boolean;
    routineCount: number;
    profileEdited: boolean;
    photoCompared: boolean;
    routineEdited: boolean;
    themeSwitched: boolean;
  },
  streak: { current: number; longest: number }
): boolean {
  switch (id) {
    case 'streak-1':
      return stats.workoutCount >= 1;
    case 'streak-3':
      return streak.longest >= 3;
    case 'streak-7':
      return streak.longest >= 7;
    case 'streak-14':
      return streak.longest >= 14;
    case 'streak-30':
      return streak.longest >= 30;
    case 'streak-100':
      return streak.longest >= 100;
    case 'workout-1':
      return stats.workoutCount >= 1;
    case 'workout-10':
      return stats.workoutCount >= 10;
    case 'workout-50':
      return stats.workoutCount >= 50;
    case 'workout-100':
      return stats.workoutCount >= 100;
    case 'workout-marathon':
      return stats.longestWorkoutSeconds > 90 * 60;
    case 'perfect-session':
      return stats.lastWorkoutPerfect;
    case 'volume-1000':
      return stats.totalVolume >= 1000;
    case 'volume-10000':
      return stats.totalVolume >= 10000;
    case 'cardio-1':
      return stats.cardioCount >= 1;
    case 'cardio-10':
      return stats.cardioCount >= 10;
    case 'cardio-5h':
      return stats.cardioTotalSeconds >= 5 * 3600;
    case 'cardio-multi':
      return [0, 1, 2, 3].every((i) => stats.cardioActivities.has(i));
    case 'cardio-30min':
      return stats.hasLongCardioSession;
    case 'pr-1':
      return stats.prCount >= 1;
    case 'pr-5':
      return stats.prCount >= 5;
    case 'pr-20':
      return stats.prCount >= 20;
    case 'trending-5':
      return stats.trendingUpCount >= 5;
    case 'no-decline':
      return stats.trackedExerciseCount >= 3 && stats.trendingDownCount === 0;
    case 'body-1':
      return stats.bodyCount >= 1;
    case 'body-5':
      return stats.bodyCount >= 5;
    case 'photo-compare':
      return stats.photoCompared;
    case 'body-transformation':
      return stats.bodyTransformation;
    case 'routine-1':
      return stats.routineCount >= 1;
    case 'routine-3':
      return stats.routineCount >= 3;
    case 'profile-edit':
      return stats.profileEdited;
    case 'routine-edit':
      return stats.routineEdited;
    case 'theme-switch':
      return stats.themeSwitched;
    default:
      return false;
  }
}

export async function checkAndUnlockAchievements(userId: string): Promise<Achievement[]> {
  const [
    workoutHistory,
    cardioHistory,
    exerciseHistoryMap,
    bodyMetrics,
    routineCount,
    profileEditedRaw,
    photoComparedRaw,
    routineEditedRaw,
    themeSwitchedRaw,
    streak,
    previouslyUnlocked,
  ] = await Promise.all([
    readWorkoutHistory(userId),
    readCardioHistory(userId),
    getAllHistories(),
    getBodyMetrics(userId),
    readRoutineCount(userId),
    AsyncStorage.getItem(profileEditedKey(userId)),
    AsyncStorage.getItem(photoComparedKey(userId)),
    AsyncStorage.getItem(routineEditedKey(userId)),
    AsyncStorage.getItem(themeSwitchedKey(userId)),
    computeStreak(userId),
    getUnlockedAchievementIds(userId),
  ]);

  const stats = {
    workoutCount: workoutHistory.length,
    cardioCount: cardioHistory.length,
    cardioTotalSeconds: cardioHistory.reduce((sum, h) => sum + h.durationSeconds, 0),
    cardioActivities: new Set(cardioHistory.map((h) => h.activityIndex)),
    longestWorkoutSeconds: Math.max(0, ...workoutHistory.map((h) => h.durationSeconds ?? 0)),
    hasLongCardioSession: cardioHistory.some((h) => h.durationSeconds >= LONG_CARDIO_SECONDS),
    prCount: countPersonalRecords(exerciseHistoryMap),
    trendingUpCount: countTrendingUp(exerciseHistoryMap),
    trendingDownCount: countTrendingDown(exerciseHistoryMap),
    trackedExerciseCount: Object.keys(exerciseHistoryMap).length,
    totalVolume: sumTotalVolume(exerciseHistoryMap),
    lastWorkoutPerfect: isLastWorkoutPerfect(workoutHistory),
    bodyCount: bodyMetrics.length,
    bodyTransformation: hasBodyTransformation(bodyMetrics),
    routineCount,
    profileEdited: profileEditedRaw === 'true',
    photoCompared: photoComparedRaw === 'true',
    routineEdited: routineEditedRaw === 'true',
    themeSwitched: themeSwitchedRaw === 'true',
  };

  const previouslySet = new Set(previouslyUnlocked);
  const currentlyMetIds = ACHIEVEMENTS.filter((a) => evaluateAchievement(a.id, stats, streak)).map(
    (a) => a.id
  );
  const merged = Array.from(new Set([...previouslyUnlocked, ...currentlyMetIds]));

  if (merged.length !== previouslyUnlocked.length) {
    await AsyncStorage.setItem(unlockedKey(userId), JSON.stringify(merged));
  }

  const newlyUnlockedIds = currentlyMetIds.filter((id) => !previouslySet.has(id));
  return ACHIEVEMENTS.filter((a) => newlyUnlockedIds.includes(a.id));
}
