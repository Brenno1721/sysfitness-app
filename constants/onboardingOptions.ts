// Slugs e labels do onboarding — compartilhado entre app/onboarding.tsx (o
// wizard) e app/(tabs)/perfil.tsx (exibição read-only dos dados salvos), pra
// não duplicar o mapa slug -> label em dois lugares.
export type OptionItem = { value: string; label: string };

export const GENDER_OPTIONS: OptionItem[] = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'feminino', label: 'Feminino' },
  { value: 'nao_informar', label: 'Prefiro não dizer' },
];

export const ACTIVITY_OPTIONS: OptionItem[] = [
  { value: 'iniciante', label: 'Iniciante' },
  { value: 'intermediario', label: 'Intermediário' },
  { value: 'avancado', label: 'Avançado' },
];

export const GOAL_OPTIONS: OptionItem[] = [
  { value: 'ganhar_peso', label: 'Ganhar peso' },
  { value: 'perder_peso', label: 'Perder peso' },
  { value: 'ganhar_massa', label: 'Ganhar massa muscular' },
  { value: 'condicionamento', label: 'Melhorar condicionamento' },
  { value: 'manter_forma', label: 'Manter a forma' },
];

function labelFor(options: OptionItem[], value: string | null | undefined): string | null {
  if (!value) return null;
  return options.find((o) => o.value === value)?.label ?? null;
}

export const genderLabel = (value: string | null | undefined) => labelFor(GENDER_OPTIONS, value);
export const activityLabel = (value: string | null | undefined) =>
  labelFor(ACTIVITY_OPTIONS, value);
export function goalLabels(values: string[] | null | undefined): string[] {
  if (!values || values.length === 0) return [];
  return values
    .map((v) => GOAL_OPTIONS.find((o) => o.value === v)?.label)
    .filter((label): label is string => !!label);
}
