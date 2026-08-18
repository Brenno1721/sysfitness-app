import { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useWorkoutLog } from '../../context/WorkoutLogContext';
import { useRoutine } from '../../context/RoutineContext';
import { useTheme } from '../../context/ThemeContext';
import { DAY_ORDER, todayKey, totalExercises } from '../../data/workoutPlan';
import ProgressBar from '../../components/ProgressBar';
import CardioTimerCard from '../../components/CardioTimerCard';
import { SPACING, RADIUS, FONT } from '../../constants/theme';

const DAY_SHORT: Record<string, string> = {
  seg: 'SEG', ter: 'TER', qua: 'QUA', qui: 'QUI', sex: 'SEX', sab: 'SAB', dom: 'DOM',
};

export default function HomeScreen() {
  const { COLORS } = useTheme();
  const { user } = useAuth();
  const { dayState, weekProgress, setCurrentDay } = useWorkoutLog();
  const { activeRoutine } = useRoutine();
  const router = useRouter();

  const dKey = todayKey();
  const todayPlan = activeRoutine ? activeRoutine.days[dKey] : null;
  const total = todayPlan ? totalExercises(todayPlan) : 0;
  const done = Object.values(dayState).filter((e) => e.done).length;

  const daysTrainedThisWeek = weekProgress.filter(Boolean).length;

  const goToWorkout = () => {
    setCurrentDay(dKey);
    router.push('/treino-resumo');
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { padding: SPACING.lg, paddingBottom: 40 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
    userRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    avatar: {
      width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.card,
      borderWidth: 1, borderColor: COLORS.cardBorder, alignItems: 'center', justifyContent: 'center',
    },
    greeting: { color: COLORS.text, fontWeight: '800', fontSize: 15, letterSpacing: 0.3 },

    restCard: {
      backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder,
      borderRadius: RADIUS.lg, padding: SPACING.xl, alignItems: 'center', marginBottom: SPACING.lg,
    },
    restEmoji: { fontSize: 36, marginBottom: SPACING.sm },
    restTitle: { color: COLORS.text, fontWeight: '800', fontSize: 17 },
    restSub: { color: COLORS.muted, fontSize: 13, marginTop: 4, textAlign: 'center' },

    todayCard: {
      backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder,
      borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.lg,
    },
    todayHeaderRow: { flexDirection: 'row', justifyContent: 'space-between' },
    eyebrow: { ...FONT.eyebrow, color: COLORS.muted },
    todayTitle: { ...FONT.title, color: COLORS.text, marginTop: 6, marginBottom: SPACING.md },
    tagRow: { flexDirection: 'row', gap: SPACING.xs, marginBottom: SPACING.lg },
    tag: {
      backgroundColor: COLORS.bgElevated, borderWidth: 1, borderColor: COLORS.cardBorder,
      borderRadius: RADIUS.sm, paddingHorizontal: 10, paddingVertical: 5,
    },
    tagText: { color: COLORS.muted, fontSize: 10.5, fontWeight: '700' },
    startButton: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: COLORS.accent, borderRadius: RADIUS.sm, paddingVertical: 14,
    },
    startButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14, letterSpacing: 0.5 },

    sectionLabel: { ...FONT.sectionLabel, color: COLORS.muted, marginBottom: SPACING.sm },

    weekCard: {
      backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder,
      borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.lg,
    },
    weekHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: SPACING.sm },
    weekBig: { color: COLORS.text, fontWeight: '900', fontSize: 20 },
    weekSub: { color: COLORS.muted, fontSize: 10.5, fontWeight: '700', letterSpacing: 0.5 },
    weekDaysRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.md },
    weekDayCol: { alignItems: 'center', gap: 6 },
    weekDot: {
      width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.bgElevated,
      borderWidth: 1, borderColor: COLORS.cardBorder, alignItems: 'center', justifyContent: 'center',
    },
    weekDotDone: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
    weekDotRest: { opacity: 0.4 },
    weekDayLabel: { fontSize: 9.5, color: COLORS.mutedDim, fontWeight: '700' },

    shortcutsRow: { flexDirection: 'row', gap: SPACING.sm },
    shortcut: {
      flex: 1, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder,
      borderRadius: RADIUS.md, paddingVertical: SPACING.lg, alignItems: 'center', gap: 8,
    },
    shortcutText: { color: COLORS.text, fontSize: 11.5, fontWeight: '700' },
  }), [COLORS]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }} edges={['top']}>
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.bg }} contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.userRow}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={16} color={COLORS.muted} />
          </View>
          <Text style={styles.greeting}>
            Bom treino, {(user?.name || 'atleta').split(' ')[0]}
          </Text>
        </View>
        <Ionicons name="notifications-outline" size={20} color={COLORS.text} />
      </View>

      {!activeRoutine ? (
        <View style={styles.restCard}>
          <Ionicons name="barbell-outline" size={32} color={COLORS.muted} />
          <Text style={styles.restTitle}>Nenhuma rotina ativa</Text>
          <Text style={styles.restSub}>Escolha ou crie uma rotina de treino</Text>
          <TouchableOpacity
            style={[styles.startButton, { marginTop: SPACING.md }]}
            onPress={() => router.push('/(tabs)/treino')}
          >
            <Text style={styles.startButtonText}>IR PARA TREINO</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      ) : !todayPlan || 'rest' in todayPlan ? (
        <View style={styles.restCard}>
          <Text style={styles.restEmoji}>🌙</Text>
          <Text style={styles.restTitle}>Dia de descanso</Text>
          <Text style={styles.restSub}>Recupera hoje que amanhã tem treino</Text>
        </View>
      ) : (
        <View style={styles.todayCard}>
          <View style={styles.todayHeaderRow}>
            <Text style={styles.eyebrow}>TREINO DE HOJE</Text>
          </View>
          <Text style={styles.todayTitle}>{todayPlan.full}</Text>
          <View style={styles.tagRow}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{todayPlan.tag}</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{total} EXERCÍCIOS</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.startButton} onPress={goToWorkout}>
            <Text style={styles.startButtonText}>TREINO</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.sectionLabel}>SEMANA ATUAL</Text>
      <View style={styles.weekCard}>
        <View style={styles.weekHeaderRow}>
          <Text style={styles.weekBig}>{daysTrainedThisWeek} de 5</Text>
          <Text style={styles.weekSub}>DIAS TREINADOS</Text>
        </View>
        <ProgressBar pct={(daysTrainedThisWeek / 5) * 100} />
        <View style={styles.weekDaysRow}>
          {DAY_ORDER.slice(0, 7).map((d, i) => {
            const dayPlan = activeRoutine?.days[d];
            const isRestDay = dayPlan ? 'rest' in dayPlan : false;
            const trained = weekProgress[i];
            return (
              <View key={d} style={styles.weekDayCol}>
                <View
                  style={[
                    styles.weekDot,
                    trained && styles.weekDotDone,
                    isRestDay && !trained && styles.weekDotRest,
                  ]}
                >
                  {trained && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
                  {!trained && !isRestDay && <Ionicons name="close" size={12} color={COLORS.mutedDim} />}
                </View>
                <Text style={styles.weekDayLabel}>{DAY_SHORT[d]}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <CardioTimerCard />

      <Text style={styles.sectionLabel}>ATALHOS</Text>
      <View style={styles.shortcutsRow}>
        <TouchableOpacity style={styles.shortcut} onPress={() => router.push('/historico')}>
          <Ionicons name="time-outline" size={20} color={COLORS.text} />
          <Text style={styles.shortcutText}>Histórico</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shortcut} onPress={() => router.push('/(tabs)/evolucao')}>
          <Ionicons name="trending-up-outline" size={20} color={COLORS.text} />
          <Text style={styles.shortcutText}>Evolução</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shortcut}>
          <Ionicons name="document-text-outline" size={20} color={COLORS.text} />
          <Text style={styles.shortcutText}>Meu plano</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}
