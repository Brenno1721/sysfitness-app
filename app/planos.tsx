import { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePlan } from '../context/PlanContext';
import { PLANS, PLAN_ORDER, Plan } from '../lib/plans';
import { SPACING, RADIUS, FONT } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import type { ThemeColors } from '../constants/theme';

type Period = 'monthly' | 'yearly';

function formatPrice(plan: Plan, period: Period): string {
  const value = period === 'monthly' ? plan.priceMonthly : plan.priceYearly;
  if (value === 0) return 'Grátis';
  const formatted = value.toFixed(2).replace('.', ',');
  return `R$ ${formatted}/${period === 'monthly' ? 'mês' : 'ano'}`;
}

export default function PlanosScreen() {
  const router = useRouter();
  const { COLORS } = useTheme();
  const { planId, plan: currentPlan, setPlan } = usePlan();
  const [period, setPeriod] = useState<Period>('monthly');
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);

  const currentIndex = PLAN_ORDER.indexOf(planId);

  const handleSelectPlan = (target: Plan) => {
    const isDowngrade = PLAN_ORDER.indexOf(target.id) < currentIndex;
    Alert.alert(
      isDowngrade ? 'Fazer downgrade?' : 'Assinar plano?',
      `Isso é uma simulação — pagamentos reais serão ativados em breve. Deseja ativar o plano ${target.name} agora, só pra testar o app?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => {
            setPlan(target.id);
            Alert.alert('Plano ativado', `Agora você está no plano ${target.name}.`, [
              { text: 'OK', onPress: () => router.back() },
            ]);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Planos</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 60 }}>
        <View style={styles.currentBanner}>
          <Text style={styles.currentBannerLabel}>SEU PLANO ATUAL</Text>
          <Text style={styles.currentBannerValue}>{currentPlan.name}</Text>
        </View>

        <View style={styles.periodRow}>
          <TouchableOpacity
            style={[styles.periodPill, period === 'monthly' && styles.periodPillActive]}
            onPress={() => setPeriod('monthly')}
          >
            <Text
              style={[styles.periodPillText, period === 'monthly' && styles.periodPillTextActive]}
            >
              Mensal
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodPill, period === 'yearly' && styles.periodPillActive]}
            onPress={() => setPeriod('yearly')}
          >
            <Text
              style={[styles.periodPillText, period === 'yearly' && styles.periodPillTextActive]}
            >
              Anual
            </Text>
          </TouchableOpacity>
        </View>

        {PLAN_ORDER.map((id) => {
          const plan = PLANS[id];
          const isCurrent = id === planId;
          const isDowngrade = PLAN_ORDER.indexOf(id) < currentIndex;

          return (
            <View key={id} style={[styles.card, isCurrent && styles.cardCurrent]}>
              {isCurrent && (
                <View style={styles.currentBadge}>
                  <Text style={styles.currentBadgeText}>ATUAL</Text>
                </View>
              )}

              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planTagline}>{plan.tagline}</Text>
              <Text style={styles.planPrice}>{formatPrice(plan, period)}</Text>

              <View style={styles.highlightsList}>
                {plan.highlights.map((highlight) => (
                  <View key={highlight} style={styles.highlightRow}>
                    <Ionicons name="checkmark-circle" size={16} color={COLORS.done} />
                    <Text style={styles.highlightText}>{highlight}</Text>
                  </View>
                ))}
              </View>

              {isCurrent ? (
                <View style={styles.buttonDisabled}>
                  <Text style={styles.buttonDisabledText}>Plano atual</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={isDowngrade ? styles.buttonOutline : styles.buttonFilled}
                  onPress={() => handleSelectPlan(plan)}
                >
                  <Text style={isDowngrade ? styles.buttonOutlineText : styles.buttonFilledText}>
                    {isDowngrade ? 'FAZER DOWNGRADE' : 'ASSINAR'}
                  </Text>
                </TouchableOpacity>
              )}
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

    currentBanner: {
      backgroundColor: COLORS.card,
      borderWidth: 1.5,
      borderColor: COLORS.accent,
      borderRadius: RADIUS.lg,
      padding: SPACING.lg,
      alignItems: 'center',
      marginBottom: SPACING.lg,
    },
    currentBannerLabel: {
      ...FONT.eyebrow,
      fontSize: 10.5,
      color: COLORS.muted,
      marginBottom: 4,
    },
    currentBannerValue: { color: COLORS.text, fontWeight: '900', fontSize: 22 },

    periodRow: {
      flexDirection: 'row',
      gap: SPACING.sm,
      marginBottom: SPACING.xl,
    },
    periodPill: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: COLORS.cardBorder,
      borderRadius: RADIUS.pill,
      backgroundColor: COLORS.card,
    },
    periodPillActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
    periodPillText: { color: COLORS.muted, fontWeight: '700', fontSize: 13 },
    periodPillTextActive: { color: '#FFFFFF' },

    card: {
      backgroundColor: COLORS.card,
      borderWidth: 1,
      borderColor: COLORS.cardBorder,
      borderRadius: RADIUS.lg,
      padding: SPACING.lg,
      marginBottom: SPACING.md,
    },
    cardCurrent: { borderColor: COLORS.accent, borderWidth: 2 },
    currentBadge: {
      position: 'absolute',
      top: SPACING.md,
      right: SPACING.md,
      backgroundColor: COLORS.accent,
      borderRadius: RADIUS.pill,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    currentBadgeText: { color: '#FFFFFF', fontSize: 9.5, fontWeight: '800', letterSpacing: 0.5 },

    planName: { color: COLORS.text, fontWeight: '900', fontSize: 19 },
    planTagline: { color: COLORS.muted, fontSize: 12.5, marginTop: 2 },
    planPrice: { color: COLORS.accent, fontWeight: '800', fontSize: 15, marginTop: SPACING.sm },

    highlightsList: { marginTop: SPACING.md, gap: 8 },
    highlightRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    highlightText: { color: COLORS.text, fontSize: 13, flex: 1 },

    buttonFilled: {
      backgroundColor: COLORS.accent,
      borderRadius: RADIUS.sm,
      paddingVertical: 13,
      alignItems: 'center',
      marginTop: SPACING.lg,
    },
    buttonFilledText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
    buttonOutline: {
      borderWidth: 1,
      borderColor: COLORS.cardBorder,
      borderRadius: RADIUS.sm,
      paddingVertical: 13,
      alignItems: 'center',
      marginTop: SPACING.lg,
    },
    buttonOutlineText: { color: COLORS.text, fontWeight: '700', fontSize: 13, letterSpacing: 0.5 },
    buttonDisabled: {
      borderRadius: RADIUS.sm,
      paddingVertical: 13,
      alignItems: 'center',
      marginTop: SPACING.lg,
    },
    buttonDisabledText: { color: COLORS.muted, fontWeight: '700', fontSize: 13, letterSpacing: 0.5 },
  });
}
