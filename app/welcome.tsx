import { useMemo } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { RADIUS, SPACING } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

// Dimensões reais de fundo.png (941x1672) — as silhuetas e o logo "S" ficam na
// metade superior da foto, com bastante chão vazio embaixo. Um crop centralizado
// (resizeMode cover comum) corta demais por cima e mostra só o chão/equipamento.
// Calculamos a altura da imagem em pixels (não com a prop aspectRatio — ela não
// respeita a proporção real quando aplicada a um <Image> no React Native Web) e
// ancoramos no topo do container (overflow hidden), garantindo que cabeças + logo
// fiquem visíveis em vez do chão vazio.
const HERO_IMAGE_ASPECT_RATIO = 941 / 1672; // largura / altura
// Fração vertical da foto exibida antes do corte — os pés terminam em ~72.4%
// da altura real do arquivo (medido pixel a pixel), então 0.73 é o mínimo
// seguro pra mostrar os pés inteiros sem cortar na altura da canela.
const HERO_VISIBLE_FRACTION = 0.73;
// logocapa.png é um canvas QUADRADO (1254x1254) com o wordmark "SYSFITNESS"
// ocupando só uma faixa fina no meio (~45%–54% da altura, quase 100% da
// largura — confirmado lendo os pixels não-transparentes do arquivo). Mostrar
// o canvas inteiro em 1:1 deixaria o texto minúsculo no meio de muito espaço
// vazio. Em vez disso, recortamos uma janela centralizada equivalente a uma
// proporção de exibição ~5.5:1, igual a um wordmark normal.
const WORDMARK_DISPLAY_ASPECT_RATIO = 5.5; // largura / altura da janela de recorte

export default function WelcomeScreen() {
  const router = useRouter();
  const { COLORS } = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  const heroImageHeight = screenWidth / HERO_IMAGE_ASPECT_RATIO;
  const imageAreaHeight = heroImageHeight * HERO_VISIBLE_FRACTION;
  const bottomFadeHeight = imageAreaHeight * 0.28;
  // Faixa preta no topo (atrás do notch/status bar) até transparente — a foto
  // "nasce" do preto em vez de começar de repente logo abaixo da safe area.
  const topFadeHeight = imageAreaHeight * 0.15;

  // Wordmark: mesma técnica do hero — dimensões em pixel via JS (a prop
  // aspectRatio não é respeitada por <Image> no React Native Web), imagem
  // quadrada centralizada num container mais baixo que ela, overflow hidden
  // recortando igualmente em cima/embaixo (o conteúdo já está centralizado
  // verticalmente no arquivo, então um corte centralizado simples resolve).
  const wordmarkContentWidth = (screenWidth - SPACING.xl * 2) * 0.62;
  const wordmarkAreaHeight = wordmarkContentWidth / WORDMARK_DISPLAY_ASPECT_RATIO;

  const styles = useMemo(() => StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#000' },
    imageArea: { height: imageAreaHeight, overflow: 'hidden', backgroundColor: '#000' },
    heroImage: { width: screenWidth, height: heroImageHeight },
    heroTopFade: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      height: topFadeHeight,
    },
    heroFade: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: bottomFadeHeight,
    },
    bottomArea: {
      flex: 1,
      backgroundColor: COLORS.bg,
      paddingHorizontal: SPACING.xl,
      paddingTop: SPACING.xs,
      paddingBottom: SPACING.xs,
      alignItems: 'center',
      // Distribui o espaço sobrando entre os 3 grupos (wordmark+tagline,
      // botões, selo) em vez de deixar tudo grudado no topo com um vazio
      // gigante embaixo — some sozinho quando a tela é pequena (SE) e some
      // espaçamento de verdade quando sobra espaço (telas maiores).
      justifyContent: 'space-between',
    },
    textBlock: { alignItems: 'center', gap: SPACING.xs },
    wordmarkArea: {
      width: wordmarkContentWidth,
      height: wordmarkAreaHeight,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    wordmarkImage: { width: wordmarkContentWidth, height: wordmarkContentWidth },
    tagline: {
      color: COLORS.muted,
      textAlign: 'center',
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '600',
      maxWidth: 300,
    },
    actions: { width: '100%', gap: 8 },
    buttonRow: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.md,
    },
    primaryButton: {
      borderWidth: 1,
      borderColor: COLORS.accent,
      backgroundColor: COLORS.accent,
      borderRadius: RADIUS.sm,
      paddingVertical: 12,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontWeight: '800',
      fontSize: 15,
      letterSpacing: 0.4,
      textAlign: 'center',
      flex: 1,
    },
    secondaryButton: {
      borderWidth: 1,
      borderColor: COLORS.cardBorder,
      borderRadius: RADIUS.sm,
      paddingVertical: 12,
      backgroundColor: COLORS.card,
    },
    secondaryButtonText: {
      color: COLORS.text,
      fontWeight: '700',
      fontSize: 15,
      letterSpacing: 0.2,
      textAlign: 'center',
      flex: 1,
    },
    trustRow: {
      marginTop: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
    },
    trustText: {
      color: COLORS.muted,
      fontSize: 11,
      fontWeight: '600',
      textAlign: 'center',
    },
  }), [
    COLORS,
    imageAreaHeight,
    screenWidth,
    heroImageHeight,
    bottomFadeHeight,
    topFadeHeight,
    wordmarkContentWidth,
    wordmarkAreaHeight,
  ]);

  return (
    <View style={styles.screen}>
      {/* A imagem fica FORA da safe area de propósito — edge-to-edge, começando
          do y=0 real da tela, por trás do notch/status bar. */}
      <StatusBar style="light" />

      <View style={styles.imageArea}>
        <Image
          source={require('../assets/images/fundo.png')}
          resizeMode="cover"
          style={styles.heroImage}
        />
        <LinearGradient
          colors={['#000000', 'transparent']}
          style={styles.heroTopFade}
          pointerEvents="none"
        />
        <LinearGradient
          colors={['transparent', COLORS.bg]}
          style={styles.heroFade}
          pointerEvents="none"
        />
      </View>

      <SafeAreaView style={styles.bottomArea} edges={['bottom']}>
        <View style={styles.textBlock}>
          <View style={styles.wordmarkArea}>
            <Image
              source={require('../assets/images/logocapa.png')}
              style={styles.wordmarkImage}
            />
          </View>
          <Text style={styles.tagline}>Seu treino. Seus resultados. Nosso sistema.</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <View style={styles.buttonRow}>
              <Ionicons name="school-outline" size={18} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Entrar como Aluno</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/personal-em-construcao')}
          >
            <View style={styles.buttonRow}>
              <Ionicons name="person-outline" size={18} color={COLORS.text} />
              <Text style={styles.secondaryButtonText}>Entrar como Personal</Text>
              <Ionicons name="arrow-forward" size={18} color={COLORS.text} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.trustRow}>
          <Ionicons name="lock-closed-outline" size={12} color={COLORS.muted} />
          <Text style={styles.trustText}>Seus dados estão protegidos com segurança</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}
