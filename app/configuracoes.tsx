import { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { usePlan } from '../context/PlanContext';
import { useGamification } from '../context/GamificationContext';
import { apiDelete } from '../lib/api';
import { clearLocalBodyMetricPhotos } from '../lib/bodyMetrics';
import { markThemeSwitched } from '../lib/gamification';
import { SPACING, RADIUS, FONT } from '../constants/theme';
import { useTheme, ThemeMode } from '../context/ThemeContext';

export default function ConfiguracoesScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { refresh } = useGamification();
  const { hapticsEnabled, setHapticsEnabled } = useSettings();
  const { COLORS, mode, setMode } = useTheme();
  const { hasFeature } = usePlan();
  const lightThemeEnabled = hasFeature('lightThemeEnabled');

  // markThemeSwitched fica aqui (não dentro do ThemeContext) porque o tema é
  // propositalmente uma preferência do APARELHO — o ThemeProvider fica acima do
  // AuthProvider na árvore e não tem como saber qual conta está logada. A conquista
  // de "trocou de tema" já é por conta, então marcamos no ponto de uso.
  const changeMode = (next: ThemeMode) => {
    if (user && mode !== next) markThemeSwitched(user.id).then(refresh);
    setMode(next);
  };

  const handleSelectLightMode = () => {
    if (!lightThemeEnabled) {
      Alert.alert(
        'Recurso bloqueado',
        'O tema claro está disponível a partir do plano Básico.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Ver planos', onPress: () => router.push('/planos') },
        ]
      );
      return;
    }
    changeMode('light');
  };

  const handleDeleteAllData = () => {
    Alert.alert(
      'Excluir todos os dados?',
      'Isso vai apagar TODOS os treinos, rotinas, histórico e sua conta. Essa ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir tudo',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            await logout();
            router.replace('/welcome');
          },
        },
      ]
    );
  };

  const handleResetProgress = () => {
    Alert.alert(
      'Resetar progresso?',
      'Isso apaga todo o seu histórico de treinos, cardio, medidas corporais e conquistas — mas suas ROTINAS DE TREINO continuam salvas. Essa ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: 'default',
          onPress: async () => {
            if (!user) return;
            try {
              try {
                await apiDelete('/me/progress');
              } catch {
                await apiDelete('/auth/me/progress');
              }

              // Chaves namespaced por userId — filtra só as DESSA conta, senão
              // resetar o progresso do Brenno apagaria o checklist da Mariana também.
              const allKeys = await AsyncStorage.getAllKeys();
              const suffix = `:${user.id}`;
              const checklistKeys = allKeys.filter(
                (k) => k.startsWith('checklist:') && k.endsWith(suffix)
              );
              await AsyncStorage.multiRemove([
                `gamification:unlocked:${user.id}`,
                `workout:customOrder:${user.id}`,
                `workout:history:${user.id}`,
                ...checklistKeys,
              ]);

              await clearLocalBodyMetricPhotos(user.id);
              await refresh();
              Alert.alert('Progresso resetado.');
              router.replace('/(tabs)');
            } catch {
              Alert.alert('Erro', 'Não foi possível resetar seu progresso agora.');
            }
          },
        },
      ]
    );
  };

  const styles = useMemo(() => StyleSheet.create({
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
    sectionTitle: { ...FONT.sectionLabel, color: COLORS.muted, marginBottom: SPACING.sm },
    section: {
      backgroundColor: COLORS.card,
      borderWidth: 1,
      borderColor: COLORS.cardBorder,
      borderRadius: RADIUS.md,
      marginBottom: SPACING.xl,
      overflow: 'hidden',
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.cardBorder,
    },
    toggleRowLast: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: SPACING.md,
    },
    toggleLabel: { color: COLORS.text, fontWeight: '700', fontSize: 14, flex: 1, marginRight: SPACING.sm },
    segmentedRow: { flexDirection: 'row', padding: SPACING.md, gap: SPACING.sm },
    pill: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: COLORS.cardBorder,
      borderRadius: RADIUS.pill,
      backgroundColor: COLORS.bgElevated,
    },
    pillActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
    pillContent: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    pillText: { color: COLORS.muted, fontWeight: '700', fontSize: 13 },
    pillTextActive: { color: '#FFFFFF' },
    dangerButton: { alignItems: 'center', paddingVertical: SPACING.md },
    accentButton: { alignItems: 'center', paddingVertical: SPACING.md },
    dangerButtonText: { color: COLORS.danger, fontWeight: '700', fontSize: 13.5 },
    accentButtonText: { color: COLORS.accent, fontWeight: '700', fontSize: 13.5 },
  }), [COLORS]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Configurações</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: SPACING.lg }}>
        <Text style={styles.sectionTitle}>APARÊNCIA</Text>
        <View style={styles.section}>
          <View style={styles.segmentedRow}>
            <TouchableOpacity
              style={[styles.pill, mode === 'dark' && styles.pillActive]}
              onPress={() => changeMode('dark')}
            >
              <Text style={[styles.pillText, mode === 'dark' && styles.pillTextActive]}>Escuro</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pill, mode === 'light' && styles.pillActive]}
              onPress={handleSelectLightMode}
            >
              <View style={styles.pillContent}>
                {!lightThemeEnabled && (
                  <Ionicons
                    name="lock-closed"
                    size={11}
                    color={mode === 'light' ? '#FFFFFF' : COLORS.muted}
                  />
                )}
                <Text style={[styles.pillText, mode === 'light' && styles.pillTextActive]}>
                  Claro
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>PREFERÊNCIAS</Text>
        <View style={styles.section}>
          <View style={styles.toggleRowLast}>
            <Text style={styles.toggleLabel}>Sons e vibração</Text>
            <Switch
              value={hapticsEnabled}
              onValueChange={setHapticsEnabled}
              trackColor={{ false: COLORS.cardBorder, true: COLORS.accent }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <TouchableOpacity style={styles.accentButton} onPress={handleResetProgress}>
          <Text style={styles.accentButtonText}>Resetar progresso</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dangerButton} onPress={handleDeleteAllData}>
          <Text style={styles.dangerButtonText}>Excluir todos os dados</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}