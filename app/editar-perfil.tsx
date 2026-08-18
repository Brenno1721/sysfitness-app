import { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useGamification } from '../context/GamificationContext';
import { markProfileEdited } from '../lib/gamification';
import { SPACING, RADIUS, FONT } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

export default function EditarPerfilScreen() {
  const router = useRouter();
  const { COLORS } = useTheme();
  const { user, updateProfile } = useAuth();
  const { refresh: refreshGamification } = useGamification();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) return;
    setSaving(true);
    await updateProfile(name.trim(), email.trim());
    if (user) {
      await markProfileEdited(user.id);
      await refreshGamification();
    }
    setSaving(false);
    Alert.alert('Perfil atualizado', 'Suas informações foram salvas.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
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
        label: { ...FONT.sectionLabel, color: COLORS.muted, marginBottom: SPACING.xs },
        inputRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.sm,
          backgroundColor: COLORS.card,
          borderWidth: 1,
          borderColor: COLORS.cardBorder,
          borderRadius: RADIUS.sm,
          paddingHorizontal: SPACING.md,
          paddingVertical: 12,
        },
        input: { flex: 1, color: COLORS.text, fontSize: 15 },
        button: {
          backgroundColor: COLORS.accent,
          borderRadius: RADIUS.sm,
          paddingVertical: 15,
          alignItems: 'center',
          marginTop: SPACING.xl,
        },
        buttonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14, letterSpacing: 0.5 },
      }),
    [COLORS]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Editar perfil</Text>
        <View style={{ width: 22 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ padding: SPACING.lg }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.label}>NOME COMPLETO</Text>
          <View style={styles.inputRow}>
            <Ionicons name="person-outline" size={16} color={COLORS.muted} />
            <TextInput
              style={styles.input}
              placeholder="Seu nome"
              placeholderTextColor={COLORS.mutedDim}
              value={name}
              onChangeText={setName}
            />
          </View>

          <Text style={[styles.label, { marginTop: SPACING.md }]}>E-MAIL</Text>
          <View style={styles.inputRow}>
            <Ionicons name="mail-outline" size={16} color={COLORS.muted} />
            <TextInput
              style={styles.input}
              placeholder="atleta@sysfitness.com"
              placeholderTextColor={COLORS.mutedDim}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.buttonText}>{saving ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
