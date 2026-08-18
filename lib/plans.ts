export type PlanId = 'free' | 'basico' | 'plus' | 'ultra';

export type PlanFeatures = {
  maxRoutines: number | null; // null = ilimitado
  historyDays: number | null; // null = histórico completo
  lightThemeEnabled: boolean;
  notificationsEnabled: boolean;
  bodyMetricsEnabled: boolean;
  fullGamification: boolean; // false = níveis 1-3 só
};

export type Plan = {
  id: PlanId;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  tagline: string;
  features: PlanFeatures;
  highlights: string[]; // lista curta pra mostrar na tela
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Free+',
    priceMonthly: 0,
    priceYearly: 0,
    tagline: 'Pra começar sem compromisso',
    features: {
      maxRoutines: 1,
      historyDays: 30,
      lightThemeEnabled: false,
      notificationsEnabled: false,
      bodyMetricsEnabled: false,
      fullGamification: false,
    },
    highlights: [
      '1 rotina de treino',
      'Histórico de 30 dias',
      'Cronômetro de cardio completo',
      'Tema escuro',
    ],
  },
  basico: {
    id: 'basico',
    name: 'Básico',
    priceMonthly: 9.9,
    priceYearly: 89.9,
    tagline: 'Pra quem treina toda semana',
    features: {
      maxRoutines: 3,
      historyDays: null,
      lightThemeEnabled: true,
      notificationsEnabled: true,
      bodyMetricsEnabled: false,
      fullGamification: false,
    },
    highlights: [
      'Até 3 rotinas de treino',
      'Histórico completo',
      'Tema claro e escuro',
      'Lembrete diário de treino',
    ],
  },
  plus: {
    id: 'plus',
    name: 'Plus',
    priceMonthly: 19.9,
    priceYearly: 179.9,
    tagline: 'Acompanhamento completo do seu progresso',
    features: {
      maxRoutines: null,
      historyDays: null,
      lightThemeEnabled: true,
      notificationsEnabled: true,
      bodyMetricsEnabled: true,
      fullGamification: true,
    },
    highlights: [
      'Rotinas ilimitadas',
      'Medidas corporais e fotos de progresso',
      'Todas as 33 conquistas',
      'Tudo do Básico',
    ],
  },
  ultra: {
    id: 'ultra',
    name: 'Ultra',
    priceMonthly: 39.9,
    priceYearly: 359.9,
    tagline: 'O sistema completo',
    features: {
      maxRoutines: null,
      historyDays: null,
      lightThemeEnabled: true,
      notificationsEnabled: true,
      bodyMetricsEnabled: true,
      fullGamification: true,
    },
    highlights: [
      'Tudo do Plus',
      'Treino gerado por IA (em breve)',
      'Conexão com Personal Trainer (em breve)',
      'Timer na tela bloqueada (em breve)',
    ],
  },
};

export const PLAN_ORDER: PlanId[] = ['free', 'basico', 'plus', 'ultra'];

// Dados antigos continuam salvos no AsyncStorage — isso só corta o que é EXIBIDO,
// conforme o limite de histórico do plano atual (historyDays: null = sem corte).
export function filterByHistoryDays<T extends { date: string }>(
  records: T[],
  historyDays: number | null
): T[] {
  if (historyDays === null) return records;
  const cutoff = Date.now() - historyDays * 24 * 60 * 60 * 1000;
  return records.filter((r) => new Date(r.date).getTime() >= cutoff);
}
