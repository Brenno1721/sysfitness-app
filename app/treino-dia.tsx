import { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useAnimatedProps, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { useWorkoutLog } from '../context/WorkoutLogContext';
import { useRoutine } from '../context/RoutineContext';
import { useWorkoutSession } from '../context/WorkoutSessionContext';
import { parseSetsCount } from '../data/workoutPlan';
import type { ExerciseRecord } from '../lib/exerciseWeights';
import { triggerNotification, NotificationFeedbackType } from '../lib/haptics';
import { SPACING, RADIUS, FONT } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import type { ThemeColors } from '../constants/theme';

const DEFAULT_REST_SECONDS = 60;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const RING_SIZE = 180;
const RING_STROKE = 12;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

type FlatExercise = {
  key: string;
  name: string;
  sets: string;
  totalSets: number;
  groupName: string;
  showGroupLabel: boolean;
  restSeconds?: number;
  notes?: string;
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function formatNumber(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function Stepper({
  label,
  value,
  step,
  onChange,
}: {
  label: string;
  value: number;
  step: number;
  onChange: (next: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const { COLORS } = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);

  const decrement = () => onChange(Math.max(0, roundToStep(value - step, step)));
  const increment = () => onChange(roundToStep(value + step, step));

  const startEditing = () => {
    setInputValue(formatNumber(value));
    setEditing(true);
  };

  const commitEdit = () => {
    const parsed = parseFloat(inputValue.replace(',', '.'));
    if (!isNaN(parsed) && parsed >= 0) {
      onChange(parsed);
    }
    setEditing(false);
  };

  return (
    <View style={styles.stepperBlock}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperRow}>
        <TouchableOpacity onPress={decrement} hitSlop={8}>
          <Ionicons name="remove-circle-outline" size={32} color={COLORS.text} />
        </TouchableOpacity>
        {editing ? (
          <TextInput
            style={styles.stepperInput}
            value={inputValue}
            onChangeText={setInputValue}
            onBlur={commitEdit}
            onSubmitEditing={commitEdit}
            keyboardType="decimal-pad"
            autoFocus
            selectTextOnFocus
          />
        ) : (
          <TouchableOpacity onPress={startEditing} hitSlop={8}>
            <Text style={styles.stepperValue}>{formatNumber(value)}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={increment} hitSlop={8}>
          <Ionicons name="add-circle-outline" size={32} color={COLORS.accent} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function NotesSection({
  title = 'Observações',
  icon = 'alert-circle-outline',
  notes,
  fallback,
  defaultExpanded = true,
  style,
}: {
  title?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  notes?: string;
  fallback?: string;
  defaultExpanded?: boolean;
  style?: object;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const { COLORS } = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const text = notes && notes.trim() ? notes : fallback;
  if (!text) return null;

  return (
    <View style={[styles.notesBox, style]}>
      <TouchableOpacity style={styles.notesHeader} onPress={() => setExpanded((e) => !e)}>
        <Ionicons name={icon} size={16} color={COLORS.accent} />
        <Text style={styles.notesTitle}>{title}</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={14}
          color={COLORS.muted}
          style={{ marginLeft: 'auto' }}
        />
      </TouchableOpacity>
      {expanded && <Text style={styles.notesText}>{text}</Text>}
    </View>
  );
}

function RestRing({
  label,
  remaining,
  total,
  isPaused,
  onSkip,
  onTogglePause,
}: {
  label: string;
  remaining: number;
  total: number;
  isPaused: boolean;
  onSkip: () => void;
  onTogglePause: () => void;
}) {
  const { COLORS } = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const progress = useSharedValue(total > 0 ? remaining / total : 0);

  useEffect(() => {
    const fraction = total > 0 ? remaining / total : 0;
    progress.value = withTiming(fraction, { duration: 950, easing: Easing.linear });
  }, [remaining, total]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: RING_CIRCUMFERENCE * (1 - progress.value),
  }));

  return (
    <View style={styles.restRingContainer}>
      <View style={styles.restRingSvgWrap}>
        <Svg width={RING_SIZE} height={RING_SIZE} style={{ transform: [{ rotate: '-90deg' }] }}>
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke={COLORS.cardBorder}
            strokeWidth={RING_STROKE}
            fill="none"
          />
          <AnimatedCircle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke={COLORS.done}
            strokeWidth={RING_STROKE}
            fill="none"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeLinecap="round"
            animatedProps={animatedProps}
          />
        </Svg>
        <View style={styles.restRingCenter} pointerEvents="none">
          <Text style={styles.restRingSeconds}>{remaining}</Text>
          <Text style={styles.restRingSecondsLabel}>segundos</Text>
        </View>
      </View>

      <Text style={styles.restRingExerciseText}>{label}</Text>

      <View style={styles.restRingControls}>
        <TouchableOpacity style={styles.restSkipButton} onPress={onSkip}>
          <Text style={styles.restSkipButtonText}>Pular descanso</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onTogglePause} hitSlop={8}>
          <Text style={styles.restPauseLink}>{isPaused ? 'Retomar' : 'Pausar'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function TreinoDiaScreen() {
  const router = useRouter();
  const { COLORS } = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const { activeRoutine } = useRoutine();
  const { currentDay, dayState, logSet, updateSetLog, finishExerciseEarly, finishWorkout, customOrder, exerciseHistory } =
    useWorkoutLog();

  const { elapsedSeconds, isActive, startSession, endSession } = useWorkoutSession();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalReps, setModalReps] = useState(0);
  const [modalWeight, setModalWeight] = useState(0);
  // Refs ensure handleSubmitSet always reads the latest value even if onBlur
  // and onPress race (T3 fix: manual TextInput edit commits before save).
  const modalRepsRef = useRef(0);
  const modalWeightRef = useRef(0);
  const updateModalReps = (v: number) => { modalRepsRef.current = v; setModalReps(v); };
  const updateModalWeight = (v: number) => { modalWeightRef.current = v; setModalWeight(v); };
  const [modalExercise, setModalExercise] = useState<FlatExercise | null>(null);
  const [modalEditIndex, setModalEditIndex] = useState<number | null>(null);
  const [lastRecords, setLastRecords] = useState<Record<string, ExerciseRecord>>({});
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [restingExerciseKey, setRestingExerciseKey] = useState<string | null>(null);
  const [restRemaining, setRestRemaining] = useState(0);
  const [restTotalSeconds, setRestTotalSeconds] = useState(0);
  const [restCompletedSetNumber, setRestCompletedSetNumber] = useState(0);
  const [hasStartedRest, setHasStartedRest] = useState(false);
  const [isRestPaused, setIsRestPaused] = useState(false);

  const finishCalled = useRef(false);
  const expandInitialized = useRef(false);

  // T4: inicia o cronômetro ao entrar na tela; restaura sessão existente do storage.
  useEffect(() => {
    if (!isActive) startSession(currentDay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Populate lastRecords from API-based exercise history
  useEffect(() => {
    const last: Record<string, ExerciseRecord> = {};
    for (const [name, records] of Object.entries(exerciseHistory)) {
      if (records.length > 0) last[name] = records[records.length - 1];
    }
    setLastRecords(last);
  }, [exerciseHistory]);

  const plan = activeRoutine ? activeRoutine.days[currentDay] : undefined;
  const isValidDay = !!(plan && !('rest' in plan));

  // Build flat exercise list (before any conditional returns)
  const flatExercises: FlatExercise[] = [];
  if (isValidDay && plan && !('rest' in plan)) {
    plan.groups.forEach((group, gi) => {
      group.exercises.forEach((ex, ei) => {
        flatExercises.push({
          key: `${gi}-${ei}`,
          name: ex.name,
          sets: ex.sets,
          totalSets: parseSetsCount(ex.sets),
          groupName: group.name,
          showGroupLabel: false, // recalculado abaixo, depois da reordenação
          restSeconds: ex.restSeconds,
          notes: ex.notes,
        });
      });
    });

    if (customOrder) {
      const order = customOrder;
      flatExercises.sort((a, b) => {
        const ia = order.indexOf(a.key);
        const ib = order.indexOf(b.key);
        if (ia === -1 && ib === -1) return 0;
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      });
    }

    flatExercises.forEach((ex, i) => {
      ex.showGroupLabel = i === 0 || flatExercises[i - 1].groupName !== ex.groupName;
    });
  }

  const done = Object.values(dayState).filter((e) => e.done).length;
  const total = flatExercises.length;
  const allDone = total > 0 && done === total;
  const restPhaseActive = restingExerciseKey !== null;

  // Abre o primeiro exercício pendente automaticamente na primeira renderização (conveniência, não trava).
  useEffect(() => {
    if (expandInitialized.current || flatExercises.length === 0) return;
    expandInitialized.current = true;
    const firstPending = flatExercises.find((e) => !dayState[e.key]?.done);
    setExpandedKey(firstPending ? firstPending.key : flatExercises[0].key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flatExercises.length]);

  // Rest countdown — só conta enquanto iniciado e não pausado
  useEffect(() => {
    if (restingExerciseKey === null || !hasStartedRest || isRestPaused) return;
    const id = setInterval(() => {
      setRestRemaining((r) => (r > 0 ? r - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [restingExerciseKey, hasStartedRest, isRestPaused]);

  // Descanso ENTRE séries do mesmo exercício termina — só libera o formulário
  // da próxima série; nunca fecha o card ou avança de exercício sozinho.
  useEffect(() => {
    if (restingExerciseKey !== null && restRemaining <= 0) {
      triggerNotification(NotificationFeedbackType.Success);
      setRestingExerciseKey(null);
    }
  }, [restRemaining, restingExerciseKey]);

  // ---- Conditional renders (all hooks above) ----

  const backButton = (
    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
      <Ionicons name="chevron-back" size={22} color={COLORS.text} />
    </TouchableOpacity>
  );

  if (!activeRoutine) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {backButton}
        <View style={styles.emptyState}>
          <Ionicons name="barbell-outline" size={40} color={COLORS.muted} />
          <Text style={styles.emptyTitle}>Nenhum treino ativo.</Text>
          <Text style={styles.emptySubtitle}>Crie ou escolha uma rotina na aba Treino.</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push('/(tabs)/treino')}
          >
            <Text style={styles.emptyButtonText}>IR PARA TREINO</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!isValidDay) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {backButton}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 40, marginBottom: SPACING.sm }}>🌙</Text>
          <Text style={{ color: COLORS.text, fontWeight: '800', fontSize: 17 }}>
            Hoje é dia de descanso
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // plan is guaranteed non-rest here
  const activePlan = plan as Extract<typeof plan, { groups: any }>;

  const toggleExpanded = (key: string) => {
    setExpandedKey((prev) => (prev === key ? null : key));
  };

  const openModalForNewSet = (ex: FlatExercise) => {
    setModalExercise(ex);
    setModalEditIndex(null);
    const prevRecord = lastRecords[ex.name];
    const reps = prevRecord ? prevRecord.reps : 0;
    const weight = prevRecord ? prevRecord.weight : 0;
    updateModalReps(reps);
    updateModalWeight(weight);
    setModalVisible(true);
  };

  const openModalForEditSet = (ex: FlatExercise, index: number) => {
    const set = dayState[ex.key]?.setsLog[index];
    setModalExercise(ex);
    setModalEditIndex(index);
    const reps = set ? Number(set.reps) || 0 : 0;
    const weight = set ? Number(set.weight) || 0 : 0;
    updateModalReps(reps);
    updateModalWeight(weight);
    setModalVisible(true);
  };

  const beginRestBetweenSets = (key: string, completedSetNumber: number) => {
    const ex = flatExercises.find((e) => e.key === key);
    const restSeconds = ex?.restSeconds ?? DEFAULT_REST_SECONDS;
    setRestingExerciseKey(key);
    setRestRemaining(restSeconds);
    setRestTotalSeconds(restSeconds);
    setRestCompletedSetNumber(completedSetNumber);
    setHasStartedRest(false);
    setIsRestPaused(false);
  };

  const startRestCountdown = () => setHasStartedRest(true);
  const togglePauseRest = () => setIsRestPaused((p) => !p);

  const handleSubmitSet = async () => {
    if (!modalExercise) return;
    // T3: read from refs so manual TextInput edits are always captured.
    const setValue = { reps: String(modalRepsRef.current), weight: String(modalWeightRef.current) };

    if (modalEditIndex !== null) {
      updateSetLog(modalExercise.key, modalEditIndex, setValue);
      setModalVisible(false);
      setExpandedKey(modalExercise.key);
      return;
    }

    const record: ExerciseRecord = { reps: modalRepsRef.current, weight: modalWeightRef.current };
    setLastRecords((prev) => ({ ...prev, [modalExercise.name]: record }));

    // T1: totalSets=1 marks done after the first (and only) recorded set.
    logSet(modalExercise.key, setValue, 1);
    setModalVisible(false);

    // T1: always advance to next pending exercise; no automatic rest dispatch.
    const idx = flatExercises.findIndex((e) => e.key === modalExercise.key);
    const next = flatExercises
      .slice(idx + 1)
      .find((e) => !(dayState[e.key]?.done));
    setExpandedKey(next ? next.key : null);
  };

  const handleCancelModal = () => setModalVisible(false);

  const skipRest = () => setRestRemaining(0);

  const openFirstPending = () => {
    const first = flatExercises.find((e) => !dayState[e.key]?.done);
    setExpandedKey(first ? first.key : null);
  };

  const goToNextPendingExercise = () => {
    const idx = flatExercises.findIndex((e) => e.key === expandedKey);
    const searchFrom = idx === -1 ? 0 : idx + 1;
    const next =
      flatExercises.slice(searchFrom).find((e) => !dayState[e.key]?.done) ??
      flatExercises.find((e) => !dayState[e.key]?.done);
    setExpandedKey(next ? next.key : null);
  };

  const handleVideoPress = (exerciseName: string) => {
    const query = encodeURIComponent(`${exerciseName} execução correta`);
    Linking.openURL(`https://www.youtube.com/results?search_query=${query}`);
  };

  const handleEndSession = () => {
    Alert.alert(
      'Encerrar treino?',
      'Seu progresso até aqui será salvo.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Encerrar',
          style: 'destructive',
          onPress: async () => {
            if (isValidDay) await finishWorkout(plan!, elapsedSeconds);
            endSession();
            router.replace('/(tabs)');
          },
        },
      ]
    );
  };

  const handleFinishWorkout = () => {
    Alert.alert(
      'Finalizar treino?',
      'Você concluiu todos os exercícios.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Finalizar',
          style: 'default',
          onPress: async () => {
            if (finishCalled.current) return;
            finishCalled.current = true;
            const finalSeconds = elapsedSeconds;
            await finishWorkout(plan!, finalSeconds);
            endSession();
            router.replace({
              pathname: '/treino-concluido',
              params: { seconds: String(finalSeconds) },
            });
          },
        },
      ]
    );
  };

  const handleFinishEarly = (ex: FlatExercise) => {
    finishExerciseEarly(ex.key);
    const idx = flatExercises.findIndex((e) => e.key === ex.key);
    const next = flatExercises.slice(idx + 1).find((e) => !dayState[e.key]?.done);
    setExpandedKey(next?.key ?? null);
  };

  const modalSetNumber = modalExercise
    ? modalEditIndex !== null
      ? modalEditIndex + 1
      : (dayState[modalExercise.key]?.setsLog.length ?? 0) + 1
    : 1;

  const headerPct = total ? (done / total) * 100 : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          {activeRoutine.name} — {activePlan.full}
        </Text>
        <TouchableOpacity onPress={handleEndSession} hitSlop={8}>
          <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.headerProgressWrap}>
        <View style={styles.headerProgressTrack}>
          <View style={[styles.headerProgressFill, { width: `${headerPct}%` }]} />
        </View>
        <Text style={styles.headerProgressCount}>{done} de {total} exercícios</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: SPACING.lg, paddingTop: SPACING.md, paddingBottom: 140 }}
      >
        <NotesSection
          title="Observações"
          icon="document-text-outline"
          notes={activePlan.generalNotes}
          fallback="Nenhuma observação adicionada."
          style={styles.generalNotesBox}
        />

        <View>
          {flatExercises.map((ex) => {
            const dayEntry = dayState[ex.key];
            const setsLog = dayEntry?.setsLog ?? [];
            const isDone = dayEntry?.done === true;
            const isExpanded = expandedKey === ex.key;
            const isResting = restingExerciseKey === ex.key;
            const isOpenCard = isExpanded || isResting;
            const lastRecord = lastRecords[ex.name];
            const lastSet = setsLog.length > 0 ? setsLog[setsLog.length - 1] : null;

            return (
              <View key={ex.key}>
                {ex.showGroupLabel && (
                  <Text style={styles.groupLabel}>{ex.groupName}</Text>
                )}

                {!isOpenCard ? (
                  <TouchableOpacity
                    style={[styles.cardClosed, isDone && styles.cardClosedDone]}
                    onPress={() => toggleExpanded(ex.key)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardClosedName}>{ex.name}</Text>
                      <Text style={styles.cardClosedGroup}>{ex.groupName}</Text>
                      {isDone && (dayEntry?.finishedEarly || lastSet) && (
                        <Text style={styles.cardClosedSummary}>
                          {dayEntry?.finishedEarly
                            ? `${setsLog.length} de ${ex.totalSets} séries${lastSet ? ` · última: ${lastSet.reps} reps · ${lastSet.weight}kg` : ''}`
                            : `${setsLog.length} séries · última: ${lastSet!.reps} reps · ${lastSet!.weight}kg`}
                        </Text>
                      )}
                    </View>
                    <Ionicons
                      name={isDone ? 'checkmark-circle' : 'chevron-down'}
                      size={22}
                      color={isDone ? COLORS.done : COLORS.muted}
                    />
                  </TouchableOpacity>
                ) : (
                  <View
                    style={[
                      styles.cardCurrent,
                      (isDone || isResting) && styles.cardCurrentDone,
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.cardCurrentHeaderRow}
                      onPress={() => toggleExpanded(ex.key)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.cardCurrentName}>{ex.name}</Text>
                      <View style={styles.cardCurrentHeaderActions}>
                        <TouchableOpacity
                          style={styles.videoButton}
                          onPress={() => handleVideoPress(ex.name)}
                          hitSlop={6}
                        >
                          <Ionicons name="play" size={16} color={COLORS.accent} />
                        </TouchableOpacity>
                        <Ionicons name="chevron-up" size={18} color={COLORS.muted} />
                      </View>
                    </TouchableOpacity>

                    {/* Bloco SÉRIES */}
                    <View style={styles.subPanel}>
                      <View style={styles.subPanelHeader}>
                        <Ionicons name="list-outline" size={16} color={COLORS.muted} />
                        <Text style={styles.subPanelHeaderLabel}>Séries</Text>
                      </View>
                      <Text style={styles.setsMainText}>{ex.sets}</Text>
                      <Text style={styles.subPanelMutedText}>
                        {lastRecord
                          ? `Último registro: ${formatNumber(lastRecord.reps)} reps · ${formatNumber(lastRecord.weight)}kg`
                          : 'Sem registro anterior'}
                      </Text>
                    </View>

                    {/* Bloco DESCANSO */}
                    {isResting && (
                      <View style={styles.subPanel}>
                        {!hasStartedRest ? (
                          <View style={styles.restPanelRow}>
                            <View>
                              <View style={styles.subPanelHeader}>
                                <Ionicons name="time-outline" size={16} color={COLORS.muted} />
                                <Text style={styles.subPanelHeaderLabel}>Descanso</Text>
                              </View>
                              <Text style={styles.restPanelSeconds}>{restRemaining}s</Text>
                            </View>
                            <TouchableOpacity
                              style={styles.restStartButtonCompact}
                              onPress={startRestCountdown}
                            >
                              <Ionicons name="play" size={12} color="#FFFFFF" />
                              <Text style={styles.restStartButtonCompactText}>
                                Iniciar descanso
                              </Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <RestRing
                            label={`Descanso — Série ${restCompletedSetNumber} concluída`}
                            remaining={restRemaining}
                            total={restTotalSeconds}
                            isPaused={isRestPaused}
                            onSkip={skipRest}
                            onTogglePause={togglePauseRest}
                          />
                        )}
                      </View>
                    )}

                    {/* Bloco OBSERVAÇÃO */}
                    {!!ex.notes && (
                      <View style={styles.subPanel}>
                        <View style={styles.subPanelHeader}>
                          <Ionicons
                            name="information-circle-outline"
                            size={16}
                            color={COLORS.muted}
                          />
                          <Text style={styles.subPanelHeaderLabel}>Observação</Text>
                        </View>
                        <Text style={styles.observationText}>{ex.notes}</Text>
                      </View>
                    )}

                    {/* Ação principal */}
                    {isDone ? (
                      <View style={styles.setsListWrap}>
                        {setsLog.map((set, i) => (
                          <TouchableOpacity
                            key={i}
                            style={styles.setRow}
                            onPress={() => openModalForEditSet(ex, i)}
                          >
                            <Text style={styles.setRowLabel}>Série {i + 1}</Text>
                            <Text style={styles.setRowValue}>
                              {set.reps} reps · {set.weight}kg
                            </Text>
                            <Ionicons name="create-outline" size={14} color={COLORS.muted} />
                          </TouchableOpacity>
                        ))}
                      </View>
                    ) : !isResting ? (
                      <>
                        <TouchableOpacity
                          style={styles.nextButton}
                          onPress={() => openModalForNewSet(ex)}
                        >
                          <Text style={styles.nextButtonText}>REGISTRAR MELHOR SÉRIE</Text>
                        </TouchableOpacity>
                        {/* T2: optional rest timer — never blocks the flow */}
                        <TouchableOpacity
                          style={styles.restOptButton}
                          onPress={() => { beginRestBetweenSets(ex.key, 0); startRestCountdown(); }}
                        >
                          <Ionicons name="timer-outline" size={14} color={COLORS.muted} />
                          <Text style={styles.restOptButtonText}>Cronômetro de descanso</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.finishEarlyButton}
                          onPress={() => handleFinishEarly(ex)}
                        >
                          <Text style={styles.finishEarlyButtonText}>Finalizar exercício</Text>
                        </TouchableOpacity>
                      </>
                    ) : null}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Barra fixa: tempo de treino + ação contextual */}
      <View style={styles.footer}>
        <View>
          <View style={styles.footerTimeLabelRow}>
            <Ionicons name="time-outline" size={12} color={COLORS.muted} />
            <Text style={styles.footerTimeLabel}>Tempo de treino</Text>
          </View>
          <Text style={styles.footerTimeValue}>{formatTime(elapsedSeconds)}</Text>
        </View>

        {allDone ? (
          <TouchableOpacity style={styles.footerFinishButton} onPress={handleFinishWorkout}>
            <Text style={styles.footerFinishButtonText}>FINALIZAR TREINO</Text>
          </TouchableOpacity>
        ) : restPhaseActive ? (
          <TouchableOpacity style={styles.footerActionButton} onPress={skipRest}>
            <Text style={styles.footerActionButtonText}>Pular descanso</Text>
          </TouchableOpacity>
        ) : expandedKey === null ? (
          <TouchableOpacity style={styles.footerNavButton} onPress={openFirstPending}>
            <Text style={styles.footerNavButtonText}>Começar treino</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.footerNavButton} onPress={goToNextPendingExercise}>
            <Text style={styles.footerNavButtonText}>Próximo exercício</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Reps + weight stepper modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalExerciseName}>{modalExercise?.name}</Text>
            <Text style={styles.modalTitle}>
              {modalEditIndex !== null
                ? `Editar ${modalSetNumber}ª série`
                : 'Qual foi sua melhor série?'}
            </Text>

            <Stepper label="REPETIÇÕES" value={modalReps} step={1} onChange={updateModalReps} />
            <View style={{ height: SPACING.md }} />
            <Stepper label="PESO USADO (KG)" value={modalWeight} step={2.5} onChange={updateModalWeight} />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalSkip} onPress={handleCancelModal}>
                <Text style={styles.modalSkipText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleSubmitSet}>
                <Text style={styles.modalSaveText}>
                  {modalEditIndex !== null ? 'Salvar' : 'Enviar e avançar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function makeStyles(COLORS: ThemeColors) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  backButton: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.xs },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  topBarTitle: {
    flex: 1,
    textAlign: 'center',
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 17,
  },

  headerProgressWrap: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  headerProgressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.cardBorder,
    overflow: 'hidden',
  },
  headerProgressFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 2,
  },
  headerProgressCount: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
    alignSelf: 'flex-end',
  },

  groupLabel: { ...FONT.sectionLabel, color: COLORS.muted, marginBottom: SPACING.sm, marginTop: SPACING.lg },

  generalNotesBox: { marginBottom: SPACING.lg },

  // Fechado
  cardClosed: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  cardClosedDone: { backgroundColor: COLORS.doneBg, borderColor: COLORS.doneBorder },
  cardClosedName: { color: COLORS.text, fontWeight: '700', fontSize: 14.5 },
  cardClosedGroup: { color: COLORS.muted, fontSize: 12, fontWeight: '600', marginTop: 2 },
  cardClosedSummary: { color: COLORS.done, fontSize: 12, fontWeight: '700', marginTop: 4 },

  // Aberto — elevado, com faixa de destaque na borda esquerda
  cardCurrent: {
    backgroundColor: COLORS.cardElevated,
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
    borderRadius: RADIUS.sm,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  cardCurrentDone: { borderColor: COLORS.done, borderLeftColor: COLORS.done },
  cardCurrentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  cardCurrentHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  cardCurrentName: { color: COLORS.text, fontWeight: '800', fontSize: 16, flex: 1 },
  videoButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Sub-painéis aninhados
  subPanel: {
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  subPanelHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SPACING.sm },
  subPanelHeaderLabel: {
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: '800',
    color: COLORS.muted,
    textTransform: 'uppercase',
  },
  setsMainText: { color: COLORS.text, fontWeight: '800', fontSize: 18, marginBottom: 4 },
  subPanelMutedText: { color: COLORS.mutedDim, fontSize: 12.5, fontWeight: '600' },
  subPanelAccentText: { color: COLORS.accent, fontWeight: '800', fontSize: 13, marginTop: SPACING.sm },
  observationText: { color: COLORS.text, fontSize: 13, lineHeight: 19, fontStyle: 'italic' },

  restPanelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  restPanelSeconds: {
    color: COLORS.text,
    fontWeight: '900',
    fontSize: 22,
    fontVariant: ['tabular-nums'],
  },
  restStartButtonCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 9,
  },
  restStartButtonCompactText: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '800' },

  nextButton: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.sm,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  nextButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14, letterSpacing: 0.5 },

  finishEarlyButton: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: SPACING.sm,
  },
  finishEarlyButtonText: { color: COLORS.muted, fontWeight: '700', fontSize: 13.5 },

  // T2: optional rest timer button — outline style, never blocks the flow
  restOptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: RADIUS.sm,
    paddingVertical: 10,
    marginTop: SPACING.sm,
  },
  restOptButtonText: { color: COLORS.muted, fontWeight: '700', fontSize: 13 },

  setsListWrap: {
    backgroundColor: COLORS.bgElevated,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    marginTop: SPACING.md,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  setRowLabel: { color: COLORS.text, fontWeight: '700', fontSize: 13 },
  setRowValue: { color: COLORS.muted, fontSize: 12.5, fontWeight: '600', flex: 1, textAlign: 'right', marginRight: 4 },

  // Observações gerais do dia (topo da página)
  notesBox: {
    backgroundColor: COLORS.bgElevated,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  notesHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  notesTitle: { color: COLORS.text, fontSize: 12.5, fontWeight: '700' },
  notesText: { color: COLORS.muted, fontSize: 12.5, marginTop: SPACING.sm, lineHeight: 18 },

  // Descanso — anel circular imersivo
  restRingContainer: { alignItems: 'center', paddingVertical: SPACING.sm, gap: SPACING.md },
  restRingSvgWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restRingCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restRingSeconds: {
    color: COLORS.text,
    fontWeight: '900',
    fontSize: 48,
    fontVariant: ['tabular-nums'],
  },
  restRingSecondsLabel: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  restRingExerciseText: { color: COLORS.done, fontWeight: '700', fontSize: 13.5, textAlign: 'center' },
  restRingControls: { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg },
  restSkipButton: {
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  restSkipButtonText: { color: COLORS.muted, fontSize: 12, fontWeight: '700' },
  restPauseLink: {
    color: COLORS.text,
    fontSize: 12.5,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  // Barra fixa no rodapé
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.bgElevated,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  footerTimeLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  footerTimeLabel: { color: COLORS.muted, fontSize: 10.5, fontWeight: '700' },
  footerTimeValue: {
    color: COLORS.text,
    fontWeight: '900',
    fontSize: 20,
    letterSpacing: 0.5,
    fontVariant: ['tabular-nums'],
  },
  footerActionButton: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 12,
  },
  footerActionButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  footerFinishButton: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.xl,
    paddingVertical: 15,
  },
  footerFinishButtonText: { color: '#FFFFFF', fontWeight: '900', fontSize: 14.5, letterSpacing: 0.5 },
  footerNavButton: {
    backgroundColor: COLORS.text,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 12,
  },
  // T5a: text must contrast against COLORS.text background in both themes.
  footerNavButtonText: { color: COLORS.bg, fontWeight: '800', fontSize: 13 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  modalCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  modalExerciseName: {
    color: COLORS.muted,
    fontWeight: '700',
    fontSize: 12.5,
    textAlign: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: 18,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  stepperBlock: { alignItems: 'center' },
  stepperLabel: {
    ...FONT.sectionLabel,
    color: COLORS.muted,
    fontSize: 11,
    marginBottom: SPACING.sm,
  },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg },
  stepperValue: {
    color: COLORS.text,
    fontWeight: '900',
    fontSize: 28,
    minWidth: 64,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  stepperInput: {
    color: COLORS.text,
    fontWeight: '900',
    fontSize: 28,
    minWidth: 64,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.accent,
    paddingBottom: 2,
  },
  modalButtons: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xl },
  modalSkip: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: RADIUS.sm,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalSkipText: { color: COLORS.muted, fontWeight: '700', fontSize: 14 },
  modalSave: {
    flex: 1,
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.sm,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalSaveText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13.5 },

  // Estados vazios/erro
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 16,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  emptySubtitle: { color: COLORS.muted, fontSize: 13, textAlign: 'center' },
  emptyButton: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.sm,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: SPACING.md,
  },
  emptyButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
  });
}