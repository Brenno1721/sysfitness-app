import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PLAN, DAY_ORDER } from '../data/workoutPlan';
import { apiGet } from '../lib/api';
import LineChart from '../components/LineChart';
import { SPACING, RADIUS, FONT } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

type Period = 'Semana' | 'Mês' | 'Semestre';
const PERIODS: Period[] = ['Semana', 'Mês', 'Semestre'];

type ApiSession = { date: string; durationSeconds: number };

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function toMinutes(seconds: number): number {
  return Math.round(seconds / 60);
}

function buildUrl(from: Date, to: Date): string {
  return `/cardio-sessions?from=${from.toISOString()}&to=${to.toISOString()}`;
}

export default function CardioHistoricoScreen() {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>('Semana');
  const [sessions, setSessions] = useState<ApiSession[]>([]);
  const { COLORS } = useTheme();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const fetchForPeriod = useCallback(async (p: Period) => {
    try {
      let from: Date;
      let to: Date = new Date(now);
      to.setHours(23, 59, 59, 999);

      if (p === 'Semana') {
        from = startOfWeek(now);
        to = new Date(from);
        to.setDate(from.getDate() + 6);
        to.setHours(23, 59, 59, 999);
      } else if (p === 'Mês') {
        from = new Date(year, month, 1);
        to = new Date(year, month + 1, 0, 23, 59, 59, 999);
      } else {
        from = new Date(year, month - 5, 1);
      }

      const data = await apiGet<ApiSession[]>(buildUrl(from, to));
      setSessions(data);
    } catch {
      setSessions([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchForPeriod(period);
    }, [period, fetchForPeriod])
  );

  const weekStart = startOfWeek(now);
  const weekDays = DAY_ORDER.map((key, i) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    const totalSeconds = sessions
      .filter((h) => sameDay(new Date(h.date), date))
      .reduce((sum, h) => sum + h.durationSeconds, 0);
    const plan = PLAN[key];
    const target = 'rest' in plan ? undefined : plan.cardioTarget;
    return { key, label: plan.label, totalSeconds, target };
  });
  const weekTotalMinutes = toMinutes(weekDays.reduce((sum, d) => sum + d.totalSeconds, 0));

  const bucketCount = Math.ceil(daysInMonth(year, month) / 7);
  const monthBuckets = Array.from({ length: bucketCount }, () => 0);
  sessions.forEach((h) => {
    const d = new Date(h.date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      monthBuckets[Math.floor((d.getDate() - 1) / 7)] += h.durationSeconds;
    }
  });
  const monthTotalMinutes = toMinutes(monthBuckets.reduce((a, b) => a + b, 0));

  const semesterMonths = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(year, month - (5 - i), 1);
    return {
      year: d.getFullYear(),
      month: d.getMonth(),
      label: d.toLocaleDateString('pt-BR', { month: 'short' }),
    };
  });
  const semesterTotals = semesterMonths.map(({ year: y, month: m }) =>
    sessions
      .filter((h) => {
        const d = new Date(h.date);
        return d.getFullYear() === y && d.getMonth() === m;
      })
      .reduce((sum, h) => sum + h.durationSeconds, 0)
  );
  const semesterTotalMinutes = toMinutes(semesterTotals.reduce((a, b) => a + b, 0));
  const semesterChartData = semesterMonths.map((m, i) => ({
    label: m.label,
    value: toMinutes(semesterTotals[i]),
  }));

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.xl,
      paddingBottom: SPACING.md,
    },
    title: { ...FONT.title, fontSize: 18, color: COLORS.text },
    periodRow: {
      flexDirection: 'row',
      gap: SPACING.xs,
      paddingHorizontal: SPACING.lg,
      marginBottom: SPACING.md,
    },
    periodChip: {
      borderWidth: 1,
      borderColor: COLORS.cardBorder,
      borderRadius: RADIUS.pill,
      paddingHorizontal: 14,
      paddingVertical: 8,
      backgroundColor: COLORS.card,
    },
    periodChipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
    periodText: { color: COLORS.muted, fontSize: 12.5, fontWeight: '700' },
    periodTextActive: { color: '#FFFFFF' },
    summaryCard: {
      backgroundColor: COLORS.card,
      borderWidth: 1,
      borderColor: COLORS.cardBorder,
      borderRadius: RADIUS.lg,
      padding: SPACING.lg,
      alignItems: 'center',
      marginBottom: SPACING.lg,
    },
    summaryLabel: {
      color: COLORS.mutedDim,
      fontSize: 10.5,
      fontWeight: '700',
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    summaryValue: { color: COLORS.text, fontSize: 24, fontWeight: '900' },
    chartCard: {
      backgroundColor: COLORS.card,
      borderWidth: 1,
      borderColor: COLORS.cardBorder,
      borderRadius: RADIUS.lg,
      padding: SPACING.lg,
      marginBottom: SPACING.lg,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: COLORS.card,
      borderWidth: 1,
      borderColor: COLORS.cardBorder,
      borderRadius: RADIUS.md,
      padding: SPACING.md,
      marginBottom: SPACING.sm,
    },
    rowLabel: { color: COLORS.text, fontWeight: '700', fontSize: 14 },
    rowValue: { color: COLORS.muted, fontSize: 13, fontWeight: '600' },
  }), [COLORS]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Cardio</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.periodRow}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodChip, period === p && styles.periodChipActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: 60 }}>
        {period === 'Semana' && (
          <>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>TOTAL DA SEMANA</Text>
              <Text style={styles.summaryValue}>{weekTotalMinutes} min</Text>
            </View>
            {weekDays.map((d) => (
              <View key={d.key} style={styles.row}>
                <Text style={styles.rowLabel}>{d.label}</Text>
                <Text style={styles.rowValue}>
                  {d.totalSeconds > 0
                    ? `${toMinutes(d.totalSeconds)} min${d.target ? ` (meta: ${d.target} min)` : ''}`
                    : '—'}
                </Text>
              </View>
            ))}
          </>
        )}

        {period === 'Mês' && (
          <>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>TOTAL DO MÊS</Text>
              <Text style={styles.summaryValue}>{monthTotalMinutes} min</Text>
            </View>
            {monthBuckets.map((seconds, i) => (
              <View key={i} style={styles.row}>
                <Text style={styles.rowLabel}>Semana {i + 1}</Text>
                <Text style={styles.rowValue}>
                  {seconds > 0 ? `${toMinutes(seconds)} min` : '—'}
                </Text>
              </View>
            ))}
          </>
        )}

        {period === 'Semestre' && (
          <>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>TOTAL DO SEMESTRE</Text>
              <Text style={styles.summaryValue}>{semesterTotalMinutes} min</Text>
            </View>
            <View style={styles.chartCard}>
              <LineChart data={semesterChartData} unit=" min" />
            </View>
            {semesterMonths.map((m, i) => (
              <View key={`${m.year}-${m.month}`} style={styles.row}>
                <Text style={styles.rowLabel}>
                  {m.label.charAt(0).toUpperCase() + m.label.slice(1)}
                </Text>
                <Text style={styles.rowValue}>
                  {semesterTotals[i] > 0 ? `${toMinutes(semesterTotals[i])} min` : '—'}
                </Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}