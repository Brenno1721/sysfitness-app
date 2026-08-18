import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { triggerImpact } from '../../lib/haptics';
import { useTheme } from '../../context/ThemeContext';

const ITEM_HEIGHT = 30;
const VISIBLE_ITEMS = 3;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const COLUMN_WIDTH = 56;

function range(count: number): number[] {
  return Array.from({ length: count }, (_, i) => i);
}

function WheelColumn({
  values,
  selected,
  onChange,
  colors,
}: {
  values: number[];
  selected: number;
  onChange: (value: number) => void;
  colors: { text: string; muted: string };
}) {
  const listRef = useRef<FlatList<number>>(null);
  const committedValueRef = useRef(selected);

  useEffect(() => {
    committedValueRef.current = selected;
  }, [selected]);

  const commitValue = useCallback(
    (value: number) => {
      if (value === committedValueRef.current) return;
      committedValueRef.current = value;
      onChange(value);
      triggerImpact();
    },
    [onChange]
  );

  const onSettle = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    const clamped = Math.min(values.length - 1, Math.max(0, index));
    commitValue(values[clamped]);
  };

  return (
    <FlatList
      ref={listRef}
      data={values}
      keyExtractor={(v) => String(v)}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
      snapToInterval={ITEM_HEIGHT}
      snapToAlignment="start"
      decelerationRate="fast"
      style={{ height: WHEEL_HEIGHT, width: COLUMN_WIDTH }}
      contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}
      initialScrollIndex={selected}
      getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
      onMomentumScrollEnd={onSettle}
      onScrollEndDrag={onSettle}
      renderItem={({ item }) => {
        const active = item === selected;
        return (
          <View style={styles.wheelItem}>
            <Text
              style={[
                styles.wheelText,
                active
                  ? { color: colors.text, fontSize: 18, fontWeight: '800' }
                  : { color: colors.muted, fontSize: 14, opacity: 0.5 },
              ]}
            >
              {String(item).padStart(2, '0')}
            </Text>
          </View>
        );
      }}
    />
  );
}

type Props = {
  totalSeconds: number;
  onChange: (seconds: number) => void;
};

export default function TimeWheelPicker({ totalSeconds, onChange }: Props) {
  const { COLORS } = useTheme();
  const hours = Math.floor(totalSeconds / 3600) % 24;
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hourValues = useMemo(() => range(24), []);
  const minuteValues = useMemo(() => range(60), []);
  const secondValues = useMemo(() => range(60), []);

  const update = (h: number, m: number, s: number) => {
    onChange(h * 3600 + m * 60 + s);
  };

  const colors = { text: COLORS.text, muted: COLORS.muted };

  return (
    <View style={styles.row}>
      <WheelColumn values={hourValues} selected={hours} onChange={(h) => update(h, minutes, seconds)} colors={colors} />
      <Text style={[styles.separator, { color: COLORS.muted }]}>:</Text>
      <WheelColumn values={minuteValues} selected={minutes} onChange={(m) => update(hours, m, seconds)} colors={colors} />
      <Text style={[styles.separator, { color: COLORS.muted }]}>:</Text>
      <WheelColumn values={secondValues} selected={seconds} onChange={(s) => update(hours, minutes, s)} colors={colors} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  wheelItem: { height: ITEM_HEIGHT, alignItems: 'center', justifyContent: 'center' },
  wheelText: { fontVariant: ['tabular-nums'] },
  separator: { fontSize: 16, fontWeight: '700' },
});
