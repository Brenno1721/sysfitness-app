import { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, RADIUS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import type { ThemeColors } from '../constants/theme';

type Props = {
  message: string;
  title?: string;
};

export default function LockedFeature({ message, title = 'Recurso bloqueado' }: Props) {
  const router = useRouter();
  const { COLORS } = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name="lock-closed" size={24} color={COLORS.muted} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <TouchableOpacity style={styles.button} onPress={() => router.push('/planos')}>
        <Text style={styles.buttonText}>VER PLANOS</Text>
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(COLORS: ThemeColors) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      paddingVertical: SPACING.xl * 1.5,
      paddingHorizontal: SPACING.xl,
    },
    iconWrap: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: COLORS.card,
      borderWidth: 1,
      borderColor: COLORS.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: SPACING.md,
    },
    title: { color: COLORS.text, fontWeight: '800', fontSize: 16, marginBottom: SPACING.xs },
    message: { color: COLORS.muted, fontSize: 13, textAlign: 'center', lineHeight: 19 },
    button: {
      backgroundColor: COLORS.accent,
      borderRadius: RADIUS.sm,
      paddingVertical: 13,
      paddingHorizontal: SPACING.xl,
      marginTop: SPACING.lg,
    },
    buttonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
  });
}
