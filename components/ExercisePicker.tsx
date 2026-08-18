import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EXERCISE_DATABASE, ExerciseCategory, ExerciseDBEntry } from '../data/exerciseDatabase';
import { SPACING, RADIUS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

const CATEGORIES: ExerciseCategory[] = [
  'Peito', 'Costas', 'Ombro', 'Bíceps', 'Tríceps',
  'Perna', 'Posterior', 'Panturrilha', 'Abdômen', 'Cardio',
];

type CategoryFilter = 'Todos' | ExerciseCategory;

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

type Props = {
  onAdd: (exercise: ExerciseDBEntry) => void;
};

export default function ExercisePicker({ onAdd }: Props) {
  const { COLORS } = useTheme();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('Todos');

  const filtered = useMemo(() => {
    const query = normalize(search);
    return EXERCISE_DATABASE.filter((ex) => {
      const matchesCategory = category === 'Todos' || ex.category === category;
      const matchesSearch = query === '' || normalize(ex.name).includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [search, category]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {},
        searchRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.sm,
          backgroundColor: COLORS.card,
          borderWidth: 1,
          borderColor: COLORS.cardBorder,
          borderRadius: RADIUS.sm,
          paddingHorizontal: SPACING.md,
          paddingVertical: 10,
        },
        searchInput: { flex: 1, color: COLORS.text, fontSize: 14 },
        categoryRow: { gap: SPACING.xs, paddingVertical: SPACING.sm },
        categoryChip: {
          borderWidth: 1,
          borderColor: COLORS.cardBorder,
          borderRadius: RADIUS.pill,
          paddingHorizontal: 12,
          paddingVertical: 6,
          backgroundColor: COLORS.card,
        },
        categoryChipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
        categoryText: { color: COLORS.muted, fontSize: 11.5, fontWeight: '700' },
        categoryTextActive: { color: '#FFFFFF' },
        list: {
          backgroundColor: COLORS.card,
          borderWidth: 1,
          borderColor: COLORS.cardBorder,
          borderRadius: RADIUS.md,
          overflow: 'hidden',
        },
        exerciseRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: SPACING.sm,
          padding: SPACING.md,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.cardBorder,
        },
        exerciseRowLast: { borderBottomWidth: 0 },
        exerciseName: { color: COLORS.text, fontSize: 13.5, fontWeight: '700' },
        exerciseCategory: { color: COLORS.muted, fontSize: 11, fontWeight: '600', marginTop: 2 },
        emptyText: {
          color: COLORS.mutedDim,
          fontSize: 13,
          fontWeight: '600',
          textAlign: 'center',
          padding: SPACING.lg,
        },
      }),
    [COLORS]
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <Ionicons name="search" size={16} color={COLORS.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar exercício..."
          placeholderTextColor={COLORS.mutedDim}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRow}
      >
        {(['Todos', ...CATEGORIES] as CategoryFilter[]).map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
            onPress={() => setCategory(cat)}
          >
            <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.list}>
        {filtered.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum exercício encontrado.</Text>
        ) : (
          filtered.map((exercise, i) => (
            <View
              key={exercise.id}
              style={[styles.exerciseRow, i === filtered.length - 1 && styles.exerciseRowLast]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseCategory}>{exercise.category}</Text>
              </View>
              <TouchableOpacity onPress={() => onAdd(exercise)}>
                <Ionicons name="add-circle-outline" size={24} color={COLORS.accent} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </View>
  );
}
