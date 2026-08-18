import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { RADIUS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

export default function ProgressBar({ pct }: { pct: number }) {
  const { COLORS } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        track: {
          height: 6,
          borderRadius: RADIUS.pill,
          backgroundColor: COLORS.cardBorder,
          overflow: 'hidden',
        },
        fill: {
          height: '100%',
          backgroundColor: COLORS.done,
          borderRadius: RADIUS.pill,
        },
      }),
    [COLORS]
  );

  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${Math.min(100, Math.max(0, pct))}%` }]} />
    </View>
  );
}
