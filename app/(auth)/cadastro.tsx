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

export default function CadastroScreen() {
  const { signUp } = useAuth();
  const router = useRouter();
  const { COLORS } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: SPACING.xl,
      paddingVertical: SPACING.xl,
    },
    logo: {
      width: '70%',
      height: undefined,
      aspectRatio: 5.5,
      alignSelf: 'center',
      marginTop: SPACING.sm,
    },
    subtitle: { ...FONT.eyebrow, color: COLORS.muted, marginTop: 4 },
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
    footer: { alignItems: 'center', marginTop: SPACING.xl },
    footerLink: { color: COLORS.accent, fontSize: 12.5, fontWeight: '700', letterSpacing: 0.5 },
  }), [COLORS]);

  const handleSignUp = async () => {
    setError('');
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    setLoading(true);
    const res = await signUp(name.trim(), email.trim(), password);
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
        <View style={{ alignItems: 'center' }}>
          <Ionicons name="barbell" size={28} color={COLORS.accent} />
          <Image
            source={require('../../assets/images/logocapa.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.subtitle}>CADASTRO DE ATLETA</Text>
        </View>

        <View style={{ marginTop: SPACING.xl }}>
          <Text style={styles.label}>NOME COMPLETO</Text>
          <View style={styles.inputRow}>
            <Ionicons name="person-outline" size={16} color={COLORS.muted} />
            <TextInput
              style={styles.input}
              placeholder="John Doe"
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

          <Text style={[styles.label, { marginTop: SPACING.md }]}>CONFIRMAR SENHA</Text>
          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={16} color={COLORS.muted} />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={COLORS.mutedDim}
              secureTextEntry={!showPassword}
              value={confirm}
              onChangeText={setConfirm}
            />
          </View>

          {!!error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={styles.button}
            onPress={handleSignUp}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'CRIANDO...' : 'CRIAR CONTA'}
            </Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text style={styles.footerLink}>JÁ TEM CONTA? ENTRAR</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}