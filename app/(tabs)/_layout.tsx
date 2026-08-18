import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AnimatedTabBar from '../../components/AnimatedTabBar';
import ActiveSessionBanner from '../../components/ActiveSessionBanner';
import { useTheme } from '../../context/ThemeContext';

export default function TabsLayout() {
  const { COLORS } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ActiveSessionBanner />
      <Tabs
        tabBar={(props) => <AnimatedTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          animation: 'shift',
          tabBarActiveTintColor: COLORS.accent,
          tabBarInactiveTintColor: COLORS.muted,
          tabBarStyle: {
            backgroundColor: COLORS.bgElevated,
            borderTopColor: COLORS.cardBorder,
            borderTopWidth: 1,
            height: 84,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 10.5,
            fontWeight: '700',
            letterSpacing: 0.3,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" color={color} size={size - 2} />
            ),
          }}
        />
        <Tabs.Screen
          name="treino"
          options={{
            title: 'Workout',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="barbell" color={color} size={size - 2} />
            ),
          }}
        />
        <Tabs.Screen
          name="evolucao"
          options={{
            title: 'Stats',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="stats-chart" color={color} size={size - 2} />
            ),
          }}
        />
        <Tabs.Screen
          name="perfil"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" color={color} size={size - 2} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}