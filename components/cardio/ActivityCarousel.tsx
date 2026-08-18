import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { triggerImpact } from '../../lib/haptics';
import { useTheme } from '../../context/ThemeContext';

export const CARDIO_ACTIVITIES: { label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'Esteira', icon: 'walk-outline' },
  { label: 'Ar livre', icon: 'leaf-outline' },
  { label: 'Escada', icon: 'layers-outline' },
  { label: 'Bicicleta', icon: 'bicycle-outline' },
];

type Props = {
  activityIndex: number;
  onChange: (index: number) => void;
  itemWidth?: number;
  iconSize?: number;
  labelSize?: number;
};

export default function ActivityCarousel({
  activityIndex,
  onChange,
  itemWidth = 84,
  iconSize = 22,
  labelSize = 11.5,
}: Props) {
  const { COLORS } = useTheme();
  const listRef = useRef<FlatList<(typeof CARDIO_ACTIVITIES)[number]>>(null);
  const [sidePad, setSidePad] = useState(0);
  const committedIndexRef = useRef(activityIndex);

  useEffect(() => {
    committedIndexRef.current = activityIndex;
  }, [activityIndex]);

  const scrollToIndex = useCallback(
    (index: number, animated: boolean) => {
      listRef.current?.scrollToOffset({ offset: index * itemWidth, animated });
    },
    [itemWidth]
  );

  const onLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const pad = (e.nativeEvent.layout.width - itemWidth) / 2;
      setSidePad(pad > 0 ? pad : 0);
    },
    [itemWidth]
  );

  useEffect(() => {
    if (sidePad > 0) scrollToIndex(activityIndex, false);
    // Só precisa reposicionar quando o layout (sidePad) fica disponível.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sidePad]);

  const commitIndex = useCallback(
    (index: number) => {
      if (index === committedIndexRef.current) return;
      committedIndexRef.current = index;
      onChange(index);
      triggerImpact();
    },
    [onChange]
  );

  const onSettle = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.min(
      CARDIO_ACTIVITIES.length - 1,
      Math.max(0, Math.round(offsetX / itemWidth))
    );
    commitIndex(index);
  };

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({ length: itemWidth, offset: sidePad + itemWidth * index, index }),
    [itemWidth, sidePad]
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        item: { alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 6 },
        label: { fontWeight: '700' },
      }),
    []
  );

  return (
    <View onLayout={onLayout}>
      <FlatList
        ref={listRef}
        data={CARDIO_ACTIVITIES}
        horizontal
        keyExtractor={(item) => item.label}
        showsHorizontalScrollIndicator={false}
        snapToInterval={itemWidth}
        snapToAlignment="start"
        decelerationRate="fast"
        getItemLayout={getItemLayout}
        contentContainerStyle={{ paddingHorizontal: sidePad }}
        onMomentumScrollEnd={onSettle}
        onScrollEndDrag={onSettle}
        renderItem={({ item, index }) => {
          const active = index === activityIndex;
          return (
            <TouchableOpacity
              style={[styles.item, { width: itemWidth }]}
              onPress={() => {
                commitIndex(index);
                scrollToIndex(index, true);
              }}
            >
              <Ionicons
                name={item.icon}
                size={active ? iconSize : iconSize - 4}
                color={active ? COLORS.text : COLORS.muted}
                style={{ opacity: active ? 1 : 0.6 }}
              />
              <Text
                style={[
                  styles.label,
                  {
                    fontSize: active ? labelSize : labelSize - 1,
                    color: active ? COLORS.text : COLORS.muted,
                    opacity: active ? 1 : 0.6,
                  },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}
