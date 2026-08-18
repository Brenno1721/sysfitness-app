import { useMemo } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, SPACING } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

type Props = {
  name: string;
  sets: string;
  done: boolean;
  weight: string;
  onToggle: () => void;
  onChangeWeight: (v: string) => void;
};

export default function ExerciseCard({
  name,
  sets,
  done,
  weight,
  onToggle,
  onChangeWeight,
}: Props) {
  const { COLORS } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.md,
          backgroundColor: COLORS.card,
          borderWidth: 1,
          borderColor: COLORS.cardBorder,
          borderRadius: RADIUS.md,
          padding: SPACING.md,
          marginBottom: SPACING.sm,
        },
        cardDone: { backgroundColor: COLORS.doneBg, borderColor: COLORS.doneBorder },
        checkbox: {
          width: 26,
          height: 26,
          borderRadius: 13,
          borderWidth: 2,
          borderColor: COLORS.cardBorder,
          alignItems: 'center',
          justifyContent: 'center',
        },
        checkboxDone: { backgroundColor: COLORS.done, borderColor: COLORS.done },
        name: { fontSize: 15.5, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
        nameDone: { color: COLORS.muted, textDecorationLine: 'line-through' },
        sets: { fontSize: 13, color: COLORS.muted, fontWeight: '600' },
        weightLabel: { fontSize: 9.5, color: COLORS.mutedDim, fontWeight: '700', marginBottom: 4 },
        weightInput: {
          width: 54,
          textAlign: 'center',
          backgroundColor: COLORS.bg,
          borderWidth: 1,
          borderColor: COLORS.cardBorder,
          borderRadius: 10,
          color: COLORS.text,
          fontSize: 14,
          fontWeight: '700',
          paddingVertical: 7,
        },
      }),
    [COLORS]
  );

  return (
    <View style={[styles.card, done && styles.cardDone]}>
      <TouchableOpacity
        style={[styles.checkbox, done && styles.checkboxDone]}
        onPress={onToggle}
      >
        {done && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
      </TouchableOpacity>

      <View style={{ flex: 1 }}>
        <Text style={[styles.name, done && styles.nameDone]}>{name}</Text>
        <Text style={styles.sets}>{sets}</Text>
      </View>

      <View style={{ alignItems: 'center' }}>
        <Text style={styles.weightLabel}>Carga (kg)</Text>
        <TextInput
          style={styles.weightInput}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={COLORS.mutedDim}
          value={weight}
          onChangeText={onChangeWeight}
        />
      </View>
    </View>
  );
}
