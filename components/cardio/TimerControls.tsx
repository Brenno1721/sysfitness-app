import React, { useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

type Props = {
  isRunning: boolean;
  onToggle: () => void;
  secondaryIcon: keyof typeof Ionicons.glyphMap;
  onSecondaryPress: () => void;
  playSize?: number;
  resetSize?: number;
};

export default function TimerControls({
  isRunning,
  onToggle,
  secondaryIcon,
  onSecondaryPress,
  playSize = 56,
  resetSize = 40,
}: Props) {
  const { COLORS } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
        playButton: { backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' },
        playIconOffset: { marginLeft: 2 },
        resetButton: {
          borderWidth: 1,
          borderColor: COLORS.cardBorder,
          alignItems: 'center',
          justifyContent: 'center',
        },
      }),
    [COLORS]
  );

  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={[
          styles.playButton,
          { width: playSize, height: playSize, borderRadius: playSize / 2 },
        ]}
        onPress={onToggle}
      >
        <Ionicons
          name={isRunning ? 'pause' : 'play'}
          size={playSize * 0.45}
          color="#FFFFFF"
          style={!isRunning ? styles.playIconOffset : undefined}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.resetButton,
          { width: resetSize, height: resetSize, borderRadius: resetSize / 2 },
        ]}
        onPress={onSecondaryPress}
      >
        <Ionicons name={secondaryIcon} size={resetSize * 0.5} color={COLORS.text} />
      </TouchableOpacity>
    </View>
  );
}
