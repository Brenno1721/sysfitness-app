import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { WorkoutLogProvider } from '../context/WorkoutLogContext';
import { CardioTimerProvider } from '../context/CardioTimerContext';
import { RoutineProvider } from '../context/RoutineContext';
import { WorkoutSessionProvider } from '../context/WorkoutSessionContext';
import { SettingsProvider } from '../context/SettingsContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { GamificationProvider } from '../context/GamificationContext';
import { PlanProvider } from '../context/PlanContext';
import AchievementToast from '../components/AchievementToast';

function RootNavigation() {
  const { user, isLoading } = useAuth();
  const { COLORS } = useTheme();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const segment = segments[0];
    const isPublicRoute =
      segment === '(auth)' || segment === 'welcome' || segment === 'personal-em-construcao';
    const isOnboardingRoute = segment === 'onboarding';

    if (!user && !isPublicRoute) {
      router.replace('/welcome');
    } else if (user && !user.onboardingCompleted && !isOnboardingRoute) {
      // Vale tanto pra quem acabou de criar conta quanto pra contas antigas
      // (onboardingCompleted vem false por padrão da migration) — em
      // qualquer rota, com o onboarding pendente, cai aqui antes de tudo.
      router.replace('/onboarding');
    } else if (user && user.onboardingCompleted && isPublicRoute) {
      router.replace('/(tabs)');
    }
  }, [user, isLoading, segments, router]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={COLORS.accent} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: COLORS.bg } }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
      <Stack.Screen name="personal-em-construcao" />
      <Stack.Screen name="historico" options={{ presentation: 'card' }} />
      <Stack.Screen name="timer-fullscreen" options={{ presentation: 'card' }} />
      <Stack.Screen name="cardio-historico" options={{ presentation: 'card' }} />
      <Stack.Screen name="treino-dia" options={{ presentation: 'card' }} />
      <Stack.Screen name="treino-resumo" options={{ presentation: 'card' }} />
      <Stack.Screen name="treino-concluido" options={{ presentation: 'card' }} />
      <Stack.Screen name="evolucao-exercicio" options={{ presentation: 'card' }} />
      <Stack.Screen name="novo-treino" options={{ presentation: 'card' }} />
      <Stack.Screen name="registrar-medida" options={{ presentation: 'card' }} />
      <Stack.Screen name="comparar-fotos" options={{ presentation: 'card' }} />
      <Stack.Screen name="conquistas" options={{ presentation: 'card' }} />
      <Stack.Screen name="planos" options={{ presentation: 'card' }} />
      <Stack.Screen name="editar-perfil" options={{ presentation: 'card' }} />
      <Stack.Screen name="notificacoes" options={{ presentation: 'card' }} />
      <Stack.Screen name="configuracoes" options={{ presentation: 'card' }} />
      <Stack.Screen name="ajuda" options={{ presentation: 'card' }} />
    </Stack>
  );
}

function ThemedStatusBar() {
  const { mode } = useTheme();
  return <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <SettingsProvider>
          <AuthProvider>
            <PlanProvider>
              <GamificationProvider>
                <RoutineProvider>
                  <WorkoutLogProvider>
                    <WorkoutSessionProvider>
                      <CardioTimerProvider>
                        <ThemedStatusBar />
                        <RootNavigation />
                        <AchievementToast />
                      </CardioTimerProvider>
                    </WorkoutSessionProvider>
                  </WorkoutLogProvider>
                </RoutineProvider>
              </GamificationProvider>
            </PlanProvider>
          </AuthProvider>
        </SettingsProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
