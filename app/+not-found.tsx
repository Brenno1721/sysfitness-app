import { useMemo } from 'react';
import { Link, Stack } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { FONT } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

export default function NotFoundScreen() {
  const { COLORS } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          backgroundColor: COLORS.bg,
        },
        title: { ...FONT.title, fontSize: 18, color: COLORS.text },
        link: { marginTop: 15, paddingVertical: 15 },
        linkText: { fontSize: 14, color: COLORS.accent, fontWeight: '700' },
      }),
    [COLORS]
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!', headerShown: false }} />
      <View style={styles.container}>
        <Text style={styles.title}>Essa tela não existe.</Text>
        <Link href="/(tabs)" style={styles.link}>
          <Text style={styles.linkText}>Voltar pro início</Text>
        </Link>
      </View>
    </>
  );
}
