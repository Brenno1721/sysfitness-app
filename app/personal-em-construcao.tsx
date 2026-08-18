import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SPACING } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

export default function PersonalEmConstrucaoScreen() {
  const router = useRouter();
  const { COLORS } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.md,
    },
    backText: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.sm,
      paddingHorizontal: SPACING.xl,
    },
    title: { color: COLORS.text, fontWeight: '700', fontSize: 18, marginTop: SPACING.sm },
    subtitle: { color: COLORS.muted, fontSize: 13, textAlign: 'center' },
  }), [COLORS]);

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={20} color={COLORS.text} />
        <Text style={styles.backText}>Voltar</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Ionicons name="construct-outline" size={40} color={COLORS.muted} />
        <Text style={styles.title}>Em construção</Text>
        <Text style={styles.subtitle}>
          A área do personal trainer ainda está sendo desenvolvida.
        </Text>
      </View>
    </SafeAreaView>
  );
}