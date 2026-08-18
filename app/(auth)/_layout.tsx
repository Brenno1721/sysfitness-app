import { Stack } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';

export default function AuthLayout() {
  const { COLORS } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.bg },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="cadastro" />
    </Stack>
  );
}
