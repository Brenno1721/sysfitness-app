import React, { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

type Props = {
  seconds: number;
  fontSize?: number;
};

export default function TimeDisplay({ seconds, fontSize = 40 }: Props) {
  const { COLORS } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        text: {
          color: COLORS.text,
          fontWeight: '800',
          textAlign: 'center',
          fontVariant: ['tabular-nums'],
        },
      }),
    [COLORS]
  );

  return <Text style={[styles.text, { fontSize }]}>{formatTime(seconds)}</Text>;
}
