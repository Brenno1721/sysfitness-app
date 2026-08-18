import { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { WeightRecord } from '../lib/exerciseWeights';
import { useWorkoutLog } from '../context/WorkoutLogContext';
import { EXERCISE_DATABASE } from '../data/exerciseDatabase';
import { usePlan } from '../context/PlanContext';
import { filterByHistoryDays } from '../lib/plans';
import LineChart from '../components/LineChart';
import Entrance from '../components/Entrance';
import { SPACING, RADIUS, FONT } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

function formatNumber(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
}

export default function EvolucaoExercicioScreen() {
  const router = useRouter();
  const { name } = useLocalSearchParams<{ name?: string }>();
  const exerciseName = name ? decodeURIComponent(name) : '';
  const { exerciseHistory } = useWorkoutLog();
  const { COLORS } = useTheme();
  const { hasFeature } = usePlan();
  const historyDays = hasFeature('historyDays');

  const history: WeightRecord[] | null = exerciseName
    ? filterByHistoryDays(exerciseHistory[exerciseName] ?? [], historyDays)
    : null;

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.md,
      paddingBottom: SPACING.sm,
    },
    headerName: { color: COLORS.text, fontWeight: '800', fontSize: 16 },
    headerCategory: { color: COLORS.muted, fontSize: 12, fontWeight: '600', marginTop: 1 },
    statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
    statCard: {
      flex: 1,
      backgroundColor: COLORS.card,
      borderWidth: 1,
      borderColor: COLORS.cardBorder,
      borderRadius: RADIUS.md,
      padding: SPACING.md,
      alignItems: 'center',
    },
    statLabel: {
      color: COLORS.mutedDim,
      fontSize: 9,
      fontWeight: '700',
      marginBottom: 6,
      textAlign: 'center',
    },
    statValue: { color: COLORS.text, fontSize: 15, fontWeight: '800' },
    chartCard: {
      backgroundColor: COLORS.card,
      borderWidth: 1,
      borderColor: COLORS.cardBorder,
      borderRadius: RADIUS.lg,
      padding: SPACING.lg,
      marginBottom: SPACING.lg,
    },
    sectionTitle: { ...FONT.sectionLabel, color: COLORS.muted, marginBottom: SPACING.sm },
    historyList: {
      backgroundColor: COLORS.card,
      borderWidth: 1,
      borderColor: COLORS.cardBorder,
      borderRadius: RADIUS.md,
      overflow: 'hidden',
    },
    historyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      paddingHorizontal: SPACING.md,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.cardBorder,
    },
    historyDate: { color: COLORS.text, fontWeight: '700', fontSize: 13, flex: 1 },
    historyDetail: { color: COLORS.muted, fontSize: 12.5, fontWeight: '600' },
    prBadge: {
      backgroundColor: COLORS.done,
      borderRadius: RADIUS.pill,
      paddingHorizontal: 7,
      paddingVertical: 2,
    },
    prBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
    empty: { alignItems: 'center', paddingVertical: 80, gap: SPACING.sm },
    emptyText: { color: COLORS.mutedDim, fontSize: 13.5, fontWeight: '600' },
  }), [COLORS]);

  const category = EXERCISE_DATABASE.find((e) => e.name === exerciseName)?.category ?? 'Outro';

  if (history === null) {
    return <SafeAreaView style={styles.container} edges={['top']} />;
  }

  const first = history[0];
  const last = history[history.length - 1];
  const totalDiff = history.length > 0 ? last.weight - first.weight : 0;
  const maxWeight = history.length > 0 ? Math.max(...history.map((h) => h.weight)) : 0;

  const chartData = history.map((h) => ({ label: formatShortDate(h.date), value: h.weight }));
  const reversedHistory = [...history].reverse();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerName} numberOfLines={1}>
            {exerciseName}
          </Text>
          <Text style={styles.headerCategory}>{category}</Text>
        </View>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 60 }}>
        {history.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="trending-up-outline" size={40} color={COLORS.mutedDim} />
            <Text style={styles.emptyText}>Nenhum registro encontrado.</Text>
          </View>
        ) : (
          <>
            <Entrance delay={0} style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>PRIMEIRO REGISTRO</Text>
                <Text style={styles.statValue}>{formatNumber(first.weight)}kg</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>ATUAL</Text>
                <Text style={styles.statValue}>{formatNumber(last.weight)}kg</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>EVOLUÇÃO TOTAL</Text>
                <Text
                  style={[
                    styles.statValue,
                    { color: totalDiff >= 0 ? COLORS.done : COLORS.danger },
                  ]}
                >
                  {totalDiff >= 0 ? '+' : ''}
                  {formatNumber(totalDiff)}kg
                </Text>
              </View>
            </Entrance>

            {chartData.length >= 2 && (
              <Entrance delay={150} style={styles.chartCard}>
                <LineChart data={chartData} />
              </Entrance>
            )}

            <Entrance delay={300}>
              <Text style={styles.sectionTitle}>Histórico completo</Text>
              <View style={styles.historyList}>
                {reversedHistory.map((record, i) => (
                  <View key={i} style={styles.historyRow}>
                    <Text style={styles.historyDate}>{formatFullDate(record.date)}</Text>
                    <Text style={styles.historyDetail}>
                      {record.reps} reps · {formatNumber(record.weight)}kg
                    </Text>
                    {record.weight === maxWeight && (
                      <View style={styles.prBadge}>
                        <Text style={styles.prBadgeText}>PR</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </Entrance>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}