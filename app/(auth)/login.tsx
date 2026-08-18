import { useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { SPACING, RADIUS, FONT } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const { COLORS } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: SPACING.xl,
    },
    logo: {
      width: '70%',
      height: undefined,
      aspectRatio: 1.0,
      alignSelf: 'center',
    },
    label: {
      ...FONT.sectionLabel,
      color: COLORS.muted,
      marginBottom: SPACING.xs,
    },
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
    error: { color: COLORS.danger, fontSize: 13, marginTop: SPACING.sm, fontWeight: '600' },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: COLORS.accent,
      borderRadius: RADIUS.sm,
      paddingVertical: 15,
      marginTop: SPACING.lg,
    },
    buttonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15, letterSpacing: 0.5 },
    forgot: {
      color: COLORS.muted,
      fontSize: 12.5,
      fontWeight: '600',
      textAlign: 'center',
      textDecorationLine: 'underline',
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: SPACING.xl * 1.5,
    },
    footerText: { color: COLORS.muted, fontSize: 13.5 },
    footerLink: { color: COLORS.accent, fontSize: 13.5, fontWeight: '700' },
  }), [COLORS]);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    const res = await login(email.trim(), password);
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }} edges={['top', 'bottom']}>
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Image
          source={require('../../assets/images/logocapa.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={{ marginTop: SPACING.xl }}>
          <Text style={styles.label}>E-MAIL</Text>
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

          <Text style={[styles.label, { marginTop: SPACING.md }]}>SENHA</Text>
          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={16} color={COLORS.muted} />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={COLORS.mutedDim}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword((s) => !s)}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={COLORS.muted}
              />
            </TouchableOpacity>
          </View>

          {!!error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'ENTRANDO...' : 'ENTRAR'}</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity style={{ marginTop: SPACING.md }}>
            <Text style={styles.forgot}>ESQUECI MINHA SENHA</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Não tem conta? </Text>
          <Link href="/(auth)/cadastro" asChild>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Criar conta</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}