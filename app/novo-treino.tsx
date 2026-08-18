import { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRoutine } from '../context/RoutineContext';
import { DAY_ORDER } from '../data/workoutPlan';
import type { DayPlan, Group, WorkoutRoutine } from '../data/workoutPlan';
import type { ExerciseDBEntry } from '../data/exerciseDatabase';
import { EXERCISE_DATABASE } from '../data/exerciseDatabase';
import ExercisePicker from '../components/ExercisePicker';
import { SPACING, RADIUS, FONT } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import type { ThemeColors } from '../constants/theme';

const DAY_LABELS: Record<string, string> = {
  seg: 'Segunda', ter: 'Terça', qua: 'Quarta', qui: 'Quinta',
  sex: 'Sexta', sab: 'Sábado', dom: 'Domingo',
};

type DayStatus = 'treino' | 'descanso';

type DayExerciseEntry = {
  instanceId: string;
  name: string;
  category: string;
  sets: string;
  notes: string;
};

function groupByCategory(entries: DayExerciseEntry[]): { category: string; items: DayExerciseEntry[] }[] {
  const order: string[] = [];
  const map = new Map<string, DayExerciseEntry[]>();
  entries.forEach((e) => {
    if (!map.has(e.category)) {
      map.set(e.category, []);
      order.push(e.category);
    }
    map.get(e.category)!.push(e);
  });
  return order.map((category) => ({ category, items: map.get(category)! }));
}

