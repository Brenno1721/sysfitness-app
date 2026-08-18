import React, { useMemo } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCardioTimer } from '../context/CardioTimerContext';
import { SPACING } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import ActivityCarousel from '../components/cardio/ActivityCarousel';
import TimeDisplay from '../components/cardio/TimeDisplay';
import TimerControls from '../components/cardio/TimerControls';
import { buildFinishFeedback } from '../components/cardio/cardioFeedback';

export default function TimerFullscreenScreen() {
  const router = useRouter();
  const { COLORS } = useTheme();
  const {
    activityIndex,
    setActivityIndex,
    elapsedSeconds,
    isRunning,
    start,
    pause,
    reset,
    finishSession,
  } = useCardioTimer();

  const canFinish = isRunning || elapsedSeconds > 0;

  const handleFinish = async () => {
    const result = await finishSession();
    const { title, message } = buildFinishFeedback(result, activityIndex);
    Alert.alert(title, message);
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    closeButton: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },
    content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.xl },
  }), [COLORS]);

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
        <Ionicons name="close" size={26} color={COLORS.text} />
      </TouchableOpacity>

      <View style={styles.content}>
        <ActivityCarousel
          activityIndex={activityIndex}
          onChange={setActivityIndex}
          itemWidth={120}
          iconSize={30}
          labelSize={14}
        />

        <TimeDisplay seconds={elapsedSeconds} fontSize={80} />

        <TimerControls
          isRunning={isRunning}
          onToggle={isRunning ? pause : start}
          secondaryIcon={canFinish ? 'checkmark-outline' : 'refresh-outline'}
          onSecondaryPress={canFinish ? handleFinish : reset}
          playSize={80}
          resetSize={56}
        />
      </View>
    </SafeAreaView>
  );
}