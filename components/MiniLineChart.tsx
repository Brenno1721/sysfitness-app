import React, { useEffect, useMemo } from 'react';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const SVG_H = 44;
const SVG_W = 300;
const PX = 4;
const PY = 6;

function buildPath(data: number[]): { d: string; length: number } {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => ({
    x: PX + (i / (data.length - 1)) * (SVG_W - PX * 2),
    y: PY + (1 - (v - min) / range) * (SVG_H - PY * 2),
  }));
  const d = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    length += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  return { d, length };
}

function MiniLineChartInner({ data }: { data: number[] }) {
  const { COLORS } = useTheme();
  const { d, length } = useMemo(() => buildPath(data), [data]);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: 700,
      easing: Easing.out(Easing.cubic),
    });
  }, [d]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: length * (1 - progress.value),
  }));

  return (
    <Svg
      width="100%"
      height={SVG_H}
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      preserveAspectRatio="none"
    >
      <AnimatedPath
        d={d}
        fill="none"
        stroke={COLORS.accent}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={length}
        animatedProps={animatedProps}
      />
    </Svg>
  );
}

export default function MiniLineChart({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  return <MiniLineChartInner data={data} />;
}