export default function NovoTreinoScreen() {
  const router = useRouter();
  const { COLORS } = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const { edit: editId } = useLocalSearchParams<{ edit?: string }>();
  const { addRoutine, updateRoutine, routines } = useRoutine();

  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [dayStatus, setDayStatus] = useState<Record<string, DayStatus>>(() =>
    Object.fromEntries(DAY_ORDER.map((d) => [d, 'descanso' as DayStatus]))
  );
  const [dayExercises, setDayExercises] = useState<Record<string, DayExerciseEntry[]>>({});
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const initialized = useRef(!editId);

  // Pre-fill state when editing an existing routine
  useEffect(() => {
    if (!editId || initialized.current || routines.length === 0) return;
    const routine = routines.find((r) => r.id === editId);
    if (!routine) return;
    initialized.current = true;

    setName(routine.name);
    setGoal(routine.goal);

    const newDayStatus: Record<string, DayStatus> = {};
    DAY_ORDER.forEach((d) => {
      const day = routine.days[d];
      newDayStatus[d] = day && !('rest' in day) ? 'treino' : 'descanso';
    });
    setDayStatus(newDayStatus);

    const newDayExercises: Record<string, DayExerciseEntry[]> = {};
    DAY_ORDER.forEach((d) => {
      const day = routine.days[d];
      if (!day || 'rest' in day) return;
      const entries: DayExerciseEntry[] = [];
      day.groups.forEach((group) => {
        group.exercises.forEach((ex) => {
          const dbEntry = EXERCISE_DATABASE.find((e) => e.name === ex.name);
          entries.push({
            instanceId: `${ex.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            name: ex.name,
            category: dbEntry ? dbEntry.category : group.name,
            sets: ex.sets,
            notes: ex.notes ?? '',
          });
        });
      });
      newDayExercises[d] = entries;
    });
    setDayExercises(newDayExercises);
  }, [editId, routines]);

  const trainingDays = DAY_ORDER.filter((d) => dayStatus[d] === 'treino');
  const safeIndex = trainingDays.length === 0 ? 0 : Math.min(activeDayIndex, trainingDays.length - 1);
  const currentDayKey = trainingDays[safeIndex];
  const currentDayEntries = currentDayKey ? dayExercises[currentDayKey] || [] : [];
  const isLastDay = safeIndex === trainingDays.length - 1;

  const canProceedStep0 = name.trim().length > 0;
  const canProceedStep1 = trainingDays.length > 0;

  const goBack = () => {
    if (step === 0) {
      router.back();
      return;
    }
    setStep((s) => (s - 1) as 0 | 1 | 2);
  };

  const goNextFromStep1 = () => {
    setActiveDayIndex(0);
    setStep(2);
  };

  const addExerciseToDay = (dayKey: string, exercise: ExerciseDBEntry) => {
    setDayExercises((prev) => ({
      ...prev,
      [dayKey]: [
        ...(prev[dayKey] || []),
        {
          instanceId: `${exercise.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          name: exercise.name,
          category: exercise.category,
          sets: '',
          notes: '',
        },
      ],
    }));
  };

  const removeExercise = (dayKey: string, instanceId: string) => {
    setDayExercises((prev) => ({
      ...prev,
      [dayKey]: (prev[dayKey] || []).filter((e) => e.instanceId !== instanceId),
    }));
  };

  const updateSets = (dayKey: string, instanceId: string, value: string) => {
    setDayExercises((prev) => ({
      ...prev,
      [dayKey]: (prev[dayKey] || []).map((e) =>
        e.instanceId === instanceId ? { ...e, sets: value } : e
      ),
    }));
  };

  const updateNotes = (dayKey: string, instanceId: string, value: string) => {
    setDayExercises((prev) => ({
      ...prev,
      [dayKey]: (prev[dayKey] || []).map((e) =>
        e.instanceId === instanceId ? { ...e, notes: value } : e
      ),
    }));
  };

  const handleFinish = () => {
    const days: Record<string, DayPlan> = {};

    DAY_ORDER.forEach((d) => {
      if (dayStatus[d] !== 'treino') {
        days[d] = { label: DAY_LABELS[d], rest: true };
        return;
      }

      const entries = dayExercises[d] || [];
      const groupedByCategory = groupByCategory(entries);
      const groups: Group[] = groupedByCategory.map((g) => ({
        name: g.category,
        exercises: g.items.map((e) => ({
          name: e.name,
          sets: e.sets,
          notes: e.notes.trim() ? e.notes.trim() : undefined,
        })),
      }));

      days[d] = {
        label: DAY_LABELS[d],
        full: groupedByCategory.length > 0
          ? groupedByCategory.map((g) => g.category).join(' + ')
          : 'Treino',
        tag: goal.trim() || 'Personalizado',
        groups,
      };
    });

    const routine: WorkoutRoutine = {
      id: editId ?? `routine-${Date.now()}`,
      name: name.trim(),
      goal: goal.trim() || 'Personalizado',
      days,
    };

    if (editId) {
      updateRoutine(editId, routine);
    } else {
      addRoutine(routine);
    }
    router.replace('/(tabs)/treino');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack}>
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{editId ? 'Editar treino' : 'Novo treino'}</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.progressRow}>
        <Text style={styles.progressText}>Passo {step + 1} de 3</Text>
        <View style={styles.dotsRow}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.dot, i <= step && styles.dotActive]} />
          ))}
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: SPACING.lg, paddingTop: SPACING.sm, paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
      >
        {step === 0 && (
          <View>
            <Text style={styles.stepTitle}>Informações da rotina</Text>

            <Text style={styles.label}>NOME DO TREINO</Text>
            <TextInput
              style={styles.input}
              placeholder="Treino A"
              placeholderTextColor={COLORS.mutedDim}
              value={name}
              onChangeText={setName}
            />

            <Text style={[styles.label, { marginTop: SPACING.md }]}>OBJETIVO</Text>
            <TextInput
              style={styles.input}
              placeholder="Hipertrofia, Emagrecimento..."
              placeholderTextColor={COLORS.mutedDim}
              value={goal}
              onChangeText={setGoal}
            />

            <TouchableOpacity
              style={[styles.primaryButton, !canProceedStep0 && styles.primaryButtonDisabled]}
              disabled={!canProceedStep0}
              onPress={() => setStep(1)}
            >
              <Text style={styles.primaryButtonText}>PRÓXIMO</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {step === 1 && (
          <View>
            <Text style={styles.stepTitle}>Dias da semana</Text>

            {DAY_ORDER.map((d) => (
              <View key={d} style={styles.dayRow}>
                <Text style={styles.dayRowLabel}>{DAY_LABELS[d]}</Text>
                <View style={styles.toggleGroup}>
                  <TouchableOpacity
                    style={[
                      styles.toggleOption,
                      dayStatus[d] === 'treino' && styles.toggleOptionActive,
                    ]}
                    onPress={() => setDayStatus((prev) => ({ ...prev, [d]: 'treino' }))}
                  >
                    <Text
                      style={[
                        styles.toggleOptionText,
                        dayStatus[d] === 'treino' && styles.toggleOptionTextActive,
                      ]}
                    >
                      Treino
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.toggleOption,
                      dayStatus[d] === 'descanso' && styles.toggleOptionActive,
                    ]}
                    onPress={() => setDayStatus((prev) => ({ ...prev, [d]: 'descanso' }))}
                  >
                    <Text
                      style={[
                        styles.toggleOptionText,
                        dayStatus[d] === 'descanso' && styles.toggleOptionTextActive,
                      ]}
                    >
                      Descanso
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={[
                styles.primaryButton,
                !canProceedStep1 && styles.primaryButtonDisabled,
                { marginTop: SPACING.lg },
              ]}
              disabled={!canProceedStep1}
              onPress={goNextFromStep1}
            >
              <Text style={styles.primaryButtonText}>PRÓXIMO</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && currentDayKey && (
          <View>
            <Text style={styles.stepTitle}>Montar exercícios</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dayTabsRow}
            >
              {trainingDays.map((d, i) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.dayTab, i === safeIndex && styles.dayTabActive]}
                  onPress={() => setActiveDayIndex(i)}
                >
                  <Text style={[styles.dayTabText, i === safeIndex && styles.dayTabTextActive]}>
                    {DAY_LABELS[d].slice(0, 3).toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.currentDayTitle}>{DAY_LABELS[currentDayKey]}</Text>

            <ExercisePicker onAdd={(ex) => addExerciseToDay(currentDayKey, ex)} />

            <View style={{ marginTop: SPACING.lg }}>
              <Text style={styles.sectionLabel}>EXERCÍCIOS ADICIONADOS</Text>

              {currentDayEntries.length === 0 ? (
                <Text style={styles.emptyHint}>Nenhum exercício adicionado ainda.</Text>
              ) : (
                groupByCategory(currentDayEntries).map((group) => (
                  <View key={group.category} style={{ marginTop: SPACING.md }}>
                    <Text style={styles.groupLabel}>{group.category}</Text>
                    {group.items.map((item) => (
                      <View key={item.instanceId} style={styles.addedExerciseCard}>
                        <View style={styles.addedExerciseRow}>
                          <Text style={styles.addedExerciseName} numberOfLines={1}>
                            {item.name}
                          </Text>
                          <TextInput
                            style={styles.setsInput}
                            placeholder="3x10-12"
                            placeholderTextColor={COLORS.mutedDim}
                            value={item.sets}
                            onChangeText={(v) => updateSets(currentDayKey, item.instanceId, v)}
                          />
                          <TouchableOpacity
                            onPress={() => removeExercise(currentDayKey, item.instanceId)}
                          >
                            <Ionicons
                              name="close-circle-outline"
                              size={22}
                              color={COLORS.danger}
                            />
                          </TouchableOpacity>
                        </View>
                        <TextInput
                          style={styles.notesInput}
                          placeholder="Observações (opcional)"
                          placeholderTextColor={COLORS.mutedDim}
                          value={item.notes}
                          onChangeText={(v) => updateNotes(currentDayKey, item.instanceId, v)}
                        />
                      </View>
                    ))}
                  </View>
                ))
              )}
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, { marginTop: SPACING.lg }]}
              onPress={isLastDay ? handleFinish : () => setActiveDayIndex((i) => i + 1)}
            >
              <Text style={styles.primaryButtonText}>
                {isLastDay ? 'CONCLUIR' : 'PRÓXIMO DIA'}
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(COLORS: ThemeColors) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerTitle: { ...FONT.title, fontSize: 18, color: COLORS.text },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  progressText: { color: COLORS.muted, fontSize: 12, fontWeight: '700' },
  dotsRow: { flexDirection: 'row', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: COLORS.cardBorder },
  dotActive: { backgroundColor: COLORS.accent },

  stepTitle: { ...FONT.title, fontSize: 22, color: COLORS.text, marginBottom: SPACING.lg },
  label: { ...FONT.sectionLabel, color: COLORS.muted, marginBottom: SPACING.xs },
  input: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    color: COLORS.text,
    fontSize: 15,
  },

  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.sm,
    paddingVertical: 15,
    marginTop: SPACING.xl,
  },
  primaryButtonDisabled: { opacity: 0.4 },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14, letterSpacing: 0.5 },

  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  dayRowLabel: { color: COLORS.text, fontSize: 14.5, fontWeight: '700' },
  toggleGroup: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
  },
  toggleOption: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: COLORS.card },
  toggleOptionActive: { backgroundColor: COLORS.accent },
  toggleOptionText: { color: COLORS.muted, fontSize: 12, fontWeight: '700' },
  toggleOptionTextActive: { color: '#FFFFFF' },

  dayTabsRow: { gap: SPACING.xs, paddingBottom: SPACING.sm },
  dayTab: {
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.card,
  },
  dayTabActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  dayTabText: { color: COLORS.muted, fontSize: 11.5, fontWeight: '700' },
  dayTabTextActive: { color: '#FFFFFF' },
  currentDayTitle: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: 17,
    marginBottom: SPACING.md,
  },

  sectionLabel: { ...FONT.sectionLabel, color: COLORS.muted },
  emptyHint: { color: COLORS.mutedDim, fontSize: 13, marginTop: SPACING.sm },
  groupLabel: { ...FONT.sectionLabel, color: COLORS.muted, marginBottom: SPACING.sm, fontSize: 11 },
  addedExerciseCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  addedExerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  notesInput: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 8,
    color: COLORS.text,
    fontSize: 12.5,
  },
  addedExerciseName: { flex: 1, color: COLORS.text, fontSize: 13.5, fontWeight: '700' },
  setsInput: {
    width: 84,
    textAlign: 'center',
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 10,
    color: COLORS.text,
    fontSize: 12.5,
    fontWeight: '700',
    paddingVertical: 7,
  },
  });
}