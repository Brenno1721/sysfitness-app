import { useMemo } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRoutine } from '../../context/RoutineContext';
import { useWorkoutLog } from '../../context/WorkoutLogContext';
import { usePlan } from '../../context/PlanContext';
import type { WorkoutRoutine } from '../../data/workoutPlan';
import { SPACING, RADIUS, FONT } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import MiniLineChart from '../../components/MiniLineChart';

function countTrainingDays(routine: WorkoutRoutine): number {
  return Object.values(routine.days).filter((d) => !('rest' in d)).length;
}

export default function TreinoScreen() {
  const router = useRouter();
  const { routines, activeRoutineId, setActiveRoutineId, deleteRoutine } = useRoutine();
  const { volumeByRoutine } = useWorkoutLog();
  const { hasFeature } = usePlan();
  const { COLORS, mode } = useTheme();
  const brandLogo = mode === 'dark'
    ? require('../../assets/images/logoalto.png')
    : require('../../assets/images/darklogo.png');

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xs },
    brand: { width: '62%', height: undefined, aspectRatio: 1.5 },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.lg,
    },
    title: { ...FONT.title, fontSize: 26, color: COLORS.text },
    newButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    newButtonText: { color: COLORS.accent, fontSize: 12.5, fontWeight: '700' },
    emptyState: { alignItems: 'center', paddingVertical: 60, gap: SPACING.sm },
    emptyTitle: { color: COLORS.text, fontWeight: '800', fontSize: 16, marginTop: SPACING.sm },
    emptySubtitle: { color: COLORS.muted, fontSize: 13, textAlign: 'center', marginBottom: SPACING.md },
    primaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: COLORS.accent,
      borderRadius: RADIUS.sm,
      paddingVertical: 14,
      paddingHorizontal: SPACING.xl,
      marginTop: SPACING.sm,
    },
    primaryButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14, letterSpacing: 0.5 },
    routineCard: {
      backgroundColor: COLORS.card,
      borderWidth: 1,
      borderColor: COLORS.cardBorder,
      borderRadius: RADIUS.lg,
      padding: SPACING.lg,
      marginBottom: SPACING.md,
    },
    routineCardActive: { borderColor: COLORS.accent, borderWidth: 2 },
    routineHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.sm,
    },
    routineNameRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
    cardActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
    routineName: { color: COLORS.text, fontWeight: '800', fontSize: 16 },
    activeBadge: {
      backgroundColor: COLORS.accent,
      borderRadius: RADIUS.pill,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    activeBadgeText: { color: '#FFFFFF', fontSize: 9.5, fontWeight: '800', letterSpacing: 0.5 },
    routineMetaRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    goalTag: {
      backgroundColor: COLORS.bgElevated,
      borderWidth: 1,
      borderColor: COLORS.cardBorder,
      borderRadius: RADIUS.sm,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    goalTagText: { color: COLORS.muted, fontSize: 10.5, fontWeight: '700' },
    routineDays: { color: COLORS.muted, fontSize: 12.5, fontWeight: '600' },
    chartSection: {
      marginTop: SPACING.md,
      paddingTop: SPACING.sm,
      borderTopWidth: 1,
      borderTopColor: COLORS.cardBorder,
    },
    chartLabel: { ...FONT.eyebrow, fontSize: 9.5, color: COLORS.muted, marginBottom: 4 },
  }), [COLORS]);

  const goToNewRoutine = () => {
    const maxRoutines = hasFeature('maxRoutines');
    if (maxRoutines !== null && routines.length >= maxRoutines) {
      Alert.alert(
        'Limite de rotinas atingido',
        `Seu plano atual permite até ${maxRoutines} ${maxRoutines === 1 ? 'rotina' : 'rotinas'} de treino. Faça upgrade pra criar mais.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Ver planos', onPress: () => router.push('/planos') },
        ]
      );
      return;
    }
    router.push('/novo-treino');
  };

  const handleDelete = (routine: WorkoutRoutine) => {
    Alert.alert(
      'Excluir rotina?',
      'Essa ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => deleteRoutine(routine.id) },
      ]
    );
  };

  const handleEdit = (routine: WorkoutRoutine) => {
    router.push(`/novo-treino?edit=${routine.id}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: SPACING.lg, paddingTop: 0, paddingBottom: 60 }}
      >
        <View style={styles.brandRow}>
          <Image source={brandLogo} style={styles.brand} resizeMode="contain" />
        </View>

        <View style={styles.headerRow}>
          <Text style={styles.title}>Treino</Text>
          {routines.length > 0 && (
            <TouchableOpacity style={styles.newButton} onPress={goToNewRoutine}>
              <Ionicons name="add" size={16} color={COLORS.accent} />
              <Text style={styles.newButtonText}>Novo treino</Text>
            </TouchableOpacity>
          )}
        </View>

        {routines.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="barbell-outline" size={56} color={COLORS.mutedDim} />
            <Text style={styles.emptyTitle}>Nenhum treino criado ainda</Text>
            <Text style={styles.emptySubtitle}>Monte sua primeira rotina de treino</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={goToNewRoutine}>
              <Text style={styles.primaryButtonText}>NOVO TREINO</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          routines.map((routine) => {
            const isActive = routine.id === activeRoutineId;
            const trainingDays = countTrainingDays(routine);
            const volumes = volumeByRoutine[routine.id] ?? [];
            return (
              <TouchableOpacity
                key={routine.id}
                style={[styles.routineCard, isActive && styles.routineCardActive]}
                activeOpacity={isActive ? 1 : 0.7}
                onPress={() => !isActive && setActiveRoutineId(routine.id)}
              >
                <View style={styles.routineHeaderRow}>
                  <View style={styles.routineNameRow}>
                    <Text style={styles.routineName}>{routine.name}</Text>
                    {isActive && (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>ATIVA</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity onPress={() => handleEdit(routine)} hitSlop={8}>
                      <Ionicons name="create-outline" size={18} color={COLORS.muted} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(routine)} hitSlop={8}>
                      <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.routineMetaRow}>
                  <View style={styles.goalTag}>
                    <Text style={styles.goalTagText}>{routine.goal}</Text>
                  </View>
                  <Text style={styles.routineDays}>
                    {trainingDays} {trainingDays === 1 ? 'dia' : 'dias'} de treino
                  </Text>
                </View>
                {volumes.length >= 2 && (
                  <View style={styles.chartSection}>
                    <Text style={styles.chartLabel}>EVOLUÇÃO DE VOLUME</Text>
                    <MiniLineChart data={volumes} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}