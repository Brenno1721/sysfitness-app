import { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { SPACING, RADIUS, FONT } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import type { ThemeColors } from '../constants/theme';
import { GENDER_OPTIONS, ACTIVITY_OPTIONS, GOAL_OPTIONS } from '../constants/onboardingOptions';

const TOTAL_STEPS = 5;

export default function OnboardingScreen() {
  const router = useRouter();
  const { mode: modeParam } = useLocalSearchParams<{ mode?: string }>();
  const isEdit = modeParam === 'edit';
  const { user, completeOnboarding } = useAuth();
  const { COLORS } = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);

  const [step, setStep] = useState(0);
  const [gender, setGender] = useState<string | null>(isEdit ? user?.gender ?? null : null);
  const [age, setAge] = useState(isEdit && user?.age != null ? String(user.age) : '');
  const [weightKg, setWeightKg] = useState(
    isEdit && user?.weightKg != null ? String(user.weightKg) : ''
  );
  const [heightCm, setHeightCm] = useState(
    isEdit && user?.heightCm != null ? String(user.heightCm) : ''
  );
  const [goals, setGoals] = useState<string[]>(isEdit ? user?.goals ?? [] : []);
  const [activityLevel, setActivityLevel] = useState<string | null>(
    isEdit ? user?.activityLevel ?? null : null
  );
  const [saving, setSaving] = useState(false);

  const toggleGoal = (value: string) => {
    setGoals((prev) =>
      prev.includes(value) ? prev.filter((g) => g !== value) : [...prev, value]
    );
  };

  const canProceed = (() => {
    switch (step) {
      case 0:
        return gender !== null;
      case 1:
        return age.trim().length > 0 && Number(age) > 0;
      case 2:
        return (
          weightKg.trim().length > 0 &&
          Number(weightKg) > 0 &&
          heightCm.trim().length > 0 &&
          Number(heightCm) > 0
        );
      case 3:
        return goals.length > 0;
      case 4:
        return activityLevel !== null;
      default:
        return false;
    }
  })();

  const goNext = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  const goBackStep = () => setStep((s) => Math.max(s - 1, 0));

  const handleFinish = async () => {
    setSaving(true);
    try {
      await completeOnboarding({
        gender: gender ?? undefined,
        age: Number(age),
        weightKg: Number(weightKg),
        heightCm: Number(heightCm),
        goals,
        activityLevel: activityLevel ?? undefined,
      });
      if (isEdit) {
        router.back();
      } else {
        router.replace('/(tabs)');
      }
    } catch (e) {
      Alert.alert(
        'Não foi possível salvar',
        e instanceof Error ? e.message : 'Tente novamente.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePrimaryPress = () => {
    if (step === TOTAL_STEPS - 1) {
      handleFinish();
    } else {
      goNext();
    }
  };

  const isLastStep = step === TOTAL_STEPS - 1;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* No fluxo obrigatório (primeira vez) não dá pra sair arrastando nem
          voltar — só em modo edição, chamado a partir do Perfil. */}
      <Stack.Screen options={{ gestureEnabled: isEdit }} />

      <View style={styles.header}>
        {isEdit ? (
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="close" size={22} color={COLORS.text} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 22 }} />
        )}
        <Text style={styles.headerTitle}>{isEdit ? 'Editar perfil' : 'Vamos te conhecer'}</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.progressRow}>
        <Text style={styles.progressText}>
          Passo {step + 1} de {TOTAL_STEPS}
        </Text>
        <View style={styles.dotsRow}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <View key={i} style={[styles.dot, i <= step && styles.dotActive]} />
          ))}
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: SPACING.lg, paddingTop: SPACING.md, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {step === 0 && (
          <View>
            <Text style={styles.stepTitle}>Qual é o seu gênero?</Text>
            <Text style={styles.stepSubtitle}>
              Ajuda a calibrar recomendações de treino no futuro.
            </Text>
            {GENDER_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.bigOption, gender === opt.value && styles.bigOptionActive]}
                onPress={() => setGender(opt.value)}
              >
                <Text
                  style={[
                    styles.bigOptionText,
                    gender === opt.value && styles.bigOptionTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {step === 1 && (
          <View>
            <Text style={styles.stepTitle}>Qual é a sua idade?</Text>
            <Text style={styles.stepSubtitle}>Só usamos isso pra personalizar seu treino.</Text>
            <View style={styles.numberFieldBlock}>
              <Text style={styles.numberFieldLabel}>IDADE (ANOS)</Text>
              <TextInput
                style={styles.numberFieldInput}
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                autoFocus
                placeholder="0"
                placeholderTextColor={COLORS.muted}
              />
            </View>
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={styles.stepTitle}>Peso e altura</Text>
            <Text style={styles.stepSubtitle}>Dá pra atualizar isso depois quando quiser.</Text>
            <View style={styles.numberFieldBlock}>
              <Text style={styles.numberFieldLabel}>PESO (KG)</Text>
              <TextInput
                style={styles.numberFieldInput}
                value={weightKg}
                onChangeText={setWeightKg}
                keyboardType="numeric"
                autoFocus
                placeholder="0"
                placeholderTextColor={COLORS.muted}
              />
            </View>
            <View style={{ height: SPACING.md }} />
            <View style={styles.numberFieldBlock}>
              <Text style={styles.numberFieldLabel}>ALTURA (CM)</Text>
              <TextInput
                style={styles.numberFieldInput}
                value={heightCm}
                onChangeText={setHeightCm}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={COLORS.muted}
              />
            </View>
          </View>
        )}

        {step === 3 && (
          <View>
            <Text style={styles.stepTitle}>Qual é o seu objetivo?</Text>
            <Text style={styles.stepSubtitle}>Pode escolher mais de um.</Text>
            <View style={styles.goalsWrap}>
              {GOAL_OPTIONS.map((opt) => {
                const selected = goals.includes(opt.value);
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.goalChip, selected && styles.goalChipActive]}
                    onPress={() => toggleGoal(opt.value)}
                  >
                    {selected && (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                    )}
                    <Text style={[styles.goalChipText, selected && styles.goalChipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {step === 4 && (
          <View>
            <Text style={styles.stepTitle}>Nível de atividade</Text>
            <Text style={styles.stepSubtitle}>Como você descreveria sua experiência hoje?</Text>
            {ACTIVITY_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.bigOption, activityLevel === opt.value && styles.bigOptionActive]}
                onPress={() => setActivityLevel(opt.value)}
              >
                <Text
                  style={[
                    styles.bigOptionText,
                    activityLevel === opt.value && styles.bigOptionTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {step > 0 ? (
          <TouchableOpacity style={styles.footerBackButton} onPress={goBackStep} disabled={saving}>
            <Ionicons name="chevron-back" size={18} color={COLORS.muted} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 44 }} />
        )}
        <TouchableOpacity
          style={[styles.primaryButton, (!canProceed || saving) && styles.primaryButtonDisabled]}
          disabled={!canProceed || saving}
          onPress={handlePrimaryPress}
        >
          <Text style={styles.primaryButtonText}>
            {saving ? 'SALVANDO...' : isLastStep ? (isEdit ? 'SALVAR' : 'CONCLUIR') : 'PRÓXIMO'}
          </Text>
          {!saving && <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />}
        </TouchableOpacity>
      </View>
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
    headerTitle: { ...FONT.title, fontSize: 17, color: COLORS.text },

    progressRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: SPACING.lg,
      marginBottom: SPACING.sm,
    },
    progressText: { color: COLORS.muted, fontSize: 12, fontWeight: '700' },
    dotsRow: { flexDirection: 'row', gap: 6 },
    dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: COLORS.cardBorder },
    dotActive: { backgroundColor: COLORS.accent },

    stepTitle: { ...FONT.title, fontSize: 22, color: COLORS.text, marginBottom: SPACING.xs },
    stepSubtitle: { color: COLORS.muted, fontSize: 13, marginBottom: SPACING.xl },

    bigOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: COLORS.cardBorder,
      borderRadius: RADIUS.md,
      paddingVertical: 18,
      backgroundColor: COLORS.card,
      marginBottom: SPACING.sm,
    },
    bigOptionActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
    bigOptionText: { color: COLORS.text, fontWeight: '800', fontSize: 15.5 },
    bigOptionTextActive: { color: '#FFFFFF' },

    numberFieldBlock: { alignItems: 'center' },
    numberFieldLabel: {
      ...FONT.sectionLabel,
      color: COLORS.muted,
      fontSize: 11,
      marginBottom: SPACING.sm,
      alignSelf: 'flex-start',
    },
    numberFieldInput: {
      color: COLORS.text,
      fontWeight: '800',
      fontSize: 28,
      width: '100%',
      textAlign: 'center',
      backgroundColor: COLORS.card,
      borderWidth: 1,
      borderColor: COLORS.cardBorder,
      borderRadius: RADIUS.sm,
      paddingVertical: SPACING.sm,
    },

    goalsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
    goalChip: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: COLORS.cardBorder,
      borderRadius: RADIUS.pill,
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor: COLORS.card,
    },
    goalChipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
    goalChipText: { color: COLORS.text, fontSize: 13, fontWeight: '700' },
    goalChipTextActive: { color: '#FFFFFF' },

    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.md,
      paddingBottom: SPACING.md,
      borderTopWidth: 1,
      borderTopColor: COLORS.cardBorder,
    },
    footerBackButton: {
      width: 44,
      height: 44,
      borderRadius: RADIUS.sm,
      borderWidth: 1,
      borderColor: COLORS.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: COLORS.accent,
      borderRadius: RADIUS.sm,
      paddingVertical: 15,
    },
    primaryButtonDisabled: { opacity: 0.4 },
    primaryButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14, letterSpacing: 0.5 },
  });
}
