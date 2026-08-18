import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { triggerImpact } from '../lib/haptics';
import { SPACING, RADIUS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

export type ReorderableExercise = {
  key: string;
  name: string;
  sets: string;
  groupName: string;
};

const ITEM_HEIGHT = 72;
const ROW_GAP = SPACING.sm;
const SPRING_CONFIG = { damping: 22, stiffness: 260, mass: 0.7 };

type Props = {
  items: ReorderableExercise[];
  onReorder: (items: ReorderableExercise[]) => void;
};

export default function ReorderableExerciseList({ items, onReorder }: Props) {
  // Não-controlado após a montagem: o drag reordena o próprio estado interno,
  // re-renders do pai não devem "puxar o tapete" no meio de um arrasto.
  const [data, setData] = useState(items);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  useEffect(() => {
    onReorder(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const moveItem = (from: number, to: number) => {
    setData((prev) => {
      if (from === to || from < 0 || to < 0 || from >= prev.length || to >= prev.length) {
        return prev;
      }
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  return (
    <View style={{ height: data.length * ITEM_HEIGHT }}>
      {data.map((item, index) => (
        <Row
          key={item.key}
          item={item}
          index={index}
          total={data.length}
          isActive={activeKey === item.key}
          onDragStart={() => setActiveKey(item.key)}
          onDragEnd={() => setActiveKey(null)}
          onCrossThreshold={moveItem}
        />
      ))}
    </View>
  );
}

function Row({
  item,
  index,
  total,
  isActive,
  onDragStart,
  onDragEnd,
  onCrossThreshold,
}: {
  item: ReorderableExercise;
  index: number;
  total: number;
  isActive: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onCrossThreshold: (from: number, to: number) => void;
}) {
  const { COLORS } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: ITEM_HEIGHT - ROW_GAP,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: COLORS.card,
          borderWidth: 1,
          borderColor: COLORS.cardBorder,
          borderRadius: RADIUS.sm,
          paddingHorizontal: SPACING.md,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 10,
        },
        name: { color: COLORS.text, fontWeight: '700', fontSize: 14 },
        meta: { color: COLORS.muted, fontSize: 12, fontWeight: '600', marginTop: 2 },
        handle: { padding: SPACING.sm },
      }),
    [COLORS]
  );

  const translateY = useSharedValue(index * ITEM_HEIGHT);
  const isDragging = useSharedValue(false);
  const startOffset = useSharedValue(0);
  const currentIndex = useSharedValue(index);

  // Índice autoritativo vem do React state (após um swap); acompanha com
  // spring, exceto no próprio item sendo arrastado (que segue o dedo).
  useEffect(() => {
    currentIndex.value = index;
    if (!isDragging.value) {
      translateY.value = withSpring(index * ITEM_HEIGHT, SPRING_CONFIG);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const triggerHaptic = () => {
    triggerImpact();
  };

  const pan = Gesture.Pan()
    .onStart(() => {
      isDragging.value = true;
      startOffset.value = translateY.value;
      runOnJS(onDragStart)();
    })
    .onUpdate((event) => {
      translateY.value = startOffset.value + event.translationY;
      const targetIndex = Math.min(
        total - 1,
        Math.max(0, Math.round(translateY.value / ITEM_HEIGHT))
      );
      if (targetIndex !== currentIndex.value) {
        const from = currentIndex.value;
        currentIndex.value = targetIndex;
        runOnJS(onCrossThreshold)(from, targetIndex);
        runOnJS(triggerHaptic)();
      }
    })
    .onEnd(() => {
      isDragging.value = false;
      translateY.value = withSpring(currentIndex.value * ITEM_HEIGHT, SPRING_CONFIG);
      runOnJS(onDragEnd)();
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: withSpring(isDragging.value ? 1.03 : 1, SPRING_CONFIG) },
    ],
    zIndex: isDragging.value ? 10 : 0,
    elevation: isDragging.value ? 8 : 0,
    shadowOpacity: isDragging.value ? 0.35 : 0,
  }));

  return (
    <Animated.View style={[styles.row, animatedStyle]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.meta} numberOfLines={1}>{item.groupName} · {item.sets}</Text>
      </View>
      <GestureDetector gesture={pan}>
        <Animated.View style={styles.handle} hitSlop={10}>
          <Ionicons name="reorder-three-outline" size={20} color={COLORS.muted} />
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}
