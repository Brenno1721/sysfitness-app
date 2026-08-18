import { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useWorkoutSession } from '../context/WorkoutSessionContext';
import { SPACING } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function ActiveSessionBanner() {
  const router = useRouter();
  const { COLORS } = useTheme();
  const { isActive, elapsedSeconds } = useWorkoutSession();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: { backgroundColor: COLORS.accent },
        banner: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: SPACING.sm,
          paddingHorizontal: SPACING.lg,
          paddingVertical: SPACING.sm,
        },
        text: { flex: 1, color: '#FFFFFF', fontWeight: '700', fontSize: 12.5 },
        link: { color: '#FFFFFF', fontWeight: '800', fontSize: 12.5, textDecorationLine: 'underline' },
      }),
    [COLORS]
  );

  if (!isActive) return null;

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.banner}>
        <Text style={styles.text} numberOfLines={1}>
          Treino em andamento · {formatTime(elapsedSeconds)}
        </Text>
        <TouchableOpacity onPress={() => router.push('/treino-dia')} hitSlop={8}>
          <Text style={styles.link}>Voltar ao treino</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
