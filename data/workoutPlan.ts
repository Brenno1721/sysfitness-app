export type Exercise = {
  name: string;
  sets: string;
  restSeconds?: number;
  notes?: string;
};
export type Group = { name: string; exercises: Exercise[] };
export type DayPlan =
  | { label: string; rest: true }
  | {
      label: string;
      full: string;
      tag: string;
      groups: Group[];
      cardioTarget?: number;
      generalNotes?: string;
    };

export type WorkoutRoutine = {
  id: string;
  name: string;
  goal: string;
  days: Record<string, DayPlan>;
};

export const PLAN: Record<string, DayPlan> = {
  seg: {
    label: 'Segunda',
    full: 'Peito + Tríceps',
    tag: 'Hipertrofia',
    cardioTarget: 20,
    groups: [
      {
        name: 'Peito',
        exercises: [
          { name: 'Supino reto', sets: '4x8-10' },
          { name: 'Supino inclinado com alteres', sets: '4x8-10' },
          { name: 'Supino inclinado na máquina', sets: '3x10-12' },
          { name: 'Crucifixo na máquina', sets: '3x12-15' },
        ],
      },
      {
        name: 'Tríceps',
        exercises: [
          { name: 'Tríceps testa', sets: '3x10-12' },
          { name: 'Tríceps na polia', sets: '3x12-15' },
          { name: 'Paralela', sets: '3x até a falha' },
        ],
      },
    ],
  },
  ter: {
    label: 'Terça',
    full: 'Costas + Bíceps',
    tag: 'Hipertrofia',
    cardioTarget: 15,
    groups: [
      {
        name: 'Costas',
        exercises: [
          { name: 'Puxada alta pegada básica', sets: '4x8-10' },
          { name: 'Pulldown', sets: '3x10-12' },
          { name: 'Remada na máquina', sets: '4x8-10' },
          { name: 'Remada unilateral', sets: '3x10-12' },
        ],
      },
      {
        name: 'Bíceps',
        exercises: [
          { name: 'Barra W', sets: '3x8-10' },
          { name: 'Scott', sets: '3x10-12' },
          { name: 'Rosca banco (braços atrás)', sets: '3x12-15' },
          { name: 'Martelo', sets: '3x12' },
        ],
      },
    ],
  },
  qua: { label: 'Quarta', rest: true },
  qui: {
    label: 'Quinta',
    full: 'Ombro',
    tag: 'Hipertrofia',
    cardioTarget: 20,
    groups: [
      {
        name: 'Ombro',
        exercises: [
          { name: 'Desenvolvimento no smith', sets: '4x8-10' },
          { name: 'Desenvolvimento no banco', sets: '3x10-12' },
          { name: 'Na máquina de ombro', sets: '3x10-12' },
          { name: 'Crucifixo na máquina de ombro', sets: '3x12-15' },
          { name: 'Crucifixo invertido unilateral', sets: '3x12-15' },
        ],
      },
    ],
  },
  sex: {
    label: 'Sexta',
    full: 'Perna',
    tag: 'Hipertrofia',
    cardioTarget: 25,
    groups: [
      {
        name: 'Perna',
        exercises: [
          { name: 'Agachamento hack', sets: '4x8-10' },
          { name: 'Leg 45', sets: '4x10-12' },
          { name: 'Búlgaro na guiada', sets: '3x10-12 cada' },
          { name: 'Stiff livre', sets: '4x10-12' },
          { name: 'Abdutora', sets: '3x15' },
        ],
      },
    ],
  },
  sab: { label: 'Sábado', rest: true },
  dom: { label: 'Domingo', rest: true },
};

export const DAY_ORDER = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];

const BRAZIL_TIME_ZONE = 'America/Sao_Paulo';
const WEEKDAY_KEY_MAP = {
  Sun: 'dom',
  Mon: 'seg',
  Tue: 'ter',
  Wed: 'qua',
  Thu: 'qui',
  Fri: 'sex',
  Sat: 'sab',
} as const;

function getBrazilDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BRAZIL_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((part) => part.type === 'year')?.value ?? '1970';
  const month = parts.find((part) => part.type === 'month')?.value ?? '01';
  const day = parts.find((part) => part.type === 'day')?.value ?? '01';

  return { year, month, day };
}

export function brazilDateKey(date: Date = new Date()): string {
  const { year, month, day } = getBrazilDateParts(date);
  return `${year}-${month}-${day}`;
}

export function dayKeyFromDate(date: Date = new Date()): string {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: BRAZIL_TIME_ZONE,
    weekday: 'short',
  }).format(date) as keyof typeof WEEKDAY_KEY_MAP;

  return WEEKDAY_KEY_MAP[weekday] ?? 'seg';
}

export function todayKey(): string {
  return dayKeyFromDate(new Date());
}

export function totalExercises(day: DayPlan): number {
  if ('rest' in day) return 0;
  return day.groups.reduce((acc, g) => acc + g.exercises.length, 0);
}

export function parseSetsCount(setsLabel: string): number {
  const match = setsLabel.match(/^(\d+)x/);
  return match ? parseInt(match[1], 10) : 1;
}
