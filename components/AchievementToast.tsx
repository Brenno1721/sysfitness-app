import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useGamification } from '../context/GamificationContext';
import type { Achievement } from '../lib/gamification';
import { triggerNotification, NotificationFeedbackType } from '../lib/haptics';
import CelebrationParticles from './CelebrationParticles';
import { RADIUS, SPACING, FONT } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import type { ThemeColors } from '../constants/theme';

const VISIBLE_DURATION = 3500;
const EXIT_DURATION = 260;
const QUEUE_GAP = 400;
const BURST_SIZE = 140;
const ICON_CIRCLE_SIZE = 76;

function IconBurst({ icon, COLORS }: { icon: string; COLORS: ThemeColors }) {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withSequence(
      withTiming(1.15, { duration: 280, easing: Easing.out(Easing.ease) }),
      withSpring(1, { damping: 10, stiffness: 220 })
    );
  }, []);

  const circleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View
      style={{
        width: BURST_SIZE,
        height: BURST_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <CelebrationParticles colors={[COLORS.accent, COLORS.done]} />
      <Animated.View
        style={[
          {
            width: ICON_CIRCLE_SIZE,
            height: ICON_CIRCLE_SIZE,
            borderRadius: ICON_CIRCLE_SIZE / 2,
            backgroundColor: COLORS.accent,
            alignItems: 'center',
            justifyContent: 'center',
          },
          circleStyle,
        ]}
      >
        <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={34} color="#FFFFFF" />
      </Animated.View>
    </View>
  );
}

function Toast({ achievement, onFinished }: { achievement: Achievement; onFinished: () => void }) {
  const { COLORS } = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const progress = useSharedValue(0);

  useEffect(() => {
    triggerNotification(NotificationFeedbackType.Success);
    progress.value = withSpring(1, { damping: 14, stiffness: 180 });

    const hideTimer = setTimeout(() => {
      progress.value = withTiming(0, { duration: EXIT_DURATION, easing: Easing.in(Easing.cubic) });
    }, VISIBLE_DURATION);

    const removeTimer = setTimeout(() => {
      onFinished();
    }, VISIBLE_DURATION + EXIT_DURATION);

    return () => {
      clearTimeout(hideTimer);
      clearTimeout(removeTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: (1 - progress.value) * -70 },
      { scale: 0.85 + progress.value * 0.15 },
    ],
  }));

  return (
    <Animated.View style={[styles.card, cardAnimatedStyle]}>
      <TouchableOpacity activeOpacity={0.9} onPress={onFinished} style={styles.cardInner}>
        <IconBurst icon={achievement.icon} COLORS={COLORS} />
        <Text style={styles.eyebrow}>CONQUISTA DESBLOQUEADA</Text>
        <Text style={styles.title}>{achievement.title}</Text>
        <Text style={styles.description}>{achievement.description}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function AchievementToast() {
  const { celebrationQueue, dismissCelebration } = useGamification();
  const [gapActive, setGapActive] = useState(false);
  const gapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (gapTimerRef.current) clearTimeout(gapTimerRef.current);
    },
    []
  );

  const handleFinished = () => {
    dismissCelebration();
    setGapActive(true);
    gapTimerRef.current = setTimeout(() => setGapActive(false), QUEUE_GAP);
  };

  const current = celebrationQueue[0] ?? null;
  if (!current || gapActive) return null;

  return (
    <SafeAreaView style={styles.overlay} edges={['top']} pointerEvents="box-none">
      <Toast key={current.id} achievement={current} onFinished={handleFinished} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
    elevation: 999,
  },
});

function makeStyles(COLORS: ThemeColors) {
  return StyleSheet.create({
    card: { width: '86%', maxWidth: 420, marginTop: SPACING.sm },
    cardInner: {
      alignItems: 'center',
      backgroundColor: COLORS.cardElevated,
      borderWidth: 1.5,
      borderColor: COLORS.accent,
      borderRadius: RADIUS.lg,
      paddingVertical: SPACING.lg,
      paddingHorizontal: SPACING.lg,
      shadowColor: COLORS.accent,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.35,
      shadowRadius: 24,
      elevation: 14,
    },
    eyebrow: {
      ...FONT.eyebrow,
      color: COLORS.accent,
      marginTop: SPACING.xs,
    },
    title: {
      color: COLORS.text,
      fontWeight: '800',
      fontSize: 17,
      marginTop: 6,
      textAlign: 'center',
    },
    description: {
      color: COLORS.muted,
      fontSize: 12.5,
      textAlign: 'center',
      marginTop: 6,
      lineHeight: 18,
    },
  });
}
