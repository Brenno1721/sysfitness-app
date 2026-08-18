import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { SPACING, RADIUS, FONT, ThemeColors } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { usePlan } from '../context/PlanContext';
import { useAuth } from '../context/AuthContext';
import LockedFeature from '../components/LockedFeature';

const storageKey = (userId: string) => `settings:workoutReminder:${userId}`;

type ReminderPrefs = { enabled: boolean; hour: number; minute: number };

function NumberStepper({
  label,
  value,
  onChange,
  max,
  COLORS,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  max: number;
  COLORS: ThemeColors;
}) {
  const decrement = () => onChange((value - 1 + max) % max);
  const increment = () => onChange((value + 1) % max);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        stepperBlock: { alignItems: 'center' },
        stepperLabel: {
          ...FONT.sectionLabel,
          color: COLORS.muted,
          fontSize: 10,
          marginBottom: SPACING.sm,
        },
        stepperRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
        stepperValue: {
          color: COLORS.text,
          fontWeight: '900',
          fontSize: 24,
          minWidth: 40,
          textAlign: 'center',
          fontVariant: ['tabular-nums'],
        },
      }),
    [COLORS]
  );

  return (
    <View style={styles.stepperBlock}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperRow}>
        <TouchableOpacity onPress={decrement} hitSlop={8}>
          <Ionicons name="remove-circle-outline" size={30} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.stepperValue}>{String(value).padStart(2, '0')}</Text>
        <TouchableOpacity onPress={increment} hitSlop={8}>
          <Ionicons name="add-circle-outline" size={30} color={COLORS.accent} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function NotificacoesScreen() {
  const router = useRouter();
  const { COLORS } = useTheme();
  const { hasFeature } = usePlan();
  const { user } = useAuth();
  const userId = user?.id;
  const [enabled, setEnabled] = useState(false);
  const [hour, setHour] = useState(8);
  const [minute, setMinute] = useState(0);

  // Troca de conta: recarrega o horário de lembrete dessa conta (cada pessoa tem o
  // seu, não é uma preferência do aparelho).
  useEffect(() => {
    if (!userId) {
      setEnabled(false);
      setHour(8);
      setMinute(0);
      return;
    }
    AsyncStorage.getItem(storageKey(userId)).then((raw) => {
      if (raw) {
        const prefs: ReminderPrefs = JSON.parse(raw);
        setEnabled(prefs.enabled);
        setHour(prefs.hour);
        setMinute(prefs.minute);
      } else {
        setEnabled(false);
        setHour(8);
        setMinute(0);
      }
    });
  }, [userId]);

  const persist = (prefs: ReminderPrefs) => {
    if (!userId) return;
    AsyncStorage.setItem(storageKey(userId), JSON.stringify(prefs));
  };

  const handleToggle = async (value: boolean) => {
    if (value) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permissão necessária',
          'Ative as notificações do SysFitness nas configurações do sistema pra usar o lembrete.'
        );
        return;
      }
      setEnabled(true);
    } else {
      setEnabled(false);
      await Notifications.cancelAllScheduledNotificationsAsync();
      persist({ enabled: false, hour, minute });
    }
  };

  const handleConfirm = async () => {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Lembretes',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Hora do treino! 💪',
        body: 'Não esqueça do seu SysFitness hoje.',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });

    persist({ enabled: true, hour, minute });
    Alert.alert(
      'Lembrete ativado',
      `Você será notificado todos os dias às ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}.`
    );
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
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
        toggleRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: COLORS.card,
          borderWidth: 1,
          borderColor: COLORS.cardBorder,
          borderRadius: RADIUS.md,
          padding: SPACING.md,
        },
        toggleLabel: { color: COLORS.text, fontWeight: '700', fontSize: 14, flex: 1, marginRight: SPACING.sm },
        pickerCard: {
          backgroundColor: COLORS.card,
          borderWidth: 1,
          borderColor: COLORS.cardBorder,
          borderRadius: RADIUS.md,
          padding: SPACING.lg,
          marginTop: SPACING.md,
          alignItems: 'center',
        },
        pickerHint: { color: COLORS.muted, fontSize: 12.5, fontWeight: '600', marginBottom: SPACING.md },
        stepperRowWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.md },
        colon: { color: COLORS.text, fontWeight: '900', fontSize: 24, marginBottom: 8 },
        confirmButton: {
          backgroundColor: COLORS.accent,
          borderRadius: RADIUS.sm,
          paddingVertical: 14,
          paddingHorizontal: SPACING.xl,
          marginTop: SPACING.lg,
          alignSelf: 'stretch',
          alignItems: 'center',
        },
        confirmButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13.5, letterSpacing: 0.5 },
      }),
    [COLORS]
  );

  if (!hasFeature('notificationsEnabled')) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Notificações</Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <LockedFeature message="Disponível a partir do plano Básico." />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Notificações</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: SPACING.lg }}>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Lembrete diário de treino</Text>
          <Switch
            value={enabled}
            onValueChange={handleToggle}
            trackColor={{ false: COLORS.cardBorder, true: COLORS.accent }}
            thumbColor="#fff"
          />
        </View>

        {enabled && (
          <View style={styles.pickerCard}>
            <Text style={styles.pickerHint}>Escolha o horário do lembrete</Text>
            <View style={styles.stepperRowWrap}>
              <NumberStepper label="HORA" value={hour} onChange={setHour} max={24} COLORS={COLORS} />
              <Text style={styles.colon}>:</Text>
              <NumberStepper label="MINUTO" value={minute} onChange={setMinute} max={60} COLORS={COLORS} />
            </View>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
              <Text style={styles.confirmButtonText}>CONFIRMAR HORÁRIO</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
