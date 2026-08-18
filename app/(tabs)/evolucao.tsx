import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  computeTrend,
  TrackedExercise,
  Trend,
} from '../../lib/exerciseWeights';
import { getBodyMetrics, BodyMetricEntry } from '../../lib/bodyMetrics';
import { usePlan } from '../../context/PlanContext';
import { useAuth } from '../../context/AuthContext';
import { useWorkoutLog } from '../../context/WorkoutLogContext';
import { filterByHistoryDays } from '../../lib/plans';
import MiniLineChart from '../../components/MiniLineChart';
import LineChart from '../../components/LineChart';
import Entrance from '../../components/Entrance';
import LockedFeature from '../../components/LockedFeature';
import { SPACING, RADIUS, FONT } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { EXERCISE_DATABASE } from '../../data/exerciseDatabase';
import type { ThemeColors } from '../../constants/theme';

type TrendFilter = 'all' | Trend;
type ViewMode = 'exercicios' | 'corpo';

function formatEntryDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function formatWeight(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function formatNumber(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function trendColor(direction: Trend, COLORS: ThemeColors): string {
  switch (direction) {
    case 'up': return COLORS.done;
    case 'down': return COLORS.danger;
    case 'new': return COLORS.accent;
    default: return COLORS.muted;
  }
}

function useCountUp(target: number, duration = 600): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let raf: number;
    const start = Date.now();

    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      setValue(Math.round(target * progress));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

function ExerciseCard({
  item,
  index,
  onPress,
}: {
  item: TrackedExercise;
  index: number;
  onPress: () => void;
}) {
  const { COLORS } = useTheme();
  const trend = computeTrend(item.history);
  const color = trendColor(trend.direction, COLORS);
  const icon =
    trend.direction === 'up' ? 'arrow-up' : trend.direction === 'down' ? 'arrow-down' : 'remove';
  const badgeText =
    trend.direction === 'new'
      ? 'NOVO'
      : `${trend.delta > 0 ? '+' : ''}${formatNumber(trend.delta)}kg`;
  const chartData = item.history.slice(-8).map((h) => h.weight);
  const delay = Math.min(index * 40, 300);

  const cardStyles = useMemo(() => StyleSheet.create({
    cardWrap: { marginBottom: SPACING.md },
    card: {
      flexDirection: 'row',
      backgroundColor: COLORS.card,
      borderWidth: 1,
      borderColor: COLORS.cardBorder,
      borderRadius: RADIUS.md,
      overflow: 'hidden',
    },
    cardStripe: { width: 3 },
    cardBody: { flex: 1, padding: SPACING.md },
    cardHeaderRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: SPACING.sm,
    },
    cardName: { color: COLORS.text, fontWeight: '700', fontSize: 14.5 },
    cardCategory: { color: COLORS.muted, fontSize: 12, fontWeight: '600', marginTop: 2 },
    cardWeightBlock: { alignItems: 'flex-end' },
    cardWeight: { color: COLORS.text, fontWeight: '900', fontSize: 17 },
    trendBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      borderRadius: RADIUS.pill,
      paddingHorizontal: 7,
      paddingVertical: 3,
      marginTop: 4,
    },
    trendBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
    cardChartWrap: { marginTop: SPACING.sm },
  }), [COLORS]);

  return (
    <Entrance delay={delay} style={cardStyles.cardWrap}>
      <TouchableOpacity style={cardStyles.card} onPress={onPress} activeOpacity={0.75}>
        <View style={[cardStyles.cardStripe, { backgroundColor: color }]} />
        <View style={cardStyles.cardBody}>
          <View style={cardStyles.cardHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={cardStyles.cardName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={cardStyles.cardCategory}>{item.category}</Text>
            </View>
            <View style={cardStyles.cardWeightBlock}>
              <Text style={cardStyles.cardWeight}>{formatNumber(trend.currentWeight)}kg</Text>
              <View style={[cardStyles.trendBadge, { backgroundColor: color }]}>
                {trend.direction !== 'new' && <Ionicons name={icon} size={10} color="#FFFFFF" />}
                <Text style={cardStyles.trendBadgeText}>{badgeText}</Text>
              </View>
            </View>
          </View>
          {chartData.length >= 2 && (
            <View style={cardStyles.cardChartWrap}>
              <MiniLineChart data={chartData} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Entrance>
  );
}

export default function EvolucaoScreen() {
  const router = useRouter();
  const { hasFeature } = usePlan();
  const historyDays = hasFeature('historyDays');
  const { user } = useAuth();
  const userId = user?.id;
  const { exerciseHistory } = useWorkoutLog();
  const [viewMode, setViewMode] = useState<ViewMode>('exercicios');
  const [tracked, setTracked] = useState<TrackedExercise[]>([]);
  const [filter, setFilter] = useState<TrendFilter>('all');
  const [bodyMetrics, setBodyMetrics] = useState<BodyMetricEntry[]>([]);
  const { COLORS, mode } = useTheme();
  const brandLogo = mode === 'dark'
    ? require('../../assets/images/logoalto.png')
    : require('../../assets/images/darklogo.png');

  // Rebuild TrackedExercise list whenever exerciseHistory changes
  useEffect(() => {
    const list: TrackedExercise[] = Object.entries(exerciseHistory).map(([name, history]) => {
      const dbEntry = EXERCISE_DATABASE.find((e) => e.name === name);
      return { name, category: dbEntry?.category ?? 'Outro', history };
    });
    const visible = list
      .map((item) => ({ ...item, history: filterByHistoryDays(item.history, historyDays) }))
      .filter((item) => item.history.length > 0);
    setTracked(visible);
  }, [exerciseHistory, historyDays]);

  useFocusEffect(
    useCallback(() => {
      if (!userId) {
        setBodyMetrics([]);
        return;
      }
      let active = true;
      getBodyMetrics(userId).then((list) => {
        if (active) setBodyMetrics(list);
      });
      return () => {
        active = false;
      };
    }, [userId])
  );

  const sorted = [...tracked].sort((a, b) => {
    const aDate = a.history[a.history.length - 1]?.date ?? '';
    const bDate = b.history[b.history.length - 1]?.date ?? '';
    return bDate.localeCompare(aDate);
  });

  const trends = sorted.map((e) => computeTrend(e.history).direction);
  const counts = {
    up: trends.filter((t) => t === 'up').length,
    same: trends.filter((t) => t === 'same').length,
    down: trends.filter((t) => t === 'down').length,
  };
  const total = sorted.length;
  const countUpValue = useCountUp(total);

  const filtered = filter === 'all' ? sorted : sorted.filter((e, i) => trends[i] === filter);

  const chips: { key: TrendFilter; label: string }[] = [
    { key: 'all', label: `Todos (${total})` },
    { key: 'up', label: `↑ Evoluindo (${counts.up})` },
    { key: 'same', label: `→ Estável (${counts.same})` },
    { key: 'down', label: `↓ Caiu (${counts.down})` },
  ];

  // bodyMetrics já vem ordenado do mais recente pro mais antigo (getBodyMetrics).
  const weightAscending = [...bodyMetrics]
    .filter((m) => m.weight !== undefined)
    .reverse();
  const weightDeltaById = new Map<string, number>();
  weightAscending.forEach((entry, i) => {
    if (i === 0) return;
    weightDeltaById.set(entry.id, entry.weight! - weightAscending[i - 1].weight!);
  });
  const weightChartData = weightAscending.map((m) => ({
    label: formatShortDate(m.date),
    value: m.weight!,
  }));
  const photosCount = bodyMetrics.filter((m) => !!m.photoUri).length;

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xs },
    brand: { width: '45%', height: undefined, aspectRatio: 1.5 },
    title: { ...FONT.title, fontSize: 26, color: COLORS.text, marginBottom: SPACING.lg },
    emptyState: { alignItems: 'center', paddingVertical: 60, gap: SPACING.sm },
    emptyTitle: { color: COLORS.text, fontWeight: '800', fontSize: 16, marginTop: SPACING.sm },
    emptySubtitle: { color: COLORS.muted, fontSize: 13, textAlign: 'center' },
    heroCard: {
      backgroundColor: COLORS.card,
      borderWidth: 1,
      borderColor: COLORS.cardBorder,
      borderRadius: RADIUS.lg,
      paddingVertical: SPACING.xl,
      alignItems: 'center',
      marginBottom: SPACING.lg,
    },
    heroNumber: { color: COLORS.accent, fontWeight: '900', fontSize: 44, fontVariant: ['tabular-nums'] },
    heroLabel: { ...FONT.eyebrow, fontSize: 10.5, color: COLORS.muted, marginTop: 4 },
    chipsRow: { gap: SPACING.xs, paddingBottom: SPACING.lg },
    chip: {
      borderWidth: 1,
      borderColor: COLORS.cardBorder,
      borderRadius: RADIUS.pill,
      paddingHorizontal: 14,
      paddingVertical: 8,
      backgroundColor: COLORS.card,
    },
    chipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
    chipText: { color: COLORS.muted, fontSize: 12, fontWeight: '700' },
    chipTextActive: { color: '#FFFFFF' },
    noResultsText: { color: COLORS.muted, fontSize: 13, textAlign: 'center', marginTop: SPACING.xl },
    modeRow: {
      flexDirection: 'row',
      gap: SPACING.sm,
      marginBottom: SPACING.lg,
    },
    modePill: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: COLORS.cardBorder,
      borderRadius: RADIUS.pill,
      backgroundColor: COLORS.card,
    },
    modePillActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
    modePillText: { color: COLORS.muted, fontWeight: '700', fontSize: 13 },
    modePillTextActive: { color: '#FFFFFF' },
    registerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: COLORS.accent,
      borderRadius: RADIUS.sm,
      paddingVertical: 14,
      marginBottom: SPACING.lg,
    },
    registerButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14, letterSpacing: 0.5 },
    bodyChartCard: {
      backgroundColor: COLORS.card,
      borderWidth: 1,
      borderColor: COLORS.cardBorder,
      borderRadius: RADIUS.lg,
      padding: SPACING.lg,
      marginBottom: SPACING.lg,
    },
    compareButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      borderWidth: 1,
      borderColor: COLORS.cardBorder,
      borderRadius: RADIUS.sm,
      paddingVertical: 12,
      marginBottom: SPACING.lg,
    },
    compareButtonText: { color: COLORS.text, fontWeight: '700', fontSize: 13 },
    bodyEntryCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.md,
      backgroundColor: COLORS.card,
      borderWidth: 1,
      borderColor: COLORS.cardBorder,
      borderRadius: RADIUS.md,
      padding: SPACING.md,
      marginBottom: SPACING.sm,
    },
    bodyEntryDate: { color: COLORS.text, fontWeight: '700', fontSize: 13.5 },
    bodyEntryWeightRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 3 },
    bodyEntryWeight: { color: COLORS.text, fontWeight: '800', fontSize: 15 },
    bodyEntryDelta: { color: COLORS.muted, fontSize: 12, fontWeight: '600' },
    bodyEntryMeasurements: { color: COLORS.muted, fontSize: 11.5, fontWeight: '600', marginTop: 3 },
    bodyEntryThumb: { width: 50, height: 50, borderRadius: RADIUS.sm },
  }), [COLORS]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 60 }}
      >
        <View style={styles.brandRow}>
          <Image source={brandLogo} style={styles.brand} resizeMode="contain" />
        </View>
        <Text style={styles.title}>Evolução</Text>

        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modePill, viewMode === 'exercicios' && styles.modePillActive]}
            onPress={() => setViewMode('exercicios')}
          >
            <Text
              style={[
                styles.modePillText,
                viewMode === 'exercicios' && styles.modePillTextActive,
              ]}
            >
              Exercícios
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modePill, viewMode === 'corpo' && styles.modePillActive]}
            onPress={() => setViewMode('corpo')}
          >
            <Text style={[styles.modePillText, viewMode === 'corpo' && styles.modePillTextActive]}>
              Corpo
            </Text>
          </TouchableOpacity>
        </View>

        {viewMode === 'exercicios' &&
          (total === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="trending-up-outline" size={56} color={COLORS.mutedDim} />
              <Text style={styles.emptyTitle}>Nenhuma evolução registrada ainda</Text>
              <Text style={styles.emptySubtitle}>
                Complete treinos pra começar a ver sua evolução aqui.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.heroCard}>
                <Text style={styles.heroNumber}>{countUpValue}</Text>
                <Text style={styles.heroLabel}>
                  {total === 1 ? 'EXERCÍCIO ACOMPANHADO' : 'EXERCÍCIOS ACOMPANHADOS'}
                </Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsRow}
              >
                {chips.map((chip) => (
                  <TouchableOpacity
                    key={chip.key}
                    style={[styles.chip, filter === chip.key && styles.chipActive]}
                    onPress={() => setFilter(chip.key)}
                  >
                    <Text style={[styles.chipText, filter === chip.key && styles.chipTextActive]}>
                      {chip.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {filtered.length === 0 ? (
                <Text style={styles.noResultsText}>Nenhum exercício nesse filtro.</Text>
              ) : (
                filtered.map((item, i) => (
                  <ExerciseCard
                    key={item.name}
                    item={item}
                    index={i}
                    onPress={() =>
                      router.push(`/evolucao-exercicio?name=${encodeURIComponent(item.name)}`)
                    }
                  />
                ))
              )}
            </>
          ))}

        {viewMode === 'corpo' && !hasFeature('bodyMetricsEnabled') && (
          <LockedFeature message="Medidas corporais e fotos de progresso estão disponíveis a partir do plano Plus." />
        )}

        {viewMode === 'corpo' && hasFeature('bodyMetricsEnabled') && (
          <>
            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => router.push('/registrar-medida')}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.registerButtonText}>REGISTRAR HOJE</Text>
            </TouchableOpacity>

            {bodyMetrics.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="body-outline" size={56} color={COLORS.mutedDim} />
                <Text style={styles.emptyTitle}>Nenhuma medida registrada ainda</Text>
                <Text style={styles.emptySubtitle}>
                  Registre seu peso, medidas ou uma foto pra acompanhar sua evolução física.
                </Text>
              </View>
            ) : (
              <>
                {weightChartData.length >= 2 && (
                  <View style={styles.bodyChartCard}>
                    <LineChart data={weightChartData} unit="kg" />
                  </View>
                )}

                {photosCount >= 2 && (
                  <TouchableOpacity
                    style={styles.compareButton}
                    onPress={() => router.push('/comparar-fotos')}
                  >
                    <Ionicons name="images-outline" size={16} color={COLORS.text} />
                    <Text style={styles.compareButtonText}>Comparar fotos</Text>
                  </TouchableOpacity>
                )}

                {bodyMetrics.map((entry) => {
                  const delta = weightDeltaById.get(entry.id);
                  const m = entry.measurements;
                  const measurementParts: string[] = [];
                  if (m?.waist) measurementParts.push(`Cintura ${formatWeight(m.waist)}cm`);
                  if (m?.chest) measurementParts.push(`Peito ${formatWeight(m.chest)}cm`);
                  if (m?.arm) measurementParts.push(`Braço ${formatWeight(m.arm)}cm`);
                  if (m?.thigh) measurementParts.push(`Coxa ${formatWeight(m.thigh)}cm`);
                  if (m?.hip) measurementParts.push(`Quadril ${formatWeight(m.hip)}cm`);

                  return (
                    <View key={entry.id} style={styles.bodyEntryCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.bodyEntryDate}>{formatEntryDate(entry.date)}</Text>
                        {entry.weight !== undefined && (
                          <View style={styles.bodyEntryWeightRow}>
                            <Text style={styles.bodyEntryWeight}>
                              {formatWeight(entry.weight)}kg
                            </Text>
                            {delta !== undefined && (
                              <Text style={styles.bodyEntryDelta}>
                                ({delta > 0 ? '+' : ''}
                                {formatWeight(delta)}kg)
                              </Text>
                            )}
                          </View>
                        )}
                        {measurementParts.length > 0 && (
                          <Text style={styles.bodyEntryMeasurements} numberOfLines={1}>
                            {measurementParts.join(' · ')}
                          </Text>
                        )}
                      </View>
                      {entry.photoUri && (
                        <Image source={{ uri: entry.photoUri }} style={styles.bodyEntryThumb} />
                      )}
                    </View>
                  );
                })}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}