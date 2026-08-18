import React, { useMemo } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCardioTimer } from '../context/CardioTimerContext';
import { FONT, RADIUS, SPACING } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import ActivityCarousel from './cardio/ActivityCarousel';
import TimeDisplay from './cardio/TimeDisplay';
import TimerControls from './cardio/TimerControls';
import TimeWheelPicker from './cardio/TimeWheelPicker';
import { buildFinishFeedback } from './cardio/cardioFeedback';

export default function CardioTimerCard() {
  const router = useRouter();
  const { COLORS } = useTheme();
  const {
    activityIndex,
    setActivityIndex,
    mode,
    setMode,
    targetSeconds,
    setTargetSeconds,
    elapsedSeconds,
    isRunning,
    start,
    pause,
    reset,
    finishSession,
  } = useCardioTimer();

  const showPicker = mode === 'definido' && !isRunning;
  const canFinish = isRunning || elapsedSeconds > 0;

  const handleFinish = async () => {
    const result = await finishSession();
    const { title, message } = buildFinishFeedback(result, activityIndex);
    Alert.alert(title, message);
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: COLORS.card,
          borderWidth: 1,
          borderColor: COLORS.cardBorder,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
          marginBottom: SPACING.lg,
        },
        headerRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: SPACING.sm,
        },
        eyebrow: { ...FONT.eyebrow, color: COLORS.muted },
        modeRow: {
          flexDirection: 'row',
          gap: SPACING.sm,
          marginTop: SPACING.md,
          justifyContent: 'center',
        },
        modeChip: {
          borderWidth: 1,
          borderColor: COLORS.cardBorder,
          borderRadius: RADIUS.pill,
          paddingHorizontal: SPACING.md,
          paddingVertical: 8,
        },
        modeChipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
        modeChipText: { color: COLORS.muted, fontSize: 11, fontWeight: '800', letterSpacing: 0.4 },
        modeChipTextActive: { color: '#FFFFFF' },
        pickerWrap: { marginTop: SPACING.md },
        controlsWrap: { marginTop: SPACING.lg },
        historyLink: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          marginTop: SPACING.lg,
        },
        historyLinkText: { color: COLORS.muted, fontSize: 12.5, fontWeight: '700' },
      }),
    [COLORS]
  );

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.eyebrow}>CARDIO</Text>
        <TouchableOpacity onPress={() => router.push('/timer-fullscreen')}>
          <Ionicons name="expand-outline" size={18} color={COLORS.muted} />
        </TouchableOpacity>
      </View>

      <ActivityCarousel activityIndex={activityIndex} onChange={setActivityIndex} />

      <TimeDisplay seconds={elapsedSeconds} fontSize={40} />

      <View style={styles.modeRow}>
        <TouchableOpacity
          style={[styles.modeChip, mode === 'cronometro' && styles.modeChipActive]}
          onPress={() => setMode('cronometro')}
        >
          <Text style={[styles.modeChipText, mode === 'cronometro' && styles.modeChipTextActive]}>
            CRONÔMETRO
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeChip, mode === 'definido' && styles.modeChipActive]}
          onPress={() => setMode('definido')}
        >
          <Text style={[styles.modeChipText, mode === 'definido' && styles.modeChipTextActive]}>
            DEFINIR TEMPO
          </Text>
        </TouchableOpacity>
      </View>

      {showPicker && (
        <View style={styles.pickerWrap}>
          <TimeWheelPicker totalSeconds={targetSeconds} onChange={setTargetSeconds} />
        </View>
      )}

      <View style={styles.controlsWrap}>
        <TimerControls
          isRunning={isRunning}
          onToggle={isRunning ? pause : start}
          secondaryIcon={canFinish ? 'checkmark-outline' : 'refresh-outline'}
          onSecondaryPress={canFinish ? handleFinish : reset}
        />
      </View>

      <TouchableOpacity
        style={styles.historyLink}
        onPress={() => router.push('/cardio-historico')}
      >
        <Text style={styles.historyLinkText}>Ver histórico</Text>
        <Ionicons name="chevron-forward" size={14} color={COLORS.muted} />
      </TouchableOpacity>
    </View>
  );
}
