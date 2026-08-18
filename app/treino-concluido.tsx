import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useRoutine } from '../context/RoutineContext';
import { useWorkoutLog } from '../context/WorkoutLogContext';
import { getHistory } from '../lib/exerciseWeights';
import LineChart from '../components/LineChart';
import CelebrationParticles from '../components/CelebrationParticles';
import { SPACING, RADIUS, FONT } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function CheckmarkBurst() {
  const { COLORS } = useTheme();
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withSequence(
      withTiming(1.15, { duration: 260, easing: Easing.out(Easing.ease) }),
      withSpring(1, { damping: 10, stiffness: 220 })
    );
  }, []);

  const circleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View style={{ width: 200, height: 140, alignItems: 'center', justifyContent: 'center' }}>
      <CelebrationParticles colors={[COLORS.accent, COLORS.done]} />
      <Animated.View style={[{ width: 96, height: 96, borderRadius: 48, backgroundColor: COLORS.done, alignItems: 'center', justifyContent: 'center' }, circleStyle]}>
        <Ionicons name="checkmark" size={56} color="#FFFFFF" />
      </Animated.View>
    </View>
  );
}

function Entrance({ delay, distance = 16, style, children }: { delay: number; distance?: number; style?: object; children: ReactNode }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(delay, withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * distance }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

type EvolutionItem = {
  key: string;
  name: string;
  chartData: { label: string; value: number }[];
  isRecord: boolean;
};

export default function TreinoConcluidoScreen() {
  const router = useRouter();
  const { seconds } = useLocalSearchParams<{ seconds?: string }>();
  const { activeRoutine } = useRoutine();
  const { currentDay, dayState } = useWorkoutLog();
  const { COLORS } = useTheme();

  const totalSeconds = Number(seconds) || 0;
  const [evolution, setEvolution] = useState<EvolutionItem[] | null>(null);

  const plan = activeRoutine ? activeRoutine.days[currentDay] : undefined;

  const doneExercises = useMemo(() => {
    if (!plan || 'rest' in plan) return [];
    const list: { key: string; name: string }[] = [];
    plan.groups.forEach((group, gi) => {
      group.exercises.forEach((ex, ei) => {
        const key = `${gi}-${ei}`;
        if (dayState[key]?.done) list.push({ key, name: ex.name });
      });
    });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exercisesCompleted = doneExercises.length;

  const volumeTotal = useMemo(() => {
    return doneExercises.reduce((sum, e) => {
      const setsLog = dayState[e.key]?.setsLog ?? [];
      return (
        sum +
        setsLog.reduce((s, set) => s + (Number(set.reps) || 0) * (Number(set.weight) || 0), 0)
      );
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (async () => {
      const results: EvolutionItem[] = [];
      for (const e of doneExercises) {
        const history = await getHistory(e.name);
        if (history.length >= 2) {
          const previousMax = Math.max(...history.slice(0, -1).map((h) => h.weight));
          const latest = history[history.length - 1];
          results.push({
            key: e.key,
            name: e.name,
            chartData: history.map((h) => ({
              label: new Date(h.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
              value: h.weight,
            })),
            isRecord: latest.weight > previousMax,
          });
        }
      }
      setEvolution(results);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    content: { padding: SPACING.xl, paddingTop: SPACING.xl * 1.5, alignItems: 'center' },
    titleWrap: { marginTop: SPACING.sm },
    title: { ...FONT.title, fontSize: 24, color: COLORS.text, textAlign: 'center' },
    statsRow: { flexDirection: 'row', width: '100%', marginTop: SPACING.xl, gap: SPACING.sm },
    statBlock: { flex: 1, alignItems: 'center', backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder, borderRadius: RADIUS.md, paddingVertical: SPACING.md },
    statValue: { color: COLORS.text, fontWeight: '900', fontSize: 17 },
    statLabel: { color: COLORS.mutedDim, fontSize: 9.5, fontWeight: '700', marginTop: 4, letterSpacing: 0.5 },
    sectionTitleWrap: { width: '100%', marginTop: SPACING.xl * 1.2, marginBottom: SPACING.md },
    sectionTitle: { ...FONT.sectionLabel, color: COLORS.muted },
    emptyEvolutionWrap: { width: '100%' },
    emptyEvolutionText: { color: COLORS.muted, fontSize: 13, textAlign: 'center', lineHeight: 19 },
    evolutionCard: { width: '100%', backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md },
    evolutionCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm },
    evolutionCardName: { color: COLORS.text, fontWeight: '700', fontSize: 14, flex: 1 },
    recordBadge: { backgroundColor: COLORS.done, borderRadius: RADIUS.pill, paddingHorizontal: 8, paddingVertical: 3, marginLeft: SPACING.sm },
    recordBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
    buttonWrap: { width: '100%', marginTop: SPACING.lg },
    button: { backgroundColor: COLORS.accent, borderRadius: RADIUS.sm, paddingVertical: 16, alignItems: 'center' },
    buttonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14, letterSpacing: 0.5 },
  }), [COLORS]);

  const stats = [
    { label: 'TEMPO', value: formatTime(totalSeconds) },
    { label: 'EXERCÍCIOS', value: String(exercisesCompleted) },
    { label: 'VOLUME', value: `${Math.round(volumeTotal)}kg` },
  ];

  const evolutionBaseDelay = 600;
  const buttonDelay = 1000;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <CheckmarkBurst />

        <Entrance delay={200} style={styles.titleWrap}>
          <Text style={styles.title}>Treino concluído! ??</Text>
        </Entrance>

        <View style={styles.statsRow}>
          {stats.map((stat, i) => (
            <Entrance key={stat.label} delay={350 + i * 80} distance={10} style={styles.statBlock}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </Entrance>
          ))}
        </View>

        <Entrance delay={evolutionBaseDelay} style={styles.sectionTitleWrap}>
          <Text style={styles.sectionTitle}>Sua evolução</Text>
        </Entrance>

        {evolution !== null &&
          (evolution.length === 0 ? (
            <Entrance delay={evolutionBaseDelay + 80} style={styles.emptyEvolutionWrap}>
              <Text style={styles.emptyEvolutionText}>
                Continue treinando pra começar a ver sua evolução aqui.
              </Text>
            </Entrance>
          ) : (
            evolution.map((item, i) => (
              <Entrance key={item.key} delay={evolutionBaseDelay + 100 + i * 100} style={styles.evolutionCard}>
                <View style={styles.evolutionCardHeader}>
                  <Text style={styles.evolutionCardName}>{item.name}</Text>
                  {item.isRecord && (
                    <View style={styles.recordBadge}>
                      <Text style={styles.recordBadgeText}>Novo recorde ??</Text>
                    </View>
                  )}
                </View>
                <LineChart data={item.chartData} height={100} />
              </Entrance>
            ))
          ))}

        <Entrance delay={buttonDelay} style={styles.buttonWrap}>
          <TouchableOpacity style={styles.button} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.buttonText}>VOLTAR PARA O INÍCIO</Text>
          </TouchableOpacity>
        </Entrance>
      </ScrollView>
    </SafeAreaView>
  );
}