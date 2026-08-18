import { useMemo } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRoutine } from '../context/RoutineContext';
import { todayKey, totalExercises } from '../data/workoutPlan';
import { SPACING, RADIUS, FONT } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

export default function TreinoResumoScreen() {
  const router = useRouter();
  const { activeRoutine } = useRoutine();
  const { mode, COLORS } = useTheme();
  const brandLogo = mode === 'dark'
    ? require('../assets/images/logoalto.png')
    : require('../assets/images/darklogo.png');

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    backButton: {
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.md,
      paddingBottom: SPACING.xs,
    },
    brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xs },
    brand: { width: '62%', height: undefined, aspectRatio: 1.5 },
    eyebrow: { ...FONT.eyebrow, color: COLORS.muted, marginBottom: 6 },
    title: { ...FONT.title, fontSize: 26, color: COLORS.text, marginBottom: SPACING.md },
    tagRow: { flexDirection: 'row', gap: SPACING.xs, marginBottom: SPACING.sm },
    tag: {
      backgroundColor: COLORS.bgElevated,
      borderWidth: 1,
      borderColor: COLORS.cardBorder,
      borderRadius: RADIUS.sm,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    tagText: { color: COLORS.muted, fontSize: 10.5, fontWeight: '700' },
    groupLabel: { ...FONT.sectionLabel, color: COLORS.muted, marginBottom: SPACING.sm },
    exerciseRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: COLORS.card,
      borderWidth: 1,
      borderColor: COLORS.cardBorder,
      borderRadius: RADIUS.sm,
      padding: SPACING.md,
      marginBottom: SPACING.sm,
    },
    exerciseName: { flex: 1, color: COLORS.text, fontWeight: '700', fontSize: 14 },
    exerciseSets: { color: COLORS.muted, fontSize: 12.5, fontWeight: '600' },
    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: SPACING.lg,
      paddingBottom: 32,
      backgroundColor: COLORS.bg,
      borderTopWidth: 1,
      borderTopColor: COLORS.cardBorder,
    },
    startButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: COLORS.accent,
      borderRadius: RADIUS.sm,
      paddingVertical: 16,
    },
    startButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14, letterSpacing: 0.5 },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.sm },
    emptyTitle: { color: COLORS.text, fontWeight: '700', fontSize: 16 },
  }), [COLORS]);

  if (!activeRoutine) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.emptyState}>
          <Ionicons name="barbell-outline" size={40} color={COLORS.muted} />
          <Text style={styles.emptyTitle}>Nenhuma rotina ativa.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const dKey = todayKey();
  const plan = activeRoutine.days[dKey];

  if (!plan || 'rest' in plan) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 40, marginBottom: SPACING.sm }}>🌙</Text>
          <Text style={{ color: COLORS.text, fontWeight: '800', fontSize: 17 }}>
            Hoje é dia de descanso
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const total = totalExercises(plan);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={22} color={COLORS.text} />
      </TouchableOpacity>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: SPACING.lg, paddingTop: 0, paddingBottom: 120 }}
      >
        <View style={styles.brandRow}>
          <Image source={brandLogo} style={styles.brand} resizeMode="contain" />
        </View>

        <Text style={styles.eyebrow}>TREINO DE HOJE</Text>
        <Text style={styles.title}>{plan.full}</Text>

        <View style={styles.tagRow}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{plan.tag}</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{total} EXERCÍCIOS</Text>
          </View>
        </View>

        {plan.groups.map((group) => (
          <View key={group.name} style={{ marginTop: SPACING.lg }}>
            <Text style={styles.groupLabel}>{group.name}</Text>
            {group.exercises.map((ex, i) => (
              <View key={i} style={styles.exerciseRow}>
                <Text style={styles.exerciseName}>{ex.name}</Text>
                <Text style={styles.exerciseSets}>{ex.sets}</Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => router.push('/treino-dia')}
        >
          <Text style={styles.startButtonText}>INICIAR TREINO</Text>
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
