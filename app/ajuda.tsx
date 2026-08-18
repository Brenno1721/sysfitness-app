import { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, RADIUS, FONT, ThemeColors } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

const FAQ = [
  {
    question: 'Como crio uma nova rotina de treino?',
    answer:
      'Na aba Treino, toque em "Novo treino" e monte os dias, grupos e exercícios. Você pode ter várias rotinas e alternar qual está ativa a qualquer momento.',
  },
  {
    question: 'Como funciona o cronômetro de cardio?',
    answer:
      'Na Home, escolha a atividade, defina o tempo desejado e inicie — o cronômetro conta em segundo plano e salva a sessão no seu histórico de cardio ao final.',
  },
  {
    question: 'Meus dados ficam salvos onde?',
    answer:
      'Tudo fica salvo localmente no seu aparelho. Se quiser apagar tudo e recomeçar do zero, use "Excluir todos os dados" em Configurações.',
  },
  {
    question: 'Como faço pra ver minha evolução de carga?',
    answer:
      'Na aba Evolução você encontra todos os exercícios já treinados, com a tendência de cada um. Toque num exercício pra ver o histórico completo e o gráfico de carga.',
  },
];

function FaqItem({
  question,
  answer,
  COLORS,
}: {
  question: string;
  answer: string;
  COLORS: ThemeColors;
}) {
  const [expanded, setExpanded] = useState(false);
  const styles = useMemo(
    () =>
      StyleSheet.create({
        faqBox: {
          backgroundColor: COLORS.bgElevated,
          borderWidth: 1,
          borderColor: COLORS.cardBorder,
          borderRadius: RADIUS.sm,
          padding: SPACING.md,
          marginBottom: SPACING.sm,
        },
        faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.sm },
        faqQuestion: { color: COLORS.text, fontSize: 13.5, fontWeight: '700', flex: 1 },
        faqAnswer: { color: COLORS.muted, fontSize: 12.5, marginTop: SPACING.sm, lineHeight: 18 },
      }),
    [COLORS]
  );

  return (
    <View style={styles.faqBox}>
      <TouchableOpacity style={styles.faqHeader} onPress={() => setExpanded((e) => !e)}>
        <Text style={styles.faqQuestion}>{question}</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={COLORS.muted}
        />
      </TouchableOpacity>
      {expanded && <Text style={styles.faqAnswer}>{answer}</Text>}
    </View>
  );
}

export default function AjudaScreen() {
  const router = useRouter();
  const { COLORS } = useTheme();

  const handleContactSupport = () => {
    // Número placeholder — Brenno ajusta pro número real de suporte depois.
    Linking.openURL('https://wa.me/5500000000000');
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
        sectionLabel: { ...FONT.sectionLabel, color: COLORS.muted, marginBottom: SPACING.sm },
        footer: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: SPACING.lg,
          paddingBottom: 32,
          backgroundColor: COLORS.bg,
          borderTopWidth: 1,
          borderTopColor: COLORS.cardBorder,
        },
        supportButton: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          backgroundColor: COLORS.done,
          borderRadius: RADIUS.sm,
          paddingVertical: 15,
        },
        supportButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13.5, letterSpacing: 0.5 },
      }),
    [COLORS]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Ajuda</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 100 }}>
        <Text style={styles.sectionLabel}>PERGUNTAS FREQUENTES</Text>
        {FAQ.map((item) => (
          <FaqItem key={item.question} question={item.question} answer={item.answer} COLORS={COLORS} />
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.supportButton} onPress={handleContactSupport}>
          <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
          <Text style={styles.supportButtonText}>FALAR COM O SUPORTE</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
