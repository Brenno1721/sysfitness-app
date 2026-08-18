import { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { addBodyMetric, pickAndSavePhoto } from '../lib/bodyMetrics';
import type { BodyMeasurements } from '../lib/bodyMetrics';
import { SPACING, RADIUS, FONT } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useGamification } from '../context/GamificationContext';
import type { ThemeColors } from '../constants/theme';

function formatNumber(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function roundToStep(value: number, step: number): number {
  const decimals = step < 1 ? 1 : 0;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function Stepper({
  label,
  value,
  step,
  onChange,
}: {
  label: string;
  value: number;
  step: number;
  onChange: (next: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const { COLORS } = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);

  const decrement = () => onChange(Math.max(0, roundToStep(value - step, step)));
  const increment = () => onChange(roundToStep(value + step, step));

  const startEditing = () => {
    setInputValue(value > 0 ? formatNumber(value) : '');
    setEditing(true);
  };

  const commitEdit = () => {
    const parsed = parseFloat(inputValue.replace(',', '.'));
    onChange(!isNaN(parsed) && parsed >= 0 ? parsed : 0);
    setEditing(false);
  };

  return (
    <View style={styles.stepperBlock}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperRow}>
        <TouchableOpacity onPress={decrement} hitSlop={8}>
          <Ionicons name="remove-circle-outline" size={28} color={COLORS.text} />
        </TouchableOpacity>
        {editing ? (
          <TextInput
            style={styles.stepperInput}
            value={inputValue}
            onChangeText={setInputValue}
            onBlur={commitEdit}
            onSubmitEditing={commitEdit}
            keyboardType="decimal-pad"
            autoFocus
            selectTextOnFocus
          />
        ) : (
          <TouchableOpacity onPress={startEditing} hitSlop={8}>
            <Text style={styles.stepperValue}>{value > 0 ? formatNumber(value) : '—'}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={increment} hitSlop={8}>
          <Ionicons name="add-circle-outline" size={28} color={COLORS.accent} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const MEASUREMENT_FIELDS: { key: keyof BodyMeasurements; label: string }[] = [
  { key: 'waist', label: 'CINTURA (CM)' },
  { key: 'chest', label: 'PEITO (CM)' },
  { key: 'arm', label: 'BRAÇO (CM)' },
  { key: 'thigh', label: 'COXA (CM)' },
  { key: 'hip', label: 'QUADRIL (CM)' },
];

export default function RegistrarMedidaScreen() {
  const router = useRouter();
  const { COLORS } = useTheme();
  const { user } = useAuth();
  const { refresh: refreshGamification } = useGamification();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);

  const [weight, setWeight] = useState(0);
  const [measurementsExpanded, setMeasurementsExpanded] = useState(false);
  const [measurements, setMeasurements] = useState<Partial<Record<keyof BodyMeasurements, number>>>({});
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const updateMeasurement = (key: keyof BodyMeasurements, value: number) => {
    setMeasurements((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddPhoto = async () => {
    const uri = await pickAndSavePhoto();
    if (uri) setPhotoUri(uri);
  };

  const hasAnyData =
    weight > 0 || Object.values(measurements).some((v) => (v ?? 0) > 0) || !!photoUri;

  const handleSave = async () => {
    if (!hasAnyData || saving || !user) return;
    setSaving(true);

    const filledMeasurements: BodyMeasurements = {};
    MEASUREMENT_FIELDS.forEach(({ key }) => {
      const v = measurements[key];
      if (v && v > 0) filledMeasurements[key] = v;
    });

    await addBodyMetric(user.id, {
      date: new Date().toISOString(),
      weight: weight > 0 ? weight : undefined,
      measurements: Object.keys(filledMeasurements).length > 0 ? filledMeasurements : undefined,
      photoUri: photoUri ?? undefined,
    });
    await refreshGamification();

    setSaving(false);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Registrar medidas</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.weightCard}>
          <Stepper label="PESO (KG)" value={weight} step={0.1} onChange={setWeight} />
        </View>

        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => setMeasurementsExpanded((e) => !e)}
        >
          <Ionicons name="resize-outline" size={16} color={COLORS.accent} />
          <Text style={styles.sectionHeaderText}>MEDIDAS (OPCIONAL)</Text>
          <Ionicons
            name={measurementsExpanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={COLORS.muted}
            style={{ marginLeft: 'auto' }}
          />
        </TouchableOpacity>

        {measurementsExpanded && (
          <View style={styles.measurementsGrid}>
            {MEASUREMENT_FIELDS.map((field) => (
              <View key={field.key} style={styles.measurementItem}>
                <Stepper
                  label={field.label}
                  value={measurements[field.key] ?? 0}
                  step={0.5}
                  onChange={(v) => updateMeasurement(field.key, v)}
                />
              </View>
            ))}
          </View>
        )}

        <Text style={styles.sectionLabel}>FOTO</Text>
        {photoUri ? (
          <View style={styles.photoPreviewWrap}>
            <Image source={{ uri: photoUri }} style={styles.photoPreview} />
            <View style={styles.photoActionsRow}>
              <TouchableOpacity style={styles.photoActionButton} onPress={handleAddPhoto}>
                <Text style={styles.photoActionText}>Trocar foto</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoActionButton} onPress={() => setPhotoUri(null)}>
                <Text style={[styles.photoActionText, { color: COLORS.danger }]}>Remover</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.addPhotoButton} onPress={handleAddPhoto}>
            <Ionicons name="camera-outline" size={20} color={COLORS.text} />
            <Text style={styles.addPhotoButtonText}>Adicionar foto</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.saveButton, (!hasAnyData || saving) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!hasAnyData || saving}
        >
          <Text style={styles.saveButtonText}>{saving ? 'SALVANDO...' : 'SALVAR REGISTRO'}</Text>
        </TouchableOpacity>
      </ScrollView>
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

    weightCard: {
      backgroundColor: COLORS.card,
      borderWidth: 1,
      borderColor: COLORS.cardBorder,
      borderRadius: RADIUS.lg,
      paddingVertical: SPACING.lg,
      alignItems: 'center',
      marginBottom: SPACING.lg,
    },

    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: COLORS.bgElevated,
      borderWidth: 1,
      borderColor: COLORS.cardBorder,
      borderRadius: RADIUS.sm,
      padding: SPACING.md,
    },
    sectionHeaderText: { color: COLORS.text, fontSize: 12.5, fontWeight: '700' },

    measurementsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING.sm,
      marginTop: SPACING.sm,
      marginBottom: SPACING.lg,
    },
    measurementItem: {
      width: '47%',
      backgroundColor: COLORS.card,
      borderWidth: 1,
      borderColor: COLORS.cardBorder,
      borderRadius: RADIUS.md,
      paddingVertical: SPACING.md,
      alignItems: 'center',
    },

    sectionLabel: {
      ...FONT.sectionLabel,
      color: COLORS.muted,
      marginTop: SPACING.md,
      marginBottom: SPACING.sm,
    },

    addPhotoButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderWidth: 1,
      borderColor: COLORS.cardBorder,
      borderRadius: RADIUS.sm,
      paddingVertical: 16,
      backgroundColor: COLORS.card,
    },
    addPhotoButtonText: { color: COLORS.text, fontWeight: '700', fontSize: 14 },

    photoPreviewWrap: { alignItems: 'center' },
    photoPreview: {
      width: '100%',
      height: 260,
      borderRadius: RADIUS.lg,
      backgroundColor: COLORS.card,
    },
    photoActionsRow: { flexDirection: 'row', gap: SPACING.lg, marginTop: SPACING.sm },
    photoActionButton: { paddingVertical: 8 },
    photoActionText: { color: COLORS.text, fontWeight: '700', fontSize: 13 },

    saveButton: {
      backgroundColor: COLORS.accent,
      borderRadius: RADIUS.sm,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: SPACING.xl,
    },
    saveButtonDisabled: { opacity: 0.4 },
    saveButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14, letterSpacing: 0.5 },

    stepperBlock: { alignItems: 'center' },
    stepperLabel: {
      ...FONT.sectionLabel,
      color: COLORS.muted,
      fontSize: 10.5,
      marginBottom: SPACING.sm,
    },
    stepperRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
    stepperValue: {
      color: COLORS.text,
      fontWeight: '900',
      fontSize: 22,
      minWidth: 52,
      textAlign: 'center',
      fontVariant: ['tabular-nums'],
    },
    stepperInput: {
      color: COLORS.text,
      fontWeight: '900',
      fontSize: 22,
      minWidth: 52,
      textAlign: 'center',
      borderBottomWidth: 2,
      borderBottomColor: COLORS.accent,
      paddingBottom: 2,
    },
  });
}
