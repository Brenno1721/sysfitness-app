import { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWorkoutLog } from '../context/WorkoutLogContext';
import { SPACING, RADIUS, FONT } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

function formatDateLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();

  if (sameDay(date, today)) return 'Hoje';
  if (sameDay(date, yesterday)) return 'Ontem';

  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
}

export default function HistoricoScreen() {
  const { history } = useWorkoutLog();
  const router = useRouter();
  const { COLORS } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: SPACING.lg, paddingTop: SPACING.xl, paddingBottom: SPACING.md,
    },
    title: { ...FONT.title, fontSize: 18, color: COLORS.text },
    groupLabel: { ...FONT.sectionLabel, color: COLORS.muted, marginBottom: SPACING.sm },
    card: {
      flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
      backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder,
      borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm,
    },
    workoutName: { color: COLORS.text, fontWeight: '700', fontSize: 14.5, marginBottom: 3 },
    workoutMeta: { color: COLORS.muted, fontSize: 12 },
    empty: { alignItems: 'center', paddingVertical: 80, gap: SPACING.sm },
    emptyText: { color: COLORS.mutedDim, fontSize: 13.5, fontWeight: '600' },
  }), [COLORS]);

  const groups: Record<string, typeof history> = {};
  history.forEach((h) => {
    const label = formatDateLabel(h.date);
    if (!groups[label]) groups[label] = [];
    groups[label].push(h);
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Histórico</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 60 }}>
        {history.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="time-outline" size={32} color={COLORS.mutedDim} />
            <Text style={styles.emptyText}>Nenhum treino registrado ainda</Text>
          </View>
        ) : (
          Object.entries(groups).map(([label, entries]) => (
            <View key={label} style={{ marginBottom: SPACING.lg }}>
              <Text style={styles.groupLabel}>{label.toUpperCase()}</Text>
              {entries.map((entry, i) => {
                const complete = entry.completed === entry.total;
                return (
                  <View key={i} style={styles.card}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.workoutName}>{entry.full}</Text>
                      <Text style={styles.workoutMeta}>
                        {new Date(entry.date).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                       •{entry.completed}/{entry.total} exercícios
                      </Text>
                    </View>
                    {complete && (
                      <Ionicons name="checkmark-circle" size={22} color={COLORS.done} />
                    )}
                  </View>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}