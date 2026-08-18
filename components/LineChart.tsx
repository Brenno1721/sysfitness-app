import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle, Line } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';

type Point = { label: string; value: number };

export default function LineChart({
  data,
  height = 160,
  unit = 'kg',
}: {
  data: Point[];
  height?: number;
  unit?: string;
}) {
  const { COLORS } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        topLabel: { color: COLORS.muted, fontSize: 11, fontWeight: '700', marginBottom: 4 },
        bottomRow: { flexDirection: 'row', alignItems: 'center' },
        bottomLabel: { color: COLORS.muted, fontSize: 11, fontWeight: '700' },
        axisLabel: { color: COLORS.mutedDim, fontSize: 10.5, fontWeight: '600' },
      }),
    [COLORS]
  );

  if (data.length === 0) return null;

  const width = 300; // viewBox width, escala com o container via preserveAspectRatio
  const padding = 24;
  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1 || 1)) * (width - padding * 2);
    const y = padding + (1 - (d.value - min) / range) * (height - padding * 2);
    return { x, y, value: d.value };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <View>
      <Text style={styles.topLabel}>{max}{unit}</Text>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <Line
          x1={padding} y1={height - padding} x2={width - padding} y2={height - padding}
          stroke={COLORS.cardBorder} strokeWidth={1}
        />
        <Polyline
          points={polylinePoints}
          fill="none"
          stroke={COLORS.accent}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={3.5} fill={COLORS.accent} />
        ))}
      </Svg>
      <View style={styles.bottomRow}>
        <Text style={styles.bottomLabel}>{min}{unit}</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', flex: 1, marginLeft: 8 }}>
          <Text style={styles.axisLabel}>{data[0].label}</Text>
          <Text style={styles.axisLabel}>{data[data.length - 1].label}</Text>
        </View>
      </View>
    </View>
  );
}
