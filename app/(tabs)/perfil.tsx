import { useMemo } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useWorkoutLog } from '../../context/WorkoutLogContext';
import { useTheme } from '../../context/ThemeContext';
import { useGamification } from '../../context/GamificationContext';
import { ACHIEVEMENTS } from '../../lib/gamification';
import { usePlan } from '../../context/PlanContext';
import { SPACING, RADIUS, FONT } from '../../constants/theme';

type MenuItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route: string | null;
  rightText?: string;
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function PerfilScreen() {
  const { user, logout } = useAuth();
  const { history } = useWorkoutLog();
  const { xp, levelInfo, streak, unlockedAchievements } = useGamification();
  const { plan } = usePlan();
  const router = useRouter();
  const { COLORS, mode } = useTheme();
  const brandLogo = mode === 'dark'
    ? require('../../assets/images/logoalto.png')
    : require('../../assets/images/darklogo.png');

  const MENU: MenuItem[] = [
    { icon: 'create-outline', label: 'Editar perfil', route: '/editar-perfil' },
    {
      icon: 'trophy-outline',
      label: 'Conquistas',
      route: '/conquistas',
      rightText: `${unlockedAchievements.length}/${ACHIEVEMENTS.length}`,
    },
    { icon: 'document-text-outline', label: 'Meu plano de treino', route: '/planos' },
    { icon: 'notifications-outline', label: 'Notificações', route: '/notificacoes' },
    { icon: 'contrast-outline', label: 'Aparência', route: '/configuracoes', rightText: mode === 'dark' ? 'Escuro' : 'Claro' },
    { icon: 'settings-outline', label: 'Configurações', route: '/configuracoes' },
    { icon: 'help-circle-outline', label: 'Ajuda', route: '/ajuda' },
  ];

  const totalWorkouts = history.length;
  const uniqueDays = new Set(history.map((h) => h.date.slice(0, 10))).size;

  const confirmLogout = () => {
    Alert.alert('Sair da conta', 'Tem certeza que quer sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: logout },
    ]);
  };

  const initials = getInitials(user?.name ?? '');

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xs },
    brand: { width: '45%', height: undefined, aspectRatio: 1.5 },
    profileHeader: { alignItems: 'center', marginBottom: SPACING.xl },
    avatar: {
      width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.accent,
      alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md,
    },
    avatarText: { color: '#fff', fontWeight: '900', fontSize: 26, letterSpacing: 0.5 },
    name: { color: COLORS.text, fontWeight: '900', fontSize: 17, letterSpacing: 0.5 },
    email: { color: COLORS.muted, fontSize: 13, marginTop: 2 },
    levelCard: {
      backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder,
      borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.lg,
    },
    levelHeaderRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
      marginBottom: SPACING.sm,
    },
    levelText: { color: COLORS.text, fontWeight: '800', fontSize: 13.5 },
    levelXpText: { color: COLORS.muted, fontSize: 11, fontWeight: '600' },
    levelBarTrack: {
      height: 5, borderRadius: 3, backgroundColor: COLORS.cardBorder, overflow: 'hidden',
    },
    levelBarFill: { height: '100%', borderRadius: 3, backgroundColor: COLORS.accent },
    planRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: SPACING.xl,
    },
    planRowText: { color: COLORS.muted, fontSize: 12.5, fontWeight: '600' },
    planRowLink: { color: COLORS.accent, fontSize: 12.5, fontWeight: '700' },
    statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.xl },
    statCard: {
      flex: 1, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder,
      borderRadius: RADIUS.md, paddingVertical: SPACING.md, alignItems: 'center',
    },
    statValue: { color: COLORS.text, fontWeight: '900', fontSize: 20 },
    statLabel: { color: COLORS.mutedDim, fontSize: 9.5, fontWeight: '700', marginTop: 4 },
    streakValueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    menu: {
      backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder,
      borderRadius: RADIUS.md, marginBottom: SPACING.lg, overflow: 'hidden',
    },
    menuItem: {
      flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md,
      borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder,
    },
    menuText: { color: COLORS.text, fontSize: 14, fontWeight: '600', flex: 1 },
    menuRightText: { color: COLORS.muted, fontSize: 13, fontWeight: '600' },
    logout: { alignItems: 'center', paddingVertical: SPACING.md },
    logoutText: { color: COLORS.danger, fontWeight: '700', fontSize: 13, letterSpacing: 0.5 },
  }), [COLORS]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 60 }}>
      <View style={styles.brandRow}>
        <Image source={brandLogo} style={styles.brand} resizeMode="contain" />
      </View>

      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{(user?.name || '').toUpperCase() || 'ATLETA'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.levelCard}>
        <View style={styles.levelHeaderRow}>
          <Text style={styles.levelText}>
            Nível {levelInfo.current.level} · {levelInfo.current.title}
          </Text>
          <Text style={styles.levelXpText}>
            {levelInfo.next ? `${xp} / ${levelInfo.next.minXP} XP` : 'NÍVEL MÁXIMO'}
          </Text>
        </View>
        <View style={styles.levelBarTrack}>
          <View style={[styles.levelBarFill, { width: `${levelInfo.progress * 100}%` }]} />
        </View>
      </View>

      <View style={styles.planRow}>
        <Text style={styles.planRowText}>Plano: {plan.name}</Text>
        <TouchableOpacity onPress={() => router.push('/planos')}>
          <Text style={styles.planRowLink}>Ver planos</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{uniqueDays}</Text>
          <Text style={styles.statLabel}>DIAS TREINADOS</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalWorkouts}</Text>
          <Text style={styles.statLabel}>TOTAL WORKOUTS</Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.streakValueRow}>
            <Ionicons name="flame" size={16} color={COLORS.accent} />
            <Text style={styles.statValue}>{streak.current}</Text>
          </View>
          <Text style={styles.statLabel}>DIAS SEGUIDOS</Text>
        </View>
      </View>

      <View style={styles.menu}>
        {MENU.map((item, i) => (
          <TouchableOpacity
            key={item.label}
            style={[styles.menuItem, i === MENU.length - 1 && { borderBottomWidth: 0 }]}
            onPress={item.route ? () => router.push(item.route as any) : undefined}
            disabled={!item.route}
          >
            <Ionicons name={item.icon} size={18} color={COLORS.text} />
            <Text style={styles.menuText}>{item.label}</Text>
            {item.rightText && (
              <Text style={styles.menuRightText}>{item.rightText}</Text>
            )}
            <Ionicons name="chevron-forward" size={16} color={COLORS.mutedDim} />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logout} onPress={confirmLogout}>
        <Text style={styles.logoutText}>SAIR DA CONTA</Text>
      </TouchableOpacity>
    </ScrollView>
    </SafeAreaView>
  );
}