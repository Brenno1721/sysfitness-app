import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getBodyMetrics, BodyMetricEntry } from '../lib/bodyMetrics';
import { markPhotosCompared } from '../lib/gamification';
import { SPACING, RADIUS, FONT } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useGamification } from '../context/GamificationContext';
import type { ThemeColors } from '../constants/theme';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatWeight(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function daysBetween(fromIso: string, toIso: string): number {
  const ms = new Date(toIso).getTime() - new Date(fromIso).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

type Slot = 'before' | 'after';

export default function CompararFotosScreen() {
  const router = useRouter();
  const { COLORS } = useTheme();
  const { user } = useAuth();
  const userId = user?.id;
  const { refresh: refreshGamification } = useGamification();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);

  const [entries, setEntries] = useState<BodyMetricEntry[] | null>(null);
  const [beforeId, setBeforeId] = useState<string | null>(null);
  const [afterId, setAfterId] = useState<string | null>(null);
  const [pickerSlot, setPickerSlot] = useState<Slot | null>(null);

  useEffect(() => {
    if (!userId) return;
    getBodyMetrics(userId).then((list) => {
      const withPhoto = list
        .filter((e) => !!e.photoUri)
        .sort((a, b) => a.date.localeCompare(b.date)); // mais antigo primeiro

      setEntries(withPhoto);
      if (withPhoto.length > 0) {
        setBeforeId(withPhoto[0].id);
        setAfterId(withPhoto[withPhoto.length - 1].id);
      }
      if (withPhoto.length >= 2) {
        markPhotosCompared(userId).then(refreshGamification);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const photoEntries = entries ?? [];
  const beforeEntry = photoEntries.find((e) => e.id === beforeId) ?? null;
  const afterEntry = photoEntries.find((e) => e.id === afterId) ?? null;

  const bothHaveWeight =
    beforeEntry?.weight !== undefined && afterEntry?.weight !== undefined && beforeEntry.id !== afterEntry.id;
  const weightDiff = bothHaveWeight ? afterEntry!.weight! - beforeEntry!.weight! : 0;
  const dayDiff = beforeEntry && afterEntry ? daysBetween(beforeEntry.date, afterEntry.date) : 0;

  const openPicker = (slot: Slot) => setPickerSlot(slot);
  const closePicker = () => setPickerSlot(null);

  const handlePick = (id: string) => {
    if (pickerSlot === 'before') setBeforeId(id);
    if (pickerSlot === 'after') setAfterId(id);
    closePicker();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Comparar fotos</Text>
        <View style={{ width: 22 }} />
      </View>

      {entries === null ? (
        <View style={{ flex: 1 }} />
      ) : photoEntries.length < 2 ? (
        <View style={styles.empty}>
          <Ionicons name="images-outline" size={40} color={COLORS.mutedDim} />
          <Text style={styles.emptyText}>
            Registre pelo menos duas fotos de progresso pra poder compará-las.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 60 }}>
          <View style={styles.selectorRow}>
            <TouchableOpacity style={styles.selectorButton} onPress={() => openPicker('before')}>
              <Text style={styles.selectorLabel}>ANTES</Text>
              <Text style={styles.selectorValue}>{beforeEntry ? formatDate(beforeEntry.date) : '—'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.selectorButton} onPress={() => openPicker('after')}>
              <Text style={styles.selectorLabel}>DEPOIS</Text>
              <Text style={styles.selectorValue}>{afterEntry ? formatDate(afterEntry.date) : '—'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.photosRow}>
            <View style={styles.photoColumn}>
              {beforeEntry?.photoUri && (
                <Image source={{ uri: beforeEntry.photoUri }} style={styles.photo} />
              )}
              <Text style={styles.photoDate}>{beforeEntry ? formatDate(beforeEntry.date) : '—'}</Text>
              <Text style={styles.photoWeight}>
                {beforeEntry?.weight !== undefined ? `${formatWeight(beforeEntry.weight)}kg` : '—'}
              </Text>
            </View>
            <View style={styles.photoColumn}>
              {afterEntry?.photoUri && (
                <Image source={{ uri: afterEntry.photoUri }} style={styles.photo} />
              )}
              <Text style={styles.photoDate}>{afterEntry ? formatDate(afterEntry.date) : '—'}</Text>
              <Text style={styles.photoWeight}>
                {afterEntry?.weight !== undefined ? `${formatWeight(afterEntry.weight)}kg` : '—'}
              </Text>
            </View>
          </View>

          {bothHaveWeight && (
            <Text style={styles.diffText}>
              {weightDiff > 0 ? '+' : ''}
              {formatWeight(weightDiff)}kg em {Math.abs(dayDiff)}{' '}
              {Math.abs(dayDiff) === 1 ? 'dia' : 'dias'}
            </Text>
          )}
        </ScrollView>
      )}

      <Modal visible={pickerSlot !== null} transparent animationType="fade" onRequestClose={closePicker}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closePicker}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {pickerSlot === 'before' ? 'Escolher foto — Antes' : 'Escolher foto — Depois'}
            </Text>
            <ScrollView style={{ maxHeight: 340 }}>
              {photoEntries.map((entry) => {
                const selected = pickerSlot === 'before' ? entry.id === beforeId : entry.id === afterId;
                return (
                  <TouchableOpacity
                    key={entry.id}
                    style={styles.modalRow}
                    onPress={() => handlePick(entry.id)}
                  >
                    <Text style={styles.modalRowText}>{formatDate(entry.date)}</Text>
                    {selected && <Ionicons name="checkmark" size={18} color={COLORS.accent} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

function makeStyles(COLORS: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.md,
      paddingBottom: SPACING.sm,
    },
    title: { ...FONT.title, fontSize: 18, color: COLORS.text },

    empty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.sm,
      paddingHorizontal: SPACING.xl,
    },
    emptyText: { color: COLORS.mutedDim, fontSize: 13.5, fontWeight: '600', textAlign: 'center' },

    selectorRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
    selectorButton: {
      flex: 1,
      backgroundColor: COLORS.card,
      borderWidth: 1,
      borderColor: COLORS.cardBorder,
      borderRadius: RADIUS.md,
      padding: SPACING.md,
      alignItems: 'center',
    },
    selectorLabel: { ...FONT.sectionLabel, fontSize: 10, color: COLORS.muted, marginBottom: 4 },
    selectorValue: { color: COLORS.text, fontWeight: '800', fontSize: 14 },

    photosRow: { flexDirection: 'row', gap: SPACING.sm },
    photoColumn: { flex: 1, alignItems: 'center' },
    photo: {
      width: '100%',
      aspectRatio: 3 / 4,
      borderRadius: RADIUS.md,
      backgroundColor: COLORS.card,
    },
    photoDate: { color: COLORS.text, fontWeight: '700', fontSize: 12.5, marginTop: SPACING.sm },
    photoWeight: { color: COLORS.muted, fontSize: 12, fontWeight: '600', marginTop: 2 },

    diffText: {
      color: COLORS.muted,
      fontWeight: '800',
      fontSize: 15,
      textAlign: 'center',
      marginTop: SPACING.lg,
    },

    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: SPACING.xl,
    },
    modalCard: {
      backgroundColor: COLORS.card,
      borderRadius: RADIUS.lg,
      padding: SPACING.lg,
      width: '100%',
      borderWidth: 1,
      borderColor: COLORS.cardBorder,
    },
    modalTitle: {
      color: COLORS.text,
      fontWeight: '800',
      fontSize: 15,
      marginBottom: SPACING.md,
      textAlign: 'center',
    },
    modalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.cardBorder,
    },
    modalRowText: { color: COLORS.text, fontWeight: '600', fontSize: 14 },
  });
}
