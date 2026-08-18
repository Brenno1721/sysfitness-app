import { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGamification } from '../context/GamificationContext';
import { ACHIEVEMENTS, AchievementCategory } from '../lib/gamification';
import { usePlan } from '../context/PlanContext';
import { SPACING, RADIUS, FONT } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import type { ThemeColors } from '../constants/theme';

const CATEGORY_ORDER: AchievementCategory[] = [
  'consistencia',
  'treino',
  'cardio',
  'evolucao',
  'corpo',
  'organizacao',
];

// Categorias liberadas em qualquer plano — as demais exigem fullGamification (Plus/Ultra).
const BASIC_CATEGORIES: AchievementCategory[] = ['consistencia', 'treino'];

const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  consistencia: 'Consistência',
  treino: 'Treino',
  cardio: 'Cardio',
  evolucao: 'Evolução',
  corpo: 'Corpo',
  organizacao: 'Organização',
};

export default function ConquistasScreen() {
  const router = useRouter();
  const { COLORS } = useTheme();
  const { unlockedAchievements } = useGamification();
  const { hasFeature } = usePlan();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);

  const unlockedSet = new Set(unlockedAchievements);
  const fullGamification = hasFeature('fullGamification');

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Conquistas</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 60 }}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>
            {unlockedSet.size} de {ACHIEVEMENTS.length}
          </Text>
          <Text style={styles.summaryLabel}>DESBLOQUEADAS</Text>
        </View>

        {CATEGORY_ORDER.map((category) => {
          const items = ACHIEVEMENTS.filter((a) => a.category === category);
          if (items.length === 0) return null;

          return (
            <View key={category} style={{ marginBottom: SPACING.lg }}>
              <Text style={styles.categoryLabel}>{CATEGORY_LABELS[category].toUpperCase()}</Text>
              {items.map((achievement) => {
                const unlocked = unlockedSet.has(achievement.id);
                const planLocked = !fullGamification && !BASIC_CATEGORIES.includes(category);
                const showUnlocked = unlocked && !planLocked;

                return (
                  <View
                    key={achievement.id}
                    style={[styles.card, !showUnlocked && styles.cardLocked]}
                  >
                    <View style={[styles.iconWrap, showUnlocked && styles.iconWrapUnlocked]}>
                      <Ionicons
                        name={achievement.icon as keyof typeof Ionicons.glyphMap}
                        size={20}
                        color={showUnlocked ? COLORS.accent : COLORS.mutedDim}
                      />
                      {planLocked && (
                        <View style={styles.planLockBadge}>
                          <Ionicons name="lock-closed" size={9} color="#FFFFFF" />
                        </View>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardTitle, !showUnlocked && styles.cardTitleLocked]}>
                        {achievement.title}
                      </Text>
                      <Text style={styles.cardDescription}>{achievement.description}</Text>
                      {planLocked && <Text style={styles.planLockedText}>Disponível no Plus</Text>}
                    </View>
                    {showUnlocked && (
                      <Ionicons name="checkmark-circle" size={18} color={COLORS.done} />
                    )}
                  </View>
                );
              })}
            </View>
          );
        })}
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
    title: { ...FONT.title, fontSize: 18, color: COLORS.text },

    summaryCard: {
      backgroundColor: COLORS.card,
      borderWidth: 1,
      borderColor: COLORS.cardBorder,
      borderRadius: RADIUS.lg,
      paddingVertical: SPACING.lg,
      alignItems: 'center',
      marginBottom: SPACING.xl,
    },
    summaryValue: { color: COLORS.accent, fontWeight: '900', fontSize: 24 },
    summaryLabel: {
      ...FONT.eyebrow,
      fontSize: 10.5,
      color: COLORS.muted,
      marginTop: 4,
    },

    categoryLabel: { ...FONT.sectionLabel, color: COLORS.muted, marginBottom: SPACING.sm },

    card: {
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
    cardLocked: { opacity: 0.6 },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: COLORS.bgElevated,
      borderWidth: 1,
      borderColor: COLORS.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconWrapUnlocked: { borderColor: COLORS.accent },
    planLockBadge: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: COLORS.accent,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: COLORS.bg,
    },
    cardTitle: { color: COLORS.text, fontWeight: '700', fontSize: 14 },
    cardTitleLocked: { color: COLORS.muted },
    cardDescription: { color: COLORS.muted, fontSize: 12, marginTop: 2, lineHeight: 16 },
    planLockedText: { color: COLORS.accent, fontSize: 10.5, fontWeight: '700', marginTop: 4 },
  });
}
