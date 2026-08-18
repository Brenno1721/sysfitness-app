import React, { useEffect, useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { RADIUS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home',
  treino: 'barbell',
  evolucao: 'stats-chart',
  perfil: 'person',
};

const SPRING_CONFIG = { damping: 22, stiffness: 260, mass: 0.7, overshootClamping: true };
const CIRCLE_SIZE = 36;
const LIFT = 10;
const ICON_SIZE = 18;

function TabItem({
  focused,
  iconName,
  onPress,
  colors,
}: {
  focused: boolean;
  iconName: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  colors: { muted: string; accent: string };
}) {
  const progress = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(focused ? 1 : 0, SPRING_CONFIG);
  }, [focused, progress]);

  const liftStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: progress.value * -LIFT }],
  }));

  const circleStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.6 + progress.value * 0.4 }],
  }));

  return (
    <TouchableOpacity style={styles.item} activeOpacity={0.8} onPress={onPress}>
      <Animated.View style={[styles.iconStack, liftStyle]}>
        <Animated.View
          style={[
            styles.circle,
            circleStyle,
            { backgroundColor: colors.accent, shadowColor: colors.accent },
          ]}
        />
        <Ionicons name={iconName} size={ICON_SIZE} color={focused ? '#FFFFFF' : colors.muted} />
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function AnimatedTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { COLORS } = useTheme();
  const barStyles = useMemo(
    () =>
      StyleSheet.create({
        bar: {
          flexDirection: 'row',
          backgroundColor: COLORS.bgElevated,
          borderTopWidth: 1,
          borderTopColor: COLORS.cardBorder,
          borderTopLeftRadius: RADIUS.lg,
          borderTopRightRadius: RADIUS.lg,
          paddingTop: 8,
        },
      }),
    [COLORS]
  );

  return (
    <View style={[barStyles.bar, { height: 68 + insets.bottom, paddingBottom: insets.bottom }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const iconName = TAB_ICONS[route.name] ?? 'ellipse';

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TabItem
            key={route.key}
            focused={focused}
            iconName={iconName}
            onPress={onPress}
            colors={{ muted: COLORS.muted, accent: COLORS.accent }}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  iconStack: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    shadowOpacity: 0.45,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
});
